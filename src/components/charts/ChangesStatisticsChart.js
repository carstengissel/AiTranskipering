import React, { memo, useState, useMemo } from 'react';
import { BarChart, XAxis, YAxis, Bar, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import ChartTooltip from '../ChartTooltip';
import { useDashboard } from '../../context/DashboardContext';
import TimeScaleSelector from './TimeScaleSelector';
import { groupDataByTimeScale } from '../../utils/timeScaleUtils';

const LoadingOverlay = () => (
  <div className="absolute inset-0 bg-white bg-opacity-75" />
);

/**
 * Chart component displaying the number of conversations over time
 * Allows filtering by clicking on bars
 */
const ChangesStatisticsChart = memo(({ data }) => {
  const { isPending } = useDashboard();
  const navigate = useNavigate();
  const [timeScale, setTimeScale] = useState('weeks');
  const [selectedDate, setSelectedDate] = useState(null);

  // Group data by the selected time scale
  const groupedData = useMemo(() => {
    return groupDataByTimeScale(data, timeScale, 'date');
  }, [data, timeScale]);

  // Process data for the chart
  const chartData = useMemo(() => {
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
      count: item.totalCount || 0
    }));
  }, [groupedData]);

  // Calculate total count
  const totalCount = useMemo(() => {
    return chartData.reduce((sum, item) => sum + (item.count || 0), 0);
  }, [chartData]);

  /**
   * Handle click on a bar chart
   * Navigates directly to conversation summary with the selected date filter
   */
  const handleBarClick = (data) => {
    if (!data || !data.payload || !data.payload.date) {
      console.error("Invalid click data:", data);
      return;
    }
    
    try {
      // Format the date for URL in DD.MM.YYYY format
      const date = new Date(data.payload.date);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const formattedDate = `${day}.${month}.${year}`;
      
      console.log(`Bar clicked with date ${data.payload.date}, formatted as ${formattedDate}`);
      
      // Set selected date for visual feedback
      setSelectedDate(data.payload.date);
      
      // Navigate directly to conversation summary view with the date filter
      navigate(`/conversation-summary?startDate=${formattedDate}&endDate=${formattedDate}`);
    } catch (error) {
      console.error("Error in handleBarClick:", error);
    }
  };

  /**
   * Custom tooltip for bar charts
   */
  const customTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm">{`Antal samtaler: ${payload[0].value}`}</p>
          <div className="mt-2 pt-2 border-t text-xs text-blue-600">
            Klik for at se samtaler fra denne dato
          </div>
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