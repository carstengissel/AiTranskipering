import React, { useState, useEffect } from 'react';
import SectionChangesChart from './charts/SectionChangesChart';
import AverageSectionChangesChart from './charts/AverageSectionChangesChart';
import { generateMockTimelineData } from '../services/mockData';

const TestCharts = () => {
  const [mockData, setMockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      // Generate mock data
      const data = generateMockTimelineData('2025-02-01', 15);
      console.log('Generated mock data:', data);
      setMockData(data);
      setLoading(false);
    } catch (err) {
      console.error('Error generating mock data:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div className="p-4">Loading charts...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Chart Test Page</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Section Changes Chart</h2>
        <SectionChangesChart data={mockData} />
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Average Section Changes Chart</h2>
        <AverageSectionChangesChart data={mockData} />
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Raw Data</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
          {JSON.stringify(mockData, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default TestCharts;
