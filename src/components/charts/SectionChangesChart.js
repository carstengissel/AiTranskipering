import React, { memo, useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartTooltip from '../ChartTooltip';
import { useFilters } from '../../context/FilterContext';
import { useDashboard } from '../../context/DashboardContext';
import TimeScaleSelector from './TimeScaleSelector';
import { groupDataByTimeScale } from '../../utils/timeScaleUtils';

const SECTION_COLORS = {
  viHarAftalt: '#8884d8',
  viHarIDagTaltOm: '#82ca9d',
  dinJobsogningIndtilNu: '#ffc658',
  uaendredeSektioner: '#ff7300'
};

const calculateYAxisProps = (data) => {
  // Find the maximum value across all data points and all metrics
  const maxValue = Math.max(
    ...data.flatMap(item => [
      item.viHarAftalt || 0,
      item.viHarIDagTaltOm || 0,
      item.dinJobsogningIndtilNu || 0,
      item.uaendredeSektioner || 0
    ])
  );

  // Round up to the next multiple of 10 for a clean max value
  const roundedMax = Math.ceil(maxValue / 10) * 10;
  
  // Calculate tick interval (divide the range into 5 parts)
  const interval = Math.ceil(roundedMax / 5);
  
  // Generate ticks array
  const ticks = Array.from(
    { length: 6 }, 
    (_, i) => i * interval
  );

  return {
    domain: [0, roundedMax],
    ticks
  };
};

const SectionChangesChart = memo(({ data }) => {
  const { filters } = useFilters();
  const { isPending } = useDashboard();
  const [timeScale, setTimeScale] = useState('weeks');

  const groupedData = useMemo(() => {
    return groupDataByTimeScale(data, timeScale, 'date');
  }, [data, timeScale]);

  const yAxisProps = calculateYAxisProps(groupedData);

  const handleClick = (data) => {
    if (data && data.payload) {
      // onChartClick(data.payload);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <ChartTooltip 
            title="Sektionsændringer over tid"
            description="Viser antallet af ændringer i hver sektion over tid."
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
              allowDecimals={false}
              domain={yAxisProps.domain}
              ticks={yAxisProps.ticks}
            />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: '10px' }} />
            <Line 
              type="monotone" 
              dataKey="viHarAftalt" 
              stroke={SECTION_COLORS.viHarAftalt} 
              name="Vi har aftalt" 
              strokeWidth={2}
              activeDot={{ onClick: handleClick, cursor: 'pointer' }}
              dot={{ cursor: 'pointer', onClick: handleClick }}
            />
            <Line 
              type="monotone" 
              dataKey="viHarIDagTaltOm" 
              stroke={SECTION_COLORS.viHarIDagTaltOm} 
              name="Vi har i dag talt om" 
              strokeWidth={2}
              activeDot={{ onClick: handleClick, cursor: 'pointer' }}
              dot={{ cursor: 'pointer', onClick: handleClick }}
            />
            <Line 
              type="monotone" 
              dataKey="dinJobsogningIndtilNu" 
              stroke={SECTION_COLORS.dinJobsogningIndtilNu} 
              name="Din jobsøgning indtil nu" 
              strokeWidth={2}
              activeDot={{ onClick: handleClick, cursor: 'pointer' }}
              dot={{ cursor: 'pointer', onClick: handleClick }}
            />
            <Line 
              type="monotone" 
              dataKey="uaendredeSektioner" 
              stroke={SECTION_COLORS.uaendredeSektioner} 
              name="Uændrede sektioner" 
              strokeWidth={2}
              activeDot={{ onClick: handleClick, cursor: 'pointer' }}
              dot={{ cursor: 'pointer', onClick: handleClick }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default SectionChangesChart;
