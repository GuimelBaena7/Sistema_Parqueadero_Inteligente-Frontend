import React, { useState } from 'react';
import { Settings, Wifi, Zap, Image, SkipForward } from 'lucide-react';

/**
 * NetworkOptimizer - Panel de control para optimización de streaming
 * Permite ajustar parámetros en tiempo real según la calidad de red
 */
const NetworkOptimizer = ({ onConfigChange, currentConfig }) => {
  const [showPanel, setShowPanel] = useState(false);
  
  const presets = {
    excellent: {
      name: '🚀 Excelente',
      fps: 15,
      resolution: { width: 640, height: 480 },
      quality: 0.75,
      skipFrames: 1,
      description: 'Fibra óptica, conexión estable'
    },
    good: {
      name: '✅ Buena',
      fps: 10,
      resolution: { width: 480, height: 360 },
      quality: 0.6,
      skipFrames: 2,
      description: 'ADSL rápido, conexión estable'
    },
    regular: {
      name: '⚠️ Regular',
      fps: 8,
      resolution: { width: 320, height: 240 },
      quality: 0.5,
      skipFrames: 3,
      description: 'ADSL lento, conexión variable'
    },
    poor: {
      name: '🐌 Pobre',
      fps: 5,
      resolution: { width: 320, height: 240 },
      quality: 0.4,
      skipFrames: 4,
      description: '3G/4G, conexión inestable'
    }
  };

  const applyPreset = (presetKey) => {
    const preset = presets[presetKey];
    onConfigChange({
      fps: preset.fps,
      resolution: preset.resolution,
      quality: preset.quality,
      skipFrames: preset.skipFrames
    });
  };

  const calculateBandwidth = (config) => {
    // Estimación aproximada de ancho de banda
    const { fps, resolution, quality, skipFrames } = config;
    const effectiveFps = fps / (skipFrames + 1);
    const pixels = resolution.width * resolution.height;
    const bytesPerPixel = 0.1 * quality; // Aproximación JPEG
    const bytesPerFrame = pixels * bytesPerPixel;
    const bytesPerSecond = bytesPerFrame * effectiveFps;
    const mbps = (bytesPerSecond * 8) / (1024 * 1024);
    return mbps.toFixed(2);
  };

  return (
    <div className="relative">
      {/* Botón flotante */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110"
        title="Optimización de Red"
      >
        <Settings className="w-6 h-6" />
      </button>

      {/* Panel de configuración */}
      {showPanel && (
        <div className="fixed bottom-20 right-4 z-50 bg-white rounded-lg shadow-2xl p-6 w-96 max-h-[80vh] overflow-y-auto border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Wifi className="w-5 h-5 text-blue-600" />
              Optimización de Red
            </h3>
            <button
              onClick={() => setShowPanel(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Configuración actual */}
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-sm text-blue-900 mb-2">📊 Configuración Actual</h4>
            <div className="space-y-1 text-xs text-blue-800">
              <div className="flex justify-between">
                <span>FPS:</span>
                <span className="font-mono">{currentConfig.fps}</span>
              </div>
              <div className="flex justify-between">
                <span>Resolución:</span>
                <span className="font-mono">{currentConfig.resolution.width}x{currentConfig.resolution.height}</span>
              </div>
              <div className="flex justify-between">
                <span>Calidad JPEG:</span>
                <span className="font-mono">{Math.round(currentConfig.quality * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Skip Frames:</span>
                <span className="font-mono">1/{currentConfig.skipFrames + 1}</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t border-blue-200">
                <span>Ancho de banda estimado:</span>
                <span className="font-mono text-blue-600">{calculateBandwidth(currentConfig)} Mbps</span>
              </div>
            </div>
          </div>

          {/* Presets rápidos */}
          <div className="space-y-2 mb-4">
            <h4 className="font-semibold text-sm text-gray-700 mb-2">⚡ Presets Rápidos</h4>
            {Object.entries(presets).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-blue-300 transition-all"
              >
                <div className="font-semibold text-sm">{preset.name}</div>
                <div className="text-xs text-gray-600 mt-1">{preset.description}</div>
                <div className="flex gap-2 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {preset.fps} FPS
                  </span>
                  <span className="flex items-center gap-1">
                    <Image className="w-3 h-3" />
                    {preset.resolution.width}x{preset.resolution.height}
                  </span>
                  <span className="flex items-center gap-1">
                    <SkipForward className="w-3 h-3" />
                    1/{preset.skipFrames + 1}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Indicadores de rendimiento */}
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <h4 className="font-semibold text-sm text-yellow-900 mb-2">💡 Tips</h4>
            <ul className="space-y-1 text-xs text-yellow-800">
              <li>• Latencia alta? → Reducir FPS y resolución</li>
              <li>• Video pixelado? → Aumentar calidad JPEG</li>
              <li>• Tartamudeo? → Aumentar skip frames</li>
              <li>• CPU alta en Colab? → Usar YOLO nano/small</li>
            </ul>
          </div>

          {/* Info de conexión */}
          <div className="mt-4 text-xs text-gray-500 text-center">
            Optimizado para Google Colab + ngrok
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkOptimizer;
