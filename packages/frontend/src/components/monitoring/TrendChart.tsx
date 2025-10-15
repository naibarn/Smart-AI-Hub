import React, { useEffect, useRef, useState } from 'react';
import GlassCard from '../common/GlassCard';

interface TrendDataPoint {
  timestamp: string;
  value: number;
}

interface TrendSeries {
  service: string;
  route: string;
  percentile: string;
  data: TrendDataPoint[];
}

interface TrendChartProps {
  title: string;
  data: TrendSeries[];
  height?: number;
  loading?: boolean;
  showLegend?: boolean;
  colors?: string[];
  timeFormat?: 'short' | 'long';
}

const DEFAULT_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // yellow
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
];

const TrendChart: React.FC<TrendChartProps> = ({
  title,
  data,
  height = 300,
  loading = false,
  showLegend = true,
  colors = DEFAULT_COLORS,
  timeFormat = 'short'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{
    series: TrendSeries;
    point: TrendDataPoint;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    if (!canvasRef.current || loading || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Calculate dimensions
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = rect.width - padding.left - padding.right;
    const chartHeight = rect.height - padding.top - padding.bottom;

    // Collect all data points to find min/max
    const allDataPoints = data.flatMap(series => series.data);
    if (allDataPoints.length === 0) return;

    const values = allDataPoints.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1;

    const timestamps = allDataPoints.map(d => new Date(d.timestamp).getTime());
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const timeRange = maxTime - minTime || 1;

    // Draw grid
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 0.5;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();
      
      // Y-axis labels
      const value = maxValue - (valueRange / 5) * i;
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(value.toFixed(1) + 'ms', padding.left - 5, y + 3);
    }
    
    // Vertical grid lines
    for (let i = 0; i <= 6; i++) {
      const x = padding.left + (chartWidth / 6) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, padding.top + chartHeight);
      ctx.stroke();
      
      // X-axis labels
      const time = minTime + (timeRange / 6) * i;
      const date = new Date(time);
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      
      if (timeFormat === 'short') {
        ctx.fillText(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), x, padding.top + chartHeight + 15);
      } else {
        ctx.fillText(date.toLocaleString(), x, padding.top + chartHeight + 15);
      }
    }

    // Draw axes
    ctx.strokeStyle = '#6B7280';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + chartHeight);
    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
    ctx.stroke();

    // Draw data lines
    data.forEach((series, seriesIndex) => {
      if (series.data.length === 0) return;

      const color = colors[seriesIndex % colors.length];
      
      // Draw line
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      series.data.forEach((point, index) => {
        const x = padding.left + ((new Date(point.timestamp).getTime() - minTime) / timeRange) * chartWidth;
        const y = padding.top + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      
      // Draw data points
      series.data.forEach((point) => {
        const x = padding.left + ((new Date(point.timestamp).getTime() - minTime) / timeRange) * chartWidth;
        const y = padding.top + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    });

    // Handle mouse move for tooltips
    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Find closest data point
      let closestPoint: typeof hoveredPoint | null = null;
      let minDistance = Infinity;
      
      data.forEach((series) => {
        series.data.forEach((point) => {
          const px = padding.left + ((new Date(point.timestamp).getTime() - minTime) / timeRange) * chartWidth;
          const py = padding.top + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
          
          const distance = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
          if (distance < minDistance && distance < 10) {
            minDistance = distance;
            closestPoint = { series, point, x: px, y: py };
          }
        });
      });
      
      setHoveredPoint(closestPoint);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', () => setHoveredPoint(null));

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', () => setHoveredPoint(null));
    };
  }, [data, loading, height, showLegend, colors, timeFormat]);

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
        {showLegend && data.length > 0 && (
          <div className="flex flex-wrap gap-4 mt-2">
            {data.map((series, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: colors[index % colors.length] }}
                ></div>
                <span className="text-sm text-gray-400">
                  {series.service} - {series.route} ({series.percentile})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="relative" style={{ height }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ display: 'block' }}
        />
        
        {/* Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute bg-gray-800 text-white p-2 rounded shadow-lg border border-gray-600 text-sm pointer-events-none z-10"
            style={{
              left: hoveredPoint.x + 10,
              top: hoveredPoint.y - 30
            }}
          >
            <div className="font-semibold">{hoveredPoint.series.service}</div>
            <div>{hoveredPoint.series.route}</div>
            <div>{hoveredPoint.series.percentile}: {hoveredPoint.point.value.toFixed(2)}ms</div>
            <div>{new Date(hoveredPoint.point.timestamp).toLocaleString()}</div>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

export default TrendChart;