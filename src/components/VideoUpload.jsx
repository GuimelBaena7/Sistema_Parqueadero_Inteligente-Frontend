import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Upload, X, SkipForward, SkipBack } from 'lucide-react';

const VideoUpload = () => {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fps, setFps] = useState(10);
  const [processedFrame, setProcessedFrame] = useState(null);
  const [stats, setStats] = useState({ frame: 0, detections: 0 });
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const intervalRef = useRef(null);

  const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/camara-directa';

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setProcessedFrame(null);
      setStats({ frame: 0, detections: 0 });
    }
  };

  const connectWebSocket = () => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(WS_URL);
      
      ws.onopen = () => {
        console.log('📡 WebSocket conectado para procesamiento de video');
        // Enviar configuración
        ws.send(JSON.stringify({
          type: 'camera_local',
          camera_name: `Video: ${videoFile.name}`,
          camera_type: 'video_upload'
        }));
        resolve(ws);
      };

      ws.onmessage = (event) => {
        if (event.data instanceof Blob) {
          // Frame procesado recibido
          const url = URL.createObjectURL(event.data);
          setProcessedFrame(url);
        } else {
          try {
            const data = JSON.parse(event.data);
            if (data.detections) {
              setStats(prev => ({
                ...prev,
                detections: prev.detections + data.detections
              }));
            }
          } catch (e) {
            console.log('Mensaje del servidor:', event.data);
          }
        }
      };

      ws.onerror = (error) => {
        console.error('❌ Error en WebSocket:', error);
        reject(error);
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket cerrado');
      };

      wsRef.current = ws;
    });
  };

  const captureAndSendFrame = async () => {
    if (!videoRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convertir a blob y enviar
    canvas.toBlob((blob) => {
      if (blob && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(blob);
        setStats(prev => ({ ...prev, frame: prev.frame + 1 }));
      }
    }, 'image/jpeg', 0.8);
  };

  const startProcessing = async () => {
    if (!videoFile || !videoRef.current) return;

    try {
      setIsProcessing(true);
      
      // Conectar WebSocket
      await connectWebSocket();
      
      // Reproducir video
      await videoRef.current.play();
      
      // Capturar y enviar frames
      const frameInterval = 1000 / fps;
      intervalRef.current = setInterval(captureAndSendFrame, frameInterval);
      
    } catch (error) {
      console.error('Error iniciando procesamiento:', error);
      setIsProcessing(false);
      alert('Error al conectar con el servidor. Verifica que el backend esté corriendo.');
    }
  };

  const stopProcessing = () => {
    setIsProcessing(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.pause();
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const handleVideoEnd = () => {
    stopProcessing();
    alert(`Procesamiento completado!\n\nFrames procesados: ${stats.frame}\nDetecciones: ${stats.detections}`);
  };

  const resetVideo = () => {
    stopProcessing();
    setVideoFile(null);
    setVideoUrl(null);
    setProcessedFrame(null);
    setStats({ frame: 0, detections: 0 });
  };

  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime += 5;
    }
  };

  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime -= 5;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          📹 Procesamiento de Video
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Sube un video para procesarlo frame por frame y detectar vehículos y placas en tiempo real
        </p>
      </div>

      {/* Upload Section */}
      {!videoFile && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-12 h-12 mb-4 text-gray-400" />
              <p className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-300">
                Click para seleccionar video
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                MP4, AVI, MOV o cualquier formato de video
              </p>
            </div>
            <input
              type="file"
              className="hidden"
              accept="video/*"
              onChange={handleFileSelect}
            />
          </label>
        </div>
      )}

      {/* Video Processing */}
      {videoFile && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  FPS:
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={fps}
                  onChange={(e) => setFps(Number(e.target.value))}
                  disabled={isProcessing}
                  className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                />
              </div>

              <div className="flex gap-2">
                {!isProcessing ? (
                  <button
                    onClick={startProcessing}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
                  >
                    <Play className="w-4 h-4" />
                    Iniciar Procesamiento
                  </button>
                ) : (
                  <button
                    onClick={stopProcessing}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
                  >
                    <Pause className="w-4 h-4" />
                    Detener
                  </button>
                )}

                <button
                  onClick={skipBackward}
                  disabled={!isProcessing}
                  className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition disabled:opacity-50"
                  title="Retroceder 5s"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  onClick={skipForward}
                  disabled={!isProcessing}
                  className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition disabled:opacity-50"
                  title="Adelantar 5s"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                <button
                  onClick={resetVideo}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                  Nuevo Video
                </button>
              </div>

              {/* Stats */}
              <div className="ml-auto flex gap-4 text-sm">
                <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg">
                  Frames: <span className="font-bold">{stats.frame}</span>
                </div>
                <div className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg">
                  Detecciones: <span className="font-bold">{stats.detections}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Video Display */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Original Video */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                Video Original
              </h3>
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-auto"
                  onEnded={handleVideoEnd}
                  muted
                />
                {!isProcessing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <Play className="w-16 h-16 text-white opacity-75" />
                  </div>
                )}
              </div>
            </div>

            {/* Processed Video */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                Video Procesado (con detecciones)
              </h3>
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                {processedFrame ? (
                  <img
                    src={processedFrame}
                    alt="Frame procesado"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    {isProcessing ? (
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                        <p>Procesando frames...</p>
                      </div>
                    ) : (
                      <p>Presiona "Iniciar Procesamiento"</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hidden canvas for frame capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
          💡 Instrucciones
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
          <li>Sube un video de vehículos para probar el sistema de detección</li>
          <li>Ajusta los FPS para controlar la velocidad de procesamiento</li>
          <li>El video se procesa frame por frame como si fuera una cámara en vivo</li>
          <li>Las detecciones se guardan automáticamente en la base de datos</li>
          <li>Puedes ver las estadísticas en tiempo real durante el procesamiento</li>
        </ul>
      </div>
    </div>
  );
};

export default VideoUpload;
