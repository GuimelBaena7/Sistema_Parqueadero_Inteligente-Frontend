# Sistema de Parqueadero Inteligente - Frontend

Frontend moderno desarrollado con React + Vite + TailwindCSS para el sistema de parqueadero inteligente con detección automática de placas en tiempo real.

## 🚀 **OPTIMIZADO PARA GOOGLE COLAB**
Este frontend está específicamente optimizado para trabajar con backends en Google Colab a través de ngrok, minimizando latencia y ancho de banda. Ver [OPTIMIZACIONES_COLAB.md](./OPTIMIZACIONES_COLAB.md) para detalles completos.

## Instalación y Configuración

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar URLs del backend
Edita el archivo `.env` con las URLs de tu backend en Colab:

```env
# Cambiar por tu URL de ngrok desde Google Colab
VITE_API_BASE_URL=https://abcd1234.ngrok.io/api
VITE_WS_URL=wss://abcd1234.ngrok.io/ws/video
```

### 3. Iniciar el servidor de desarrollo
```bash
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

## Estructura del Proyecto

```
src/
├── components/
│   ├── Navbar.jsx           # Barra de navegación con búsqueda
│   ├── VideoStream.jsx      # Stream de video en tiempo real (WebSocket)
│   ├── VehiculoCard.jsx     # Tarjeta de vehículo detectado
│   ├── FacturaModal.jsx     # Modal de facturación
│   ├── HistorialFacturas.jsx # Tabla de historial de registros
│   └── Dashboard.jsx        # Pantalla principal del dashboard
├── App.jsx                  # Componente principal con rutas
└── main.jsx                # Punto de entrada
```

## 🔌 Conexión con Backend

El frontend se conecta automáticamente a tu backend en Google Colab:

### WebSocket (Video en tiempo real)
- **URL**: `wss://tu-ngrok-url.ngrok.io/ws/video`
- **Función**: Recibe frames del video procesado por YOLO + OCR

### API REST (Datos)
- **Base URL**: `https://tu-ngrok-url.ngrok.io/api`
- **Endpoints utilizados**:
  - `GET /registros` - Lista todos los registros
  - `GET /registros?estado=activo` - Vehículos activos
  - `PATCH /facturas/{id}/cerrar` - Cerrar factura

## Funcionalidades

### Video Stream en Tiempo Real
- Conexión WebSocket al sistema YOLO
- Muestra detecciones en tiempo real
- Reconexión automática si se pierde la conexión

### Gestión de Vehículos
- Lista de vehículos activos en el parqueadero
- Información de placa, hora de entrada y tiempo transcurrido
- Imágenes de detección desde Google Drive
- Búsqueda por placa en tiempo real

### Sistema de Facturación
- Modal interactivo para cerrar facturas
- Cálculo automático de tiempo y valor
- Tarifa configurable ($2000/hora)
- Integración con backend para actualizar estado

### Historial Completo
- Tabla con todos los registros históricos
- Estados: activo, pagado, cancelado
- Actualización automática tras pagos

## Configuración

### Cambiar URL del Backend
Edita las variables en `.env`:
```env
VITE_API_BASE_URL=https://tu-nueva-url.ngrok.io/api
VITE_WS_URL=wss://tu-nueva-url.ngrok.io/ws/video
```

### Modificar Tarifa de Parqueadero
En `FacturaModal.jsx`, línea 25:
```javascript
const valor = horasACobrar * 2000; // Cambiar 2000 por tu tarifa
```

## Personalización

### Colores y Estilos
El proyecto usa TailwindCSS. Puedes modificar colores en las clases:
- `bg-blue-500` - Color primario
- `bg-green-500` - Color de éxito
- `bg-red-500` - Color de alerta

### Datos de Ejemplo
Si el backend no responde, el frontend muestra datos de ejemplo para desarrollo.

## Scripts Disponibles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run preview  # Preview del build
npm run lint     # Linter ESLint
```

## 🐛 Solución de Problemas

### Video no se muestra
1. Verifica que el WebSocket esté corriendo en Colab
2. Comprueba la URL en `.env`
3. Revisa la consola del navegador para errores

### API no responde
1. Asegúrate de que FastAPI esté ejecutándose en Colab
2. Verifica que ngrok esté activo
3. Comprueba CORS en el backend

### Reconexión WebSocket
El sistema se reconecta automáticamente cada 3 segundos si se pierde la conexión.

## Despliegue

### Build de Producción
```bash
npm run build
```

Los archivos se generan en la carpeta `dist/`

## Responsive Design

El dashboard está optimizado para:
- **Desktop**: Layout de 3 columnas
- **Tablet**: Layout adaptable
- **Móvil**: Diseño apilado
