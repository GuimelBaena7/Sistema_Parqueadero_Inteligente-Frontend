/**
 * Hook optimizado para manejar conexiones WebSocket de cámaras
 * 
 * Características:
 * - Control de backpressure (evita saturar el WebSocket)
 * - Calidad adaptativa basada en latencia
 * - FPS preciso con setInterval
 * - Encoding en Web Worker (no bloquea UI)
 * - Reconexión con backoff exponencial
 * - Métricas de performance en tiempo real
 * - Rendering optimizado con ImageBitmap
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { PerformanceMonitor } from '../utils/performanceMonitor';

export const useWebSocketCamera = ({
  wsUrl,
  cameraConfig,
  initialFps = 15,
  initialQuality = 0.7,
  adaptiveQuality = true,
  adaptiveFps = false,
  maxBufferSize = 100000, // 100KB - backpressure threshold
  reconnectEnabled = true,
  maxReconnectAttempts = 10
}) => {
  // Referencias
  const wsRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const captureCanvasRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const captureIntervalRef = useRef(null);
  const workerRef = useRef(null);
  const monitorRef = useRef(new PerformanceMonitor());
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const pendingPingRef = useRef(null);
  const pendingBlobRef = useRef(false); // Backpressure control

  // Estados
  const [isConnected, setIsConnected] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState(monitorRef.current.getMetrics());
  const [currentFps, setCurrentFps] = useState(initialFps);
  const [currentQuality, setCurrentQuality] = useState(initialQuality);

  // ========== INICIALIZAR WEB WORKER ==========
  useEffect(() => {
    // Crear worker para encoding JPEG
    try {
      workerRef.current = new Worker('/jpeg-worker.js');
      
      workerRef.current.onmessage = (e) => {
        const { type, blob, error, compressionRatio } = e.data;
        
        if (type === 'compressed') {
          // Enviar blob comprimido por WebSocket
          try {
            sendFrameBlob(blob);
          } catch (err) {
            console.error('Error enviando frame del worker:', err);
            pendingBlobRef.current = false;
          }
          
          if (compressionRatio) {
            monitorRef.current.recordCompressionRatio(compressionRatio);
          }
        } else if (type === 'error') {
          console.error('❌ Worker error:', error);
        }
      };

      console.log('✅ JPEG Worker inicializado');
    } catch (err) {
      console.warn('⚠️ Worker no disponible, usando encoding directo:', err);
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // ========== CONECTAR WEBSOCKET ==========
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    console.log('🔗 Conectando WebSocket:', wsUrl);
    setError(null);

    try {
      const ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer';
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        console.log('✅ WebSocket conectado');

        // Enviar configuración inicial
        const config = {
          ...cameraConfig,
          headers: { 'ngrok-skip-browser-warning': 'true' }
        };
        ws.send(JSON.stringify(config));
        console.log('📤 Configuración enviada:', config);

        // Si es cámara local, iniciar captura
        if (cameraConfig.type === 'camera_local') {
          startLocalCapture();
        }
      };

      ws.onmessage = async (event) => {
        try {
          // Recibir frame procesado del backend
          if (event.data instanceof ArrayBuffer || event.data instanceof Blob) {
            const blob = event.data instanceof Blob
              ? event.data
              : new Blob([event.data], { type: 'image/jpeg' });

            // Registrar recepción
            monitorRef.current.recordFrameReceived(blob.size);

            // Calcular latencia si hay ping pendiente
            if (pendingPingRef.current) {
              const latency = Date.now() - pendingPingRef.current;
              monitorRef.current.recordLatency(latency);
              pendingPingRef.current = null;
            }

            // Renderizar usando ImageBitmap (más rápido)
            await renderFrame(blob);
          }
        } catch (err) {
          console.error('❌ Error procesando frame:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('❌ WebSocket error:', err);
        setError('Error de conexión WebSocket');
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket desconectado');
        setIsConnected(false);
        wsRef.current = null;
        
        stopCapture();

        // Reconexión con backoff exponencial
        if (reconnectEnabled && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            30000 // Máximo 30 segundos
          );
          
          console.log(`⏳ Reconectando en ${delay / 1000}s (intento ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError(`No se pudo conectar después de ${maxReconnectAttempts} intentos`);
        }
      };

    } catch (err) {
      console.error('❌ Error creando WebSocket:', err);
      setError(err.message);
    }
  }, [wsUrl, cameraConfig, reconnectEnabled, maxReconnectAttempts]);

  // ========== RENDERIZAR FRAME CON IMAGEBITMAP ==========
  const renderFrame = async (blob) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      // Decodificación acelerada por hardware
      const imageBitmap = await createImageBitmap(blob);
      
      // Ajustar tamaño del canvas si es necesario
      if (canvas.width !== imageBitmap.width || canvas.height !== imageBitmap.height) {
        canvas.width = imageBitmap.width;
        canvas.height = imageBitmap.height;
      }

      const ctx = canvas.getContext('2d', { alpha: false });
      ctx.drawImage(imageBitmap, 0, 0);
      
      // Liberar memoria inmediatamente
      imageBitmap.close();
      
      // Actualizar métricas en UI cada 500ms
      if (!renderFrame.lastUpdate || Date.now() - renderFrame.lastUpdate > 500) {
        setMetrics(monitorRef.current.getMetrics());
        renderFrame.lastUpdate = Date.now();
      }
    } catch (err) {
      console.error('❌ Error renderizando frame:', err);
    }
  };

  // ========== INICIAR CAPTURA LOCAL ==========
  const startLocalCapture = async () => {
    if (mediaStreamRef.current) return;

    try {
      console.log('📹 Iniciando captura local...');
      
      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: currentFps }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;
      
      const video = videoRef.current;
      if (!video) throw new Error('Video ref no disponible');

      video.srcObject = stream;
      await video.play();

      // Configurar canvas de captura
      const cap = captureCanvasRef.current;
      cap.width = video.videoWidth || 640;
      cap.height = video.videoHeight || 480;

      console.log(`✅ Captura iniciada: ${cap.width}x${cap.height}`);

      // Iniciar loop de captura con setInterval (FPS preciso)
      startCaptureLoop();
      setIsCapturing(true);

    } catch (err) {
      console.error('❌ Error iniciando captura:', err);
      setError('No se pudo acceder a la cámara: ' + err.message);
      throw err;
    }
  };

  // ========== LOOP DE CAPTURA CON SETINTERVAL ==========
  const startCaptureLoop = () => {
    if (captureIntervalRef.current) return;

    const interval = 1000 / currentFps;
    
    captureIntervalRef.current = setInterval(() => {
      captureAndSendFrame();
    }, interval);

    console.log(`🎬 Loop de captura iniciado: ${currentFps} FPS`);
  };

  // ========== CAPTURAR Y ENVIAR FRAME ==========
  const captureAndSendFrame = () => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    // ⚡ CONTROL DE BACKPRESSURE
    if (ws.bufferedAmount > maxBufferSize) {
      monitorRef.current.recordDroppedFrame();
      console.warn(`⚠️ WebSocket saturado (${ws.bufferedAmount} bytes), saltando frame`);
      return;
    }

    const video = videoRef.current;
    const cap = captureCanvasRef.current;
    
    if (!video || !cap || !video.videoWidth) return;

    try {
      const ctx = cap.getContext('2d', {
        alpha: false,
        willReadFrequently: false,
        desynchronized: true
      });

      // Capturar frame actual
      ctx.drawImage(video, 0, 0, cap.width, cap.height);

      // ⚡ BACKPRESSURE: Skip si hay blob pendiente (evita encolamiento)
      if (pendingBlobRef.current) {
        return; // Skip este frame
      }

      // ⚡ CALIDAD: Usar directamente sin state update (evita re-renders)
      const quality = adaptiveQuality 
        ? monitorRef.current.getRecommendedQuality()
        : initialQuality;

      // Obtener ImageData
      const imageData = ctx.getImageData(0, 0, cap.width, cap.height);

      // Usar Worker si está disponible
      if (workerRef.current) {
        pendingBlobRef.current = true;
        workerRef.current.postMessage({
          type: 'compress',
          imageData,
          quality,
          width: cap.width,
          height: cap.height
        });
      } else {
        // Fallback: encoding directo (bloquea UI)
        pendingBlobRef.current = true;
        cap.toBlob(
          (blob) => {
            try {
              if (blob) sendFrameBlob(blob);
            } finally {
              pendingBlobRef.current = false;
            }
          },
          'image/jpeg',
          quality
        );
      }

      // Marcar timestamp para calcular latencia
      pendingPingRef.current = Date.now();

    } catch (err) {
      console.error('❌ Error capturando frame:', err);
    }
  };

  // ========== ENVIAR FRAME POR WEBSOCKET ==========
  const sendFrameBlob = async (blob) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      pendingBlobRef.current = false;
      return;
    }

    // Verificar backpressure nuevamente
    if (ws.bufferedAmount > maxBufferSize) {
      monitorRef.current.recordDroppedFrame();
      pendingBlobRef.current = false;
      return;
    }

    try {
      // Convertir blob a ArrayBuffer para enviar bytes puros
      const arrayBuffer = await blob.arrayBuffer();
      ws.send(arrayBuffer);
      monitorRef.current.recordFrameSent(blob.size);
    } catch (err) {
      console.error('❌ Error enviando frame:', err);
    } finally {
      pendingBlobRef.current = false;
    }
  };

  // ========== DETENER CAPTURA ==========
  const stopCapture = () => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCapturing(false);
    console.log('⏹️ Captura detenida');
  };

  // ========== DESCONECTAR ==========
  const disconnect = useCallback(() => {
    console.log('🔌 Desconectando...');

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    stopCapture();

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  // ========== CAMBIAR FPS DINÁMICAMENTE ==========
  const changeFps = useCallback((newFps) => {
    setCurrentFps(newFps);
    
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
      startCaptureLoop();
    }
  }, []);

  // ========== ADAPTACIÓN AUTOMÁTICA DE FPS ==========
  useEffect(() => {
    if (!adaptiveFps || !isCapturing) return;

    const interval = setInterval(() => {
      const recommendedFps = monitorRef.current.getRecommendedFPS();
      if (Math.abs(recommendedFps - currentFps) >= 5) {
        console.log(`📊 Ajustando FPS: ${currentFps} → ${recommendedFps}`);
        changeFps(recommendedFps);
      }
    }, 5000); // Verificar cada 5 segundos

    return () => clearInterval(interval);
  }, [adaptiveFps, isCapturing, currentFps, changeFps]);

  // ========== CLEANUP AL DESMONTAR ==========
  useEffect(() => {
    return () => {
      disconnect();
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [disconnect]);

  return {
    // Referencias para componentes
    videoRef,
    canvasRef,
    captureCanvasRef,
    
    // Estado
    isConnected,
    isCapturing,
    error,
    metrics,
    currentFps,
    currentQuality,
    
    // Métodos
    connect,
    disconnect,
    startLocalCapture,
    stopCapture,
    changeFps,
    
    // Monitor de performance
    getLatencyStats: () => monitorRef.current.getLatencyStats(),
    resetMetrics: () => monitorRef.current.reset()
  };
};

export default useWebSocketCamera;
