import React, { useRef, useEffect, useState } from 'react';

const CameraViewer = ({ camera, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (camera.tipo === 'local' && camera.stream) {
      // Usar stream local existente
      if (videoRef.current) {
        videoRef.current.srcObject = camera.stream;
        videoRef.current.play().then(() => {
          setIsStreaming(true);
        }).catch(err => {
          setError('Error reproduciendo video local: ' + err.message);
        });
      }
    } else if (camera.tipo === 'ip') {
      // Para cámaras IP, mostrar placeholder o implementar streaming
      setError('Streaming de cámaras IP no implementado aún');
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [camera]);

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    // Crear enlace de descarga
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `captura_${camera.nombre}_${Date.now()}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{camera.nombre}</h2>
            <p className="text-sm text-slate-600">
              {camera.tipo === 'local' ? '📹 Cámara Local' : '🌐 Cámara IP'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {isStreaming && (
              <button
                onClick={captureFrame}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Capturar</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="relative bg-gray-900" style={{ minHeight: '400px' }}>
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg mb-2">Error de conexión</p>
                <p className="text-sm opacity-75">{error}</p>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto object-contain"
                style={{ backgroundColor: '#000' }}
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              
              {!isStreaming && !error && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-lg">Conectando...</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span className={`flex items-center space-x-1 ${isStreaming ? 'text-green-600' : 'text-red-600'}`}>
                <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>{isStreaming ? 'Transmitiendo' : 'Desconectado'}</span>
              </span>
              <span>Resolución: {isStreaming && videoRef.current ? `${videoRef.current.videoWidth}x${videoRef.current.videoHeight}` : 'N/A'}</span>
            </div>
            <div className="text-xs">
              Tipo: {camera.tipo === 'local' ? 'Cámara Local' : 'Cámara IP'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraViewer;