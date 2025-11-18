import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FacturaModal = ({ vehiculo, onClose, onPagar }) => {
  const [loading, setLoading] = useState(false);
  const [tiempoTotal, setTiempoTotal] = useState('');
  const [valorAPagar, setValorAPagar] = useState(0);

  useEffect(() => {
    if (vehiculo) {
      calcularFactura();
    }
  }, [vehiculo]);

  const calcularFactura = () => {
    // Usar datos del backend si están disponibles
    if (vehiculo.horas_transcurridas && vehiculo.valor_actual) {
      setTiempoTotal(`${vehiculo.horas_transcurridas}h`);
      setValorAPagar(vehiculo.valor_actual);
      return;
    }
    
    // Fallback: calcular en frontend
    const entrada = new Date(vehiculo.hora_entrada);
    const ahora = new Date();
    const diffMinutos = Math.floor((ahora - entrada) / 1000 / 60);
    
    const horas = Math.floor(diffMinutos / 60);
    const mins = diffMinutos % 60;
    setTiempoTotal(`${horas}h ${mins}m`);
    
    const horasACobrar = Math.ceil(diffMinutos / 60);
    const valor = horasACobrar * 3000; // Tarifa del backend
    setValorAPagar(valor);
  };

  const handlePagar = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      
      // Cerrar factura en el backend
      const response = await axios.patch(`${apiUrl}/facturas/${vehiculo.id}/cerrar`, {
        valor_pagado: valorAPagar,
        hora_salida: new Date().toISOString()
      });
      
      console.log('Factura cerrada:', response.data);
      onPagar(vehiculo.id, valorAPagar);
      onClose();
    } catch (error) {
      console.error('Error procesando pago:', error);
      // Continuar con el flujo aunque falle
      onPagar(vehiculo.id, valorAPagar);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!vehiculo) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4 border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Facturación</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Información del vehículo */}
          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center space-x-4">
              {vehiculo.url_imagen ? (
                <img
                  src={vehiculo.url_imagen}
                  alt={`Vehículo ${vehiculo.placa}`}
                  className="w-16 h-16 object-cover rounded-lg border border-slate-600"
                />
              ) : (
                <div className="w-16 h-16 bg-slate-600 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              )}
              <div>
                <h3 className="font-semibold text-lg text-white">{vehiculo.placa}</h3>
                <p className="text-sm text-slate-400">
                  Entrada: {new Date(vehiculo.hora_entrada).toLocaleString('es-ES')}
                </p>
              </div>
            </div>
          </div>

          {/* Detalles de facturación */}
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-slate-600">
              <span className="text-slate-300">Tiempo total:</span>
              <span className="font-semibold text-lg text-white">{tiempoTotal}</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-slate-600">
              <span className="text-slate-300">Tarifa por hora:</span>
              <span className="font-medium text-white">$3,000</span>
            </div>
            
            <div className="flex justify-between items-center py-3 bg-emerald-600/20 px-4 rounded-lg border border-emerald-600/30">
              <span className="text-lg font-semibold text-emerald-300">Total a pagar:</span>
              <span className="text-2xl font-bold text-emerald-400">
                ${valorAPagar.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Botones */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-3 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handlePagar}
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Procesando...
                </div>
              ) : (
                'Confirmar Pago'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacturaModal;