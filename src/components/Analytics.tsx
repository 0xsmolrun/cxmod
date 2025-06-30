import React, { useMemo, useState, useRef } from 'react';
import { TrendingUp, Clock, AlertTriangle, CheckCircle, Download, Calendar, Settings, BarChart3, PieChart, LineChart } from 'lucide-react';
import { Ticket } from '../types/ticket';
import { GlassCard } from './ui/GlassCard';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

interface AnalyticsProps {
  tickets: Ticket[];
}

interface CustomChartConfig {
  xAxis: string;
  yAxis: string;
  chartType: 'bar' | 'pie' | 'line';
  title: string;
}

const chartTypeOptions = [
  { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
  { value: 'pie', label: 'Pie Chart', icon: PieChart },
  { value: 'line', label: 'Line Chart', icon: LineChart }
];

const axisOptions = [
  { value: 'status', label: 'Status' },
  { value: 'severity', label: 'Severity' },
  { value: 'month', label: 'Month Created' },
  { value: 'product_tags', label: 'Product Tags' },
  { value: 'category_tags', label: 'Category Tags' },
  { value: 'count', label: 'Count' },
  { value: 'resolution_time', label: 'Resolution Time (Days)' }
];

export const Analytics: React.FC<AnalyticsProps> = ({ tickets }) => {
  const [globalDateRange, setGlobalDateRange] = useState<{ start?: string; end?: string }>({});
  const [customChart, setCustomChart] = useState<CustomChartConfig>({
    xAxis: 'status',
    yAxis: 'count',
    chartType: 'bar',
    title: 'Custom Chart'
  });
  const [showCustomization, setShowCustomization] = useState(false);
  
  const customChartRef = useRef<HTMLCanvasElement>(null);

  // Filter tickets based on global date range
  const filteredTickets = useMemo(() => {
    if (!globalDateRange.start && !globalDateRange.end) {
      return tickets;
    }

    return tickets.filter(ticket => {
      const ticketDate = new Date(ticket.date_created);
      const startDate = globalDateRange.start ? new Date(globalDateRange.start) : null;
      const endDate = globalDateRange.end ? new Date(globalDateRange.end) : null;

      if (startDate && ticketDate < startDate) return false;
      if (endDate && ticketDate > endDate) return false;
      return true;
    });
  }, [tickets, globalDateRange]);

  const analytics = useMemo(() => {
    const statusCounts = filteredTickets.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const severityCounts = filteredTickets.reduce((acc, ticket) => {
      acc[ticket.severity] = (acc[ticket.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const resolvedTickets = filteredTickets.filter(t => t.status === 'Resolved').length;
    const totalTickets = filteredTickets.length;
    const resolutionRate = totalTickets > 0 ? (resolvedTickets / totalTickets) * 100 : 0;

    const avgResolutionTime = filteredTickets
      .filter(t => t.status === 'Resolved' && t.date_resolved)
      .reduce((acc, ticket) => {
        const created = new Date(ticket.date_created);
        const resolved = new Date(ticket.date_resolved!);
        const days = Math.ceil((resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        return acc + days;
      }, 0) / resolvedTickets || 0;

    // Monthly trend data
    const monthlyData = filteredTickets.reduce((acc, ticket) => {
      const month = new Date(ticket.date_created).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      
      if (!acc[month]) {
        acc[month] = { month, created: 0, resolved: 0 };
      }
      
      acc[month].created++;
      
      if (ticket.status === 'Resolved') {
        acc[month].resolved++;
      }
      
      return acc;
    }, {} as Record<string, { month: string; created: number; resolved: number }>);

    return {
      statusData: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
      severityData: Object.entries(severityCounts).map(([name, value]) => ({ name, value })),
      resolutionRate,
      avgResolutionTime,
      totalTickets,
      resolvedTickets,
      monthlyTrend: Object.values(monthlyData).sort((a, b) => 
        new Date(a.month).getTime() - new Date(b.month).getTime()
      )
    };
  }, [filteredTickets]);

  // Generate custom chart data based on selected axes
  const customChartData = useMemo(() => {
    const { xAxis, yAxis } = customChart;
    
    if (xAxis === 'status' && yAxis === 'count') {
      return analytics.statusData;
    } else if (xAxis === 'severity' && yAxis === 'count') {
      return analytics.severityData;
    } else if (xAxis === 'month' && yAxis === 'count') {
      return analytics.monthlyTrend.map(item => ({ name: item.month, value: item.created }));
    } else if (xAxis === 'product_tags' && yAxis === 'count') {
      const productCounts: Record<string, number> = {};
      filteredTickets.forEach(ticket => {
        ticket.product_tags.forEach(tag => {
          productCounts[tag] = (productCounts[tag] || 0) + 1;
        });
      });
      return Object.entries(productCounts).map(([name, value]) => ({ name, value }));
    } else if (xAxis === 'category_tags' && yAxis === 'count') {
      const categoryCounts: Record<string, number> = {};
      filteredTickets.forEach(ticket => {
        ticket.category_tags.forEach(tag => {
          categoryCounts[tag] = (categoryCounts[tag] || 0) + 1;
        });
      });
      return Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));
    }
    
    return [];
  }, [customChart, analytics, filteredTickets]);

  const downloadChart = (chartRef: React.RefObject<HTMLCanvasElement>, filename: string) => {
    if (!chartRef.current) return;
    
    const canvas = chartRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create a new canvas with theme-appropriate background
    const downloadCanvas = document.createElement('canvas');
    downloadCanvas.width = canvas.width;
    downloadCanvas.height = canvas.height;
    const downloadCtx = downloadCanvas.getContext('2d');
    if (!downloadCtx) return;

    // Set background color based on theme
    const isDark = document.documentElement.classList.contains('dark');
    downloadCtx.fillStyle = isDark ? '#1F2937' : '#FFFFFF';
    downloadCtx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);

    // Draw the original canvas on top
    downloadCtx.drawImage(canvas, 0, 0);

    // Download the new canvas
    const link = document.createElement('a');
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.png`;
    link.href = downloadCanvas.toDataURL();
    link.click();
  };

  const exportData = (format: 'csv' | 'json') => {
    if (filteredTickets.length === 0) {
      alert('No data to export');
      return;
    }

    if (format === 'csv') {
      const headers = ['Status', 'Count'];
      const csvContent = [
        headers.join(','),
        ...analytics.statusData.map(item => `"${item.name}","${item.value}"`),
        '',
        'Severity,Count',
        ...analytics.severityData.map(item => `"${item.name}","${item.value}"`)
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `analytics_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const jsonData = {
        summary: {
          totalTickets: analytics.totalTickets,
          resolvedTickets: analytics.resolvedTickets,
          resolutionRate: analytics.resolutionRate,
          avgResolutionTime: analytics.avgResolutionTime
        },
        statusDistribution: analytics.statusData,
        severityDistribution: analytics.severityData,
        monthlyTrend: analytics.monthlyTrend
      };

      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `analytics_${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderCustomChart = (data: any[], config: CustomChartConfig, chartRef: React.RefObject<HTMLCanvasElement>) => {
    React.useEffect(() => {
      if (!chartRef.current || data.length === 0) return;

      const canvas = chartRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size for high DPI displays
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';

      // Clear canvas with transparent background
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Set font and colors based on theme
      const isDark = document.documentElement.classList.contains('dark');
      const textColor = isDark ? '#F3F4F6' : '#374151';
      const gridColor = isDark ? '#374151' : '#E5E7EB';
      
      ctx.font = '12px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = textColor;

      const padding = 60; // Increased padding for better label visibility
      const chartWidth = rect.width - padding * 2;
      const chartHeight = rect.height - padding * 2;

      // Gradient colors
      const colors = ['#3B82F6', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

      if (config.chartType === 'bar') {
        // Bar chart
        const maxValue = Math.max(...data.map(d => d.value));
        const barWidth = chartWidth / data.length * 0.6;
        const barSpacing = chartWidth / data.length * 0.4;

        data.forEach((item, index) => {
          const barHeight = (item.value / maxValue) * chartHeight;
          const x = padding + index * (barWidth + barSpacing) + barSpacing / 2;
          const y = padding + chartHeight - barHeight;

          // Create gradient
          const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
          const color = colors[index % colors.length];
          gradient.addColorStop(0, color);
          gradient.addColorStop(1, color + '80');

          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, barWidth, barHeight);

          // Value labels on top of bars
          ctx.fillStyle = textColor;
          ctx.textAlign = 'center';
          ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
          ctx.fillText(item.value.toString(), x + barWidth / 2, y - 8);
          
          // Category labels at bottom - improved visibility
          ctx.save();
          ctx.translate(x + barWidth / 2, padding + chartHeight + 20);
          ctx.rotate(-Math.PI / 6); // 30 degree angle for better readability
          ctx.textAlign = 'right';
          ctx.font = '11px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = textColor;
          
          // Truncate long labels
          const maxLabelLength = 15;
          const label = item.name.length > maxLabelLength 
            ? item.name.substring(0, maxLabelLength) + '...' 
            : item.name;
          ctx.fillText(label, 0, 0);
          ctx.restore();
        });
      } else if (config.chartType === 'pie') {
        // Pie chart
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const radius = Math.min(chartWidth, chartHeight) / 2 - 40;
        const total = data.reduce((sum, item) => sum + item.value, 0);

        let currentAngle = -Math.PI / 2;

        data.forEach((item, index) => {
          const sliceAngle = (item.value / total) * 2 * Math.PI;
          
          // Create gradient
          const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
          const color = colors[index % colors.length];
          gradient.addColorStop(0, color);
          gradient.addColorStop(1, color + '60');

          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
          ctx.closePath();
          ctx.fillStyle = gradient;
          ctx.fill();

          // Value labels inside slices
          const labelAngle = currentAngle + sliceAngle / 2;
          const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
          const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
          
          ctx.fillStyle = '#FFFFFF';
          ctx.textAlign = 'center';
          ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
          ctx.fillText(item.value.toString(), labelX, labelY);

          // Legend labels outside
          const legendX = centerX + Math.cos(labelAngle) * (radius + 30);
          const legendY = centerY + Math.sin(labelAngle) * (radius + 30);
          
          ctx.fillStyle = textColor;
          ctx.font = '11px system-ui, -apple-system, sans-serif';
          ctx.textAlign = legendX > centerX ? 'left' : 'right';
          
          const maxLabelLength = 12;
          const label = item.name.length > maxLabelLength 
            ? item.name.substring(0, maxLabelLength) + '...' 
            : item.name;
          ctx.fillText(label, legendX, legendY);

          currentAngle += sliceAngle;
        });
      } else if (config.chartType === 'line') {
        // Line chart
        if (data.length < 2) return;

        const maxValue = Math.max(...data.map(d => d.value));
        const stepX = chartWidth / (data.length - 1);

        // Draw grid lines
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
          const y = padding + (chartHeight / 5) * i;
          ctx.beginPath();
          ctx.moveTo(padding, y);
          ctx.lineTo(padding + chartWidth, y);
          ctx.stroke();
        }

        // Draw line with gradient
        const gradient = ctx.createLinearGradient(0, padding, 0, padding + chartHeight);
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(1, colors[0] + '40');

        ctx.strokeStyle = colors[0];
        ctx.lineWidth = 3;
        ctx.beginPath();
        data.forEach((item, index) => {
          const x = padding + index * stepX;
          const y = padding + chartHeight - (item.value / maxValue) * chartHeight;
          if (index === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Fill area under line
        ctx.lineTo(padding + (data.length - 1) * stepX, padding + chartHeight);
        ctx.lineTo(padding, padding + chartHeight);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Data point labels
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        ctx.font = '11px system-ui, -apple-system, sans-serif';
        data.forEach((item, index) => {
          const x = padding + index * stepX;
          const y = padding + chartHeight - (item.value / maxValue) * chartHeight;
          
          // Value above point
          ctx.fillText(item.value.toString(), x, y - 8);
          
          // Category label below chart
          ctx.save();
          ctx.translate(x, padding + chartHeight + 15);
          ctx.rotate(-Math.PI / 6);
          ctx.textAlign = 'right';
          
          const maxLabelLength = 10;
          const label = item.name.length > maxLabelLength 
            ? item.name.substring(0, maxLabelLength) + '...' 
            : item.name;
          ctx.fillText(label, 0, 0);
          ctx.restore();
        });
      }
    }, [data, config, chartRef]);

    return (
      <canvas
        ref={chartRef}
        className="w-full h-80 rounded-lg"
        style={{ maxHeight: '320px' }}
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Global Date Range Filter */}
      <GlassCard className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Date Range Filter</h3>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button
              variant="ghost"
              size="sm"
              icon={Download}
              onClick={() => exportData('csv')}
              className="flex-1 sm:flex-none"
            >
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">CSV</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={Download}
              onClick={() => exportData('json')}
              className="flex-1 sm:flex-none"
            >
              <span className="hidden sm:inline">Export JSON</span>
              <span className="sm:hidden">JSON</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setGlobalDateRange({})}
              className="flex-1 sm:flex-none"
            >
              Clear Filter
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            value={globalDateRange.start || ''}
            onChange={(value) => setGlobalDateRange(prev => ({ ...prev, start: value }))}
          />
          <Input
            label="End Date"
            type="date"
            value={globalDateRange.end || ''}
            onChange={(value) => setGlobalDateRange(prev => ({ ...prev, end: value }))}
          />
        </div>

        {(globalDateRange.start || globalDateRange.end) && (
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Showing {filteredTickets.length} of {tickets.length} tickets
            {globalDateRange.start && ` from ${new Date(globalDateRange.start).toLocaleDateString()}`}
            {globalDateRange.end && ` to ${new Date(globalDateRange.end).toLocaleDateString()}`}
          </div>
        )}
      </GlassCard>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <GlassCard className="text-center">
          <div className="flex items-center justify-center mb-2">
            <TrendingUp className="w-6 h-6 lg:w-8 lg:h-8 text-blue-400" />
          </div>
          <div className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{analytics.totalTickets}</div>
          <div className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">Total Tickets</div>
        </GlassCard>

        <GlassCard className="text-center">
          <div className="flex items-center justify-center mb-2">
            <CheckCircle className="w-6 h-6 lg:w-8 lg:h-8 text-green-400" />
          </div>
          <div className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{analytics.resolvedTickets}</div>
          <div className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">Resolved</div>
        </GlassCard>

        <GlassCard className="text-center">
          <div className="flex items-center justify-center mb-2">
            <AlertTriangle className="w-6 h-6 lg:w-8 lg:h-8 text-yellow-400" />
          </div>
          <div className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{analytics.resolutionRate.toFixed(1)}%</div>
          <div className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">Resolution Rate</div>
        </GlassCard>

        <GlassCard className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Clock className="w-6 h-6 lg:w-8 lg:h-8 text-purple-400" />
          </div>
          <div className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{analytics.avgResolutionTime.toFixed(1)}</div>
          <div className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">Avg Days to Resolve</div>
        </GlassCard>
      </div>

      {/* Status Distribution with HP Bar Style */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status Distribution</h3>
          <div className="space-y-3">
            {analytics.statusData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium truncate flex-1 mr-3">
                  {item.name}
                </span>
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                      style={{
                        width: `${(item.value / Math.max(...analytics.statusData.map(d => d.value))) * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white min-w-[2rem] text-right">
                    {item.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Severity Distribution with HP Bar Style */}
        <GlassCard>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Severity Distribution</h3>
          <div className="space-y-3">
            {analytics.severityData.map((item, index) => {
              const percentage = analytics.totalTickets > 0 ? ((item.value / analytics.totalTickets) * 100).toFixed(1) : '0.0';
              const colors = ['#EF4444', '#F59E0B', '#3B82F6', '#06B6D4', '#10B981'];
              return (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{percentage}%</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white min-w-[2rem] text-right">
                      {item.value}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* Monthly Trend with HP Bar Style */}
      <GlassCard>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Trend</h3>
        <div className="space-y-4">
          {analytics.monthlyTrend.length > 0 ? (
            analytics.monthlyTrend.map((item, index) => (
              <div key={item.month} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.month}</span>
                  <div className="flex gap-4 text-sm">
                    <span className="text-blue-600 dark:text-blue-400">Created: {item.created}</span>
                    <span className="text-green-600 dark:text-green-400">Resolved: {item.resolved}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                      style={{
                        width: `${analytics.monthlyTrend.length > 0 ? (item.created / Math.max(...analytics.monthlyTrend.map(d => d.created))) * 100 : 0}%`
                      }}
                    />
                  </div>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-green-500 to-green-600"
                      style={{
                        width: `${item.created > 0 ? (item.resolved / item.created) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No data available for the selected date range
            </div>
          )}
        </div>
      </GlassCard>

      {/* Custom Chart */}
      <GlassCard>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{customChart.title}</h3>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={Settings}
              onClick={() => setShowCustomization(!showCustomization)}
            >
              Customize
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={Download}
              onClick={() => downloadChart(customChartRef, 'custom_chart')}
            >
              Download
            </Button>
          </div>
        </div>
        
        {showCustomization && (
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select
                label="X-Axis"
                value={customChart.xAxis}
                onChange={(value) => setCustomChart(prev => ({ ...prev, xAxis: value }))}
                options={axisOptions.filter(opt => opt.value !== 'count' && opt.value !== 'resolution_time')}
              />
              <Select
                label="Y-Axis"
                value={customChart.yAxis}
                onChange={(value) => setCustomChart(prev => ({ ...prev, yAxis: value }))}
                options={axisOptions.filter(opt => opt.value === 'count' || opt.value === 'resolution_time')}
              />
              <Select
                label="Chart Type"
                value={customChart.chartType}
                onChange={(value) => setCustomChart(prev => ({ ...prev, chartType: value as any }))}
                options={chartTypeOptions}
              />
              <Input
                label="Chart Title"
                value={customChart.title}
                onChange={(value) => setCustomChart(prev => ({ ...prev, title: value }))}
              />
            </div>
          </div>
        )}
        
        {customChartData.length > 0 ? (
          renderCustomChart(customChartData, customChart, customChartRef)
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No data available for the selected configuration
          </div>
        )}
      </GlassCard>
    </div>
  );
};