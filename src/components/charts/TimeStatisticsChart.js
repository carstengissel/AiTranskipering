import React, { memo, useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartTooltip from '../ChartTooltip';
import { useFilters } from '../../context/FilterContext';
import { useDashboard } from '../../context/DashboardContext';
import TimeScaleSelector from './TimeScaleSelector';
import { groupDataByTimeScale } from '../../utils/timeScaleUtils';

const TimeStatisticsChart = memo(({ data, onChartClick }) => {
  const { filters } = useFilters();
  const { isPending, fetchDashboardData } = useDashboard();
  const [timeScale, setTimeScale] = useState('weeks');
  const [error, setError] = useState(null);

  const groupedData = useMemo(() => {
    try {
      if (!data || data.length === 0) {
        return [];
      }

      const grouped = groupDataByTimeScale(data, timeScale, 'date');

      // Validate data format
      if (!grouped.every(item => 
        typeof item.avgTimeToAiReport === 'number' && 
        typeof item.avgTimeToApproval === 'number'
      )) {
        setError('Invalid data format');
        return [];
      }

      return grouped;
    } catch (err) {
      setError(err.message);
      return [];
    }
  }, [data, timeScale]);

  // Calculate total conversations for current period
  const currentPeriodCount = useMemo(() => {
    if (!groupedData || groupedData.length === 0) return 0;
    return groupedData[groupedData.length - 1].totalCount || 0;
  }, [groupedData]);

  // Calculate max value for YAxis domain
  const maxValue = useMemo(() => {
    if (!groupedData || groupedData.length === 0) return 100;
    
    try {
      const maxApproval = Math.max(...groupedData.map(item => {
        const val = Number(item.avgTimeToApproval);
        return !isNaN(val) && val > 0 && val < 1000 ? val : 0;  // Filter out extreme and negative values
      }));
      const maxAIReport = Math.max(...groupedData.map(item => {
        const val = Number(item.avgTimeToAiReport);
        return !isNaN(val) && val > 0 && val < 1000 ? val : 0;  // Filter out extreme and negative values
      }));
      const max = Math.max(maxApproval, maxAIReport, 100);
      return max;
    } catch (err) {
      return 100;
    }
  }, [groupedData]);

  // Handle time scale change
  const handleTimeScaleChange = (newScale) => {
    console.log('Changing time scale to:', newScale);
    setTimeScale(newScale);
    
    // Fetch new data with the updated time scale
    fetchDashboardData({ timeScale: newScale });
  };

  // If no data or error, return a placeholder or message
  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-4 text-center">
        <p className="text-red-500">Der opstod en fejl: {error}</p>
        <p className="text-sm text-gray-400">Prøv at opdatere siden</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-4 text-center">
        <p className="text-gray-500">Ingen data tilgængelig</p>
        <p className="text-sm text-gray-400">Vælg et andet tidsinterval eller fjern filtre</p>
      </div>
    );
  }

  if (!groupedData || groupedData.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-4 text-center">
        <p className="text-gray-500">Ingen data for den valgte periode</p>
        <p className="text-sm text-gray-400">Prøv at vælge et andet tidsinterval</p>
      </div>
    );
  }

  const tooltipFormatter = (value, name) => {
    if (!value || value === 0) return '0 min';
    return `${Math.round(value)} min`;
  };

  const customTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const periodData = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow">
          <p className="font-medium">{label}</p>
          <p className="text-gray-600 mb-2">
            Antal samtaler: {periodData.totalCount}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {tooltipFormatter(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getPeriodLabel = () => {
    switch (timeScale) {
      case 'days': return 'dag';
      case 'weeks': return 'uge';
      case 'months': return 'måned';
      case 'quarters': return 'kvartal';
      case 'years': return 'år';
      default: return 'periode';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <ChartTooltip 
            title="Gns. Tidstatistik"
            description="Viser gennemsnitlig tid brugt på forskellige dele af processen. 'Tid til godkendelse' er tiden fra AI-referat til godkendelse, mens 'Tid fra transskription til AI-referat' viser behandlingstiden."
          />
          <TimeScaleSelector value={timeScale} onChange={handleTimeScaleChange} />
        </div>
        <div className="bg-gray-100 p-2 rounded-lg shadow-sm">
          <p className="text-sm text-gray-600">Samtaler denne {getPeriodLabel()}</p>
          <p className="text-xl font-semibold text-gray-800">{currentPeriodCount}</p>
        </div>
      </div>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={groupedData}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="displayDate" 
              angle={-45} 
              textAnchor="end" 
              height={70} 
              interval={0}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              domain={[0, maxValue]}
              label={{ value: 'Minutter', angle: -90, position: 'insideLeft', fontSize: 11, offset: 10 }}
              tick={{ fontSize: 10 }}
              tickFormatter={tooltipFormatter}
              allowDecimals={false}
            />
            <Tooltip content={customTooltip} />
            <Legend wrapperStyle={{ fontSize: '10px' }} />
            <Line 
              type="monotone"
              dataKey="avgTimeToApproval" 
              stroke="#82ca9d" 
              name="Tid til godkendelse"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
              connectNulls
            />
            <Line 
              type="monotone"
              dataKey="avgTimeToAiReport" 
              stroke="#8884d8" 
              name="Tid fra transskription til AI-referat"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default TimeStatisticsChart;
