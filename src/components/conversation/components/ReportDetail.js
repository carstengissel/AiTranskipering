import React from 'react';
import { ArrowLeft } from 'lucide-react';
import ComparisonView from './ComparisonView';
import { parseReferat } from '../utils/parseUtils';

const ReportDetail = ({ 
  report, 
  activeSection,
  openSections,
  onToggleSection,
  onBack 
}) => {
  const humanParsedReferat = parseReferat(report.referat);
  const aiParsedReferat = parseReferat(report.aiReferat);
  const sections = ['viHarAftalt', 'viHarIDagTaltOm', 'dinJobsogningIndtilNu', 'andet'];

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <button 
        onClick={onBack}
        className="mb-4 px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
      >
        <ArrowLeft className="inline mr-2 h-4 w-4" />
        Tilbage til liste
      </button>

      <h2 className="text-xl font-semibold mb-4">Referat {report.samind_lbnr}</h2>
      
      <div className="space-y-4">
        {sections.map(section => (
          <ComparisonView
            key={section}
            section={section}
            aiText={aiParsedReferat[section].join('\n')}
            humanText={humanParsedReferat[section].join('\n')}
            isOpen={openSections[section]}
            onToggle={() => onToggleSection(section)}
            isHighlighted={activeSection === section}
          />
        ))}
      </div>

      <div className="mt-8">
        <h3 className="font-medium mb-2">Original AI-genereret referat:</h3>
        <div className="bg-gray-100 p-2 rounded whitespace-pre-wrap">
          {report.aiReferat}
        </div>
      </div>

      <div className="mt-4">
        <h3 className="font-medium mb-2">Regenerer dato:</h3>
        <div className="bg-gray-100 p-2 rounded whitespace-pre-wrap">
          {report.regenerer_dato ? new Date(report.regenerer_dato).toLocaleString() : ''}
        </div>
      </div>

      <div className="mt-4">
        <h3 className="font-medium mb-2">Feedback:</h3>
        <div className="bg-gray-100 p-2 rounded whitespace-pre-wrap">
          {report.feedback_beskrivelse || 'Ingen feedback tilgængelig'}
        </div>
      </div>
    </div>
  );
};

export default ReportDetail;
