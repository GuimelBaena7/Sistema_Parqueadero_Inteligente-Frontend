import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';

// Configurar axios
axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';
axios.defaults.timeout = 10000;
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import VideoStream from './components/VideoStream';
import RegistrosSQLite from './components/RegistrosSQLite';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCameras();
  }, []);

  const fetchCameras = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      console.log('Cargando cámaras desde:', apiUrl);
      
      const response = await axios.get(`${apiUrl}/camaras`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      const camerasData = response.data?.camaras || response.data || [];
      setCameras(Array.isArray(camerasData) ? camerasData : []);
      console.log('Cámaras cargadas:', camerasData.length);
    } catch (error) {
      console.error('Error cargando cámaras:', error.message);
      setError('Error conectando con el servidor');
      // Cámaras de ejemplo si falla la API
      setCameras([
        {
          id: 1,
          nombre: 'Entrada Principal',
          url: 'http://192.168.1.100:8080/video',
          tipo: 'ip',
          estado: 'inactivo'
        },
        {
          id: 2,
          nombre: 'Salida Vehicular', 
          url: 'http://192.168.1.101:8080/video',
          tipo: 'ip',
          estado: 'inactivo'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (term) => {
    setSearchTerm(term);
  };

  const handleCameraAdded = async (newCamera) => {
    console.log('Agregando nueva cámara:', newCamera);
    
    // Agregar nueva cámara a la lista
    setCameras(prev => [...prev, newCamera]);
    
    // Enviar al backend para persistir (solo si no es local)
    if (newCamera.tipo !== 'local') {
      try {
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
        const response = await axios.post(`${apiUrl}/camaras`, newCamera, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json'
          }
        });
        
        // Actualizar con ID asignado por el servidor
        if (response.data?.camera_id || response.data?.id) {
          const serverId = response.data.camera_id || response.data.id;
          setCameras(prev => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (lastIdx >= 0) {
              updated[lastIdx].id = serverId;
            }
            return updated;
          });
        }
        console.log('Cámara guardada en servidor');
      } catch (error) {
        console.error('Error guardando cámara:', error.message);
        setError('Error guardando cámara en servidor');
      }
    }
  };

  const handleDeleteCamera = async (cameraId) => {
    const camera = cameras.find(cam => cam.id === cameraId);
    
    // Eliminar cámara de la lista
    setCameras(prev => prev.filter(cam => cam.id !== cameraId));
    
    // Eliminar del backend (solo si no es local)
    if (camera && camera.tipo !== 'local') {
      try {
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
        await axios.delete(`${apiUrl}/camaras/${cameraId}`, {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        });
        console.log('Cámara eliminada del servidor');
      } catch (error) {
        console.error('Error eliminando cámara:', error.message);
        setError('Error eliminando cámara del servidor');
      }
    }
    
    // Detener stream si es cámara local
    if (camera && camera.stream) {
      camera.stream.getTracks().forEach(track => track.stop());
    }
  };

  if (loading) {
    return <LoadingSpinner message="Inicializando sistema de parqueadero..." />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          <Navbar
            onSearchChange={handleSearchChange}
            onCameraAdded={handleCameraAdded}
            cameras={cameras}
            error={error}
          />
          
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route 
                path="/" 
                element={
                  <Dashboard 
                    searchTerm={searchTerm} 
                    cameras={cameras}
                    onDeleteCamera={handleDeleteCamera}
                    onRefreshCameras={fetchCameras}
                  />
                } 
              />
              <Route
                path="/stream"
                element={<VideoStream />}
              />
              <Route
                path="/registros"
                element={<RegistrosSQLite />}
              />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;