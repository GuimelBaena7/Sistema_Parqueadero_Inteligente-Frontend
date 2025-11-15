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

  const getVehicleIcon = (tipo) => {
    switch (tipo) {
      case 'car': return '🚗';
      case 'motorcycle': return '🏍️';
      case 'bus': return '🚌';
      case 'truck': return '🚛';
      default: return '🚙';
    }
  };

  const getDirectionIcon = (direccion) => {
    return direccion === 'entrada' ? '⬇️' : '⬆️';
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <span className="mr-2">🎯</span>
          Detecciones Recientes
        </h2>
        <button
          onClick={fetchDetections}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
        >
          🔄 Actualizar
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Cargando detecciones...</span>
        </div>
      ) : detections.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🔍</div>
          <p>No hay detecciones recientes</p>
          <p className="text-sm mt-1">Las detecciones aparecerán aquí en tiempo real</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {detections.map((detection) => (
            <div
              key={detection.id}
              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">
                    {getVehicleIcon(detection.tipo_vehiculo)}
                  </span>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-lg font-bold text-gray-900">
                    {detection.placa_final || 'Sin placa'}
                  </p>
                  <span className="text-lg">
                    {getDirectionIcon(detection.direccion)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {formatTime(detection.hora_entrada || detection.timestamp)}
                </p>
              </div>

              <div className="flex-shrink-0 text-right">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  detection.direccion === 'entrada' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {detection.direccion || 'entrada'}
                </div>
                {detection.url_imagen && (
                  <button
                    onClick={() => window.open(detection.url_imagen, '_blank')}
                    className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                  >
                    Ver imagen
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Total detecciones: {detections.length}</span>
          <span>Actualización automática cada 5s</span>
        </div>
      </div>
    </div>
  );
};

export default DetectionPanel;