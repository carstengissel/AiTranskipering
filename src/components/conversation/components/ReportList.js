import React from 'react';
import { ArrowLeft } from 'lucide-react';
import ActiveFilters from './ActiveFilters';
import { formatDateForDisplay, parseDateFromUrl } from '../utils/dateUtils';

const ReportList = ({ 
  referats, 
  loading, 
  error, 
  activeFilters,
  onSelectReport,
  onNavigateBack,
  onRemoveFilter 
}) => {
  const formatDate = (dateStr) => {
    if (!dateStr) {
      console.warn('No date provided to formatDate');
      return 'Ingen dato';
    }

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

  return (
    <div>
      <button 
        onClick={onNavigateBack}
        className="mb-4 px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
      >
        <ArrowLeft className="inline mr-2 h-4 w-4" />
        Tilbage til statistik
      </button>

      {Object.values(activeFilters).some(v => v) && (
        <ActiveFilters 
          filters={activeFilters} 
          onRemoveFilter={onRemoveFilter}
        />
      )}

      <div className="mt-4 h-[400px] overflow-y-auto border rounded-lg">
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            Indlæser referater...
          </div>
        ) : Array.isArray(referats) && referats.length > 0 ? (
          <div>
            {referats.map(referat => (
              <div 
                key={referat.id || `${referat.medl_ident}-${referat.samind_lbnr}`}
                className="flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0" 
                onClick={() => onSelectReport(referat)}
              >
                <div>
                  <div className="font-medium">
                    Referat {referat.samind_lbnr}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(referat.reg_tid)}
                  </div>
                </div>
                {referat.samtyp_type && (
                  <div className="text-sm text-gray-500 px-2 py-1 bg-gray-100 rounded">
                    {referat.samtyp_type}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500">
            {error || 'Ingen referater fundet for de valgte filtre'}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportList;
