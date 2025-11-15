import React, { useState } from 'react';
import axios from 'axios';
import LocalCamera from './LocalCamera';

const AddCamera = ({ onCameraAdded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLocalCamera, setShowLocalCamera] = useState(false);
  const [cameraType, setCameraType] = useState('ip'); // 'ip' o 'local'
  const [formData, setFormData] = useState({
    nombre: '',
    url: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre) return;
    if (cameraType === 'ip' && !formData.url) return;

    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const cameraData = {
        nombre: formData.nombre,
        tipo: cameraType,
        url: cameraType === 'local' ? 'local://camera' : formData.url
      };
      
      const response = await axios.post(`${apiUrl}/camaras`, cameraData);
      // El backend devuelve {success: true, camera_id: ...}
      const newCamera = {
        id: response.data?.camera_id || response.data?.id || Date.now(),
        nombre: formData.nombre,
        tipo: cameraType,
        url: cameraData.url,
        estado: 'inactivo',
        creado: new Date().toISOString()
      };
      onCameraAdded(newCamera);
      resetForm();
    } catch (error) {
      console.error('❌ Error agregando cámara:', error.response?.data || error.message);
      alert('Error: ' + (error.response?.data?.detail || error.message));
      // NO simular éxito - mostrar el error
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ nombre: '', url: '' });
    setCameraType('ip');
    setIsOpen(false);
    setShowLocalCamera(false);
  };

  const handleLocalCameraReady = (cameraData) => {
    // Agregar cámara local directamente
    const newCamera = {
      id: Date.now(),
      nombre: formData.nombre || 'Cámara Local',
      tipo: 'local',
      url: 'local://camera',
      estado: 'activa',
      stream: cameraData.stream,
      captureFrame: cameraData.captureFrame
    };
    onCameraAdded(newCamera);
    resetForm();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span className="hidden md:block">Agregar Cámara</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md transform transition-all">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Agregar Nueva Cámara</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Nombre de la cámara
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    placeholder="Ej: Entrada Principal"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Tipo de cámara
                  </label>
                  <div className="flex space-x-4 mb-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="cameraType"
                        value="ip"
                        checked={cameraType === 'ip'}
                        onChange={(e) => setCameraType(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm">Cámara IP</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="cameraType"
                        value="local"
                        checked={cameraType === 'local'}
                        onChange={(e) => setCameraType(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm">Cámara Local</span>
                    </label>
                  </div>
                </div>

                {cameraType === 'ip' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      URL de la cámara
                    </label>
                    <input
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({...formData, url: e.target.value})}
                      placeholder="http://192.168.1.100:8080/video"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                )}

                {cameraType === 'local' && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center mb-2">
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-semibold text-green-800">Cámara Local</span>
                    </div>
                    <p className="text-xs text-green-700 mb-3">
                      Se usará la cámara integrada de tu dispositivo. Haz clic en "Configurar Cámara" para probarla.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowLocalCamera(true)}
                      className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      📹 Configurar Cámara Local
                    </button>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || (cameraType === 'ip' && !formData.url)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Agregando...</span>
                    </div>
                  ) : (
                    'Agregar Cámara'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLocalCamera && (
        <LocalCamera
          onCameraReady={handleLocalCameraReady}
          onClose={() => setShowLocalCamera(false)}
        />
      )}
    </>
  );
};

export default AddCamera;