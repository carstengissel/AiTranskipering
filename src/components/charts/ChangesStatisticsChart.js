import React, { memo, useState, useMemo } from 'react';
import { BarChart, XAxis, YAxis, Bar, ResponsiveContainer } from 'recharts';
import ChartTooltip from '../ChartTooltip';
import { useDashboard } from '../../context/DashboardContext';
import TimeScaleSelector from './TimeScaleSelector';
import { groupDataByTimeScale } from '../../utils/timeScaleUtils';
import { startOfDay } from 'date-fns';

const LoadingOverlay = () => (
  <div className="absolute inset-0 bg-white bg-opacity-75" />
);

const ChangesStatisticsChart = memo(({ data, onChartClick }) => {
  const { isPending } = useDashboard();
  const [timeScale, setTimeScale] = useState('weeks');
  const [selectedDate, setSelectedDate] = useState(null);

  const groupedData = useMemo(() => {
    return groupDataByTimeScale(data, timeScale, 'date');
  }, [data, timeScale]);

  const chartData = useMemo(() => {
    if (!groupedData?.length) {
      return [{
        date: '',
        displayDate: '',
        count: 0
      }];
    }

    // Map the data to only include the count property
    const mappedData = groupedData.map(item => ({
      date: startOfDay(item.date).toISOString(), // Ensure consistent date format
      displayDate: item.displayDate,
      count: item.totalCount || 0
    }));

    // If a date is selected, only show that bar
    if (selectedDate) {
      console.log("ChangesStatisticsChart - chartData - selectedDate:", selectedDate); // DEBUG
      return mappedData.filter(item => item.date === selectedDate);
    }

    console.log("ChangesStatisticsChart - chartData - all data"); // DEBUG
    return mappedData;
  }, [groupedData, selectedDate]);

  // Calculate total count
  const totalCount = useMemo(() => {
    return chartData.reduce((sum, item) => sum + (item.count || 0), 0);
  }, [chartData]);

  const handleBarClick = (data) => {
    if (data && data.payload && data.payload.date) {
      console.log("ChangesStatisticsChart - handleBarClick - data.payload.date:", data.payload.date, "timeScale:", timeScale); // DEBUG
      setSelectedDate(data.payload.date);
      // onChartClick should only update filters, not navigate
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
          <TimeScaleSelector
            value={timeScale}
            onChange={(newScale) => {
              setTimeScale(newScale);
              setSelectedDate(null);
            }}
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate(null)}
              className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              Vis alle
            </button>
          )}
        </div>
        <div className="text-lg font-semibold">
          Antal samtaler: {totalCount}
        </div>
      </div>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
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
  );
});

export default ChangesStatisticsChart;
