import React, { memo } from 'react';
import { BarChart, XAxis, YAxis, Bar, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import ChartTooltip from '../ChartTooltip';
import { useDashboard } from '../../context/DashboardContext';

const LoadingOverlay = () => (
  <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

/**
 * Custom tooltip component for the section changes bar chart
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  // Get the value from the payload
  const value = payload[0].value;
  
  return (
    <div className="bg-white shadow rounded-lg p-3 text-sm">
      <p className="font-bold mb-2">{label}</p>
      <p><span className="font-medium">{label}:</span> {value}</p>
    </div>
  );
};

/**
 * Custom bar label component to display the total number of changes
 */
const CustomBarLabel = memo(({ x, y, width, height, value, index, data }) => {
  if (!value || !data) return null;
  
  // Calculate total changes for this column
  const totalChanges = value;
  
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
        {totalChanges}
      </text>
    </g>
  );
});

/**
 * Chart component displaying the number of changes per section
 */
const SectionChangesBarChart = memo(() => {
  const { timelineData, isPending } = useDashboard();
  
  // Process data for the chart - aggregate all section changes
  const chartData = React.useMemo(() => {
    if (!timelineData || !timelineData.length) {
      return [
        { name: 'Vi har aftalt', value: 0 },
        { name: 'Vi har i dag talt om', value: 0 },
        { name: 'Din jobsøgning indtil nu', value: 0 },
        { name: 'Andet', value: 0 }
      ];
    }

    // Sum up all changes for each section across all time periods
    const totalViHarAftalt = timelineData.reduce((sum, item) => sum + (item.viHarAftalt || 0), 0);
    const totalViHarIDagTaltOm = timelineData.reduce((sum, item) => sum + (item.viHarIDagTaltOm || 0), 0);
    const totalDinJobsogningIndtilNu = timelineData.reduce((sum, item) => sum + (item.dinJobsogningIndtilNu || 0), 0);
    const totalUaendredeSektioner = timelineData.reduce((sum, item) => sum + (item.uaendredeSektioner || 0), 0);

    return [
      { name: 'Vi har aftalt', value: totalViHarAftalt },
      { name: 'Vi har i dag hørt om', value: totalViHarIDagTaltOm },
      { name: 'Din jobsøgning indtil nu', value: totalDinJobsogningIndtilNu },
      { name: 'Andet', value: totalUaendredeSektioner }
    ];
  }, [timelineData]);

  // Calculate total count of all changes
  const totalCount = React.useMemo(() => {
    return chartData.reduce((sum, item) => sum + (item.value || 0), 0);
  }, [chartData]);

  return (
    <div className="bg-white shadow rounded-lg p-4 relative">
      {isPending && <LoadingOverlay />}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <ChartTooltip
            title="Mest Rettede Sektioner"
            description="Viser antallet af ændringer for hver sektion."
          />
        </div>
        <div className="text-lg font-semibold">
          Antal ændringer: {totalCount}
        </div>
      </div>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 20, bottom: 20, left: 40 }}
            barSize={60}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              angle={0}
              textAnchor="middle"
              height={70}
              interval={0}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              label={{ value: 'Antal ændringer', angle: -90, position: 'insideLeft', fontSize: 11, offset: 10 }}
              tick={{ fontSize: 10 }}
              allowDecimals={false}
              domain={[0, dataMax => Math.max(5, Math.ceil(dataMax * 1.1))]}
              padding={{ top: 20 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="value"
              fill="#7DD3AE"
              name="Antal ændringer"
              label={<CustomBarLabel />}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default SectionChangesBarChart;
