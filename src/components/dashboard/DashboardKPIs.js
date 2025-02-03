import React from 'react';
import { useDashboard } from '../../context/DashboardContext';

const KPICard = ({ title, value, unit }) => (
  <div className="bg-white shadow rounded-lg p-4 flex flex-col items-center justify-center flex-1 min-w-[150px]">
    <h3 className="text-sm font-semibold mb-2 text-center">{title}</h3>
    <p className="text-xl font-bold">
      {value}<span className="text-xs ml-1">{unit}</span>
    </p>
  </div>
);

const DashboardKPIs = () => {
  const { kpis } = useDashboard();

  if (!kpis) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <KPICard 
        title="Gns. Thumbs Up andel" 
        value={kpis.avgThumbsUpRate} 
        unit="%" 
      />
      <KPICard 
        title="Gns. Thumbs Down andel" 
        value={kpis.avgThumbsDownRate} 
        unit="%" 
      />
      <KPICard 
        title="Gns. Tid til AI Rapport" 
        value={kpis.avgTimeToAIReport} 
        unit="min" 
      />
      <KPICard 
        title="Gns. Tid til Godkendelse" 
        value={kpis.avgTimeToApproval} 
        unit="min" 
      />
      <KPICard 
        title="Uændrede Sektioner" 
        value={kpis.unchangedSectionsPercentage} 
        unit="%" 
      />
      <KPICard 
        title="Hyppigste Samtaletype" 
        value={kpis.mostFrequentType} 
        unit="" 
      />
    </div>
  );
};

export default DashboardKPIs;
