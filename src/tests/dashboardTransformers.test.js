const newCount = transformedData.reduce((sum, item) => sum + (item.count || 0), 0);import { countChangedSections, transformReferatDataForCharts, calculateKPIs } from '../services/dashboardTransformers';
import { parseReferat } from '../components/conversation/utils/parseUtils';

// Mock test data instead of using database
const mockReferat = `Vi har aftalt:
at du undersøger muligheden for en stilling som bioanalytiker. Undersøger virksomhedspraktik som bioanalytiker, hvis du overvejer at komme tilbage i dette fagområde.`;

const mockAiReferat = `Vi har aftalt:
- Du opdaterer din joblog regelmæssigt og sørger for at alle ansøgninger og jobaktiviteter bliver registreret.
- Du arbejder på at forbedre dine ansøgninger ved at tilpasse dem til de konkrete stillingsopslag du søger.
- Du opdaterer dit CV med de nyeste kvalifikationer og erfaringer.
- Du undersøger mulighedernemuligheden for en stilling som bioanalytiker. Undersøger virksomhedspraktik og kontakter Jobcenteret for godkendelse indensom bioanalytiker, hvis du starterovervejer at komme tilbage i praktikdette fagområde.`;

// Mock data for testing conversation counts
const mockReferatData = [
  {
    medl_ident: '1',
    samind_lbnr: '1',
    reg_tid: '2024-11-21T10:00:00Z',
    referat: mockReferat,
    tid_til_godkendelse: 10,
    tid_til_ai_referat: 5,
    samtyp_type: '1',
    ledetekst: 'Test type 1'
  },
  {
    medl_ident: '2',
    samind_lbnr: '2',
    reg_tid: '2024-11-21T11:00:00Z',
    referat: mockReferat,
    tid_til_godkendelse: 15,
    tid_til_ai_referat: 7,
    samtyp_type: '1',
    ledetekst: 'Test type 1'
  },
  {
    medl_ident: '3',
    samind_lbnr: '3',
    reg_tid: '2024-11-12T10:00:00Z',
    referat: mockReferat,
    tid_til_godkendelse: 20,
    tid_til_ai_referat: 8,
    samtyp_type: '2',
    ledetekst: 'Test type 2'
  }
];

const mockAiReferatData = [
  {
    medl_ident: '1',
    samind_lbnr: '1',
    referat: mockAiReferat,
    feedback: '1',
    feedback_beskrivelse: 'Good'
  },
  {
    medl_ident: '2',
    samind_lbnr: '2',
    referat: mockAiReferat,
    feedback: '1',
    feedback_beskrivelse: 'Good'
  },
  {
    medl_ident: '3',
    samind_lbnr: '3',
    referat: mockAiReferat,
    feedback: '1',
    feedback_beskrivelse: 'Good'
  }
];

describe('countChangedSections', () => {
  it('should correctly count the number of changes in each section', () => {
    const changes = countChangedSections(mockReferat, mockAiReferat);
    
    // We expect changes to be an object with counts for each section
    expect(changes).toHaveProperty('viHarAftalt');
    expect(changes).toHaveProperty('viHarIDagTaltOm');
    expect(changes).toHaveProperty('dinJobsogningIndtilNu');
    
    // Log actual changes for debugging
    console.log('\nActual changes:', changes);
    
    // Log the sections for analysis
    const originalSections = parseReferat(mockReferat);
    const aiSections = parseReferat(mockAiReferat);
    
    console.log('\nOriginal Vi har aftalt section:', originalSections.viHarAftalt);
    console.log('\nAI Vi har aftalt section:', aiSections.viHarAftalt);
    
    // Verify specific counts for each section
    expect(changes.viHarAftalt).toBe(15);  // 15 changes in Vi har aftalt section
    expect(changes.viHarIDagTaltOm).toBe(24);  // 24 changes in Vi har i dag talt om section
    expect(changes.dinJobsogningIndtilNu).toBe(6);  // 6 changes in Din jobsøgning indtil nu section
    
    // Verify that changes are non-negative numbers
    Object.values(changes).forEach(count => {
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  it('should return zero changes when sections are identical', () => {
    const changes = countChangedSections(mockReferat, mockReferat);
    const expectedChanges = {
      viHarAftalt: 0,
      viHarIDagTaltOm: 0,
      dinJobsogningIndtilNu: 0
    };
    expect(changes).toEqual(expectedChanges);
  });
});

describe('transformReferatDataForCharts', () => {
  it('should correctly group conversations by date and calculate total count', () => {
    const transformedData = transformReferatDataForCharts(mockReferatData, mockAiReferatData);
    
    // Sort the transformed data by date to ensure consistent ordering
    const sortedData = transformedData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Verify the data structure
    expect(sortedData).toHaveLength(2); // Should have 2 unique dates
    
    // Check the first date (2024-11-12)
    const nov12Data = sortedData.find(d => d.date === '2024-11-12');
    expect(nov12Data).toBeTruthy();
    expect(nov12Data.count).toBe(1); // Should have 1 conversation
    
    // Check the second date (2024-11-21)
    const nov21Data = sortedData.find(d => d.date === '2024-11-21');
    expect(nov21Data).toBeTruthy();
    expect(nov21Data.count).toBe(2); // Should have 2 conversations
    
    // Verify that each date entry has all required properties
    [nov12Data, nov21Data].forEach(dateData => {
      expect(dateData).toHaveProperty('viHarAftalt');
      expect(dateData).toHaveProperty('viHarIDagTaltOm');
      expect(dateData).toHaveProperty('dinJobsogningIndtilNu');
      expect(dateData).toHaveProperty('uaendredeSektioner');
      expect(dateData).toHaveProperty('count');
      expect(typeof dateData.count).toBe('number');
      expect(dateData.count).toBeGreaterThan(0);
    });
  });

  it('should handle empty input data', () => {
    const transformedData = transformReferatDataForCharts([], []);
    expect(transformedData).toHaveLength(0);
  });

  it('should handle mismatched referat and AI referat data', () => {
    const transformedData = transformReferatDataForCharts(mockReferatData, []);
    expect(transformedData).toHaveLength(0);
  });
});

describe('calculateKPIs', () => {
  it('should correctly calculate thumbs up rate', () => {
    const testData = [
      {
        date: '2024-11-21',
        thumbsUp: 1,
        thumbsDown: 0,
        count: 1
      },
      {
        date: '2024-11-21',
        thumbsUp: 0,
        thumbsDown: 0,
        count: 1
      },
      {
        date: '2024-11-12',
        thumbsUp: 1,
        thumbsDown: 0,
        count: 1
      }
    ];

    const kpis = calculateKPIs(testData);
    
    // In this test case:
    // - Total conversations: 3
    // - Total thumbs up: 2
    // - Expected rate: (2/3 * 100) = 66.67%
    expect(kpis.avgThumbsUpRate).toBe("66.67");
  });

  it('should handle zero conversations', () => {
    const kpis = calculateKPIs([]);
    expect(kpis.avgThumbsUpRate).toBe("0.00");
  });

  it('should handle conversations with no feedback', () => {
    const testData = [
      {
        date: '2024-11-21',
        thumbsUp: 0,
        thumbsDown: 0,
        count: 1
      }
    ];

    const kpis = calculateKPIs(testData);
    expect(kpis.avgThumbsUpRate).toBe("0.00");
  });
});
