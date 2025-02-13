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

  // Calculate percentages
  const totalFeedback = kpis.positiveFeedback + kpis.negativeFeedback;
  const positivePercentage = totalFeedback > 0 ? ((kpis.positiveFeedback / totalFeedback) * 100).toFixed(2) : "0.00";
  const negativePercentage = totalFeedback > 0 ? ((kpis.negativeFeedback / totalFeedback) * 100).toFixed(2) : "0.00";

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <KPICard 
        title="Gns. Thumbs Up andel" 
        value={positivePercentage}
        unit="%" 
      />
      <KPICard 
        title="Gns. Thumbs Down andel" 
        value={negativePercentage}
        unit="%" 
      />
      <KPICard 
        title="Gns. Tid til AI Rapport" 
        value={kpis.avgTimeToAiReport > 0 && kpis.avgTimeToAiReport < 1000 ? Math.round(kpis.avgTimeToAiReport) : 0}
        unit="min" 
      />
      <KPICard 
        title="Gns. Tid til Godkendelse" 
        value={kpis.avgTimeToApproval > 0 && kpis.avgTimeToApproval < 1000 ? Math.round(kpis.avgTimeToApproval) : 0}
        unit="min" 
      />
      <KPICard 
        title="Samtaler i alt" 
        value={kpis.totalCount || 0} 
        unit="" 
      />
      <KPICard 
        title="Hyppigste Samtaletype" 
        value={kpis.mostFrequentType || "N/A"} 
        unit="" 
      />
    </div>
  );
};

export default DashboardKPIs;
