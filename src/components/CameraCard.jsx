import React, { useRef, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const CameraCard = ({ camera, onEdit, onDelete, onToggleStatus }) => {
  const { id, nombre, url, tipo = 'ip', estado = 'activa' } = camera;
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const reconnectTimeoutRef = useRef(null);

  // Conectar WebSocket cuando el componente monta
  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [id, url, tipo]);

  const connectWebSocket = () => {
    if (isConnecting) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    setIsConnecting(true);

    try {
      // Usar URL completa del .env o construirla
      let wsUrl = import.meta.env.VITE_WS_URL;
      
      if (!wsUrl) {
        const wsBase = import.meta.env.VITE_WS_BASE || 'ws://localhost:8000/ws';
        wsUrl = `${wsBase}/camara-directa`;
      }

      console.log(`🔌 Conectando WebSocket: ${wsUrl}`);
      wsRef.current = new WebSocket(wsUrl);
      wsRef.current.binaryType = 'arraybuffer';

      wsRef.current.onopen = () => {
        console.log(`✅ WebSocket conectado para: ${nombre}`);
        setIsConnected(true);
        setError(null);
        setIsConnecting(false);

        // Enviar configuración de la cámara
        const config = {
          type: tipo === 'local' ? 'camera_local' : 'camera_url',
          url: url || '',
          camera_name: nombre || 'Camera'
        };

        console.log('📤 Enviando config:', config);
        wsRef.current.send(JSON.stringify(config));
      };

      wsRef.current.onmessage = (event) => {
        try {
          if (event.data instanceof ArrayBuffer && canvasRef.current) {
            // Convertir buffer a imagen y mostrar en canvas
            const blob = new Blob([event.data], { type: 'image/jpeg' });
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = () => {
              const ctx = canvasRef.current?.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
              }
              URL.revokeObjectURL(url);
            };
            img.src = url;
          } else if (typeof event.data === 'string') {
            const msg = JSON.parse(event.data);
            if (msg.error) {
              setError(msg.error);
              console.error('Server error:', msg.error);
            }
          }
        } catch (err) {
          console.error('Error procesando frame:', err);
        }
      };

      wsRef.current.onerror = (err) => {
        console.error(`❌ Error WebSocket: ${nombre}:`, err);
        setError('Error de conexión');
        setIsConnected(false);
        setIsConnecting(false);
      };

      wsRef.current.onclose = () => {
        console.log(`🔌 WebSocket desconectado: ${nombre}`);
        setIsConnected(false);
        setIsConnecting(false);

        // Reconectar después de 3 segundos
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log(`⏳ Reintentando conexión: ${nombre}`);
          connectWebSocket();
        }, 3000);
      };
    } catch (err) {
      console.error('Error creando WebSocket:', err);
      setError('No se pudo conectar');
      setIsConnecting(false);

      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, 5000);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`¿Eliminar cámara "${nombre}"?`)) {
      if (wsRef.current) {
        wsRef.current.close();
      }
      onDelete?.(id);
      toast.success('Cámara eliminada');
    }
  };

  const handleReconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    connectWebSocket();
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
      {/* Video Canvas */}
      <div className="bg-gray-900 relative" style={{ aspectRatio: '16/9' }}>
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          className="w-full h-full object-cover"
        />

        {!isConnected && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-950 bg-opacity-75">
            <div className="text-center">
              {isConnecting ? (
                <>
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-3"></div>
                  <p className="text-white text-sm">Conectando...</p>
                </>
              ) : error ? (
                <>
                  <div className="text-4xl mb-3">⚠️</div>
                  <p className="text-red-400 text-sm mb-3">{error}</p>
                  <button
                    onClick={handleReconnect}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm font-medium"
                  >
                    Reintentar
                  </button>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-3">📹</div>
                  <p className="text-gray-400 text-sm">Esperando video...</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-800 truncate">{nombre}</h3>
            <p className="text-xs text-gray-500 truncate">{url}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 text-xs flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-gray-600">ID: {id}</span>
          {tipo && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
              {tipo === 'local' ? '📱 Local' : '🎥 IP'}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className={`font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {isConnected ? 'En vivo' : 'Desconectado'}
          </span>
          <button
            onClick={() => onDelete(id)}
            className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded hover:bg-red-50"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraCard;