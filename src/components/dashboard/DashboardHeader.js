import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFilters } from '../../context/FilterContext';
import { useDashboard } from '../../context/DashboardContext';

const DashboardHeader = () => {
  const navigate = useNavigate();
  const { filters, toggleSidebar, resetFilters } = useFilters();
  const { accurateConversationCount, isLoading, isPending } = useDashboard();

  const handleNavigateToDetails = () => {
    const queryParams = new URLSearchParams();
    
    if (filters.date) {
      queryParams.append('date', filters.date);
    }
    if (filters.startDate) {
      queryParams.append('startDate', filters.startDate);
    }
    if (filters.endDate) {
      queryParams.append('endDate', filters.endDate);
    }
    if (filters.section) {
      if (filters.section === 'uaendredeSektioner') {
        queryParams.append('unchanged', 'true');
      } else {
        queryParams.append('section', filters.section);
      }
    }
    if (filters.conversationType) {
      queryParams.append('type', filters.conversationType);
    }

    navigate(`/conversation-summary?${queryParams.toString()}`);
  };

  const hasActiveFilters = Object.values(filters).some(filter => filter !== null);
  const isUpdating = isLoading || isPending;

  return (
    <div className="flex justify-between items-center mb-4">
      <h1 className="text-xl font-bold">Samtalereferat Statistik</h1>
      <div className="flex gap-2">
        <button
          onClick={toggleSidebar}
          className={`p-2 rounded-full transition-colors duration-200 ${
            isUpdating 
              ? 'bg-gray-100 cursor-not-allowed' 
              : 'hover:bg-gray-100'
          }`}
          aria-label="Åbn filtre"
          disabled={isUpdating}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </button>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            disabled={isUpdating}
            className={`px-4 py-2 rounded transition-all duration-200 ${
              isUpdating
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {isUpdating ? 'Nulstiller...' : 'Nulstil filtre'}
          </button>
        )}
        <button
          onClick={handleNavigateToDetails}
          disabled={isUpdating}
          className={`px-4 py-2 rounded transition-all duration-200 ${
            isUpdating
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white`}
        >
          {/* Vis {accurateConversationCount} samtaler*/}
          Vis samtaler
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;
