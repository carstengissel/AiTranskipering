import React, { memo, useState, useMemo } from 'react';
import { ComposedChart, XAxis, YAxis, Tooltip, Legend, Bar, ResponsiveContainer } from 'recharts';
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

const CustomBarLabel = memo(({ x, y, width, height, value, index, data }) => {
  if (!value || !data) return null;
  const total = data[index].count;
  
  return (
    <g>
      <rect
        x={x + width / 2 - 10}
        y={y - 5}
        width="20"
        height="16"
        fill="#2C3E50"
        fillOpacity={0.4}
        rx="4"
      />
      <text
        x={x + width / 2}
        y={y + 3}
        fill="white"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="11"
        fontWeight="bold"
      >
        {total}
      </text>
    </g>
  );
});

const LoadingOverlay = () => (
  <div className="absolute inset-0 bg-white bg-opacity-75" />
);

const ChangesStatisticsChart = memo(({ data, onChartClick }) => {
  const { filters } = useFilters();
  const { isPending } = useDashboard();
  const [timeScale, setTimeScale] = useState('weeks');

  const groupedData = useMemo(() => {
    return groupDataByTimeScale(data, timeScale, 'date');
  }, [data, timeScale]);

  // If no data, show empty chart with zero values instead of null
  const safeData = groupedData?.length ? groupedData : [{ 
    date: '',
    displayDate: '',
    viHarAftalt: 0,
    viHarIDagTaltOm: 0,
    dinJobsogningIndtilNu: 0,
    uaendredeSektioner: 0,
    count: 0
  }];

  const handleBarClick = (data, sectionName) => {
    if (data && data.payload && data.payload.date) {
      onChartClick({ ...data.payload, timeScale }, sectionName);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4">
      {isPending && <LoadingOverlay />}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <ChartTooltip 
            title="Ændringer Statistik"
            description="Viser antallet af ændringer i hver sektion af referatet over tid."
          />
          <TimeScaleSelector value={timeScale} onChange={setTimeScale} />
        </div>
      </div>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={safeData}
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
              label={{ value: 'Antal ændringer', angle: -90, position: 'insideLeft', fontSize: 11, offset: 10 }}
              tick={{ fontSize: 10 }}
              allowDecimals={false}
              domain={[0, dataMax => Math.max(5, Math.ceil(dataMax * 1.1))]}
              padding={{ top: 10 }}
            />
            <Tooltip />
            <Legend 
              wrapperStyle={{ fontSize: '10px' }}
              verticalAlign="top"
              height={36}
            />
            <Bar 
              dataKey="viHarAftalt" 
              stackId="a" 
              fill={SECTION_COLORS.viHarAftalt}
              name="Vi har aftalt"
              onClick={(data) => handleBarClick(data, 'viHarAftalt')}
              opacity={!filters.section || filters.section === 'viHarAftalt' ? 1 : 0.3}
            />
            <Bar 
              dataKey="viHarIDagTaltOm" 
              stackId="a" 
              fill={SECTION_COLORS.viHarIDagTaltOm}
              name="Vi har i dag talt om"
              onClick={(data) => handleBarClick(data, 'viHarIDagTaltOm')}
              opacity={!filters.section || filters.section === 'viHarIDagTaltOm' ? 1 : 0.3}
            />
            <Bar 
              dataKey="dinJobsogningIndtilNu" 
              stackId="a" 
              fill={SECTION_COLORS.dinJobsogningIndtilNu}
              name="Din jobsøgning indtil nu"
              onClick={(data) => handleBarClick(data, 'dinJobsogningIndtilNu')}
              opacity={!filters.section || filters.section === 'dinJobsogningIndtilNu' ? 1 : 0.3}
            />
            <Bar 
              dataKey="uaendredeSektioner" 
              stackId="a" 
              fill={SECTION_COLORS.uaendredeSektioner}
              name="Uændrede sektioner"
              onClick={(data) => handleBarClick(data, 'uaendredeSektioner')}
              opacity={!filters.section || filters.section === 'uaendredeSektioner' ? 1 : 0.3}
              label={(props) => <CustomBarLabel {...props} data={safeData} />}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default ChangesStatisticsChart;
