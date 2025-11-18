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

    // Agregar cámara directamente - sin necesidad de API
    const newCamera = {
      id: Date.now(),
      nombre: formData.nombre,
      tipo: cameraType,
      url: cameraType === 'local' ? 'local://camera' : formData.url,
      estado: 'conectando',
      creado: new Date().toISOString()
    };
    
    onCameraAdded(newCamera);
    resetForm();
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
        className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span className="hidden md:block">Agregar Cámara</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-md border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Agregar Nueva Cámara</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nombre de la cámara
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    placeholder="Ej: Entrada Principal"
                    className="w-full px-4 py-3 border border-slate-600 rounded-lg bg-slate-700 text-white focus:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tipo de fuente de video
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center p-3 border border-slate-600 rounded-lg hover:bg-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="cameraType"
                        value="ip"
                        checked={cameraType === 'ip'}
                        onChange={(e) => setCameraType(e.target.value)}
                        className="mr-3"
                      />
                      <div>
                        <span className="text-sm font-medium text-white">Cámara IP</span>
                        <p className="text-xs text-slate-400">Se capturará en tu PC desde la URL proporcionada</p>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border border-slate-600 rounded-lg hover:bg-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="cameraType"
                        value="local"
                        checked={cameraType === 'local'}
                        onChange={(e) => setCameraType(e.target.value)}
                        className="mr-3"
                      />
                      <div>
                        <span className="text-sm font-medium text-white">Cámara del Dispositivo</span>
                        <p className="text-xs text-slate-400">Cámara integrada de tu PC o teléfono</p>
                      </div>
                    </label>
                  </div>
                </div>

                {cameraType === 'ip' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      URL de la cámara IP
                    </label>
                    <input
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({...formData, url: e.target.value})}
                      placeholder="http://192.168.1.100:8080/video o rtsp://..."
                      className="w-full px-4 py-3 border border-slate-600 rounded-lg bg-slate-700 text-white focus:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      required
                    />
                    <p className="text-xs text-slate-400 mt-2">
                      La cámara se capturará localmente en tu PC. Los frames se procesarán y enviarán al backend.
                    </p>
                  </div>
                )}

                {cameraType === 'local' && (
                  <div className="p-4 bg-blue-600/20 rounded-lg border border-blue-600/30">
                    <div className="flex items-center mb-2">
                      <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium text-blue-300">Cámara del Dispositivo</span>
                    </div>
                    <p className="text-xs text-blue-300 mb-3">
                      Se usará la cámara integrada de tu dispositivo. Haz clic en "Configurar Cámara" para activarla.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowLocalCamera(true)}
                      className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Configurar Cámara Local
                    </button>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!formData.nombre || (cameraType === 'ip' && !formData.url)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Agregar Cámara
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