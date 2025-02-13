import React, { memo, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import ChartTooltip from '../ChartTooltip';
import { useFilters } from '../../context/FilterContext';
import { useDashboard } from '../../context/DashboardContext';
import TimeScaleSelector from './TimeScaleSelector';
import { groupDataByTimeScale } from '../../utils/timeScaleUtils';

const AverageSectionChangesChart = memo(({ data }) => {
  const { filters } = useFilters();
  const { isPending } = useDashboard();
  const [timeScale, setTimeScale] = useState('weeks');

  const processedData = useMemo(() => {
    const groupedData = groupDataByTimeScale(data, timeScale, 'date');

    return groupedData.map(item => {
      const calculateAverage = (value, count) => {
        return value && count ? Math.round((value / count) * 10) / 10 : 0;
      };

      return {
        date: item.date,
        displayDate: item.displayDate,
        viHarAftalt: calculateAverage(item.viHarAftalt, item.totalCount),
        viHarIDagTaltOm: calculateAverage(item.viHarIDagTaltOm, item.totalCount),
        dinJobsogningIndtilNu: calculateAverage(item.dinJobsogningIndtilNu, item.totalCount),
        count: item.count || 0
      };
    });
  }, [data, timeScale]);

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <ChartTooltip 
            title="Gns. Sektionsændringer over tid"
            description="Viser det gennemsnitlige antal ændringer i hver sektion over tid."
          />
          <TimeScaleSelector value={timeScale} onChange={setTimeScale} />
        </div>
      </div>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={processedData}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="displayDate" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={70}
              interval={0}
            />
            <YAxis 
              label={{ value: 'Gns. antal ændringer', angle: -90, position: 'insideLeft', fontSize: 11, offset: 10 }}
            />
            <Tooltip 
              formatter={(value, name) => [
                `${value} ændringer`,
                name === 'viHarAftalt' ? 'Vi har aftalt' :
                name === 'viHarIDagTaltOm' ? 'Vi har i dag talt om' :
                'Din jobsøgning indtil nu'
              ]}
            />
            <Legend 
              wrapperStyle={{ fontSize: '10px' }}
              formatter={(value) => 
                value === 'viHarAftalt' ? 'Vi har aftalt' :
                value === 'viHarIDagTaltOm' ? 'Vi har i dag talt om' :
                'Din jobsøgning indtil nu'
              }
            />
            <Bar dataKey="viHarAftalt" fill="#8884d8" name="viHarAftalt" />
            <Bar dataKey="viHarIDagTaltOm" fill="#82ca9d" name="viHarIDagTaltOm" />
            <Bar dataKey="dinJobsogningIndtilNu" fill="#ffc658" name="dinJobsogningIndtilNu" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default AverageSectionChangesChart;
