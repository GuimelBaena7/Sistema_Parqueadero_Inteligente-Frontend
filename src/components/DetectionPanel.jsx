import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DetectionPanel = () => {
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetections();
    const interval = setInterval(fetchDetections, 5000); // Actualizar cada 5 segundos
    return () => clearInterval(interval);
  }, []);

  const fetchDetections = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await axios.get(`${apiUrl}/registros`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      
      // Ordenar por más recientes primero
      const sortedDetections = (response.data?.registros || [])
        .sort((a, b) => new Date(b.timestamp || b.hora_entrada) - new Date(a.timestamp || a.hora_entrada))
        .slice(0, 10); // Solo los últimos 10
      
      setDetections(sortedDetections);
    } catch (error) {
      console.error('Error cargando detecciones:', error);
      // Datos de ejemplo para desarrollo
      setDetections([
        {
          id: 1,
          placa_final: 'ABC123',
          tipo_vehiculo: 'car',
          hora_entrada: new Date().toISOString(),
          direccion: 'entrada',
          url_imagen: null
        }
      ]);
    } finally {
      setLoading(false);
    }
  };



  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">
            Detecciones en Tiempo Real
          </h2>
          <p className="text-slate-400 text-sm">Actividad reciente</p>
        </div>
        <button
          onClick={fetchDetections}
          className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-600 border-t-purple-500"></div>
          <span className="mt-3 text-slate-400 text-sm">Cargando...</span>
        </div>
      ) : detections.length === 0 ? (
        <div className="text-center py-8 bg-slate-700/20 rounded-lg border border-slate-700/30">
          <div className="w-12 h-12 bg-slate-600 rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-slate-300 font-medium">Sin detecciones</p>
          <p className="text-slate-500 text-sm mt-1">Las detecciones aparecerán aquí</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {detections.map((detection, index) => (
            <div
              key={detection.id}
              className="bg-slate-700/50 rounded-lg border border-slate-600/50 hover:border-slate-500 transition-colors p-3"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center border border-purple-600/30">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-base font-bold text-white">
                      {detection.placa_final || 'Sin placa'}
                    </p>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      detection.direccion === 'entrada' 
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30' 
                        : 'bg-orange-600/20 text-orange-400 border border-orange-600/30'
                    }`}>
                      {detection.direccion || 'entrada'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">
                    {formatTime(detection.hora_entrada || detection.timestamp)}
                  </p>
                </div>

                <div className="flex-shrink-0">
                  {detection.url_imagen && (
                    <button
                      onClick={() => window.open(detection.url_imagen, '_blank')}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-1 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Ver</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-slate-600">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-slate-400 font-medium">Total: {detections.length}</span>
          </div>
          <span className="text-slate-500 text-xs">Auto-actualización 5s</span>
        </div>
      </div>
    </div>
  );
};

export default DetectionPanel;