import React, { memo, useState, useMemo } from 'react';
import { BarChart, XAxis, YAxis, Bar, ResponsiveContainer, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';
import ChartTooltip from '../ChartTooltip';
import { useDashboard } from '../../context/DashboardContext';
import TimeScaleSelector from './TimeScaleSelector';
import { groupDataByTimeScale, filterRealDates, filterFutureDates } from '../../utils/timeScaleUtils';
import {
  isValid,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  startOfDay,
  endOfDay,
  addDays
} from 'date-fns';

const LoadingOverlay = () => (
  <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

/**
 * Chart component displaying the number of conversations over time
 * Allows filtering by clicking on bars
 */
const ChangesStatisticsChart = memo(({ data, onChartClick }) => {
  const { isPending } = useDashboard();
  const navigate = useNavigate();
  const [timeScale, setTimeScale] = useState('weeks');
  const [selectedDate, setSelectedDate] = useState(null);

  // Ensure we only show real data
  const processedData = useMemo(() => {
    // Filter out any data with future dates
    const noFutureDates = filterFutureDates(data, 'date');
    
    // Only keep data points that have actual counts
    const realData = filterRealDates(noFutureDates);
    
    return realData;
  }, [data]);

  // Group data by the selected time scale
  const groupedData = useMemo(() => {
    const grouped = groupDataByTimeScale(processedData, timeScale, 'date');
    
    // Additional filtering to ensure we only show non-zero counts
    return grouped.filter(item => item.totalCount > 0 || item.count > 0);
  }, [processedData, timeScale]);

  // Process data for the chart
  const chartData = useMemo(() => {
    if (!groupedData?.length) {
      return [{
        date: '',
        displayDate: '',
        count: 0
      }];
    }

    // Map the data to only include the needed properties
    return groupedData.map(item => ({
      date: item.date ? item.date.toISOString() : '',
      displayDate: item.displayDate,
      count: item.totalCount || 0,
      // Store the raw date object and period dates
      rawDate: item.date,
      periodStart: item.periodStart,
      periodEnd: item.periodEnd
    }));
  }, [groupedData]);

  // Calculate total count
  const totalCount = useMemo(() => {
    return chartData.reduce((sum, item) => sum + (item.count || 0), 0);
  }, [chartData]);

  /**
   * Handle click on a bar chart
   * Validates the date exists in the database before navigating
   */
  const handleBarClick = (data) => {
    if (!data || !data.payload || !data.payload.date || !onChartClick) {
      return;
    }
    
    try {
      // Verify this is a valid date with actual data
      if (data.payload.count <= 0) {
        return;
      }
      
      // Ensure we have a valid date
      const clickDate = data.payload.rawDate || new Date(data.payload.date);
      if (!isValid(clickDate)) {
        return;
      }
      
      // Use the period start and end dates from the payload
      const startDate = data.payload.periodStart;
      const endDate = data.payload.periodEnd;
      
      // Format dates for URL in DD.MM.YYYY format
      const formatDateForFilter = (date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
      };
      
      const formattedStartDate = formatDateForFilter(startDate);
      const formattedEndDate = formatDateForFilter(endDate);
      
      // Set selected date for visual feedback
      setSelectedDate(data.payload.date);
      
      // Call the onChartClick prop with the formatted dates and timeScale
      onChartClick({
        date: data.payload.date,
        formattedStartDate,
        formattedEndDate,
        timeScale: timeScale
      });
    } catch (error) {
      console.error('Error handling bar click:', error);
    }
  };

  /**
   * Custom tooltip for bar charts
   */
  const customTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const count = payload[0].value;
      
      return (
        <div className="bg-white p-2 border rounded shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm">{`Antal samtaler: ${count}`}</p>
          {count > 0 && (
            <div className="mt-2 pt-2 border-t text-xs text-blue-600">
              Klik for at se samtaler fra denne dato
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 relative">
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
            <Tooltip content={customTooltip} />
            <Bar
              dataKey="count"
              fill={selectedDate ? "#4f46e5" : "#8884d8"}
              name="Antal samtaler"
              onClick={handleBarClick}
              cursor="pointer"
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