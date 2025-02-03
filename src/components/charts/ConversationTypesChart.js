import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartTooltip from '../ChartTooltip';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8884d8']

const ConversationTypesChart = ({ data }) => {
  // Calculate the total number of conversations
  const totalConversations = data.reduce((total, item) => total + (item.count || 1), 0);

  // Process the data to count conversation types
  const processedData = Object.entries(
    data.reduce((acc, item) => {
      // Ensure we have an array of conversation types
      const displayNames = Array.isArray(item.conversationTypes) 
        ? item.conversationTypes 
        : [item.ledetekst || "2. og 3. jobsamtale"];
      
      displayNames.forEach(displayName => {
        acc[displayName] = (acc[displayName] || 0) + (item.count || 1);
      });
      return acc;
    }, {})
  ).map(([name, value]) => ({
    name,
    value,
    percentage: ((value / totalConversations) * 100).toFixed(1)
  }));

  // Sort data by value in descending order
  processedData.sort((a, b) => b.value - a.value);

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central">
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white shadow rounded-lg p-2">
      <div className="flex justify-between items-center mb-2">
        <ChartTooltip 
          title="Fordeling"
          description="Viser den procentvise fordeling af forskellige samtaletyper i den valgte periode. Giver overblik over hvilke samtaletyper der er mest almindelige."
        />
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={processedData}
            cx="50%"
            cy="45%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {processedData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value, name) => [
              `${value} (${processedData.find(d => d.name === name)?.percentage}%)`,
              name
            ]}
          />
          <Legend 
            layout="vertical"
            align="right"
            verticalAlign="middle"
            formatter={(value) => {
              const entry = processedData.find(d => d.name === value);
              return `${value} (${entry?.value} / ${entry?.percentage}%)`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ConversationTypesChart;
