import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CameraGrid from './CameraGrid';
import VehiculoCard from './VehiculoCard';
import FacturaModal from './FacturaModal';
import HistorialFacturas from './HistorialFacturas';
import CameraViewer from './CameraViewer';
import DetectionPanel from './DetectionPanel';

const Dashboard = ({ searchTerm, cameras, onDeleteCamera }) => {
  const [vehiculosActivos, setVehiculosActivos] = useState([]);
  const [selectedVehiculo, setSelectedVehiculo] = useState(null);
  const [showFacturaModal, setShowFacturaModal] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchVehiculosActivos();
    const interval = setInterval(fetchVehiculosActivos, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchVehiculosActivos = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      // Obtener registros activos desde SQLite de main.py
      const response = await axios.get(`${apiUrl}/registros?estado=activo`);
      
      // El backend devuelve {registros: [...], total: n, fuente: "sqlite_main"}
      const data = response.data?.registros || [];
      
      // Transformar datos de SQLite a formato esperado por el frontend
      const vehiculosTransformados = data.map(registro => ({
        id: registro.id,
        placa: registro.numero_de_placa || registro.placa_final,
        hora_entrada: registro.hora_entrada,
        tipo_vehiculo: registro.tipo_vehiculo || 'car',
        url_imagen: registro.url_imagen,
        estado: registro.estado || 'activo',
        saldo: registro.saldo || 0,
        id_sort_entrada: registro.id_sort_entrada,
        frames_hasta_placa: registro.frames_hasta_placa
      }));
      
      setVehiculosActivos(vehiculosTransformados);
    } catch (error) {
      console.error('Error cargando vehículos activos:', error);
      setVehiculosActivos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizarVehiculo = (vehiculo) => {
    setSelectedVehiculo(vehiculo);
    setShowFacturaModal(true);
  };

  const handlePagar = (vehiculoId, valorPagado) => {
    setVehiculosActivos(prev => prev.filter(v => v.id !== vehiculoId));
    setRefreshTrigger(prev => prev + 1);
  };

  const vehiculosFiltrados = (Array.isArray(vehiculosActivos) ? vehiculosActivos : []).filter(vehiculo =>
    vehiculo.placa?.toLowerCase().includes(searchTerm?.toLowerCase() || '')
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Zona 1: Grid de Cámaras en Vivo */}
      <CameraGrid 
        cameras={cameras} 
        onDeleteCamera={onDeleteCamera}
        onViewCamera={setSelectedCamera}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Zona 2: Detecciones en Tiempo Real */}
        <div className="lg:col-span-1">
          <DetectionPanel />
        </div>

        {/* Zona 3: Vehículos Activos */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Vehículos Activos</h2>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                {vehiculosFiltrados.length}
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600">Cargando...</span>
              </div>
            ) : vehiculosFiltrados.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <p>No hay vehículos activos</p>
                {searchTerm && (
                  <p className="text-sm mt-1">
                    No se encontraron resultados para "{searchTerm}"
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vehiculosFiltrados.map((vehiculo) => (
                  <VehiculoCard
                    key={vehiculo.id}
                    vehiculo={vehiculo}
                    onFinalizarClick={handleFinalizarVehiculo}
                  />
                ))}
              </div>
            )}

            <button
              onClick={fetchVehiculosActivos}
              className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Actualizar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Facturación */}
      {showFacturaModal && (
        <FacturaModal
          vehiculo={selectedVehiculo}
          onClose={() => {
            setShowFacturaModal(false);
            setSelectedVehiculo(null);
          }}
          onPagar={handlePagar}
        />
      )}

      {/* Visor de Cámara */}
      {selectedCamera && (
        <CameraViewer
          camera={selectedCamera}
          onClose={() => setSelectedCamera(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;