import React, { useRef, useEffect, useState } from 'react';

const CameraStream = ({ camera, onDetection }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [detections, setDetections] = useState([]);
  const [frameCount, setFrameCount] = useState(0);

  useEffect(() => {
    if (camera.tipo === 'local') {
      startLocalCamera();
    } else {
      startIPCamera();
    }

    return () => {
      cleanup();
    };
  }, [camera]);

  const cleanup = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  const startLocalCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        connectWebSocket();
        startFrameCapture();
      }
    } catch (error) {
      console.error('Error accediendo a cámara local:', error);
    }
  };

  const startIPCamera = () => {
    connectWebSocket();
  };

  const connectWebSocket = () => {
    const wsUrl = `wss://thomasina-speedless-kayce.ngrok-free.dev/ws/camara-directa`;
    wsRef.current = new WebSocket(wsUrl);
    wsRef.current.binaryType = 'arraybuffer';

    wsRef.current.onopen = () => {
      setIsConnected(true);
      console.log('🔌 WebSocket conectado para:', camera.nombre);

      // Enviar configuración inicial
      const config = {
        type: camera.tipo === 'local' ? 'camera_local' : 'camera_url',
        url: camera.url,
        camera_name: camera.nombre
      };
      
      wsRef.current.send(JSON.stringify(config));
      console.log('📤 Enviando config:', config);
    };

    wsRef.current.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        // Frame procesado recibido del servidor
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

    wsRef.current.onclose = () => {
      setIsConnected(false);
      console.log('🔌 WebSocket desconectado:', camera.nombre);
      
      // Reintentar conexión
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.CLOSED) {
          console.log('⏳ Reintentando conexión:', camera.nombre);
          connectWebSocket();
        }
      }, 3000);
    };

    wsRef.current.onerror = (error) => {
      console.error('❌ Error WebSocket:', error);
    };
  };

  const startFrameCapture = () => {
    const captureFrame = () => {
      if (!videoRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        requestAnimationFrame(captureFrame);
        return;
      }

      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(blob);
        }
      }, 'image/jpeg', 0.8);

      // Capturar a 10 FPS
      setTimeout(() => requestAnimationFrame(captureFrame), 100);
    };

    requestAnimationFrame(captureFrame);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-3 bg-gray-50 border-b flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <h3 className="font-semibold text-gray-900">{camera.nombre}</h3>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            camera.tipo === 'local' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {camera.tipo === 'local' ? '📹 Local' : '🌐 IP'}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          Frames: {frameCount}
        </div>
      </div>

      <div className="relative bg-black" style={{ aspectRatio: '16/9' }}>
        {camera.tipo === 'local' && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        )}
        
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-contain"
        />

        {!isConnected && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-center text-white">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm">Conectando...</p>
            </div>
          </div>
        )}

        {/* Overlay de detecciones */}
        {detections.length > 0 && (
          <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white p-2 rounded text-xs">
            <div>🚗 Vehículos: {detections.filter(d => d.type === 'vehicle').length}</div>
            <div>🔤 Placas: {detections.filter(d => d.type === 'plate').length}</div>
          </div>
        )}
      </div>

      <div className="p-2 bg-gray-50 text-xs text-gray-600 flex justify-between">
        <span>Estado: {isConnected ? '🟢 Activo' : '🔴 Desconectado'}</span>
        <span>Tipo: {camera.tipo === 'local' ? 'Cámara Local' : 'Cámara IP'}</span>
      </div>
    </div>
  );
};

export default CameraStream;