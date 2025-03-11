import React, { useRef, useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from 'react-datepicker';
import da from 'date-fns/locale/da';
import { useFilters } from '../../context/FilterContext';
import { useDashboard } from '../../context/DashboardContext';
import { X } from 'lucide-react';

// Register Danish locale for DatePicker
registerLocale('da', da);

/**
 * Helper function to safely parse dates
 * @param {string|Date} dateValue - The date to parse
 * @returns {Date|null} - Returns a valid Date object or null
 */
const safelyParseDate = (dateValue) => {
  if (!dateValue) return null;
  
  try {
    // If it's already a Date object
    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
      return dateValue;
    }
    
    // If it's a string in DD.MM.YYYY format
    if (typeof dateValue === 'string' && dateValue.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
      const [day, month, year] = dateValue.split('.');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return !isNaN(date.getTime()) ? date : null;
    }
    
    // Try standard Date parsing
    const date = new Date(dateValue);
    return !isNaN(date.getTime()) ? date : null;
  } catch (err) {
    console.error('Error parsing date:', err, dateValue);
    return null;
  }
};

const FilterSidebar = () => {
  const { 
    filters, 
    updateFilters, 
    resetFilters, 
    isSidebarOpen, 
    setIsSidebarOpen,
    isPending 
  } = useFilters();
  const { samtaletyper, isLoading } = useDashboard();
  const sidebarRef = useRef(null);

  // Local state for filter values - with proper date conversion
  const [localFilters, setLocalFilters] = useState({
    startDate: safelyParseDate(filters.startDate),
    endDate: safelyParseDate(filters.endDate),
    conversationType: filters.conversationType || 'all'
  });

  // Update local filters when global filters change
  useEffect(() => {
    setLocalFilters({
      startDate: safelyParseDate(filters.startDate),
      endDate: safelyParseDate(filters.endDate),
      conversationType: filters.conversationType || 'all'
    });
  }, [filters]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsSidebarOpen(false);
      }
    };

    if (isSidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen, setIsSidebarOpen]);

  const handleApplyFilters = () => {
    // Format dates for URL and API
    const formatDateString = (date) => {
      if (!date) return null;
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}.${month}.${year}`;
    };

    // Create new filters object with properly formatted dates
    const newFilters = {
      startDate: localFilters.startDate ? formatDateString(localFilters.startDate) : null,
      endDate: localFilters.endDate ? formatDateString(localFilters.endDate) : null,
      conversationType: localFilters.conversationType
    };

    // Update global filters
    updateFilters(newFilters);
    setIsSidebarOpen(false);
  };

  const handleResetFilters = () => {
    // Reset local state
    setLocalFilters({
      startDate: null,
      endDate: null,
      conversationType: 'all'
    });

    // Use the resetFilters function from FilterContext
    resetFilters();
    
    setIsSidebarOpen(false);
  };

  // Determine button disabled state and loading indicator
  const isUpdating = isLoading || isPending;
  const buttonClass = isUpdating
    ? "opacity-50 cursor-not-allowed"
    : "hover:bg-blue-700 hover:bg-gray-300";

  return (
    <div 
      ref={sidebarRef}
      className={`fixed top-0 right-0 h-screen bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
        isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{ width: '320px' }}
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Filters</h2>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full"
            disabled={isUpdating}
            aria-label="Close filters"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Samtaletype
            </label>
            <select 
              className="w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={localFilters.conversationType} 
              onChange={(e) => setLocalFilters(prev => ({ ...prev, conversationType: e.target.value }))}
              disabled={isUpdating}
            >
              <option value="all">Alle samtaletyper</option>
              {Array.isArray(samtaletyper) && samtaletyper.map((type) => (
                <option key={type.samtyp_type} value={type.samtyp_type}>
                  {type.ledetekst}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Datointerval
            </label>
            <div className="space-y-3">
              <DatePicker
                selected={localFilters.startDate}
                onChange={(date) => setLocalFilters(prev => ({ ...prev, startDate: date }))}
                selectsStart
                startDate={localFilters.startDate}
                endDate={localFilters.endDate}
                locale="da"
                dateFormat="dd.MM.yyyy"
                placeholderText="Fra dato"
                className="w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isUpdating}
              />
              <DatePicker
                selected={localFilters.endDate}
                onChange={(date) => setLocalFilters(prev => ({ ...prev, endDate: date }))}
                selectsEnd
                startDate={localFilters.startDate}
                endDate={localFilters.endDate}
                minDate={localFilters.startDate}
                locale="da"
                dateFormat="dd.MM.yyyy"
                placeholderText="Til dato"
                className="w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isUpdating}
              />
            </div>
          </div>

          <div className="pt-4 space-y-2">
            <button
              onClick={handleApplyFilters}
              className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md transition-colors duration-200 ${buttonClass}`}
              disabled={isUpdating}
            >
              {isUpdating ? 'Opdaterer...' : 'Anvend filtre'}
            </button>
            <button
              onClick={handleResetFilters}
              className={`w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md transition-colors duration-200 ${buttonClass}`}
              disabled={isUpdating}
            >
              {isUpdating ? 'Nulstiller...' : 'Nulstil alle filtre'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;