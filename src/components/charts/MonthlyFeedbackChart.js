import React, { memo, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import ChartTooltip from '../ChartTooltip';
import { useFilters } from '../../context/FilterContext';
import { useDashboard } from '../../context/DashboardContext';
import TimeScaleSelector from './TimeScaleSelector';
import { groupDataByTimeScale } from '../../utils/timeScaleUtils';

const TimeScaleFeedbackChart = memo(({ data }) => {
  const { filters } = useFilters();
  const { isPending } = useDashboard();
  const [timeScale, setTimeScale] = useState('weeks');

  const groupedData = useMemo(() => {
    return groupDataByTimeScale(data, timeScale, 'date');
  }, [data, timeScale]);

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <ChartTooltip 
            title="Gns. Tidstatistik"
            description="Viser fordelingen af positive og negative tilbagemeldinger over tid."
          />
          <TimeScaleSelector value={timeScale} onChange={setTimeScale} />
        </div>
      </div>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={groupedData}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <XAxis 
              dataKey="displayDate" 
              angle={-45} 
              textAnchor="end" 
              height={70} 
              interval={0}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              label={{ 
                value: 'Antal tilbagemeldinger', 
                angle: -90, 
                position: 'insideLeft',
                fontSize: 11,
                offset: 10
              }}
            />
            <Tooltip 
              formatter={(value, name) => {
                return [`${value} stk`, name === 'thumbsUp' ? 'Thumbs Up' : 'Thumbs Down'];
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '10px' }}
              formatter={(value) => value === 'thumbsUp' ? 'Thumbs Up' : 'Thumbs Down'}
            />
            <Bar 
              dataKey="thumbsUp" 
              fill="#82ca9d" 
              name="thumbsUp"
            />
            <Bar 
              dataKey="thumbsDown" 
              fill="#ff8042" 
              name="thumbsDown"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default TimeScaleFeedbackChart;
