import { useState, useEffect } from 'react';
import { Search, Filter, Eye, Edit, Trash2, Plus, RefreshCw } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { VEHICLE_TYPES } from '../utils/constants';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';

const Registros = () => {
  const [registros, setRegistros] = useState([]);
  const [filteredRegistros, setFilteredRegistros] = useState([]);
  const [filters, setFilters] = useState({
    placa: '',
    tipo_vehiculo: '',
    fecha_inicio: '',
    fecha_fin: ''
  });
  const [selectedRegistro, setSelectedRegistro] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('view'); // 'view', 'edit', 'create'
  const [editForm, setEditForm] = useState({});
  
  const { getRegistros, updateRegistro, deleteRegistro, createRegistro, loading } = useApi();

  const loadRegistros = async () => {
    try {
      const data = await getRegistros();
      setRegistros(data);
      setFilteredRegistros(data);
    } catch (error) {
      console.error('Error loading registros:', error);
    }
  };

  useEffect(() => {
    loadRegistros();
  }, []);

  useEffect(() => {
    let filtered = registros;

    if (filters.placa) {
      filtered = filtered.filter(r => 
        r.placa_final?.toLowerCase().includes(filters.placa.toLowerCase())
      );
    }

    if (filters.tipo_vehiculo) {
      filtered = filtered.filter(r => r.tipo_vehiculo === filters.tipo_vehiculo);
    }

    if (filters.fecha_inicio) {
      filtered = filtered.filter(r => 
        new Date(r.hora_entrada) >= new Date(filters.fecha_inicio)
      );
    }

    if (filters.fecha_fin) {
      filtered = filtered.filter(r => 
        new Date(r.hora_entrada) <= new Date(filters.fecha_fin + 'T23:59:59')
      );
    }

    setFilteredRegistros(filtered);
  }, [filters, registros]);

  const handleView = (registro) => {
    setSelectedRegistro(registro);
    setModalType('view');
    setShowModal(true);
  };

  const handleEdit = (registro) => {
    setSelectedRegistro(registro);
    setEditForm(registro);
    setModalType('edit');
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditForm({
      tipo_vehiculo: 'car',
      placa_final: '',
      direccion: 'entrada',
      hora_entrada: new Date().toISOString().slice(0, 16)
    });
    setModalType('create');
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (modalType === 'edit') {
        await updateRegistro(selectedRegistro.id, editForm);
      } else if (modalType === 'create') {
        await createRegistro(editForm);
      }
      setShowModal(false);
      loadRegistros();
    } catch (error) {
      console.error('Error saving registro:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este registro?')) {
      try {
        await deleteRegistro(id);
        loadRegistros();
      } catch (error) {
        console.error('Error deleting registro:', error);
      }
    }
  };

  const resetFilters = () => {
    setFilters({
      placa: '',
      tipo_vehiculo: '',
      fecha_inicio: '',
      fecha_fin: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Registros</h1>
          <p className="text-gray-600 dark:text-gray-400">Gestiona todos los registros de vehículos</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={loadRegistros}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Registro</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filtros</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Placa
            </label>
            <input
              type="text"
              value={filters.placa}
              onChange={(e) => setFilters({...filters, placa: e.target.value})}
              placeholder="Buscar por placa..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de Vehículo
            </label>
            <select
              value={filters.tipo_vehiculo}
              onChange={(e) => setFilters({...filters, tipo_vehiculo: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Todos los tipos</option>
              {Object.entries(VEHICLE_TYPES).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={filters.fecha_inicio}
              onChange={(e) => setFilters({...filters, fecha_inicio: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha Fin
            </label>
            <input
              type="date"
              value={filters.fecha_fin}
              onChange={(e) => setFilters({...filters, fecha_fin: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Registros ({filteredRegistros.length})
          </h2>
        </div>
        
        {loading ? (
          <div className="p-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Placa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Fecha/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Dirección
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredRegistros.map((registro) => (
                  <tr key={registro.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {registro.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {registro.placa_final}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {VEHICLE_TYPES[registro.tipo_vehiculo] || registro.tipo_vehiculo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(registro.hora_entrada).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        registro.direccion === 'entrada' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {registro.direccion}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(registro)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(registro)}
                          className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(registro.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredRegistros.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No se encontraron registros</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={
          modalType === 'view' ? 'Detalles del Registro' :
          modalType === 'edit' ? 'Editar Registro' : 'Nuevo Registro'
        }
        size="lg"
      >
        {modalType === 'view' && selectedRegistro ? (
          <div className="space-y-4">
            {selectedRegistro.url_imagen && (
              <div>
                <img
                  src={selectedRegistro.url_imagen}
                  alt="Imagen del registro"
                  className="w-full max-h-64 object-contain rounded-lg"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ID</label>
                <p className="text-gray-900 dark:text-white">{selectedRegistro.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Placa</label>
                <p className="text-gray-900 dark:text-white">{selectedRegistro.placa_final}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
                <p className="text-gray-900 dark:text-white">{VEHICLE_TYPES[selectedRegistro.tipo_vehiculo]}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dirección</label>
                <p className="text-gray-900 dark:text-white">{selectedRegistro.direccion}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha/Hora</label>
                <p className="text-gray-900 dark:text-white">{new Date(selectedRegistro.hora_entrada).toLocaleString()}</p>
              </div>
              {selectedRegistro.frames_hasta_placa && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Frames hasta placa</label>
                  <p className="text-gray-900 dark:text-white">{selectedRegistro.frames_hasta_placa}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Placa
                </label>
                <input
                  type="text"
                  value={editForm.placa_final || ''}
                  onChange={(e) => setEditForm({...editForm, placa_final: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Vehículo
                </label>
                <select
                  value={editForm.tipo_vehiculo || ''}
                  onChange={(e) => setEditForm({...editForm, tipo_vehiculo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  {Object.entries(VEHICLE_TYPES).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Dirección
                </label>
                <select
                  value={editForm.direccion || ''}
                  onChange={(e) => setEditForm({...editForm, direccion: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="entrada">Entrada</option>
                  <option value="salida">Salida</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha/Hora
                </label>
                <input
                  type="datetime-local"
                  value={editForm.hora_entrada ? new Date(editForm.hora_entrada).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEditForm({...editForm, hora_entrada: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Registros;