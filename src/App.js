import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Loader from './components/Loader';
import ConversationSummaryApp from './components/conversation/ConversationSummaryAppCagi';
import SamtalerStatusDashboard from './components/dashboard/SamtalerStatusDashboard';
import { DashboardProvider } from './context/DashboardContext';
import { FilterProvider } from './context/FilterContext';

// Configure axios baseURL based on environment
const isDevelopment = process.env.NODE_ENV === 'development';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial load time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Router>
      <DashboardProvider>
        <FilterProvider>
          <div className="min-h-screen w-full bg-gray-100">
            <main className="w-full">
              <Routes>
                <Route path="/" element={
                  <div className="container mx-auto px-4 py-8">
                    <SamtalerStatusDashboard />
                  </div>
                } />
                <Route path="/conversation-summary" element={<ConversationSummaryApp />} />
              </Routes>
            </main>
          </div>
        </FilterProvider>
      </DashboardProvider>
    </Router>
  );
}

export default App;
