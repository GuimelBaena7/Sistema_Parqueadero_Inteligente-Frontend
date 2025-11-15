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
      activo: 'bg-green-100 text-green-800',
      cerrado: 'bg-blue-100 text-blue-800',
      cancelado: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[estado] || 'bg-gray-100 text-gray-800'}`}>
        {estado?.charAt(0).toUpperCase() + estado?.slice(1) || 'Desconocido'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">📋 Historial de Registros</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Cargando registros...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">📋 Historial de Registros</h2>
        <button
          onClick={fetchRegistros}
          className="text-blue-500 hover:text-blue-700 text-sm font-medium"
        >
          🔄 Actualizar
        </button>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-yellow-800 text-sm">{error} - Mostrando datos de ejemplo</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 font-medium text-gray-700">Imagen</th>
              <th className="text-left py-3 px-2 font-medium text-gray-700">Placa</th>
              <th className="text-left py-3 px-2 font-medium text-gray-700">Entrada</th>
              <th className="text-left py-3 px-2 font-medium text-gray-700">Salida</th>
              <th className="text-left py-3 px-2 font-medium text-gray-700">Tiempo</th>
              <th className="text-left py-3 px-2 font-medium text-gray-700">Valor</th>
              <th className="text-left py-3 px-2 font-medium text-gray-700">Estado</th>
            </tr>
          </thead>
          <tbody>
            {registros.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-gray-500">
                  No hay registros disponibles
                </td>
              </tr>
            ) : (
              registros.map((registro) => (
                <tr key={registro.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-2">
                    {registro.url_imagen ? (
                      <img
                        src={registro.url_imagen}
                        alt={`Vehículo ${registro.placa}`}
                        className="w-12 h-12 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-lg">🚗</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-2 font-medium">{registro.placa}</td>
                  <td className="py-3 px-2 text-gray-600">
                    {new Date(registro.hora_entrada).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="py-3 px-2 text-gray-600">
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
                  <td className="py-3 px-2">{registro.tiempo_total || '-'}</td>
                  <td className="py-3 px-2 font-medium">
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