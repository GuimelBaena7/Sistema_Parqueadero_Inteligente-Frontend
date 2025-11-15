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
      // GET /api/registros?estado=activo - obtener vehículos activos del backend
      const response = await axios.get(`${apiUrl}/registros?estado=activo`);
      // El backend devuelve {registros: [...]} o solo [...]
      const data = response.data?.registros || response.data || [];
      setVehiculosActivos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando vehículos activos:', error);
      // Datos de ejemplo
      setVehiculosActivos([
        {
          id: 1,
          placa: 'ABC123',
          hora_entrada: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          tipo_vehiculo: 'Automóvil',
          camara_id: 1,
          url_imagen: null,
          estado: 'activo',
          valor_actual: 6000,
          horas_transcurridas: 2,
          factura_id: 1
        },
        {
          id: 2,
          placa: 'XYZ789',
          hora_entrada: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          tipo_vehiculo: 'Motocicleta',
          camara_id: 2,
          url_imagen: null,
          estado: 'activo',
          valor_actual: 3000,
          horas_transcurridas: 1,
          factura_id: 2
        }
      ]);
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
              <h2 className="text-xl font-semibold text-gray-800">🚙 Vehículos Activos</h2>
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
                <div className="text-4xl mb-2">🚗</div>
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
              className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
            >
              🔄 Actualizar
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