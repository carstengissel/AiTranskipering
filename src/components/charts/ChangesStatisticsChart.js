import React, { memo, useState, useMemo, useRef } from 'react';
import { BarChart, XAxis, YAxis, Bar, ResponsiveContainer } from 'recharts';
import ChartTooltip from '../ChartTooltip';
import { useFilters } from '../../context/FilterContext';
import { useDashboard } from '../../context/DashboardContext';
import TimeScaleSelector from './TimeScaleSelector';
import { groupDataByTimeScale } from '../../utils/timeScaleUtils';

const LoadingOverlay = () => (
  <div className="absolute inset-0 bg-white bg-opacity-75" />
);

const ChangesStatisticsChart = memo(({ data, onChartClick }) => {
  const { filters } = useFilters();
  const { isPending } = useDashboard();
  const [timeScale, setTimeScale] = useState('weeks');
  const containerRef = useRef(null);

  const groupedData = useMemo(() => {
    return groupDataByTimeScale(data, timeScale, 'date');
  }, [data, timeScale]);

  const safeData = useMemo(() => {
    if (!groupedData?.length) {
      return [{ 
        date: '',
        displayDate: '',
        count: 0
      }];
    }
    
    // Map the data to only include the count property
    return groupedData.map(item => ({
      date: item.date,
      displayDate: item.displayDate,
      count: item.totalCount
    }));
  }, [groupedData]);

  const handleBarClick = (data) => {
    if (data && data.payload && data.payload.date) {
      onChartClick({ ...data.payload, timeScale });
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4">
      {isPending && <LoadingOverlay />}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <ChartTooltip 
            title="Ændringer Statistik"
            description="Viser antallet af samtaler over tid."
          />
          <TimeScaleSelector value={timeScale} onChange={setTimeScale} />
        </div>
      </div>
      <div className="w-full h-[300px] relative" ref={containerRef}>
        <div style={{ height: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={safeData}
              margin={{ top: 20, right: 20, bottom: 20, left: 40 }}
              barSize={30}
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
                label={{ value: 'Antal samtaler', angle: -90, position: 'insideLeft', fontSize: 11, offset: 10 }}
                tick={{ fontSize: 10 }}
                allowDecimals={false}
                domain={[0, dataMax => Math.max(5, Math.ceil(dataMax * 1.1))]}
                padding={{ top: 20 }}
              />
              <Bar 
                dataKey="count" 
                fill="#8884d8"
                name="Antal samtaler"
                onClick={handleBarClick}
                isAnimationActive={false}
                label={{
                  position: 'top',
                  fill: '#666',
                  fontSize: 12
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
});

export default ChangesStatisticsChart;
