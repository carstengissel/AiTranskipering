import React from 'react';
import { X } from 'lucide-react';

/**
 * Component that displays a legend explaining the color coding used in text comparisons
 * Shows what different background colors mean in the text comparison view:
 * - Green: Added text
 * - Red: Removed text
 * - White: Unchanged text
 * 
 * @component
 * @param {Object} props
 * @param {Function} props.onClose - Callback function to close the legend
 * 
 * @example
 * const [showLegend, setShowLegend] = useState(false);
 * 
 * // In your JSX:
 * {showLegend && (
 *   <ColorLegend onClose={() => setShowLegend(false)} />
 * )}
 */
const ColorLegend = ({ onClose }) => (
  <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
    {/* Header with title and close button */}
    <div className="flex items-center justify-between mb-2">
      <h3 className="font-medium">Farvekoder for ændringer</h3>
      <button 
        onClick={onClose}
        className="text-gray-500 hover:text-gray-700"
        aria-label="Luk farvekoder"
      >
        <X className="h-4 w-4" />
      </button>
    </div>

    {/* Color explanations */}
    <div className="space-y-2">
      {/* Added text */}
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-green-200 rounded"></div>
        <span>Tilføjet tekst - Ny tekst der er blevet tilføjet</span>
      </div>

      {/* Removed text */}
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-red-200 rounded"></div>
        <span>Fjernet tekst - Tekst der er blevet slettet</span>
      </div>

      {/* Unchanged text */}
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-white border rounded"></div>
        <span>Uændret tekst - Tekst der ikke er blevet ændret</span>
      </div>
    </div>
  </div>
);

export default ColorLegend;
