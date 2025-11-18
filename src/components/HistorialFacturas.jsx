import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HistorialFacturas = ({ refreshTrigger }) => {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRegistros();
  }, [refreshTrigger]);

  const fetchRegistros = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const response = await axios.get(`${apiUrl}/registros`);
      // El backend devuelve {registros: [...]} o solo [...]
      const data = response.data?.registros || response.data || [];
      setRegistros(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error('Error cargando registros:', err);
      setError('Error cargando historial');
      // Datos de ejemplo si falla la API
      setRegistros([
        {
          id: 1,
          placa: 'ABC123',
          hora_entrada: '2024-01-15T10:30:00',
          hora_salida: '2024-01-15T12:45:00',
          tiempo_total: '2h 15m',
          valor_pagado: 6000,
          estado: 'cerrado',
          url_imagen: null
        },
        {
          id: 2,
          placa: 'XYZ789',
          hora_entrada: '2024-01-15T14:20:00',
          hora_salida: null,
          tiempo_total: null,
          valor_pagado: null,
          estado: 'activo',
          url_imagen: null
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado) => {
    const styles = {
      activo: 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30',
      cerrado: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
      cancelado: 'bg-red-600/20 text-red-400 border-red-600/30'
    };
    
    return (
      <span className={`px-2 py-1 rounded border text-xs font-medium ${styles[estado] || 'bg-slate-600/20 text-slate-400 border-slate-600/30'}`}>
        {estado?.charAt(0).toUpperCase() + estado?.slice(1) || 'Desconocido'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-xl font-semibold mb-4 text-white">Historial de Registros</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-600 border-t-blue-500"></div>
          <span className="ml-3 text-slate-300">Cargando registros...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Historial de Registros</h2>
        <button
          onClick={fetchRegistros}
          className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center space-x-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Actualizar</span>
        </button>
      </div>

      {error && (
        <div className="bg-amber-600/20 border border-amber-600/30 rounded-lg p-3 mb-4">
          <p className="text-amber-300 text-sm">{error} - Mostrando datos de ejemplo</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-600">
              <th className="text-left py-3 px-2 font-medium text-slate-300">Imagen</th>
              <th className="text-left py-3 px-2 font-medium text-slate-300">Placa</th>
              <th className="text-left py-3 px-2 font-medium text-slate-300">Entrada</th>
              <th className="text-left py-3 px-2 font-medium text-slate-300">Salida</th>
              <th className="text-left py-3 px-2 font-medium text-slate-300">Tiempo</th>
              <th className="text-left py-3 px-2 font-medium text-slate-300">Valor</th>
              <th className="text-left py-3 px-2 font-medium text-slate-300">Estado</th>
            </tr>
          </thead>
          <tbody>
            {registros.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-slate-400">
                  No hay registros disponibles
                </td>
              </tr>
            ) : (
              registros.map((registro) => (
                <tr key={registro.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                  <td className="py-3 px-2">
                    {registro.url_imagen ? (
                      <img
                        src={registro.url_imagen}
                        alt={`Vehículo ${registro.placa}`}
                        className="w-12 h-12 object-cover rounded border border-slate-600"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-slate-700 rounded flex items-center justify-center border border-slate-600">
                        <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-2 font-medium text-white">{registro.placa}</td>
                  <td className="py-3 px-2 text-slate-300">
                    {new Date(registro.hora_entrada).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="py-3 px-2 text-slate-300">
                    {registro.hora_salida 
                      ? new Date(registro.hora_salida).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : '-'
                    }
                  </td>
                  <td className="py-3 px-2 text-slate-300">{registro.tiempo_total || '-'}</td>
                  <td className="py-3 px-2 font-medium text-white">
                    {registro.valor_pagado ? `$${registro.valor_pagado.toLocaleString()}` : '-'}
                  </td>
                  <td className="py-3 px-2">
                    {getEstadoBadge(registro.estado)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistorialFacturas;