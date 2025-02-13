import React, { memo, useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartTooltip from '../ChartTooltip';
import { useFilters } from '../../context/FilterContext';
import { useDashboard } from '../../context/DashboardContext';
import TimeScaleSelector from './TimeScaleSelector';
import { groupDataByTimeScale } from '../../utils/timeScaleUtils';

const calculateYAxisProps = (data) => {
  // Find the maximum value across positive and negative feedback
  const maxValue = Math.max(
    ...data.flatMap(item => [
      item.positiveFeedback || 0,
      item.negativeFeedback || 0
    ])
  );

  // Round up to the next whole number
  const roundedMax = Math.ceil(maxValue);
  
  // Generate ticks array from 0 to roundedMax
  const ticks = Array.from(
    { length: roundedMax + 1 }, 
    (_, i) => i
  );

  return {
    domain: [0, roundedMax],
    ticks
  };
};

const FeedbackChart = memo(({ data }) => {
  const { filters } = useFilters();
  const { isPending } = useDashboard();
  const [timeScale, setTimeScale] = useState('weeks');

  const groupedData = useMemo(() => {
    return groupDataByTimeScale(data, timeScale, 'date');
  }, [data, timeScale]);

  const yAxisProps = calculateYAxisProps(groupedData);

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <ChartTooltip 
            title="Thumbs Up/Down Statistik"
            description="Viser fordelingen af positive og negative tilbagemeldinger over tid."
          />
          <TimeScaleSelector value={timeScale} onChange={setTimeScale} />
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
              tick={{ fontSize: 12 }}
              label={{ value: 'Antal feedback', angle: -90, position: 'insideLeft', fontSize: 11, offset: 10 }}
              allowDecimals={false}
              domain={yAxisProps.domain}
              ticks={yAxisProps.ticks}
            />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: '10px' }} />
            <Line 
              type="monotone" 
              dataKey="positiveFeedback" 
              stroke="#82ca9d" 
              name="Thumbs Up"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
            />
            <Line 
              type="monotone" 
              dataKey="negativeFeedback" 
              stroke="#ff8042" 
              name="Thumbs Down"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default FeedbackChart;
