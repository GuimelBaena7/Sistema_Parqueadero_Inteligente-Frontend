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
    <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-3xl shadow-2xl overflow-hidden border border-slate-700/50 hover:border-blue-500/50 transition-all duration-500 backdrop-blur-xl hover:shadow-blue-500/20 hover:transform hover:scale-[1.02]">
      {/* Efecto de brillo en hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/5 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Video Canvas */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
        {/* Patrón de fondo animado */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)] animate-pulse"></div>
        
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          className="relative w-full h-full object-cover"
        />

        {/* Indicador de grabación cuando está conectado */}
        {isConnected && (
          <div className="absolute top-4 right-4 flex items-center space-x-2 bg-red-500/20 backdrop-blur-md px-3 py-2 rounded-full border border-red-500/30 z-10">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
            <span className="text-red-300 text-xs font-bold">REC</span>
          </div>
        )}

        {!isConnected && (
          <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-slate-900/50">
            <div className="text-center p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-xl">
              {isConnecting ? (
                <>
                  <div className="relative mb-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500/30 border-t-blue-500 mx-auto"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-lg animate-pulse"></div>
                    </div>
                  </div>
                  <p className="text-blue-300 text-sm font-semibold">Conectando cámara...</p>
                  <p className="text-slate-400 text-xs mt-1">Estableciendo enlace</p>
                </>
              ) : error ? (
                <>
                  <div className="text-6xl mb-4 animate-bounce">⚠️</div>
                  <p className="text-red-300 text-sm font-semibold mb-4 max-w-xs">{error}</p>
                  <button
                    onClick={handleReconnect}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl text-white text-sm font-bold shadow-lg shadow-blue-500/30 transform hover:scale-105 transition-all"
                  >
                    🔄 Reintentar Conexión
                  </button>
                </>
              ) : (
                <>
                  <div className="relative mb-4">
                    <div className="text-6xl animate-pulse">📹</div>
                    <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
                  </div>
                  <p className="text-slate-300 text-sm font-semibold">Cámara en espera</p>
                  <p className="text-slate-400 text-xs mt-1">Aguardando señal de video</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="px-5 py-4 border-t border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-700/30 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="relative">
              <div className={`w-4 h-4 rounded-full flex-shrink-0 ${
                isConnected ? 'bg-emerald-400 shadow-lg shadow-emerald-500/50' : 'bg-red-400 shadow-lg shadow-red-500/50'
              }`}></div>
              {isConnected && (
                <div className="absolute inset-0 w-4 h-4 bg-emerald-400 rounded-full animate-ping opacity-75"></div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-white text-lg truncate bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {nombre}
              </h3>
              <p className="text-xs text-slate-400 truncate font-medium">{url || 'Cámara local'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-gradient-to-r from-slate-900/80 to-slate-800/80 border-t border-slate-700/50 backdrop-blur-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="text-slate-400 text-xs font-medium">ID: <span className="text-blue-400 font-bold">{id}</span></span>
            {tipo && (
              <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${
                tipo === 'local' 
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              }`}>
                {tipo === 'local' ? '📱 Local' : '🎥 IP'}
              </span>
            )}
            <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${
              isConnected 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                : 'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}>
              {isConnected ? '● En vivo' : '○ Offline'}
            </span>
          </div>
          <button
            onClick={() => onDelete(id)}
            className="group relative p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 transition-all duration-300 transform hover:scale-110"
            title="Eliminar cámara"
          >
            <svg className="w-5 h-5 text-red-400 group-hover:text-red-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraCard;