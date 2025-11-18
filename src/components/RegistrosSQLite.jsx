import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

const RegistrosSQLite = () => {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [stats, setStats] = useState({});
  const [error, setError] = useState(null);
  const { getRegistros, getStats } = useApi();

  useEffect(() => {
    cargarDatos();
    const interval = setInterval(cargarDatos, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const [registrosData, statsData] = await Promise.all([
        getRegistros({ estado: filtro === 'todos' ? null : filtro }),
        getStats()
      ]);
      
      setRegistros(registrosData.registros || []);
      setStats(statsData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error al cargar los datos. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return 'N/A';
    return new Date(fechaISO).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearSaldo = (saldo) => {
    if (!saldo) return '$0';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(saldo);
  };

  // Filtrar registros según el estado seleccionado
  const registrosFiltrados = registros.filter(registro => {
    if (filtro === 'todos') return true;
    if (filtro === 'activo') return !registro.hora_salida;
    if (filtro === 'cerrado') return registro.hora_salida;
    return true;
  });

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden">
          {/* Header */}
          <div className="p-8 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-700/30">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
              <div>
                <h2 className="text-3xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                  Registros del Sistema
                </h2>
                <p className="text-slate-400 text-sm font-medium">Historial completo de detecciones y transacciones</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <select
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    className="appearance-none bg-slate-800/50 border border-slate-700 rounded-xl px-5 py-3 pr-10 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm cursor-pointer"
                  >
                    <option value="todos">📋 Todos</option>
                    <option value="activo">🟢 Activos</option>
                    <option value="cerrado">⚫ Cerrados</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <button
                  onClick={cargarDatos}
                  className="group relative bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center space-x-2 shadow-lg shadow-blue-500/30 transition-all transform hover:scale-105"
                >
                  <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Actualizar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm rounded-2xl p-5 border border-blue-500/20 hover:border-blue-500/40 transition-all hover:transform hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-2xl"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-blue-500/20 rounded-xl">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="text-3xl font-black text-blue-300">{stats.registros_total || 0}</div>
                </div>
                <div className="text-sm font-bold text-slate-300">Total Registros</div>
                <div className="text-xs text-slate-400 mt-1">Historial completo</div>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-sm rounded-2xl p-5 border border-emerald-500/20 hover:border-emerald-500/40 transition-all hover:transform hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full blur-2xl"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-emerald-500/20 rounded-xl">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="text-3xl font-black text-emerald-300">{stats.registros_activos || 0}</div>
                </div>
                <div className="text-sm font-bold text-slate-300">Vehículos Activos</div>
                <div className="text-xs text-slate-400 mt-1">En parqueadero ahora</div>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-gradient-to-br from-slate-500/10 to-slate-600/10 backdrop-blur-sm rounded-2xl p-5 border border-slate-500/20 hover:border-slate-500/40 transition-all hover:transform hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-slate-500/20 to-transparent rounded-full blur-2xl"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-slate-500/20 rounded-xl">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-black text-slate-300">{stats.registros_cerrados || 0}</div>
                </div>
                <div className="text-sm font-bold text-slate-300">Registros Cerrados</div>
                <div className="text-xs text-slate-400 mt-1">Finalizados exitosamente</div>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-gradient-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-sm rounded-2xl p-5 border border-yellow-500/20 hover:border-yellow-500/40 transition-all hover:transform hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-500/20 to-transparent rounded-full blur-2xl"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-yellow-500/20 rounded-xl">
                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-black text-yellow-300">{formatearSaldo(stats.ingresos_hoy)}</div>
                </div>
                <div className="text-sm font-bold text-slate-300">Ingresos Hoy</div>
                <div className="text-xs text-slate-400 mt-1">Recaudado en el día</div>
              </div>
            </div>
          </div>

          {/* Tabla de registros */}
          {loading ? (
        <div className="flex flex-col justify-center items-center py-16">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-700"></div>
            <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
          </div>
          <p className="mt-6 text-slate-400 font-semibold animate-pulse">Cargando registros...</p>
        </div>
      ) : error ? (
        <div className="mx-6 mb-6 text-center py-12 bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-2xl border border-red-500/20">
          <div className="text-6xl mb-4 animate-bounce">⚠️</div>
          <p className="text-red-400 font-semibold text-lg">{error}</p>
          <button 
            onClick={cargarDatos}
            className="mt-4 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-6 py-2 rounded-xl font-bold transition-all transform hover:scale-105"
          >
            Reintentar
          </button>
        </div>
      ) : registrosFiltrados.length === 0 ? (
        <div className="mx-6 mb-6 text-center py-16 bg-gradient-to-br from-slate-700/20 to-slate-800/20 rounded-2xl border border-slate-700/30">
          <div className="text-7xl mb-4 animate-pulse">📋</div>
          <p className="text-slate-400 font-semibold text-lg">No hay registros para mostrar</p>
          <p className="text-slate-500 text-sm mt-2">Intenta cambiar el filtro o actualizar</p>
        </div>
      ) : (
        <div className="px-6 pb-6 overflow-hidden">
          <div className="overflow-x-auto rounded-xl border border-slate-700/50">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-slate-700">
                  <th className="px-6 py-4 text-left text-xs font-black text-blue-400 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-blue-400 uppercase tracking-wider">Placa</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-blue-400 uppercase tracking-wider">Marca</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-blue-400 uppercase tracking-wider">Color</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-blue-400 uppercase tracking-wider">Entrada</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-blue-400 uppercase tracking-wider">Salida</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-blue-400 uppercase tracking-wider">Tiempo</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-blue-400 uppercase tracking-wider">Costo</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-blue-400 uppercase tracking-wider">Pago</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-blue-400 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {registrosFiltrados.map((registro, index) => (
                  <tr 
                    key={registro.id} 
                    className="bg-slate-800/30 hover:bg-slate-700/50 transition-all duration-200 group"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-300 group-hover:text-white">
                      #{registro.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-black text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text">
                        {registro.numero_de_placa || registro.placa_final || registro.placa || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 font-medium">
                      {registro.marca || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 font-medium">
                      {registro.color || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 font-mono">
                      {registro.hora_entrada ? formatearFecha(registro.hora_entrada) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 font-mono">
                      {registro.hora_salida ? formatearFecha(registro.hora_salida) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 font-medium">
                      {registro.tiempo_estancia || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-black text-emerald-400">
                        {formatearSaldo(registro.costo)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 font-medium">
                      {registro.metodo_pago || 'Pendiente'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex items-center space-x-1 text-xs font-bold rounded-full border ${
                        registro.estado === 'activo' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          registro.estado === 'activo' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                        }`}></span>
                        <span>{registro.estado}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistrosSQLite;