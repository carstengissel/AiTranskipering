import React, { memo, useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartTooltip from '../ChartTooltip';
import { useFilters } from '../../context/FilterContext';
import { useDashboard } from '../../context/DashboardContext';
import TimeScaleSelector from './TimeScaleSelector';
import { groupDataByTimeScale } from '../../utils/timeScaleUtils';

const TimeStatisticsChart = memo(({ data }) => {
  const { filters } = useFilters();
  const { isPending } = useDashboard();
  const [timeScale, setTimeScale] = useState('weeks');

  const groupedData = useMemo(() => {
    return groupDataByTimeScale(data, timeScale, 'date');
  }, [data, timeScale]);

  // If no data, return a placeholder or message
  if (!data || data.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-4 text-center">
        No data available
      </div>
    );
  }

  // Calculate average times and add small offset for log scale
  const processedData = groupedData.map(item => {
    const tidTilGodkendelse = Math.max(1, item.tidTilGodkendelse || 0);
    const tidTilAIReferat = Math.max(1, item.tidTilAIReferat || 0);

    return {
      ...item,
      tidTilGodkendelse,
      tidTilAIReferat
    };
  });

  const tooltipFormatter = (value) => {
    if (value === 0) return '0 min';
    if (value === 1) return '< 1 min';
    return `${Math.round(value)} min`;
  };

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <ChartTooltip 
            title="Gns. Tidstatistik"
            description="Viser gennemsnitlig tid brugt på forskellige dele af processen. 'Tid til godkendelse' er tiden fra AI-referat til godkendelse, mens 'Tid fra transskription til AI-referat' viser behandlingstiden."
          />
          <TimeScaleSelector value={timeScale} onChange={setTimeScale} />
        </div>
      </div>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={processedData}
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
              type="number"
              domain={[0, 'auto']}
              label={{ value: 'Minutter', angle: -90, position: 'insideLeft', fontSize: 11, offset: 10 }}
              tick={{ fontSize: 10 }}
              tickFormatter={tooltipFormatter}
            />
            <Tooltip formatter={tooltipFormatter} />
            <Legend wrapperStyle={{ fontSize: '10px' }} />
            <Line 
              type="monotone"
              dataKey="tidTilGodkendelse" 
              stroke="#82ca9d" 
              name="Tid til godkendelse"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone"
              dataKey="tidTilAIReferat" 
              stroke="#8884d8" 
              name="Tid fra transskription til AI-referat"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default TimeStatisticsChart;
