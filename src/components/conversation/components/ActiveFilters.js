import React from 'react';
import { X } from 'lucide-react';
import { formatDateForDisplay, parseDateFromUrl } from '../utils/dateUtils';

const ActiveFilters = ({ filters, onRemoveFilter }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    
    // First try to parse the date string in case it's in DD.MM.YYYY format
    const parsedDate = parseDateFromUrl(dateStr);
    if (parsedDate) {
      return parsedDate; // parseDateFromUrl already returns in DD.MM.YYYY format
    }

    // If parsing fails, try to create a new Date object
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateStr);
        return 'Ugyldig dato';
      }
      return formatDateForDisplay(date);
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Ugyldig dato';
    }
  };

  const getFilterLabel = (key, value) => {
    switch (key) {
      case 'startDate':
        return `Fra: ${formatDate(value)}`;
      case 'endDate':
        return `Til: ${formatDate(value)}`;
      case 'type':
        return `Type: ${value === 'all' ? 'Alle' : value}`;
      case 'section':
        const sectionLabels = {
          viHarAftalt: 'Vi har aftalt',
          viHarIDagTaltOm: 'Vi har i dag talt om',
          dinJobsogningIndtilNu: 'Din jobsøgning indtil nu'
        };
        return `Sektion: ${sectionLabels[value] || value}`;
      case 'date':
        return `Dato: ${formatDate(value)}`;
      default:
        return `${key}: ${value}`;
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {Object.entries(filters).map(([key, value]) => {
        if (!value) return null;
        
        return (
          <div 
            key={key}
            className="flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full text-sm text-blue-700"
          >
            <span>{getFilterLabel(key, value)}</span>
            <button
              onClick={() => onRemoveFilter(key)}
              className="p-1 hover:bg-blue-200 rounded-full transition-colors duration-150"
              aria-label={`Remove ${key} filter`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ActiveFilters;
