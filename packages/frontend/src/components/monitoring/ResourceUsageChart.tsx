import React, { useEffect, useRef } from 'react';
import GlassCard from '../common/GlassCard';

interface ResourceData {
  timestamp: number;
  cpu: number;
  memory: number;
  disk?: number;
  network?: number;
}

interface ResourceUsageChartProps {
  title: string;
  data: ResourceData[];
  height?: number;
  loading?: boolean;
  showCpu?: boolean;
  showMemory?: boolean;
  showDisk?: boolean;
  showNetwork?: boolean;
}

const ResourceUsageChart: React.FC<ResourceUsageChartProps> = ({
  title,
  data,
  height = 250,
  loading = false,
  showCpu = true,
  showMemory = true,
  showDisk = false,
  showNetwork = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || loading || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate dimensions
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;

    // Find max values
    const maxCpu = Math.max(...data.map((d) => d.cpu));
    const maxMemory = Math.max(...data.map((d) => d.memory));
    const maxDisk = showDisk ? Math.max(...data.map((d) => d.disk || 0)) : 0;
    const maxNetwork = showNetwork ? Math.max(...data.map((d) => d.network || 0)) : 0;

    const maxValue = Math.max(maxCpu, maxMemory, maxDisk, maxNetwork, 100);

    // Draw grid
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 0.5;

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();

      // Y-axis labels
      const value = maxValue - (maxValue / 5) * i;
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${value.toFixed(0)}%`, padding - 5, y + 3);
    }

    // Vertical grid lines
    const xStep = chartWidth / (data.length - 1 || 1);
    for (let i = 0; i < data.length; i++) {
      const x = padding + xStep * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + chartHeight);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#6B7280';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + chartHeight);
    ctx.lineTo(padding + chartWidth, padding + chartHeight);
    ctx.stroke();

    // Draw data lines
    const drawLine = (values: number[], color: string) => {
      if (values.length === 0) return;

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      values.forEach((value, index) => {
        const x = padding + xStep * index;
        const y = padding + chartHeight - (value / maxValue) * chartHeight;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Draw data points
      values.forEach((value, index) => {
        const x = padding + xStep * index;
        const y = padding + chartHeight - (value / maxValue) * chartHeight;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    };

    // Draw lines for enabled metrics
    if (showCpu) {
      drawLine(
        data.map((d) => d.cpu),
        '#EF4444'
      ); // Red
    }
    if (showMemory) {
      drawLine(
        data.map((d) => d.memory),
        '#3B82F6'
      ); // Blue
    }
    if (showDisk) {
      drawLine(
        data.map((d) => d.disk || 0),
        '#10B981'
      ); // Green
    }
    if (showNetwork) {
      drawLine(
        data.map((d) => d.network || 0),
        '#F59E0B'
      ); // Yellow
    }

    // Draw X-axis labels (time)
    if (data.length > 1) {
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';

      // Show first, middle, and last timestamps
      const firstTime = new Date(data[0].timestamp * 1000);
      const middleTime = new Date(data[Math.floor(data.length / 2)].timestamp * 1000);
      const lastTime = new Date(data[data.length - 1].timestamp * 1000);

      ctx.fillText(firstTime.toLocaleTimeString(), padding, padding + chartHeight + 15);
      ctx.fillText(
        middleTime.toLocaleTimeString(),
        padding + chartWidth / 2,
        padding + chartHeight + 15
      );
      ctx.fillText(lastTime.toLocaleTimeString(), padding + chartWidth, padding + chartHeight + 15);
    }
  }, [data, loading, height, showCpu, showMemory, showDisk, showNetwork]);

  if (loading) {
    return (
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-600 rounded"></div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <div className="flex items-center space-x-4 mt-2">
          {showCpu && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <span className="text-sm text-gray-400">CPU</span>
            </div>
          )}
          {showMemory && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
              <span className="text-sm text-gray-400">Memory</span>
            </div>
          )}
          {showDisk && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-sm text-gray-400">Disk</span>
            </div>
          )}
          {showNetwork && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <span className="text-sm text-gray-400">Network</span>
            </div>
          )}
        </div>
      </div>
      <div className="relative" style={{ height }}>
        <canvas ref={canvasRef} className="w-full h-full" style={{ display: 'block' }} />
      </div>
    </GlassCard>
  );
};

export default ResourceUsageChart;
