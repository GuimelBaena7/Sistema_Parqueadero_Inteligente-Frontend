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
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">💳 Facturación</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Información del vehículo */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-4">
              {vehiculo.url_imagen && (
                <img
                  src={vehiculo.url_imagen}
                  alt={`Vehículo ${vehiculo.placa}`}
                  className="w-16 h-16 object-cover rounded-lg"
                />
              )}
              <div>
                <h3 className="font-semibold text-lg">{vehiculo.placa}</h3>
                <p className="text-sm text-gray-600">
                  Entrada: {new Date(vehiculo.hora_entrada).toLocaleString('es-ES')}
                </p>
              </div>
            </div>
          </div>

          {/* Detalles de facturación */}
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Tiempo total:</span>
              <span className="font-semibold text-lg">{tiempoTotal}</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Tarifa por hora:</span>
              <span className="font-medium">$3,000</span>
            </div>
            
            <div className="flex justify-between items-center py-3 bg-green-50 px-4 rounded-lg">
              <span className="text-lg font-semibold text-green-800">Total a pagar:</span>
              <span className="text-2xl font-bold text-green-600">
                ${valorAPagar.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Botones */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handlePagar}
              disabled={loading}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Procesando...
                </div>
              ) : (
                'Pagar'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacturaModal;