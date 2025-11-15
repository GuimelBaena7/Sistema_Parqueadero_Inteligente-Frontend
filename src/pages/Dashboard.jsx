import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Car, Camera, FileText, BarChart3, TrendingUp, Clock } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import StatsCard from '../components/StatsCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentRegistros, setRecentRegistros] = useState([]);
  const { getStats, getRegistros, loading } = useApi();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, registrosData] = await Promise.all([
          getStats(),
          getRegistros({ limit: 5 })
        ]);
        setStats(statsData);
        setRecentRegistros(registrosData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadData();
  }, [getStats, getRegistros]);

  if (loading && !stats) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Resumen general del sistema de parqueadero</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Registros"
            value={stats.total_registros?.toLocaleString() || '0'}
            icon={FileText}
            color="blue"
          />
          <StatsCard
            title="Registros Hoy"
            value={stats.registros_hoy?.toLocaleString() || '0'}
            icon={Clock}
            color="green"
          />
          <StatsCard
            title="Automóviles"
            value={stats.por_tipo_vehiculo?.car?.toLocaleString() || '0'}
            icon={Car}
            color="purple"
          />
          <StatsCard
            title="Motocicletas"
            value={stats.por_tipo_vehiculo?.motorcycle?.toLocaleString() || '0'}
            icon={TrendingUp}
            color="yellow"
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/detect"
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center">
            <div className="bg-blue-500 p-3 rounded-lg group-hover:bg-blue-600 transition-colors">
              <Camera className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Detectar Vehículo</h3>
              <p className="text-gray-600 dark:text-gray-400">Subir imagen para detección automática</p>
            </div>
          </div>
        </Link>

        <Link
          to="/registros"
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center">
            <div className="bg-green-500 p-3 rounded-lg group-hover:bg-green-600 transition-colors">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ver Registros</h3>
              <p className="text-gray-600 dark:text-gray-400">Consultar historial completo</p>
            </div>
          </div>
        </Link>

        <Link
          to="/stats"
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center">
            <div className="bg-purple-500 p-3 rounded-lg group-hover:bg-purple-600 transition-colors">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Estadísticas</h3>
              <p className="text-gray-600 dark:text-gray-400">Análisis y gráficos detallados</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Records */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
        <div className="px-6 py-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Registros Recientes</h2>
        </div>
        <div className="p-6">
          {recentRegistros.length > 0 ? (
            <div className="space-y-4">
              {recentRegistros.map((registro) => (
                <div key={registro.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                      <Car className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{registro.placa_final}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {registro.tipo_vehiculo} • {new Date(registro.hora_entrada).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    registro.direccion === 'entrada' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {registro.direccion}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No hay registros recientes</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;