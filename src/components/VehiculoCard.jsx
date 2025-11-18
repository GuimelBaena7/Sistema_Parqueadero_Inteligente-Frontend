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
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 hover:border-slate-600 transition-colors">
      <div className="flex items-start space-x-4">
        {/* Imagen del vehículo */}
        <div className="flex-shrink-0">
          {url_imagen ? (
            <div className="relative">
              <img
                src={url_imagen}
                alt={`Vehículo ${placa}`}
                className="w-20 h-20 object-cover rounded-lg border border-slate-600"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjMkQzNzQ4Ii8+CjxwYXRoIGQ9Ik00MCA0NUMzNy4yMzg2IDQ1IDM1IDQyLjc2MTQgMzUgNDBDMzUgMzcuMjM4NiAzNy4yMzg2IDM1IDQwIDM1QzQyLjc2MTQgMzUgNDUgMzcuMjM4NiA0NSA0MEM0NSA0Mi43NjE0IDQyLjc2MTQgNDUgNDAgNDVaIiBmaWxsPSIjNjM3M0E4Ii8+Cjwvc3ZnPgo=';
                }}
              />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-800"></div>
            </div>
          ) : (
            <div className="w-20 h-20 bg-slate-700 rounded-lg flex items-center justify-center border border-slate-600">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          )}
        </div>

        {/* Información del vehículo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-white truncate">
              {placa || 'Sin placa'}
            </h3>
            <span className="px-2 py-1 bg-blue-600/20 text-blue-400 border border-blue-600/30 text-xs font-medium rounded">
              {tipo_vehiculo}
            </span>
          </div>
          
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-slate-400">Entrada:</span>
              <span className="text-slate-300 font-mono text-xs">
                {new Date(hora_entrada).toLocaleString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: '2-digit',
                  month: '2-digit'
                })}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-slate-400">Tiempo:</span>
              <span className="text-yellow-400 font-medium">
                {mostrarTiempo()}
              </span>
            </div>
            
            {valor_actual && (
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-slate-400">Valor:</span>
                <span className="text-emerald-400 font-medium">
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
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span>Finalizar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehiculoCard;