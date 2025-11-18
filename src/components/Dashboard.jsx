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
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Fetch con delay mínimo no bloqueante
    const timer = setTimeout(() => {
      fetchVehiculosActivos();
    }, 200);
    
    // Polling cada 60s (reducido de 30s para menos carga)
    const interval = setInterval(fetchVehiculosActivos, 60000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const fetchVehiculosActivos = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      // Obtener registros activos desde SQLite de main.py
      const response = await axios.get(`${apiUrl}/registros?estado=activo`, {
        timeout: 3000, // Timeout de 3s
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
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
      console.warn('API no disponible:', error.message);
      // Fallar silenciosamente
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
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header con estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-300">Cámaras Activas</p>
                  <p className="text-xs text-slate-500">Monitoreando en tiempo real</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-400">{cameras.length}</div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-300">Vehículos Detectados</p>
                  <p className="text-xs text-slate-500">Registros activos</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-emerald-400">{vehiculosFiltrados.length}</div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-300">Sistema AI</p>
                  <p className="text-xs text-slate-500">Detección automática</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-sm font-medium text-emerald-400">ACTIVO</span>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de Cámaras en Vivo */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">
                Monitoreo en Vivo
              </h2>
              <p className="text-slate-400 text-sm">Transmisión en tiempo real de todas las cámaras</p>
            </div>
          </div>
          <CameraGrid 
            cameras={cameras} 
            onDeleteCamera={onDeleteCamera}
            onViewCamera={setSelectedCamera}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Detecciones en Tiempo Real */}
          <div className="lg:col-span-1">
            <DetectionPanel />
          </div>

          {/* Vehículos Activos */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Vehículos Activos
                  </h2>
                  <p className="text-slate-400 text-sm">En estacionamiento ahora</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1.5 bg-emerald-600/20 border border-emerald-600/30 text-emerald-400 rounded-lg text-sm font-medium flex items-center space-x-2">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                    <span>{vehiculosFiltrados.length}</span>
                  </span>
                  <button
                    onClick={fetchVehiculosActivos}
                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-600 border-t-blue-500"></div>
                  <span className="mt-3 text-slate-400 text-sm">Cargando vehículos...</span>
                </div>
              ) : vehiculosFiltrados.length === 0 ? (
                <div className="text-center py-8 bg-slate-700/20 rounded-lg border border-slate-700/30">
                  <div className="w-16 h-16 bg-slate-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <p className="text-slate-300 font-medium text-base">No hay vehículos activos</p>
                  {searchTerm && (
                    <p className="text-slate-400 text-sm mt-2">
                      No se encontraron resultados para "{searchTerm}"
                    </p>
                  )}
                  <p className="text-slate-500 text-sm mt-2">El estacionamiento está vacío</p>
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
            </div>
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