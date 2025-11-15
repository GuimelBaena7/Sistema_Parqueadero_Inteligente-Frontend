import React from 'react';
import CameraStream from './CameraStream';

const CameraGrid = ({ cameras, onDeleteCamera, onViewCamera }) => {
  if (cameras.length === 0) {
    return (
      <div className="card text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          No hay cámaras configuradas
        </h3>
        <p className="text-slate-600">
          Agrega una cámara para comenzar a ver los streams en tiempo real
        </p>
      </div>
    );
  }

  // Grid responsive: 1 columna en móvil, 2 en tablet, 3+ en desktop
  const getGridCols = () => {
    if (cameras.length === 1) return 'grid-cols-1';
    if (cameras.length === 2) return 'grid-cols-1 md:grid-cols-2';
    if (cameras.length === 3) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Cámaras en Vivo
            </h2>
            <p className="text-sm text-slate-500">{cameras.length} streams activos</p>
          </div>
        </div>
        <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
          YOLO + OCR
        </div>
      </div>

      <div className={`grid ${getGridCols()} gap-4`}>
        {cameras.map((camera) => (
          <div key={camera.id} className="relative group">
            <CameraStream
              camera={camera}
              onDetection={(detection) => {
                console.log('Detección:', detection);
                // Aquí puedes manejar las detecciones
              }}
            />
            <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onViewCamera && onViewCamera(camera)}
                className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded text-xs"
                title="Vista completa"
              >
                🔍
              </button>
              <button
                onClick={() => onDeleteCamera(camera.id)}
                className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded text-xs"
                title="Eliminar"
              >
                ❌
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CameraGrid;