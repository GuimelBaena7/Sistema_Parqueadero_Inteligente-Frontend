import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Car, Motorcycle, Bus, Truck, TrendingUp, Calendar, Clock } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { VEHICLE_TYPES, VEHICLE_COLORS } from '../utils/constants';
import StatsCard from '../components/StatsCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Stats = () => {
  const [stats, setStats] = useState(null);
  const [registros, setRegistros] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const { getStats, getRegistros, loading } = useApi();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, registrosData] = await Promise.all([
          getStats(),
          getRegistros({ limit: 100 })
        ]);
        
        setStats(statsData);
        setRegistros(registrosData);
        
        // Preparar datos para gráficos
        if (statsData.por_tipo_vehiculo) {
          const chartData = Object.entries(statsData.por_tipo_vehiculo).map(([tipo, cantidad]) => ({
            tipo: VEHICLE_TYPES[tipo] || tipo,
            cantidad,
            color: VEHICLE_COLORS[tipo]
          }));
          setChartData(chartData);
          
          const pieData = Object.entries(statsData.por_tipo_vehiculo).map(([tipo, cantidad]) => ({
            name: VEHICLE_TYPES[tipo] || tipo,
            value: cantidad,
            color: VEHICLE_COLORS[tipo]
          }));
          setPieData(pieData);
        }
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };

    loadData();
  }, [getStats, getRegistros]);

  const getVehicleIcon = (tipo) => {
    const icons = {
      car: Car,
      motorcycle: Motorcycle,
      bus: Bus,
      truck: Truck
    };
    return icons[tipo] || Car;
  };

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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Estadísticas</h1>
        <p className="text-gray-600 dark:text-gray-400">Análisis detallado del sistema de parqueadero</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Registros"
            value={stats.total_registros?.toLocaleString() || '0'}
            icon={TrendingUp}
            color="blue"
          />
          <StatsCard
            title="Registros Hoy"
            value={stats.registros_hoy?.toLocaleString() || '0'}
            icon={Calendar}
            color="green"
          />
          <StatsCard
            title="Promedio Diario"
            value={Math.round((stats.total_registros || 0) / 30).toLocaleString()}
            icon={Clock}
            color="purple"
          />
          <StatsCard
            title="Tipo Más Común"
            value={chartData.length > 0 ? chartData.reduce((a, b) => a.cantidad > b.cantidad ? a : b).tipo : 'N/A'}
            icon={Car}
            color="yellow"
          />
        </div>
      )}

      {/* Vehicle Type Stats */}
      {stats?.por_tipo_vehiculo && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(stats.por_tipo_vehiculo).map(([tipo, cantidad]) => {
            const Icon = getVehicleIcon(tipo);
            const colorMap = {
              car: 'blue',
              motorcycle: 'green',
              bus: 'yellow',
              truck: 'red'
            };
            
            return (
              <StatsCard
                key={tipo}
                title={VEHICLE_TYPES[tipo] || tipo}
                value={cantidad.toLocaleString()}
                icon={Icon}
                color={colorMap[tipo] || 'blue'}
              />
            );
          })}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Registros por Tipo de Vehículo
          </h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="tipo" 
                  className="text-gray-600 dark:text-gray-400"
                />
                <YAxis className="text-gray-600 dark:text-gray-400" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgb(31 41 55)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
                <Bar dataKey="cantidad" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500 dark:text-gray-400">No hay datos disponibles</p>
            </div>
          )}
        </div>

        {/* Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Distribución por Tipo
          </h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgb(31 41 55)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500 dark:text-gray-400">No hay datos disponibles</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
        <div className="px-6 py-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Actividad Reciente</h2>
        </div>
        <div className="p-6">
          {registros.length > 0 ? (
            <div className="space-y-4">
              {registros.slice(0, 10).map((registro) => {
                const Icon = getVehicleIcon(registro.tipo_vehiculo);
                return (
                  <div key={registro.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                        <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {registro.placa_final}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {VEHICLE_TYPES[registro.tipo_vehiculo]} • {new Date(registro.hora_entrada).toLocaleString()}
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
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No hay actividad reciente
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Stats;