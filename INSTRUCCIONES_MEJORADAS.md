# 🚗 Sistema de Parqueadero - Frontend Mejorado

## ✨ Nuevas Características

### 📹 Cámaras Locales Simplificadas
- **Botón directo**: Agregar cámara local sin necesidad de URLs
- **Interfaz mejorada**: Selección entre cámara IP y cámara local
- **Vista previa**: Probar la cámara antes de agregarla
- **Captura automática**: Funciona directamente con la cámara del dispositivo

### 🔧 Mejoras Técnicas
- **Servidor actualizado**: Configurado para `https://thomasina-speedless-kayce.ngrok-free.dev/`
- **Headers ngrok**: Manejo automático de headers para evitar warnings
- **Timeout configurado**: 10 segundos para evitar cuelgues
- **Mejor manejo de errores**: Mensajes más claros y recuperación automática

## 🚀 Cómo Usar

### 1. Agregar Cámara IP
1. Clic en "Agregar Cámara"
2. Seleccionar "Cámara IP"
3. Ingresar nombre y URL de la cámara
4. Clic en "Agregar Cámara"

### 2. Agregar Cámara Local ⭐ NUEVO
1. Clic en "Agregar Cámara"
2. Seleccionar "Cámara Local"
3. Ingresar solo el nombre
4. Clic en "📹 Configurar Cámara Local"
5. Permitir acceso a la cámara
6. Clic en "Usar Esta Cámara"

### 3. Ver Cámara en Pantalla Completa
1. Pasar el mouse sobre una cámara
2. Clic en el botón del ojo que aparece
3. Ver video en pantalla completa
4. Capturar imágenes si es necesario

## 📱 Compatibilidad Móvil

### Cámara Local en Móviles
- **Cámara trasera**: Se selecciona automáticamente
- **Permisos**: El navegador pedirá permisos la primera vez
- **Resolución optimizada**: Se ajusta automáticamente según el dispositivo

### Navegadores Compatibles
- ✅ Chrome (recomendado)
- ✅ Firefox
- ✅ Safari (iOS)
- ✅ Edge

## 🔧 Configuración del Servidor

### Variables de Entorno (.env)
```env
VITE_API_BASE_URL=https://thomasina-speedless-kayce.ngrok-free.dev/api
VITE_WS_HOST=thomasina-speedless-kayce.ngrok-free.dev
VITE_WS_SCHEME=wss
VITE_WS_URL=wss://thomasina-speedless-kayce.ngrok-free.dev/ws/camara-directa
```

### Iniciar el Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🐛 Solución de Problemas

### Error de Conexión
- **Verificar**: Que el servidor backend esté ejecutándose
- **URL**: Confirmar que la URL de ngrok sea correcta
- **Headers**: Los headers de ngrok se manejan automáticamente

### Cámara Local No Funciona
- **Permisos**: Verificar que el navegador tenga permisos de cámara
- **HTTPS**: La cámara local solo funciona en HTTPS o localhost
- **Dispositivo**: Verificar que el dispositivo tenga cámara disponible

### Cámara IP No Se Conecta
- **URL**: Verificar que la URL de la cámara sea correcta
- **Red**: Confirmar conectividad de red con la cámara
- **Formato**: Usar URLs como `http://192.168.1.100:8080/video`

## 📋 Características por Tipo de Cámara

### 🌐 Cámaras IP
- ✅ Streaming desde URLs externas
- ✅ Guardado en base de datos
- ✅ Detección YOLO + OCR
- ⏳ Vista en tiempo real (en desarrollo)

### 📹 Cámaras Locales
- ✅ Acceso directo a cámara del dispositivo
- ✅ Vista previa en tiempo real
- ✅ Captura de imágenes
- ✅ Optimización automática de resolución
- ✅ Funciona sin configuración adicional

## 🎯 Próximas Mejoras

1. **Streaming en tiempo real** para cámaras IP
2. **Grabación de video** para cámaras locales
3. **Detección automática** de cámaras en la red
4. **Configuración avanzada** de resolución y FPS
5. **Múltiples cámaras locales** simultáneas

## 📞 Soporte

Si encuentras algún problema:
1. Revisa la consola del navegador (F12)
2. Verifica que el servidor backend esté funcionando
3. Confirma los permisos de cámara en el navegador
4. Asegúrate de usar HTTPS para cámaras locales