require('dotenv').config();
process.env.NODE_ENV = 'development';

const { compareAllSections } = require('./src/utils/sectionComparison');

const test = (name, aiText, humanText) => {
  console.log(`\n=== Test: ${name} ===`);
  
  const results = compareAllSections(aiText, humanText);
  
  console.log('\nResultater:', results);
  return results;
};

// Test data
const tests = {
  // 10. februar 2025
  feb10: {
    name: '10. februar 2025',
    ai: `
Vi har aftalt:
- følge op på ansøgninger
- opdatere CV
- netværk på LinkedIn
- søge bredt
- kigge jobannoncer dagligt

Vi har i dag talt om:
- status på jobsøgning
- kompetenceprofil
- jobmuligheder
- ansøgningsteknik
- karriereveje

Din jobsøgning indtil nu:
- 3 aktive ansøgninger
- 1 samtale i næste uge`,

    human: `
Vi har aftalt:
- følge op på alle ansøgninger
- CV revision
- LinkedIn optimering
- bred jobsøgning
- daglig jobsøgning

Vi har i dag talt om:
- jobsøgningsstatus
- faglige kompetencer
- relevante stillinger
- ansøgninger
- karriereudvikling

Din jobsøgning indtil nu:
- 3 ansøgninger i proces
- jobsamtale planlagt`
  },

  // 6. februar 2025
  feb6: {
    name: '6. februar 2025',
    ai: `
Vi har aftalt:
- møde i marts
- fokus på IT-jobs

Vi har i dag talt om:
- jobmarkedet
- tekniske krav
- ansøgningsstrategi

Din jobsøgning indtil nu:
- 2 ansøgninger sendt
- afventer svar`,

    human: `
Vi har aftalt:
- møde start april
- bred IT-jobsøgning

Vi har i dag talt om:
- aktuelle jobmuligheder
- kompetencekrav
- målrettet ansøgning

Din jobsøgning indtil nu:
- 3 ansøgninger i proces
- et afslag modtaget`
  },

  // 17. december 2024
  dec17: {
    name: '17. december 2024',
    ai: `
Vi har aftalt:
- opfølgning næste uge
- kontakt virksomhed X

Vi har i dag talt om:
- status på ansøgninger
- jobmuligheder
- kompetenceudvikling
- netværksaktiviteter
- CV opdatering
- karrierevalg

Din jobsøgning indtil nu:
- 3 aktive ansøgninger
- netværksmøder planlagt
- CV opdateret
- LinkedIn profil`,

    human: `
Vi har aftalt:
- opfølgning om 14 dage
- kontakt tre virksomheder

Vi har i dag talt om:
- fremdrift i jobsøgning
- relevante stillinger
- kompetencebehov
- netværksstrategi
- CV forbedringer
- karrieremuligheder

Din jobsøgning indtil nu:
- 5 ansøgninger sendt
- to netværksmøder booket
- nyt CV klar
- professionel LinkedIn`
  }
};

// Kør tests
Object.values(tests).forEach(({name, ai, human}) => {
  const results = test(name, ai, human);
  
  // Verificer resultater
  const expectedResults = {
    '10. februar 2025': {
      viHarAftalt: 5,
      viHarIDagTaltOm: 5,
      dinJobsogningIndtilNu: 2
    },
    '6. februar 2025': {
      viHarAftalt: 2,
      viHarIDagTaltOm: 3,
      dinJobsogningIndtilNu: 1
    },
    '17. december 2024': {
      viHarAftalt: 2,
      viHarIDagTaltOm: 6,
      dinJobsogningIndtilNu: 4
    }
  };

  const expected = expectedResults[name];
  const matches = JSON.stringify(results) === JSON.stringify(expected);

  console.log('\nForventet:', expected);
  console.log('Matcher forventet?', matches ? 'JA ✓' : 'NEJ ✗');
  if (!matches) {
    console.log('Forskelle:');
    Object.keys(expected).forEach(key => {
      if (expected[key] !== results[key]) {
        console.log(`${key}: Forventet ${expected[key]}, fik ${results[key]}`);
      }
    });
  }
});