import React, { useRef, useEffect, useState } from 'react';

const CameraStream = ({ camera, onDetection }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const captureCanvasRef = useRef(null);
  const wsRef = useRef(null);
  const rafRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [detections, setDetections] = useState([]);
  const [frameCount, setFrameCount] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    startCamera();

    return () => {
      cleanup();
    };
  }, [camera]);

  const cleanup = () => {
    // Detener animación frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    // Cerrar WebSocket
    if (wsRef.current) {
      wsRef.current.close();
    }
    // Detener tracks de video
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  // ========== INICIAR CÁMARA - UNIFICADA ==========
  const startCamera = async () => {
    try {
      setError(null);
      
      // Para ambos tipos de cámara: obtener stream de video
      const stream = await navigator.mediaDevices.getUserMedia({
        video: camera.tipo === 'local' 
          ? { 
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'environment'
            }
          : { 
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        
        // Conectar WebSocket
        connectWebSocket();
        
        // Esperar a que el video esté listo y empezar a capturar frames
        videoRef.current.onloadedmetadata = () => {
          startFrameCapture();
        };
      }
    } catch (error) {
      console.error('❌ Error accediendo a cámara:', error);
      setError('No se pudo acceder a la cámara: ' + error.message);
    }
  };

  // ========== CONECTAR WEBSOCKET ==========
  const connectWebSocket = () => {
    const wsUrl = `wss://thomasina-speedless-kayce.ngrok-free.dev/ws/camara-directa`;
    wsRef.current = new WebSocket(wsUrl);
    wsRef.current.binaryType = 'arraybuffer';

    wsRef.current.onopen = () => {
      setIsConnected(true);
      console.log('🔌 WebSocket conectado para:', camera.nombre);

      // Siempre enviar como camera_local (todo se envía localmente)
      const config = {
        type: 'camera_local',
        camera_name: camera.nombre,
        camera_type: camera.tipo  // Solo para referencia en logs
      };
      
      wsRef.current.send(JSON.stringify(config));
      console.log('📤 Enviando config:', config);
    };

    // === RECIBIR FRAMES PROCESADOS ===
    wsRef.current.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        // Frame procesado recibido del backend
        const blob = new Blob([event.data], { type: 'image/jpeg' });
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
          setFrameCount(prev => prev + 1);
        };
        img.src = url;
      }
    };

    // === CERRAR CONEXIÓN ===
    wsRef.current.onclose = () => {
      setIsConnected(false);
      console.log('🔌 WebSocket desconectado:', camera.nombre);
      
      // Reintentar conexión cada 3 segundos
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.CLOSED) {
          console.log('⏳ Reintentando conexión:', camera.nombre);
          connectWebSocket();
        }
      }, 3000);
    };

    // === ERRORES ===
    wsRef.current.onerror = (error) => {
      console.error('❌ Error WebSocket:', error);
      setError('Error de conexión WebSocket');
    };
  };

  // ========== CAPTURAR Y ENVIAR FRAMES CONTINUAMENTE ==========
  const startFrameCapture = () => {
    const captureAndSendFrame = (timestamp) => {
      // Validar que todo esté listo
      if (!videoRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        rafRef.current = requestAnimationFrame(captureAndSendFrame);
        return;
      }

      const video = videoRef.current;
      
      // Usar canvas reutilizable para mejor rendimiento
      const canvas = captureCanvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      // Convertir a JPEG y enviar
      canvas.toBlob((blob) => {
        if (blob && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(blob);
        }
      }, 'image/jpeg', 0.8);

      // Capturar a 10 FPS (100ms de espera)
      setTimeout(() => {
        rafRef.current = requestAnimationFrame(captureAndSendFrame);
      }, 100);
    };

    rafRef.current = requestAnimationFrame(captureAndSendFrame);
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
        {/* Video oculto - solo para captura de frames */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ display: 'none' }}
        />
        
        {/* Canvas para mostrar frame procesado del backend */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-contain"
        />

        {/* Indicador de conectando */}
        {!isConnected && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-center text-white">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm">Conectando...</p>
            </div>
          </div>
        )}

        {/* Indicador de error */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-center text-red-400">
              <p className="text-sm">⚠️ {error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Canvas para captura (oculto) */}
      <canvas ref={captureCanvasRef} style={{ display: 'none' }} />

      {/* FOOTER */}
      <div className="p-2 bg-gray-50 text-xs text-gray-600 flex justify-between">
        <span>Estado: {isConnected ? '🟢 Activo' : '🔴 Desconectado'}</span>
        <span>{camera.tipo === 'local' ? 'Cámara del Dispositivo' : 'Cámara IP (Captura Local)'}</span>
      </div>
    </div>
  );
};

export default CameraStream;