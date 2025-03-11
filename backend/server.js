const express = require('express');
const cors = require('cors');
const sql = require('mssql');
require('dotenv').config();

// Database config
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

const app = express();

// CORS setup
const corsOptions = {
  origin: [
    'http://localhost:83',
    'http://localhost:3002',
    'http://localhost:3000',
    'http://localhost:3003'
  ],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());

// Database connection
let pool;
const connectToDatabase = async () => {
  try {
    console.log('Connecting to database...');
    pool = await sql.connect(dbConfig);
    console.log('Connected to database');
  } catch (err) {
    console.error('Database connection failed:', err);
    throw err;
  }
};

// KPI stats endpoint
app.get('/api/kpi-stats', async (req, res) => {
  try {
    if (!pool) await connectToDatabase();
    console.log('Fetching KPI stats...');

    const result = await pool.request().query(`
      SELECT 
        Referat,
        AI_Referat,
        Feedback,
        Transcription_Recieved_At,
        AI_Referat_Recieved_At,
        Referat_Godkendt_At,
        Samtyp_Type
      FROM ai_statistik WITH (NOLOCK)
      WHERE Referat_Godkendt_At IS NOT NULL
    `);

    console.log(`Found ${result.recordset.length} records`);

    const stats = {
      positiveFeedback: result.recordset.filter(r => r.Feedback === '1').length,
      negativeFeedback: result.recordset.filter(r => r.Feedback === '-1').length,
      totalCount: result.recordset.length,
      avgTimeToAiReport: calculateAvgTime(result.recordset, 'Transcription_Recieved_At', 'AI_Referat_Recieved_At'),
      avgTimeToApproval: calculateAvgTime(result.recordset, 'Transcription_Recieved_At', 'Referat_Godkendt_At'),
      mostFrequentType: calculateMostFrequentType(result.recordset)
    };

    res.json(stats);
  } catch (err) {
    console.error('Error in KPI stats:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Timeline stats endpoint
app.get('/api/timeline-stats', async (req, res) => {
  try {
    if (!pool) await connectToDatabase();
    console.log('Fetching timeline stats...');

    const result = await pool.request().query(`
      SELECT 
        Referat,
        AI_Referat,
        Referat_Godkendt_At,
        Feedback,
        Transcription_Recieved_At,
        AI_Referat_Recieved_At
      FROM ai_statistik WITH (NOLOCK)
      WHERE Referat_Godkendt_At IS NOT NULL
    `);

    console.log(`Found ${result.recordset.length} records`);

    // Gruppér efter dato
    const referatsByDate = result.recordset.reduce((acc, row) => {
      const date = new Date(row.Referat_Godkendt_At).toISOString().split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(row);
      return acc;
    }, {});

    // Beregn statistik for hver dato
    const processedData = Object.entries(referatsByDate).map(([date, dayReferater]) => {
      const stats = {
        date,
        totalCount: dayReferater.length,
        viHarAftalt: 0,
        viHarIDagTaltOm: 0,
        dinJobsogningIndtilNu: 0,
        positiveFeedback: dayReferater.filter(r => r.Feedback === '1').length,
        negativeFeedback: dayReferater.filter(r => r.Feedback === '-1').length,
        avgTimeToAiReport: calculateAvgTime(dayReferater, 'Transcription_Recieved_At', 'AI_Referat_Recieved_At'),
        avgTimeToApproval: calculateAvgTime(dayReferater, 'Transcription_Recieved_At', 'Referat_Godkendt_At')
      };

      // Beregn sektionsændringer for hver referat
      dayReferater.forEach(referat => {
        try {
          const aiParsed = parseReferat(referat.AI_Referat);
          const humanParsed = parseReferat(referat.Referat);

          ['viHarAftalt', 'viHarIDagTaltOm', 'dinJobsogningIndtilNu'].forEach(section => {
            const aiText = aiParsed[section].join('\n');
            const humanText = humanParsed[section].join('\n');

            if (humanText.trim()) {
              const aiChars = Array.from(aiText);
              const humanChars = Array.from(humanText);

              let changes = 0;
              let consecutiveChanges = 0;
              let i = 0;
              let j = 0;

              while (i < humanChars.length || j < aiChars.length) {
                if (i >= humanChars.length) {
                  changes += aiChars.length - j;
                  break;
                }
                if (j >= aiChars.length) {
                  changes += humanChars.length - i;
                  break;
                }

                if (humanChars[i] !== aiChars[j]) {
                  consecutiveChanges++;
                  changes++;
                  i++;
                  j++;
                } else {
                  if (consecutiveChanges < 3) {
                    changes -= consecutiveChanges;
                  }
                  consecutiveChanges = 0;
                  i++;
                  j++;
                }
              }

              const sectionChanges = Math.min(100, Math.round((changes / humanChars.length) * 25));
              stats[section] += sectionChanges;
            }
          });
        } catch (err) {
          console.error('Error processing referat:', err);
        }
      });

      // Beregn gennemsnit
      stats.viHarAftalt = Math.round(stats.viHarAftalt / dayReferater.length);
      stats.viHarIDagTaltOm = Math.round(stats.viHarIDagTaltOm / dayReferater.length);
      stats.dinJobsogningIndtilNu = Math.round(stats.dinJobsogningIndtilNu / dayReferater.length);

      return stats;
    });

    // Sortér efter dato
    processedData.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json(processedData);
  } catch (err) {
    console.error('Error in timeline stats:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Samind referat endpoint
app.get('/api/samind_referat', async (req, res) => {
  try {
    if (!pool) await connectToDatabase();
    console.log('Fetching samind referat...');

    const result = await pool.request().query(`
      SELECT TOP 100
        lbnr,
        Referat,
        AI_Referat,
        Feedback,
        Referat_Godkendt_At,
        Transcription_Recieved_At,
        AI_Referat_Recieved_At,
        Referat_Started_At,
        Samtyp_Type,
        Feedback as feedback_beskrivelse,
        Regenerated
      FROM ai_statistik WITH (NOLOCK)
      WHERE Referat_Godkendt_At IS NOT NULL
      ORDER BY Referat_Godkendt_At DESC
    `);

    const referater = result.recordset.map(row => {
      // Beregn tider
      const tidTilGodkendelse = row.Referat_Started_At && row.Referat_Godkendt_At
        ? Math.round((new Date(row.Referat_Godkendt_At) - new Date(row.Referat_Started_At)) / (1000 * 60))
        : null;

      const tidTilAIReferat = row.Transcription_Recieved_At && row.AI_Referat_Recieved_At
        ? Math.round((new Date(row.AI_Referat_Recieved_At) - new Date(row.Transcription_Recieved_At)) / (1000 * 60))
        : null;

      return {
        id: row.lbnr,
        samind_lbnr: row.lbnr, // For bagudkompatibilitet
        referat: row.Referat,
        aiReferat: row.AI_Referat,
        feedback: row.Feedback,
        referat_godkendt_at: row.Referat_Godkendt_At,
        transcription_recieved_at: row.Transcription_Recieved_At,
        ai_referat_recieved_at: row.AI_Referat_Recieved_At,
        referat_started_at: row.Referat_Started_At,
        samtaletype: row.Samtyp_Type,
        feedback_beskrivelse: row.feedback_beskrivelse,
        regenerer_dato: row.Regenerated,
        tid_til_godkendelse: tidTilGodkendelse,
        tid_til_ai_referat: tidTilAIReferat
      };
    });

    res.json(referater);
  } catch (err) {
    console.error('Error fetching samind referat:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Hjælpefunktioner
function parseReferat(referat) {
  if (!referat) {
    return {
      viHarAftalt: [],
      viHarIDagTaltOm: [],
      dinJobsogningIndtilNu: [],
      andet: []
    };
  }

  const sections = {
    viHarAftalt: [],
    viHarIDagTaltOm: [],
    dinJobsogningIndtilNu: [],
    andet: []
  };

  const lines = referat.split('\n');
  let currentSection = 'andet';
  let currentText = '';

  for (const line of lines) {
    if (line.includes('Vi har aftalt')) {
      if (currentText.trim()) {
        sections[currentSection].push(currentText.trim());
      }
      currentSection = 'viHarAftalt';
      currentText = '';
    } else if (line.includes('Vi har i dag talt om')) {
      if (currentText.trim()) {
        sections[currentSection].push(currentText.trim());
      }
      currentSection = 'viHarIDagTaltOm';
      currentText = '';
    } else if (line.includes('Din jobsøgning indtil nu')) {
      if (currentText.trim()) {
        sections[currentSection].push(currentText.trim());
      }
      currentSection = 'dinJobsogningIndtilNu';
      currentText = '';
    } else if (line.trim()) {
      if (line.trim().startsWith('- ')) {
        if (currentText.trim()) {
          sections[currentSection].push(currentText.trim());
          currentText = '';
        }
        sections[currentSection].push(line.trim());
      } else {
        currentText += (currentText ? ' ' : '') + line.trim();
      }
    }
  }

  if (currentText.trim()) {
    sections[currentSection].push(currentText.trim());
  }

  return sections;
}

function calculateAvgTime(referater, startField, endField) {
  try {
    const validTimes = referater.filter(r => 
      r[startField] && r[endField] && 
      new Date(r[endField]) > new Date(r[startField])
    );

    if (validTimes.length === 0) return 0;

    const totalMinutes = validTimes.reduce((sum, r) => {
      const minutes = Math.floor(
        (new Date(r[endField]) - new Date(r[startField])) / (1000 * 60)
      );
      return sum + (minutes > 0 && minutes < 1000 ? minutes : 0);
    }, 0);

    return Math.round(totalMinutes / validTimes.length);
  } catch (err) {
    console.error('Error calculating average time:', err);
    return 0;
  }
}

function calculateMostFrequentType(referater) {
  try {
    const typeCounts = referater.reduce((acc, r) => {
      if (r.Samtyp_Type) {
        acc[r.Samtyp_Type] = (acc[r.Samtyp_Type] || 0) + 1;
      }
      return acc;
    }, {});

    let mostFrequent = { type: 'N/A', count: 0 };
    Object.entries(typeCounts).forEach(([type, count]) => {
      if (count > mostFrequent.count) {
        mostFrequent = { type, count };
      }
    });

    return mostFrequent.type;
  } catch (err) {
    console.error('Error calculating most frequent type:', err);
    return 'N/A';
  }
}

// Start server
connectToDatabase().then(() => {
  const port = process.env.PORT || 3002;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log('Frontend should be running on port 83');
  });
}).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
