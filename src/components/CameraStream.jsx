import React, { useRef, useEffect, useState } from 'react';

/**
 * CameraStream - Componente para mostrar stream de cámara con detección
 * Basado en VideoStream.jsx que funciona correctamente
 */
const CameraStream = ({ camera, onDetection }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const captureCanvasRef = useRef(null);
  const wsRef = useRef(null);
  const rafRef = useRef(null);
  const mediaStreamRef = useRef(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [detections, setDetections] = useState([]);
  const [frameCount, setFrameCount] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    connectCamera();

    return () => {
      cleanup();
    };
  }, [camera]);

  const cleanup = () => {
    // Detener loop de captura
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    // Cerrar WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    // Detener tracks de video
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCapturing(false);
  };

  // ========== CONECTAR CÁMARA ==========
  const connectCamera = async () => {
    try {
      setError(null);
      
      // Primero conectar WebSocket
      await connectWebSocket();
      
      // Si es cámara local, iniciar captura
      if (camera.tipo === 'local') {
        await startLocalCapture();
      }
    } catch (error) {
      console.error('❌ Error conectando cámara:', error);
      setError(error.message || 'Error al conectar');
    }
  };

  // ========== INICIAR CAPTURA LOCAL ==========
  const startLocalCapture = async () => {
    if (mediaStreamRef.current) return;
    
    try {
      // Usar stream existente o crear uno nuevo
      let stream = camera.stream;
      
      if (!stream) {
        const constraints = {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'environment',
            frameRate: { ideal: 30 }
          },
          audio: false
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      }
      
      mediaStreamRef.current = stream;
      const video = videoRef.current;
      video.srcObject = stream;
      
      // Esperar a que el video cargue metadatos
      await new Promise((resolve) => {
        video.onloadedmetadata = () => resolve();
      });
      
      await video.play();

      // Configurar canvas de captura con dimensiones reales
      const cap = captureCanvasRef.current;
      cap.width = video.videoWidth || 640;
      cap.height = video.videoHeight || 480;
      
      console.log('✅ Cámara local iniciada:', cap.width, 'x', cap.height);
      
      // Iniciar loop de captura
      startFrameLoop();
      setCapturing(true);
    } catch (error) {
      console.error('❌ Error iniciando cámara local:', error);
      setError('No se pudo acceder a la cámara: ' + error.message);
      throw error;
    }
  };

  // ========== CONECTAR WEBSOCKET ==========
  const connectWebSocket = () => {
    return new Promise((resolve, reject) => {
      if (wsRef.current) {
        resolve();
        return;
      }

      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/camara-directa';
      console.log('🔗 Conectando WebSocket:', wsUrl, 'para:', camera.nombre);
      
      wsRef.current = new WebSocket(wsUrl);
      wsRef.current.binaryType = 'arraybuffer';

      wsRef.current.onopen = () => {
        setIsConnected(true);
        console.log('✅ WebSocket conectado:', camera.nombre);

        // Enviar configuración inicial
        const config = {
          type: camera.tipo === 'local' ? 'camera_local' : 'camera_url',
          camera_name: camera.nombre || 'Camera',
          url: camera.tipo === 'ip' ? camera.url : ''
        };
        
        wsRef.current.send(JSON.stringify(config));
        console.log('📤 Config enviada:', config);
        resolve();
      };

      // Recibir frames procesados del backend
      let canvasCtx = null;
      wsRef.current.onmessage = async (event) => {
        try {
          if (event.data instanceof ArrayBuffer || event.data instanceof Blob) {
            const blob = event.data instanceof Blob 
              ? event.data 
              : new Blob([event.data], { type: 'image/jpeg' });
            
            // Usar createImageBitmap para decodificación más rápida
            const imageBitmap = await createImageBitmap(blob);
            
            const canvas = canvasRef.current;
            if (canvas) {
              // Ajustar tamaño del canvas solo si es necesario
              if (canvas.width !== imageBitmap.width || canvas.height !== imageBitmap.height) {
                canvas.width = imageBitmap.width;
                canvas.height = imageBitmap.height;
                canvasCtx = canvas.getContext('2d', { alpha: false });
              }
              
              if (!canvasCtx) {
                canvasCtx = canvas.getContext('2d', { alpha: false });
              }
              
              // Renderizado directo sin URL
              canvasCtx.drawImage(imageBitmap, 0, 0);
              imageBitmap.close(); // Liberar memoria
              setFrameCount(prev => prev + 1);
            }
          }
        } catch (err) {
          console.error('Error procesando frame:', err);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ Error WebSocket:', error);
        setError('Error de conexión WebSocket');
        reject(error);
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        console.log('🔌 WebSocket desconectado:', camera.nombre);
        wsRef.current = null;
        
        // Reintentar conexión después de 3 segundos
        setTimeout(() => {
          console.log('⏳ Reintentando conexión:', camera.nombre);
          connectCamera();
        }, 3000);
      };
    });
  };

  // ========== LOOP DE CAPTURA Y ENVÍO OPTIMIZADO ==========
  const startFrameLoop = () => {
    if (camera.tipo !== 'local') return;

    const fps = 15; // 15 FPS para mayor fluidez
    const interval = 1000 / fps;
    let lastFrameTime = 0;
    let captureCtx = null;

    const frameLoop = (timestamp) => {
      if (!mediaStreamRef.current) return;
      
      if (!lastFrameTime) lastFrameTime = timestamp;
      const elapsed = timestamp - lastFrameTime;

      if (elapsed >= interval) {
        const video = videoRef.current;
        const cap = captureCanvasRef.current;
        
        // Validaciones rápidas
        if (!video || !cap || !video.videoWidth || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          rafRef.current = requestAnimationFrame(frameLoop);
          return;
        }

        try {
          // Reutilizar contexto del canvas
          if (!captureCtx) {
            captureCtx = cap.getContext('2d', { 
              alpha: false,
              willReadFrequently: false,
              desynchronized: true
            });
          }
          
          // Dibujar frame actual
          captureCtx.drawImage(video, 0, 0, cap.width, cap.height);

          // Convertir a JPEG con calidad optimizada para velocidad
          cap.toBlob((blob) => {
            if (blob && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(blob);
            }
          }, 'image/jpeg', 0.6);

        } catch (e) {
          console.error('Error en captura:', e);
        }
        
        lastFrameTime = timestamp;
      }

      rafRef.current = requestAnimationFrame(frameLoop);
    };

    rafRef.current = requestAnimationFrame(frameLoop);
    console.log('🎬 Loop de captura iniciado (15 FPS, calidad optimizada)');
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* HEADER */}
      <div className="p-3 bg-gray-50 border-b flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <h3 className="font-semibold text-gray-900">{camera.nombre}</h3>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            camera.tipo === 'local' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
          }`}>
            {camera.tipo === 'local' ? '📹 Local' : '🌐 IP (Local)'}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          Frames: {frameCount}
        </div>
      </div>

      {/* VIDEO/CANVAS AREA */}
      <div className="relative bg-black" style={{ aspectRatio: '16/9' }}>
        {/* Canvas principal - muestra frames procesados del backend */}
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain"
          style={{ backgroundColor: '#000' }}
        />

        {/* Indicador de captura activa para cámaras locales */}
        {camera.tipo === 'local' && capturing && isConnected && (
          <div className="absolute top-2 left-2 flex items-center space-x-2 bg-green-600 bg-opacity-80 px-3 py-1 rounded-full z-10">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-white text-xs font-semibold">CAPTURANDO</span>
          </div>
        )}

        {/* Indicador de conectando */}
        {!isConnected && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-10">
            <div className="text-center text-white">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm">Conectando...</p>
            </div>
          </div>
        )}

        {/* Indicador de error */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-10">
            <div className="text-center">
              <div className="bg-red-900 bg-opacity-80 p-4 rounded-lg">
                <p className="text-red-200 text-sm font-semibold">⚠️ {error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Video oculto para captura local */}
      <video 
        ref={videoRef} 
        autoPlay 
        muted 
        playsInline 
        style={{ display: 'none' }} 
      />
      
      {/* Canvas oculto para captura y conversión */}
      <canvas ref={captureCanvasRef} style={{ display: 'none' }} />

      {/* FOOTER */}
      <div className="p-2 bg-gray-50 text-xs text-gray-600 flex justify-between">
        <span>Estado: {isConnected ? '🟢 Activo' : '🔴 Desconectado'}</span>
        <span>
          {camera.tipo === 'local' 
            ? (capturing ? 'Capturando y enviando frames' : 'Cámara del Dispositivo') 
            : 'Stream desde URL'}
        </span>
      </div>
    </div>
  );
};

export default CameraStream;