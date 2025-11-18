import { useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000, // Reducido de 30s a 8s
  headers: {
    'ngrok-skip-browser-warning': 'true'
  }
});

export const useApi = () => {
  const [loading, setLoading] = useState(false);

  const detectVehicle = useCallback(async (imageFile) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      
      const response = await api.post('/detect', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Vehículo detectado exitosamente');
      return response.data;
    } catch (error) {
      toast.error('Error al detectar vehículo');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const getRegistros = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await api.get(`/registros?${params}`);
      // El backend devuelve {registros: [...], total: n, fuente: "sqlite_main"}
      return {
        registros: response.data.registros || [],
        total: response.data.total || 0,
        fuente: response.data.fuente || 'unknown'
      };
    } catch (error) {
      console.error('Error al cargar registros:', error);
      return { registros: [], total: 0, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getRegistro = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await api.get(`/registros/${id}`);
      return response.data;
    } catch (error) {
      toast.error('Error al cargar registro');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const createRegistro = useCallback(async (data) => {
    setLoading(true);
    try {
      const response = await api.post('/registros', data);
      toast.success('Registro creado exitosamente');
      return response.data;
    } catch (error) {
      toast.error('Error al crear registro');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRegistro = useCallback(async (id, data) => {
    setLoading(true);
    try {
      const response = await api.put(`/registros/${id}`, data);
      toast.success('Registro actualizado exitosamente');
      return response.data;
    } catch (error) {
      toast.error('Error al actualizar registro');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteRegistro = useCallback(async (id) => {
    setLoading(true);
    try {
      await api.delete(`/registros/${id}`);
      toast.success('Registro eliminado exitosamente');
    } catch (error) {
      toast.error('Error al eliminar registro');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const getStats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/stats');
      return response.data;
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      return {
        registros_total: 0,
        registros_activos: 0,
        registros_cerrados: 0,
        ingresos_hoy: 0,
        camaras_activas: 0,
        error: error.message
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const getImagenesDetecciones = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/detecciones/imagenes');
      return response.data;
    } catch (error) {
      console.error('Error al cargar imágenes:', error);
      return { imagenes: [], total: 0, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    detectVehicle,
    getRegistros,
    getRegistro,
    createRegistro,
    updateRegistro,
    deleteRegistro,
    getStats,
    getImagenesDetecciones
  };
};