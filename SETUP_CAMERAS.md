# 🎥 Guía de Configuración - Cámaras Locales y WebSocket

## ✅ Cambios Realizados

### 1. **CameraStream.jsx** - Completamente Reescrito
- ✅ Eliminada dependencia a hook inexistente (`useWebSocketCamera`)
- ✅ Implementación directa y eficiente de WebSocket
- ✅ Soporte completo para cámaras locales e IP
- ✅ Rendering optimizado con `ImageBitmap`
- ✅ Control de FPS preciso (15 FPS)
- ✅ Compresión JPEG adaptativa (0.6)
- ✅ Reconexión automática cada 3 segundos
- ✅ Estadísticas en tiempo real (FPS, latencia, bytes)

### 2. **VideoStream.jsx** - Mejorado
- ✅ Renderizado con `ImageBitmap` (más rápido que `<img>`)
- ✅ Context del canvas reutilizado
- ✅ Envío de datos como `ArrayBuffer` (bytes puros)
- ✅ Mejor manejo de memoria

## 🔧 Requisitos

### Backend
- URL WebSocket: `wss://thomasina-speedless-kayce.ngrok-free.dev/ws/camara-directa`
- Debe aceptar configuración JSON inicial:
  ```json
  {
    "type": "camera_local" o "camera_url",
    "camera_name": "nombre",
    "url": "URL si es IP",
    "headers": { "ngrok-skip-browser-warning": "true" }
  }
  ```
- Debe enviar frames JPEG procesados como `ArrayBuffer`

### Frontend
- `.env` configurado correctamente
- Permisos de cámara en el navegador
- HTTPS si usas `wss://` (requiere certificado válido)

## 📋 Flujo de Conexión

### Cámara Local
```
1. useEffect → connectAndStart()
2. connectWebSocket() → conexión WebSocket
3. Enviar config: { type: "camera_local", camera_name: "..." }
4. Backend responde OK
5. startLocalCapture() → obtener stream de cámara
6. startFrameLoop() → capturar y enviar frames cada 66ms (15 FPS)
7. Backend procesa y devuelve frames con detecciones
8. Renderizar frames en canvas con detectiones
```

### Cámara IP
```
1. useEffect → connectAndStart()
2. connectWebSocket() → conexión WebSocket
3. Enviar config: { type: "camera_url", url: "http://...", camera_name: "..." }
4. Backend obtiene stream de la URL
5. Backend captura, procesa y devuelve frames
6. Renderizar frames en canvas
```

## 🐛 Troubleshooting

### "Conectando..." infinito
- Verificar URL del WebSocket en `.env`
- Verificar que el backend está corriendo
- Revisar console del navegador para errores CORS
- Si usa ngrok, verificar que el token no expiró

### No se ve video
- Confirmar que el backend está enviando frames (ArrayBuffer)
- Verificar que los frames son JPEG válidos
- Mirar console: "Error procesando frame" indicaría formato incorrecto

### Cámara lenta
- FPS está a 15, calidad JPEG a 0.6 (optimizado)
- Si aún es lenta: verificar ancho de banda a servidor
- Aumentar FPS podría ayudar: cambiar `fps = 15` a `fps = 20` en `CameraStream.jsx`

### Sin audio/detecciones
- Asegurar que backend está procesando correctamente
- Verificar que el modelo de IA/YOLO está cargado en backend
- Revisar logs del backend para errores

## 🎯 Optimizaciones Implementadas

| Aspecto | Antes | Después |
|--------|-------|--------|
| Resolución | 1280x720 | 640x480 |
| Calidad JPEG | 0.7-0.8 | 0.6 |
| FPS | 10 | 15 |
| Renderizado | `<img>` + URL | `ImageBitmap` |
| Context | Recreado c/frame | Reutilizado |
| Formato envío | Blob | ArrayBuffer |
| Reconexión | Manual | Automática |
| Rendimiento | Lento | **RÁPIDO** |

## 📊 Estadísticas en Tiempo Real

Cada componente muestra:
- **📊 FPS**: Frames por segundo que se están capturando
- **📡 ms**: Latencia promedio en milisegundos
- **Frames**: Total de frames procesados

## 🚀 Pruebas

### Probar CameraStream (Cámara Local)
```javascript
// En Dashboard o donde uses el componente
<CameraStream 
  camera={{
    id: 1,
    nombre: "Cámara Principal",
    tipo: "local",
    url: "local://camera"
  }}
/>
```

### Probar VideoStream
```javascript
// Ya está disponible en la aplicación
// Seleccionar "camera_local" y dar permisos
```

## ✨ Características

✅ Soporte WebSocket con Blob/ArrayBuffer
✅ Cámaras locales con `getUserMedia`
✅ Cámaras IP remotas
✅ Renderizado acelerado por hardware
✅ Control de memoria (ImageBitmap.close())
✅ Reconexión automática
✅ Estadísticas de rendimiento
✅ Manejo robusto de errores
✅ Totalmente optimizado para producción

---

**Última actualización**: 18 Noviembre 2025
**Estado**: ✅ LISTO PARA PRODUCCIÓN
