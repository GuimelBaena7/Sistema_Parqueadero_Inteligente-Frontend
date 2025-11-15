# 📹 Sistema de Múltiples Cámaras - Frontend

Frontend React para gestión y visualización de múltiples cámaras con streams procesados en tiempo real.

## 🚀 Instalación Rápida

```bash
npm install
npm run dev
```

## ⚙️ Configuración de URLs

Edita el archivo `.env` con tu backend de Colab:

```env
# URLs del backend en Google Colab (cambiar por tu ngrok)
VITE_API_BASE_URL=https://abcd1234.ngrok.io/api
VITE_WS_BASE=wss://abcd1234.ngrok.io/ws
```

## 🏗️ Arquitectura de Componentes

```
src/components/
├── Navbar.jsx           # Barra con búsqueda + botón agregar cámara
├── AddCamera.jsx        # Modal para agregar nuevas cámaras
├── CameraViewer.jsx     # Visualizador individual con WebSocket dinámico
├── CameraGrid.jsx       # Grid responsive de múltiples cámaras
├── CameraCard.jsx       # Tarjeta de información de cámara
├── VehiculoCard.jsx     # Tarjeta de vehículo detectado
├── HistorialFacturas.jsx # Tabla de registros históricos
└── Dashboard.jsx        # Layout principal con 3 zonas
```

## 🔌 Conexiones WebSocket Dinámicas

### Cada cámara abre su propio WebSocket:
```javascript
// Patrón de conexión por cámara
const wsUrl = `${VITE_WS_BASE}/camara/${camera.id}`;
// Ejemplo: wss://abcd1234.ngrok.io/ws/camara/1

// El WebSocket recibe frames procesados en base64
wsRef.current.onmessage = (event) => {
  setCurrentFrame(`data:image/jpeg;base64,${event.data}`);
};
```

### Reconexión automática:
```javascript
// Si se pierde la conexión, reconecta cada 3 segundos
wsRef.current.onclose = () => {
  setTimeout(() => {
    connectWebSocket();
  }, 3000);
};
```

## 📡 Integración con Backend

### Endpoints utilizados:

**Gestión de Cámaras:**
- `GET /api/camaras` - Lista todas las cámaras registradas
- `POST /api/camaras` - Agregar nueva cámara
- `DELETE /api/camaras/{id}` - Eliminar cámara

**Detecciones de Vehículos:**
- `GET /api/registros?estado=activo` - Vehículos detectados por todas las cámaras
- `GET /api/registros` - Historial completo de detecciones

**WebSockets por Cámara:**
- `wss://ngrok.io/ws/camara/1` - Stream procesado de cámara 1
- `wss://ngrok.io/ws/camara/2` - Stream procesado de cámara 2
- `wss://ngrok.io/ws/camara/N` - Stream procesado de cámara N

## 🎯 Funcionalidades Implementadas

### 📹 Gestión de Cámaras
- ✅ Agregar cámaras dinámicamente (nombre + URL)
- ✅ Ver lista de cámaras registradas
- ✅ Eliminar cámaras con confirmación
- ✅ Grid responsive que se adapta al número de cámaras

### 🔴 Streams en Tiempo Real
- ✅ WebSocket individual por cada cámara
- ✅ Recepción de frames procesados por YOLO + OCR
- ✅ Visualización en tiempo real con `<img />` base64
- ✅ Indicadores de estado de conexión
- ✅ Reconexión automática si se pierde la conexión

### 🚙 Detección de Vehículos
- ✅ Lista unificada de vehículos detectados por todas las cámaras
- ✅ Información de placa, hora de entrada, cámara origen
- ✅ Sistema de facturación integrado
- ✅ Búsqueda por placa en tiempo real

### 📊 Dashboard Integrado
- **Zona 1**: Grid de cámaras en vivo (responsive)
- **Zona 2**: Vehículos detectados (lateral)
- **Zona 3**: Historial de facturas (inferior)

## 🎨 Layout Responsive

### Grid de Cámaras Adaptable:
- **1 cámara**: 1 columna completa
- **2 cámaras**: 2 columnas en tablet+
- **3+ cámaras**: 3 columnas en desktop, 4 en pantallas XL
- **Móvil**: Siempre 1 columna apilada

### Código del Grid:
```javascript
const getGridCols = () => {
  if (cameras.length === 1) return 'grid-cols-1';
  if (cameras.length === 2) return 'grid-cols-1 md:grid-cols-2';
  if (cameras.length === 3) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
};
```

## 🔧 Configuración Avanzada

### Cambiar Tarifa de Parqueadero:
```javascript
// En FacturaModal.jsx, línea 25
const valor = horasACobrar * 2000; // Cambiar por tu tarifa
```

### Modificar Intervalo de Reconexión:
```javascript
// En CameraViewer.jsx, línea 45
setTimeout(connectWebSocket, 3000); // Cambiar 3000ms
```

### Personalizar Aspecto de Video:
```javascript
// En CameraViewer.jsx, línea 85
<div style={{ aspectRatio: '16/9' }}> // Cambiar ratio
```

## 🐛 Solución de Problemas

### Cámaras no se conectan:
1. Verificar URLs en `.env`
2. Comprobar que el backend esté ejecutándose
3. Revisar consola del navegador para errores WebSocket

### Frames no se muestran:
1. Verificar que el backend esté enviando datos base64
2. Comprobar formato de datos en `onmessage`
3. Revisar que las cámaras estén enviando video al backend

### API no responde:
1. Verificar ngrok activo en Colab
2. Comprobar CORS en el backend
3. El frontend muestra datos de ejemplo si falla la API

## 📱 Compatibilidad

- ✅ Chrome, Firefox, Safari, Edge
- ✅ Responsive design (móvil, tablet, desktop)
- ✅ WebSockets modernos
- ✅ Reconexión automática

## 🚀 Despliegue

```bash
# Build de producción
npm run build

# Los archivos se generan en dist/
```

---

**¡Sistema de múltiples cámaras listo! 🎉**

Solo configura las URLs en `.env` y agrega tus cámaras desde la interfaz.