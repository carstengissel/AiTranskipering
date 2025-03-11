import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFilters } from '../../context/FilterContext';
import { useDashboard } from '../../context/DashboardContext';
import { formatDateForUrl } from '../conversation/utils/dateUtils';

const DashboardHeader = () => {
  const navigate = useNavigate();
  const { filters, toggleSidebar, resetFilters } = useFilters();
  const { accurateConversationCount, isLoading, isPending } = useDashboard();

  const handleNavigateToDetails = () => {
    // Create a new URLSearchParams object for consistent parameter handling
    const queryParams = new URLSearchParams();
    
    console.log("Current filters for navigation:", filters);
    
    // Format the dates consistently
    let startDate = null;
    let endDate = null;
    
    try {
      // Handle the startDate
      if (filters.startDate) {
        startDate = formatDateForUrl(filters.startDate);
        if (startDate) {
          queryParams.append('startDate', startDate);
          console.log("Added startDate to params:", startDate);
        }
      }
      
      // Handle the endDate
      if (filters.endDate) {
        endDate = formatDateForUrl(filters.endDate);
        if (endDate) {
          queryParams.append('endDate', endDate);
          console.log("Added endDate to params:", endDate);
        }
      }
      
      // Single date handling (for backward compatibility or specific date filters)
      if (filters.date) {
        const formattedDate = formatDateForUrl(filters.date);
        if (formattedDate) {
          queryParams.append('date', formattedDate);
          console.log("Added date to params:", formattedDate);
        }
      }
    } catch (err) {
      console.error("Error formatting dates for navigation:", err);
    }
    
    // Handle section filter
    if (filters.section) {
      if (filters.section === 'uaendredeSektioner') {
        queryParams.append('unchanged', 'true');
      } else {
        queryParams.append('section', filters.section);
      }
      console.log("Added section to params:", filters.section);
    }
    
    // Handle conversation type filter
    if (filters.conversationType && filters.conversationType !== 'all') {
      queryParams.append('type', filters.conversationType);
      console.log("Added type to params:", filters.conversationType);
    }

    // Create the final URL
    const url = `/conversation-summary?${queryParams.toString()}`;
    console.log("Navigating to:", url);
    
    // Use navigate to go to the conversation summary view with the filters
    navigate(url);
  };

  const hasActiveFilters = Object.values(filters).some(filter => filter !== null && filter !== 'all');
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
          {hasActiveFilters 
            ? `Vis filtrerede samtaler${accurateConversationCount ? ` (${accurateConversationCount})` : ''}`
            : 'Vis samtaler'}
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;