/**
 * Web Worker para comprimir frames a JPEG
 * Evita bloquear el thread principal durante la compresión
 */

let offscreenCanvas = null;
let ctx = null;

self.onmessage = async function(e) {
  const { type, imageData, quality, width, height } = e.data;

  if (type === 'compress') {
    try {
      // Crear canvas offscreen si no existe
      if (!offscreenCanvas || offscreenCanvas.width !== width || offscreenCanvas.height !== height) {
        offscreenCanvas = new OffscreenCanvas(width, height);
        ctx = offscreenCanvas.getContext('2d', {
          alpha: false,
          desynchronized: true,
          willReadFrequently: false
        });
      }

      // Poner los datos de imagen en el canvas
      ctx.putImageData(imageData, 0, 0);

      // Convertir a blob JPEG
      const blob = await offscreenCanvas.convertToBlob({
        type: 'image/jpeg',
        quality: quality || 0.7
      });

      // Enviar de vuelta el blob comprimido
      self.postMessage({
        type: 'compressed',
        blob: blob,
        originalSize: imageData.data.length,
        compressedSize: blob.size,
        compressionRatio: (blob.size / imageData.data.length * 100).toFixed(2)
      }, [blob]); // Transferible para mejor performance

    } catch (error) {
      self.postMessage({
        type: 'error',
        error: error.message
      });
    }
  }
};
