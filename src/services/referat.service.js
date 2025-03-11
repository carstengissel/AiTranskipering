import { compareAllSections } from '../utils/sectionComparison';

/**
 * Service til at håndtere referat sammenligninger og beregninger
 */
class ReferatService {
  /**
   * Beregner sektionsændringer for en liste af referater
   * @param {Array} referater - Array af referater med ai_referat og referat
   * @returns {Array} Referater med beregnede ændringer
   */
  calculateSectionChangesForList(referater) {
    return referater.map(referat => {
      const changes = compareAllSections(referat.ai_referat, referat.referat);
      return {
        ...referat,
        sectionChanges: changes
      };
    });
  }

  /**
   * Grupperer referater efter dato og beregner samlet antal ændringer
   * @param {Array} referater - Array af referater med beregnede ændringer
   * @returns {Object} Grupperede ændringer per dato
   */
  groupChangesByDate(referater) {
    const grouped = referater.reduce((acc, referat) => {
      const date = new Date(referat.reg_tid).toISOString().split('T')[0];
      
      if (!acc[date]) {
        acc[date] = {
          date,
          totalCount: 0,
          viHarAftalt: 0,
          viHarIDagTaltOm: 0,
          dinJobsogningIndtilNu: 0,
          referater: []
        };
      }
      
      acc[date].totalCount++;
      acc[date].viHarAftalt += referat.sectionChanges.viHarAftalt;
      acc[date].viHarIDagTaltOm += referat.sectionChanges.viHarIDagTaltOm;
      acc[date].dinJobsogningIndtilNu += referat.sectionChanges.dinJobsogningIndtilNu;
      acc[date].referater.push(referat);
      
      return acc;
    }, {});

    return Object.values(grouped);
  }

  /**
   * Beregner gennemsnit for sektionsændringer
   * @param {Array} groupedData - Grupperede ændringer per dato
   * @returns {Array} Data med gennemsnitlige ændringer
   */
  calculateAverages(groupedData) {
    return groupedData.map(group => ({
      ...group,
      viHarAftalt: Math.round((group.viHarAftalt / group.totalCount) * 10) / 10,
      viHarIDagTaltOm: Math.round((group.viHarIDagTaltOm / group.totalCount) * 10) / 10,
      dinJobsogningIndtilNu: Math.round((group.dinJobsogningIndtilNu / group.totalCount) * 10) / 10
    }));
  }

  /**
   * Processerer en liste af referater til graf data
   * @param {Array} referater - Rå referat data fra databasen
   * @returns {Array} Processeret data klar til grafer
   */
  processReferatsForCharts(referater) {
    const withChanges = this.calculateSectionChangesForList(referater);
    const groupedByDate = this.groupChangesByDate(withChanges);
    return this.calculateAverages(groupedByDate);
  }

  /**
   * Beregner totaler for en specifik dato
   * @param {string} date - Dato at beregne for
   * @param {Array} referater - Liste af referater
   * @returns {Object} Totaler for den valgte dato
   */
  calculateTotalsForDate(date, referater) {
    const dateReferater = referater.filter(ref => 
      new Date(ref.reg_tid).toISOString().split('T')[0] === date
    );
    
    const withChanges = this.calculateSectionChangesForList(dateReferater);
    
    return withChanges.reduce((totals, referat) => ({
      totalCount: totals.totalCount + 1,
      viHarAftalt: totals.viHarAftalt + referat.sectionChanges.viHarAftalt,
      viHarIDagTaltOm: totals.viHarIDagTaltOm + referat.sectionChanges.viHarIDagTaltOm,
      dinJobsogningIndtilNu: totals.dinJobsogningIndtilNu + referat.sectionChanges.dinJobsogningIndtilNu
    }), {
      totalCount: 0,
      viHarAftalt: 0,
      viHarIDagTaltOm: 0,
      dinJobsogningIndtilNu: 0
    });
  }
}

export default new ReferatService();