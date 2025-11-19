/**
 * Utilidad para monitorear métricas de performance del WebSocket
 */

export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      framesSent: 0,
      framesReceived: 0,
      bytesIn: 0,
      bytesOut: 0,
      latencies: [],
      fps: 0,
      avgLatency: 0,
      avgBandwidthOut: 0,
      avgBandwidthIn: 0,
      droppedFrames: 0,
      compressionRatio: 0
    };

    this.latencyWindow = []; // Últimas 30 latencias
    this.fpsTimestamps = []; // Timestamps de frames recibidos
    this.bandwidthSamples = { in: [], out: [] };
    
    this.startTime = Date.now();
    this.lastResetTime = Date.now();
  }

  recordFrameSent(bytes) {
    this.metrics.framesSent++;
    this.metrics.bytesOut += bytes;
    
    this.bandwidthSamples.out.push({
      timestamp: Date.now(),
      bytes
    });

    // Mantener solo últimos 10 segundos
    this.cleanupBandwidthSamples();
    this.updateBandwidth();
  }

  recordFrameReceived(bytes) {
    this.metrics.framesReceived++;
    this.metrics.bytesIn += bytes;
    
    const now = Date.now();
    this.fpsTimestamps.push(now);
    
    this.bandwidthSamples.in.push({
      timestamp: now,
      bytes
    });

    // Limpiar timestamps antiguos (> 1 segundo)
    this.fpsTimestamps = this.fpsTimestamps.filter(t => now - t < 1000);
    this.metrics.fps = this.fpsTimestamps.length;

    this.cleanupBandwidthSamples();
    this.updateBandwidth();
  }

  recordLatency(latency) {
    this.latencyWindow.push(latency);
    
    // Mantener ventana de últimas 30 latencias
    if (this.latencyWindow.length > 30) {
      this.latencyWindow.shift();
    }

    this.metrics.latencies.push(latency);
    
    // Calcular promedio
    const sum = this.latencyWindow.reduce((a, b) => a + b, 0);
    this.metrics.avgLatency = Math.round(sum / this.latencyWindow.length);
  }

  recordDroppedFrame() {
    this.metrics.droppedFrames++;
  }

  recordCompressionRatio(ratio) {
    this.metrics.compressionRatio = ratio;
  }

  cleanupBandwidthSamples() {
    const now = Date.now();
    const cutoff = now - 10000; // 10 segundos

    this.bandwidthSamples.in = this.bandwidthSamples.in.filter(
      s => s.timestamp > cutoff
    );
    this.bandwidthSamples.out = this.bandwidthSamples.out.filter(
      s => s.timestamp > cutoff
    );
  }

  updateBandwidth() {
    // Calcular bandwidth en kbps
    const now = Date.now();
    const window = 5000; // 5 segundos

    const recentIn = this.bandwidthSamples.in.filter(
      s => now - s.timestamp < window
    );
    const recentOut = this.bandwidthSamples.out.filter(
      s => now - s.timestamp < window
    );

    const totalIn = recentIn.reduce((sum, s) => sum + s.bytes, 0);
    const totalOut = recentOut.reduce((sum, s) => sum + s.bytes, 0);

    // Convertir a kbps (kilobits por segundo)
    this.metrics.avgBandwidthIn = Math.round((totalIn * 8) / (window / 1000) / 1024);
    this.metrics.avgBandwidthOut = Math.round((totalOut * 8) / (window / 1000) / 1024);
  }

  getMetrics() {
    const uptime = Math.round((Date.now() - this.startTime) / 1000);
    
    return {
      ...this.metrics,
      uptime,
      avgFps: this.metrics.framesReceived / uptime || 0
    };
  }

  getLatencyStats() {
    if (this.latencyWindow.length === 0) return null;

    const sorted = [...this.latencyWindow].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    return {
      min: Math.min(...this.latencyWindow),
      max: Math.max(...this.latencyWindow),
      avg: this.metrics.avgLatency,
      p50,
      p95,
      p99
    };
  }

  reset() {
    this.latencyWindow = [];
    this.fpsTimestamps = [];
    this.bandwidthSamples = { in: [], out: [] };
    this.lastResetTime = Date.now();
    
    // Mantener contadores acumulados pero resetear promedios
    this.metrics.fps = 0;
    this.metrics.avgLatency = 0;
    this.metrics.avgBandwidthOut = 0;
    this.metrics.avgBandwidthIn = 0;
  }

  getRecommendedQuality() {
    // Recomendar calidad basada en latencia y bandwidth
    const { avgLatency, avgBandwidthOut } = this.metrics;

    if (avgLatency > 500 || avgBandwidthOut < 100) {
      return 0.4; // Baja calidad
    } else if (avgLatency > 300 || avgBandwidthOut < 300) {
      return 0.5; // Calidad media-baja
    } else if (avgLatency > 150 || avgBandwidthOut < 500) {
      return 0.6; // Calidad media
    } else if (avgLatency > 100) {
      return 0.7; // Calidad media-alta
    } else {
      return 0.8; // Alta calidad
    }
  }

  getRecommendedFPS() {
    // Recomendar FPS basado en performance
    const { avgLatency, droppedFrames, framesSent } = this.metrics;
    const dropRate = framesSent > 0 ? droppedFrames / framesSent : 0;

    if (avgLatency > 400 || dropRate > 0.2) {
      return 5; // Muy lento
    } else if (avgLatency > 250 || dropRate > 0.1) {
      return 10; // Lento
    } else if (avgLatency > 150 || dropRate > 0.05) {
      return 15; // Normal
    } else if (avgLatency > 80) {
      return 20; // Rápido
    } else {
      return 30; // Muy rápido
    }
  }
}

export default PerformanceMonitor;
