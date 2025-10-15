import React, { useEffect, useRef } from 'react';
import GlassCard from '../common/GlassCard';

interface DataPoint {
  timestamp: number;
  value: number;
  label?: string;
}

interface PerformanceChartProps {
  title: string;
  data: DataPoint[];
  unit?: string;
  color?: string;
  height?: number;
  loading?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({
  title,
  data,
  unit = '',
  color = '#3B82F6',
  height = 200,
  loading = false,
  showGrid = true,
  showLegend = true
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

    // Find min and max values
    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1;

    // Draw grid
    if (showGrid) {
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
        const value = maxValue - (valueRange / 5) * i;
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(value.toFixed(2) + unit, padding - 5, y + 3);
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
    }

    // Draw axes
    ctx.strokeStyle = '#6B7280';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + chartHeight);
    ctx.lineTo(padding + chartWidth, padding + chartHeight);
    ctx.stroke();

    // Draw data line
    if (data.length > 0) {
      const xStep = chartWidth / (data.length - 1 || 1);
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      data.forEach((point, index) => {
        const x = padding + xStep * index;
        const y = padding + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      
      // Draw data points
      data.forEach((point, index) => {
        const x = padding + xStep * index;
        const y = padding + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
      
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
        ctx.fillText(middleTime.toLocaleTimeString(), padding + chartWidth / 2, padding + chartHeight + 15);
        ctx.fillText(lastTime.toLocaleTimeString(), padding + chartWidth, padding + chartHeight + 15);
      }
    }

  }, [data, loading, color, height, showGrid, unit]);

  if (loading) {
    return (
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="animate-pulse">
          <div className="h-48 bg-gray-600 rounded"></div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {showLegend && data.length > 0 && (
          <div className="flex items-center space-x-2 mt-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: color }}
            ></div>
            <span className="text-sm text-gray-400">
              Current: {data[data.length - 1]?.value.toFixed(2)}{unit}
            </span>
          </div>
        )}
      </div>
      <div className="relative" style={{ height }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ display: 'block' }}
        />
      </div>
    </GlassCard>
  );
};

export default PerformanceChart;