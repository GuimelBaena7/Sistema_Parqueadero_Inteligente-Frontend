import React, { useEffect, useRef, useState } from 'react';

/**
 * VideoStream - Componente mejorado para cámaras
 * - Soporta modos: camera_url y camera_local
 * - Usa WebSocket con el servidor backend
 * - Maneja tanto cámaras IP como cámaras locales
 * - Optimizado para el servidor ngrok
 */
const VideoStream = () => {
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const captureCanvasRef = useRef(null);
  const localVideoRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Desconectado');
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('camera_url');
  const [host, setHost] = useState(() => import.meta.env.VITE_WS_HOST || 'thomasina-speedless-kayce.ngrok-free.dev');
  const [scheme, setScheme] = useState(() => import.meta.env.VITE_WS_SCHEME || 'wss');
  const [cameraUrl, setCameraUrl] = useState('');

  // performance / behavior controls
  const [fps, setFps] = useState(10);
  const [resolution, setResolution] = useState('auto'); // 'auto' | '320x240' | '640x360' | '1280x720'
  const [autoReduce, setAutoReduce] = useState(true);
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [reconnectInterval, setReconnectInterval] = useState(3); // seconds

  // capture state
  const [capturing, setCapturing] = useState(false);
  const mediaStreamRef = useRef(null);
  const rafRef = useRef(null);
  const [lastSendTs, setLastSendTs] = useState(null);
  const [lastRecvTs, setLastRecvTs] = useState(null);
  const [lastLatency, setLastLatency] = useState(null);
  const [lastFrameBytes, setLastFrameBytes] = useState(null);
  const testPendingRef = useRef(null);

  // helper: build ws url
  function buildWsUrl(){
    // if VITE_WS_URL present, prefer it
    const envUrl = import.meta.env.VITE_WS_URL;
    if(envUrl) return envUrl;
    const h = host.trim();
    if(!h) throw new Error('Host vacío');
    return `${scheme}://${h}/ws/camara-directa`;
  }

  function logStatus(msg){
    console.log(msg);
    setStatusMsg(msg);
  }

  // connect and send initial message depending on mode
  async function connect() {
    if(wsRef.current) return;
    let url;
    try{ url = buildWsUrl(); }catch(e){ setError(e.message); return; }
    logStatus(`Conectando a ${url}...`);
    setError(null);

    wsRef.current = new WebSocket(url);
    wsRef.current.binaryType = 'arraybuffer';

    wsRef.current.onopen = async () => {
      setIsConnected(true);
      logStatus('Conectado al servidor');
      
      // Enviar headers necesarios para ngrok
      const headers = { 'ngrok-skip-browser-warning': 'true' };
      
      // send initial message
      if(mode === 'camera_url'){
        if(!cameraUrl) {
          setError('URL de cámara requerida para camera_url');
          return;
        }
        const msg = { type: 'camera_url', url: cameraUrl, headers };
        wsRef.current.send(JSON.stringify(msg));
        logStatus('Conectado a cámara IP');
      } else {
        const msg = { type: 'camera_local', headers };
        wsRef.current.send(JSON.stringify(msg));
        logStatus('Iniciando cámara local...');
        // start capture
        try{ await startCapture(); setCapturing(true); }
        catch(err){ setError('Error al iniciar cámara: ' + err.message); }
      }
    };

    wsRef.current.onmessage = (ev) => {
      try{
        // If binary (ArrayBuffer/Blob) -> draw to canvas
        if(ev.data instanceof ArrayBuffer || ev.data instanceof Blob){
          const blob = ev.data instanceof Blob ? ev.data : new Blob([ev.data], { type: 'image/jpeg' });
          // update stats: frame size and receive time
          try{ const size = ev.data instanceof Blob ? ev.data.size : (ev.data.byteLength || null); if(size) setLastFrameBytes(size); }catch(e){}
          setLastRecvTs(Date.now());
          if(testPendingRef.current){
            const latency = Date.now() - testPendingRef.current;
            setLastLatency(latency);
            testPendingRef.current = null;
          }
          const img = new Image();
          const url = URL.createObjectURL(blob);
          img.onload = () => {
            const canvas = canvasRef.current;
            if(!canvas) return;
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
          };
          img.src = url;
        } else {
          // maybe server sends base64 text
          const text = typeof ev.data === 'string' ? ev.data : null;
          if(text){
            // attempt to draw base64 jpeg
            const canvas = canvasRef.current;
            if(canvas){
              const ctx = canvas.getContext('2d');
              const img = new Image();
              img.onload = () => { canvas.width = img.width; canvas.height = img.height; ctx.drawImage(img,0,0); };
              img.src = `data:image/jpeg;base64,${text}`;
              setLastRecvTs(Date.now());
              if(testPendingRef.current){ const latency = Date.now() - testPendingRef.current; setLastLatency(latency); testPendingRef.current = null; }
            }
          }
        }
      }catch(err){ console.error('Error procesando frame:', err); }
    };

    wsRef.current.onerror = (err) => {
      console.error('WebSocket error', err);
      setError('Error WebSocket');
    };

    wsRef.current.onclose = () => {
      logStatus('Desconectado');
      setIsConnected(false);
      // stop capture if running
      stopCapture();
      // clear ref
      wsRef.current = null;
      // auto reconnect if enabled
      if (autoReconnect) {
        logStatus(`Reconectando en ${reconnectInterval}s...`);
        setTimeout(() => {
          connect();
        }, reconnectInterval * 1000);
      }
    };
  }

  function disconnect(){
    if(wsRef.current){
      try{ wsRef.current.close(); }catch(e){}
    }
    stopCapture();
    setIsConnected(false);
    setCapturing(false);
    logStatus('Desconectado');
  }

  // send a small test frame or ping to measure round-trip if backend echoes/processes
  async function testWebSocket(){
    if(!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN){
      setError('WebSocket no abierto');
      return;
    }
    // create a small test canvas
    const c = document.createElement('canvas');
    c.width = 160; c.height = 120;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#222'; ctx.fillRect(0,0,c.width,c.height);
    ctx.fillStyle = '#0f0'; ctx.fillRect(10,10,140,100);
    ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif'; ctx.fillText('TEST', 40, 65);
    c.toBlob((blob)=>{
      if(!blob) return;
      try{
        testPendingRef.current = Date.now();
        setLastSendTs(Date.now());
        setLastFrameBytes(blob.size);
        wsRef.current.send(blob);
        // timeout after 5s if no response
        setTimeout(()=>{ if(testPendingRef.current){ setError('No response to test within 5s'); testPendingRef.current = null; } }, 5000);
      }catch(e){ setError('Error enviando test: ' + e.message); }
    }, 'image/jpeg', 0.7);
  }

  // Local camera capture and sending frames as Blob JPEG
  async function startCapture(){
    if(mediaStreamRef.current) return;
    // optionally reduce constraints based on network
    let constraints = { video: true, audio: false };
    try{
      if(autoReduce && navigator.connection && navigator.connection.effectiveType){
        const t = navigator.connection.effectiveType; // '4g','3g', etc
        if(t.includes('2g') || t.includes('3g')){
          constraints = { video: { width: 320, height: 240 }, audio: false };
        }
      }
    }catch(e){ /* ignore */ }

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    mediaStreamRef.current = stream;
    const video = localVideoRef.current;
    video.srcObject = stream;
    await video.play();

    // set up capture canvas and target resolution
    const cap = captureCanvasRef.current;
    let w = video.videoWidth || 640;
    let h = video.videoHeight || 480;
    if(resolution !== 'auto'){
      const parts = resolution.split('x');
      if(parts.length === 2){ w = parseInt(parts[0],10) || w; h = parseInt(parts[1],10) || h; }
    }
    cap.width = w;
    cap.height = h;
    const ctx = cap.getContext('2d');

    // controlled frame loop according to FPS setting
    let last = 0;
    const interval = 1000 / (fps || 10);
    function frameLoop(ts){
      if(!mediaStreamRef.current) return;
      if(!last) last = ts;
      const elapsed = ts - last;
      if(elapsed >= interval){
        try{
          ctx.drawImage(video, 0, 0, cap.width, cap.height);
          cap.toBlob((blob) => {
            if(blob && wsRef.current && wsRef.current.readyState === WebSocket.OPEN){
              try{ wsRef.current.send(blob); }catch(e){ console.error('Error enviando blob:', e); }
            }
          }, 'image/jpeg', 0.7);
        }catch(e){ console.error('Error en captura:', e); }
        last = ts;
      }
      rafRef.current = requestAnimationFrame(frameLoop);
    }
    rafRef.current = requestAnimationFrame(frameLoop);
    setCapturing(true);
  }

  function stopCapture(){
    if(rafRef.current){ cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if(mediaStreamRef.current){
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if(localVideoRef.current){ localVideoRef.current.srcObject = null; }
    setCapturing(false);
  }

  // cleanup
  useEffect(() => {
    // set mobile defaults on mount
    try{
      const isMobile = /Mobi|Android|iPhone|iPad/.test(navigator.userAgent) || (window.innerWidth && window.innerWidth < 760);
      if(isMobile){
        setFps(10);
        setResolution((r)=> r === 'auto' ? '640x360' : r);
      }
    }catch(e){}

    return () => {
      if(wsRef.current) wsRef.current.close();
      stopCapture();
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">📹 Video en Tiempo Real</h2>

      <div className="space-y-3 mb-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm">Host:</label>
          <input className="border px-2 py-1 rounded" value={host} onChange={e=>setHost(e.target.value)} />
          <label className="text-sm">Scheme:</label>
          <select value={scheme} onChange={e=>setScheme(e.target.value)} className="border px-2 py-1 rounded">
            <option>ws</option>
            <option>wss</option>
          </select>
        </div>

        <div className="flex items-center space-x-3">
          <label className="text-sm">Modo:</label>
          <label><input type="radio" name="mode" value="camera_url" checked={mode==='camera_url'} onChange={()=>setMode('camera_url')} /> camera_url</label>
          <label><input type="radio" name="mode" value="camera_local" checked={mode==='camera_local'} onChange={()=>setMode('camera_local')} /> camera_local</label>
        </div>

        {mode === 'camera_url' && (
          <div>
            <label className="text-sm">Camera URL:</label>
            <input className="border px-2 py-1 rounded w-full" value={cameraUrl} onChange={e=>setCameraUrl(e.target.value)} placeholder="rtsp://... or http://..." />
          </div>
        )}

        <div className="flex items-center space-x-3">
          <label className="text-sm">FPS:</label>
          <select value={fps} onChange={e=>setFps(parseInt(e.target.value,10))} className="border px-2 py-1 rounded">
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={30}>30</option>
          </select>

          <label className="text-sm">Resolución:</label>
          <select value={resolution} onChange={e=>setResolution(e.target.value)} className="border px-2 py-1 rounded">
            <option value="auto">Auto</option>
            <option value="320x240">320x240</option>
            <option value="640x360">640x360</option>
            <option value="1280x720">1280x720</option>
          </select>

          <label className="text-sm flex items-center"><input type="checkbox" checked={autoReduce} onChange={e=>setAutoReduce(e.target.checked)} className="mr-1" /> AutoReduce</label>
        </div>

        <div className="flex items-center space-x-3">
          <label className="text-sm flex items-center"><input type="checkbox" checked={autoReconnect} onChange={e=>setAutoReconnect(e.target.checked)} className="mr-1" /> AutoReconnect</label>
          <label className="text-sm">Retry (s):</label>
          <input type="number" min={1} value={reconnectInterval} onChange={e=>setReconnectInterval(parseInt(e.target.value||'3',10))} className="w-20 border px-2 py-1 rounded" />
        </div>

        <div className="flex items-center space-x-2">
          <button onClick={connect} className="px-3 py-1 bg-indigo-600 text-white rounded flex items-center space-x-2" disabled={isConnected}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 12h18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>Connect</span>
          </button>
          <button onClick={disconnect} className="px-3 py-1 bg-red-600 text-white rounded flex items-center space-x-2" disabled={!isConnected}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>Disconnect</span>
          </button>
          <button onClick={testWebSocket} className="px-3 py-1 bg-emerald-600 text-white rounded flex items-center space-x-2" disabled={!isConnected}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>Test WS</span>
          </button>
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <div className="text-sm text-gray-600">{statusMsg}{error ? ' - ' + error : ''}</div>
        </div>
      </div>

      <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ minHeight: '360px' }}>
        <canvas ref={canvasRef} className="w-full h-auto object-contain" style={{ backgroundColor: '#000' }} />
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 bg-white rounded shadow-sm">
          <h4 className="text-sm font-semibold">Estadísticas</h4>
          <p className="text-xs text-gray-500">Último envío: {lastSendTs ? new Date(lastSendTs).toLocaleTimeString() : '—'}</p>
          <p className="text-xs text-gray-500">Última recepción: {lastRecvTs ? new Date(lastRecvTs).toLocaleTimeString() : '—'}</p>
          <p className="text-xs text-gray-500">Última latencia: {lastLatency ? lastLatency + ' ms' : '—'}</p>
          <p className="text-xs text-gray-500">Último frame (bytes): {lastFrameBytes || '—'}</p>
        </div>
        <div className="p-3 bg-white rounded shadow-sm">
          <h4 className="text-sm font-semibold">Opciones</h4>
          <p className="text-xs text-gray-500">FPS: {fps}</p>
          <p className="text-xs text-gray-500">Resolución: {resolution}</p>
        </div>
        <div className="p-3 bg-white rounded shadow-sm">
          <h4 className="text-sm font-semibold">Ayuda</h4>
          <p className="text-xs text-gray-500">Para usar la cámara del móvil, abre esta URL en el navegador del dispositivo y selecciona <strong>camera_local</strong>.</p>
          <p className="text-xs text-gray-500">Si tu página corre en HTTPS, usa <code>wss://</code> para el WebSocket.</p>
        </div>
      </div>

      {/* hidden elements for local capture */}
      <video ref={localVideoRef} autoPlay muted playsInline style={{display:'none'}} />
      <canvas ref={captureCanvasRef} style={{display:'none'}} />
    </div>
  );
};

export default VideoStream;