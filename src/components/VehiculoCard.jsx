import React from 'react';

const VehiculoCard = ({ vehiculo, onFinalizarClick }) => {
  const {
    id,
    placa,
    hora_entrada,
    tiempo_transcurrido,
    url_imagen,
    tipo_vehiculo = 'Automóvil',
    valor_actual,
    horas_transcurridas
  } = vehiculo;

  // Mostrar tiempo y valor del backend
  const mostrarTiempo = () => {
    if (horas_transcurridas) {
      return `${horas_transcurridas}h`;
    }
    
    const entrada = new Date(hora_entrada);
    const ahora = new Date();
    const diff = Math.floor((ahora - entrada) / 1000 / 60);
    
    if (diff < 60) return `${diff} min`;
    const horas = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${horas}h ${mins}m`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-start space-x-4">
        {/* Imagen del vehículo */}
        <div className="flex-shrink-0">
          {url_imagen ? (
            <img
              src={url_imagen}
              alt={`Vehículo ${placa}`}
              className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCA0NUMzNy4yMzg2IDQ1IDM1IDQyLjc2MTQgMzUgNDBDMzUgMzcuMjM4NiAzNy4yMzg2IDM1IDQwIDM1QzQyLjc2MTQgMzUgNDUgMzcuMjM4NiA0NSA0MEM0NSA0Mi43NjE0IDQyLjc2MTQgNDUgNDAgNDVaIiBmaWxsPSIjOUI5QjlCIi8+Cjwvc3ZnPgo=';
              }}
            />
          ) : (
            <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🚗</span>
            </div>
          )}
        </div>

        {/* Información del vehículo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {placa || 'Sin placa'}
            </h3>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {tipo_vehiculo}
            </span>
          </div>
          
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center">
              <span className="font-medium">Entrada:</span>
              <span className="ml-2">
                {new Date(hora_entrada).toLocaleString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: '2-digit',
                  month: '2-digit'
                })}
              </span>
            </div>
            
            <div className="flex items-center">
              <span className="font-medium">Tiempo:</span>
              <span className="ml-2 text-orange-600 font-semibold">
                {mostrarTiempo()}
              </span>
            </div>
            
            {valor_actual && (
              <div className="flex items-center">
                <span className="font-medium">Valor:</span>
                <span className="ml-2 text-green-600 font-semibold">
                  ${valor_actual.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Botón finalizar */}
        <div className="flex-shrink-0">
          <button
            onClick={() => onFinalizarClick(vehiculo)}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Finalizar
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehiculoCard;