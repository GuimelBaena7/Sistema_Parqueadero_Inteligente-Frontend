import React, { useRef, useEffect, useState } from 'react';

/**
 * VideoStream - SIMPLIFICADO: Replica exactamente VideoUpload
 * Usa: setInterval(captureAndSendFrame, 1000/fps) + canvas.toBlob(async callback)
 */
const VideoStream = ({ camera = {}, onDetection }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const intervalRef = useRef(null);

  const [isConnected, setIsConnected] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState(null);
  const [fps] = useState(10); // Reducido de 30 a 10 FPS para Colab
  const [resolution] = useState({ width: 480, height: 360 }); // Resolución reducida (480p)
  const [quality] = useState(0.6); // Compresión JPEG agresiva (60%)
  const [skipFrames] = useState(2); // Procesar 1 de cada 3 frames
  const [stats, setStats] = useState({ frame: 0, sent: 0, skipped: 0, latency: 0 });
  const frameCounterRef = useRef(0);
  const lastSendTimeRef = useRef(Date.now());

  const WS_URL = import.meta.env.VITE_WS_URL || 'wss://localhost:8000/ws/camara-directa';

  useEffect(() => {
    connectAndStart();
    return () => cleanup();
  }, [camera]);

  const cleanup = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (wsRef.current) wsRef.current.close();
    if (isCapturing) stopCapture();
  };

  // ========== CONECTAR WEBSOCKET ==========
  const connectWebSocket = () => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(WS_URL);
      
      ws.onopen = () => {
        console.log('📡 WebSocket conectado');
        ws.send(JSON.stringify({
          type: 'camera_local',
          camera_name: camera?.nombre || 'VideoStream',
        }));
        setIsConnected(true);
        wsRef.current = ws;
        resolve(ws);
      };

      ws.onmessage = (event) => {
        if (event.data instanceof Blob || event.data instanceof ArrayBuffer) {
          const blob = event.data instanceof Blob ? event.data : new Blob([event.data], { type: 'image/jpeg' });
          const url = URL.createObjectURL(blob);
          const img = new Image();
          img.onload = () => {
            const canvas = canvasRef.current;
            if (canvas) {
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);
            }
            URL.revokeObjectURL(url);
          };
          img.src = url;
        }
      };

      ws.onerror = (err) => {
        console.error('❌ WebSocket error:', err);
        reject(err);
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log('WebSocket cerrado');
      };
    });
  };

  // ========== CAPTURAR Y ENVIAR FRAME (OPTIMIZADO PARA COLAB) ==========
  const captureAndSendFrame = async () => {
    if (!videoRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    // Skip frames: Procesar solo 1 de cada N frames para reducir carga
    frameCounterRef.current++;
    if (frameCounterRef.current % (skipFrames + 1) !== 0) {
      setStats(prev => ({ ...prev, skipped: prev.skipped + 1 }));
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: false });
    
    // Usar resolución reducida (480p) para menor tamaño de datos
    canvas.width = resolution.width;
    canvas.height = resolution.height;
    
    // Dibujar video escalado a resolución menor
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const sendTime = Date.now();
    
    // Compresión JPEG agresiva (60%) para reducir tamaño
    canvas.toBlob(async (blob) => {
      if (blob && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          const arrayBuffer = await blob.arrayBuffer();
          wsRef.current.send(arrayBuffer);
          
          // Calcular latencia de envío
          const latency = Date.now() - sendTime;
          setStats(prev => ({ 
            ...prev, 
            frame: prev.frame + 1,
            sent: prev.sent + 1,
            latency: Math.round((prev.latency * 0.9) + (latency * 0.1)) // Promedio móvil
          }));
        } catch (err) {
          console.error('Error enviando frame:', err);
        }
      }
    }, 'image/jpeg', quality);
  };

  // ========== INICIAR CAPTURA LOCAL ==========
  const startCapture = async () => {
    try {
      // Solicitar resolución baja desde la cámara (480p)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: resolution.width },
          height: { ideal: resolution.height },
          frameRate: { ideal: fps, max: fps }
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCapturing(true);
        
        await new Promise(resolve => {
          if (videoRef.current.videoWidth) {
            resolve();
          } else {
            videoRef.current.addEventListener('loadedmetadata', resolve, { once: true });
          }
        });

        const frameInterval = 1000 / fps;
        intervalRef.current = setInterval(captureAndSendFrame, frameInterval);
        console.log(`🎬 Captura iniciada: ${fps} FPS`);
      }
    } catch (err) {
      console.error('❌ Error captura:', err);
      setError('No se pudo acceder a la cámara');
    }
  };

  const stopCapture = () => {
    setIsCapturing(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
  };

  const connectAndStart = async () => {
    try {
      await connectWebSocket();
      if (camera?.tipo === 'local') {
        await startCapture();
      }
    } catch (err) {
      console.error('Error conectando:', err);
      setError('Error de conexión');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full">
      <div className="p-3 bg-gray-50 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <h3 className="font-semibold text-gray-900">{camera?.nombre || 'VideoStream'}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${camera?.tipo === 'local' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
              {camera?.tipo === 'local' ? '📹 Local' : '🌐 IP'}
            </span>
            {isCapturing && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✓ Capturando
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3 text-xs text-gray-600">
            <span>📊 {stats.sent}/{stats.frame} frames</span>
            <span>⏭️ {stats.skipped} skip</span>
            <span>⏱️ {stats.latency}ms</span>
            <span className="text-orange-600">🔥 {resolution.width}x{resolution.height}@{fps}fps Q{Math.round(quality*100)}%</span>
          </div>
        </div>
      </div>

      <div className="relative flex-1 bg-black min-h-96">
        <canvas ref={canvasRef} className="w-full h-full object-contain" style={{ backgroundColor: '#000' }} />

        {!isConnected && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
            <div className="text-center text-white">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm">Conectando...</p>
              {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
            </div>
          </div>
        )}

        {error && isConnected && (
          <div className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded text-xs">
            ⚠️ {error}
          </div>
        )}
      </div>

      <video ref={videoRef} autoPlay muted playsInline style={{ display: 'none' }} />

      <div className="p-2 bg-gray-50 border-t text-xs text-gray-600 flex justify-between">
        <span>Estado: {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}</span>
        <span>{isCapturing ? 'Capturando' : 'Listo'}</span>
      </div>
    </div>
  );
};

export default VideoStream;