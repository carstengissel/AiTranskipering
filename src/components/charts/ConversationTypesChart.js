import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartTooltip from '../ChartTooltip';
import { useDashboard } from '../../context/DashboardContext';
import axios from 'axios';
import config from '../../config';
import { useFilters } from '../../context/FilterContext';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8884d8']

const ConversationTypesChart = ({ data }) => {
  const { samtaletyper, fetchSamtaletyperData } = useDashboard();
  const { filters } = useFilters();
  const [conversationData, setConversationData] = useState([]);
  const [hasData, setHasData] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch conversation types and counts directly from the API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Ensure we have samtaletyper data
        if (!samtaletyper || samtaletyper.length === 0) {
          await fetchSamtaletyperData();
        }
        
        // Build query parameters for the API request
        const queryParams = new URLSearchParams();
        if (filters.startDate) queryParams.set('startDate', filters.startDate);
        if (filters.endDate) queryParams.set('endDate', filters.endDate);
        if (filters.conversationType && filters.conversationType !== 'all') {
          queryParams.set('type', filters.conversationType);
        }
        
        // Fetch conversation type counts directly from the database
        const response = await axios.get(`${config.apiBaseUrl}/api/samtaletyper/counts?${queryParams.toString()}`);
        console.log('API response for conversation type counts:', response.data);
        
        // Create a map of all conversation types
        const typeCountMap = {};
        
        // Initialize with zero counts from samtaletyper
        if (Array.isArray(samtaletyper) && samtaletyper.length > 0) {
          samtaletyper.forEach(type => {
            if (type.samtyp_type) {
              typeCountMap[type.samtyp_type] = 0;
            }
          });
        }
        
        // Update with actual counts from the API response
        if (response.data && Array.isArray(response.data)) {
          response.data.forEach(item => {
            if (item.samtyp_type) {
              typeCountMap[item.samtyp_type] = item.count || 0;
            }
          });
        }
        
        // Ensure we have the required types
        const requiredTypes = ['tele', 'job1', 'jobn'];
        requiredTypes.forEach(type => {
          if (typeCountMap[type] === undefined) {
            typeCountMap[type] = 0;
          }
        });
        
        // Map "2. og 3. jobsamtale" to "jobn" if it exists and jobn doesn't have data
        if (typeCountMap["2. og 3. jobsamtale"] && !typeCountMap["jobn"]) {
          typeCountMap["jobn"] = typeCountMap["2. og 3. jobsamtale"];
        }
        
        console.log('Final conversation type counts:', typeCountMap);
        
        // Check if we have any non-zero values
        const hasNonZeroValues = Object.values(typeCountMap).some(value => value > 0);
        setHasData(hasNonZeroValues);
        
        // Calculate total for percentages
        const total = Object.values(typeCountMap).reduce((sum, val) => sum + val, 0);
        
        // If all values are zero, assign a default value of 1 to each type for visualization
        const chartData = Object.entries(typeCountMap).map(([name, value]) => ({
          name,
          value: hasNonZeroValues ? value : 1, // Use 1 for visualization if all are zero
          displayValue: value, // Actual value for display
          percentage: total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
        }));
        
        // Sort by value in descending order
        chartData.sort((a, b) => b.displayValue - a.displayValue);
        
        setConversationData(chartData);
      } catch (error) {
        console.error('Error fetching conversation data:', error);
        
        // Fallback to default types if fetching fails
        const fallbackData = [
          { name: 'tele', value: 1, displayValue: 0, percentage: '0.0' },
          { name: 'job1', value: 1, displayValue: 0, percentage: '0.0' },
          { name: 'jobn', value: 1, displayValue: 0, percentage: '0.0' }
        ];
        
        setConversationData(fallbackData);
        setHasData(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [filters, samtaletyper, fetchSamtaletyperData]);

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    // Don't render labels when all values are zero
    if (!hasData) return null;
    
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
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Indlæser data...</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={conversationData}
                cx="50%"
                cy="45%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {conversationData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name, props) => {
                  const entry = conversationData.find(d => d.name === name);
                  return [
                    `${entry?.displayValue || 0} (${entry?.percentage}%)`,
                    name
                  ];
                }}
              />
              <Legend 
                layout="vertical"
                align="right"
                verticalAlign="middle"
                formatter={(value) => {
                  const entry = conversationData.find(d => d.name === value);
                  return `${value} (${entry?.displayValue || 0} / ${entry?.percentage}%)`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {!hasData && (
            <div className="text-center text-gray-500 mt-2">
              <p>Ingen data for de valgte filtre</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ConversationTypesChart;
