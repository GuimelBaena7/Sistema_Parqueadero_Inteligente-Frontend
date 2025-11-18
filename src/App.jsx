import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';

// Configurar axios con timeout más corto
axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';
axios.defaults.timeout = 5000;

// Componentes críticos (carga inmediata)
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy loading de componentes no críticos
const Dashboard = lazy(() => import('./components/Dashboard'));
const VideoStream = lazy(() => import('./components/VideoStream'));
const RegistrosSQLite = lazy(() => import('./components/RegistrosSQLite'));
const VideoUpload = lazy(() => import('./components/VideoUpload'));

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch no bloqueante con delay mínimo
    const timer = setTimeout(() => {
      fetchCameras();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const fetchCameras = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      
      const response = await axios.get(`${apiUrl}/camaras`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        },
        timeout: 3000 // Timeout más corto para cámaras
      });
      
      const camerasData = response.data?.camaras || response.data || [];
      setCameras(Array.isArray(camerasData) ? camerasData : []);
    } catch (error) {
      console.warn('API no disponible, usando modo local');
      // Modo local sin cámaras precargadas
      setCameras([]);
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

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-slate-900">
          <Navbar
            onSearchChange={handleSearchChange}
            onCameraAdded={handleCameraAdded}
            cameras={cameras}
            error={error}
          />
          
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
              <LoadingSpinner />
            </div>
          }>
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
              <Route
                path="/video-upload"
                element={<VideoUpload />}
              />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;