const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const { diffWords } = require('diff');
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

// Helper function to parse a referat into sections
const parseReferat = (referat) => {
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

  // Process each line and categorize into appropriate sections
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
      // Handle bullet points and regular text differently
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

  // Add any remaining text
  if (currentText.trim()) {
    sections[currentSection].push(currentText.trim());
  }

  return sections;
};

// Helper function to count changes in a section using diffWords
const countSectionChanges = (aiText, humanText, sectionName) => {
  if (!aiText || !humanText) return 0;
  
  const aiParsed = parseReferat(aiText);
  const humanParsed = parseReferat(humanText);
  
  // Join all lines with newlines to preserve structure
  const aiSectionText = aiParsed[sectionName].join('\n');
  const humanSectionText = humanParsed[sectionName].join('\n');
  
  // If section is empty in both texts, no changes
  if (!aiSectionText.trim() && !humanSectionText.trim()) return 0;
  
  // Use diffWords to calculate changes
  const diff = diffWords(aiSectionText, humanSectionText);
  const changes = diff.filter(part => part.added || part.removed);
  
  console.log('Section changes:', {
    sectionName,
    changes: changes.map(c => ({
      value: c.value,
      type: c.added ? 'added' : 'removed'
    }))
  });
  
  return changes.length;
};

// KPI stats endpoint
app.get('/api/kpi-stats', async (req, res) => {
  try {
    if (!pool) await connectToDatabase();
    console.log('Fetching KPI stats...');
    
    // Parse date parameters with proper format conversion
    const { startDate, endDate, type } = req.query;
    
    // SQL query parameters
    let sqlParams = [];
    let dateFilter = '';
    let typeFilter = '';
    
    // Process date filters
    if (startDate || endDate) {
      // Function to convert DD.MM.YYYY to YYYY-MM-DD format
      const formatDateForSQL = (dateStr) => {
        if (!dateStr) return null;
        
        // If date is already in DD.MM.YYYY format, convert it
        if (dateStr.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
          const [day, month, year] = dateStr.split('.');
          return `${year}-${month}-${day}`;
        }
        
        // If date is in YYYY-MM-DD format, use as is
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return dateStr;
        }
        
        // Otherwise, try to parse the date
        try {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        } catch (err) {
          console.error('Error parsing date:', err);
        }
        
        return null;
      };
      
      // Process date range (startDate and endDate)
      const formattedStartDate = formatDateForSQL(startDate);
      const formattedEndDate = formatDateForSQL(endDate);
      
      if (formattedStartDate && formattedEndDate) {
        dateFilter = "AND CAST(referat_godkendt_at AS DATE) BETWEEN @startDate AND @endDate";
        sqlParams.push({ name: 'startDate', type: sql.Date, value: formattedStartDate });
        sqlParams.push({ name: 'endDate', type: sql.Date, value: formattedEndDate });
        console.log('Filtering by date range:', formattedStartDate, 'to', formattedEndDate);
      } else if (formattedStartDate) {
        dateFilter = "AND CAST(referat_godkendt_at AS DATE) >= @startDate";
        sqlParams.push({ name: 'startDate', type: sql.Date, value: formattedStartDate });
        console.log('Filtering by start date:', formattedStartDate);
      } else if (formattedEndDate) {
        dateFilter = "AND CAST(referat_godkendt_at AS DATE) <= @endDate";
        sqlParams.push({ name: 'endDate', type: sql.Date, value: formattedEndDate });
        console.log('Filtering by end date:', formattedEndDate);
      }
    }
    
    // Add type filter if present
    if (type) {
      typeFilter = "AND samtyp_type = @type";
      sqlParams.push({ name: 'type', type: sql.VarChar, value: type });
      console.log('Filtering by type:', type);
    }
    
    // Build the KPI stats query
    const query = `
      WITH TimeStats AS (
        SELECT
          ISNULL(SUM(CASE WHEN feedback = '1' THEN 1 ELSE 0 END), 0) as thumbs_up,        
          ISNULL(SUM(CASE WHEN feedback = '-1' THEN 1 ELSE 0 END), 0) as thumbs_down,
          ISNULL(SUM(CASE WHEN feedback IS NULL THEN 1 ELSE 0 END), 0) as no_feedback,
          COUNT(*) as total_conversations,
          ISNULL(AVG(CASE
            WHEN transcription_recieved_at IS NOT NULL AND ai_referat_recieved_at IS NOT NULL
            AND DATEDIFF(MINUTE, transcription_recieved_at, ai_referat_recieved_at) > 0 
            AND DATEDIFF(MINUTE, transcription_recieved_at, ai_referat_recieved_at) < 1000
            THEN CAST(DATEDIFF(MINUTE, transcription_recieved_at, ai_referat_recieved_at) AS FLOAT)
            ELSE NULL
          END), 0) as avg_time_to_ai_report,
          ISNULL(AVG(CASE
            WHEN transcription_recieved_at IS NOT NULL AND referat_godkendt_at IS NOT NULL
            AND DATEDIFF(MINUTE, transcription_recieved_at, referat_godkendt_at) > 0    
            AND DATEDIFF(MINUTE, transcription_recieved_at, referat_godkendt_at) < 1000 
            THEN CAST(DATEDIFF(MINUTE, transcription_recieved_at, referat_godkendt_at) AS FLOAT)
            ELSE NULL
          END), 0) as avg_time_to_approval,
          (
            SELECT TOP 1 samtyp_type
            FROM ai_statistik
            WHERE referat_godkendt_at IS NOT NULL ${dateFilter} ${typeFilter}
            GROUP BY samtyp_type
            ORDER BY COUNT(*) DESC
          ) as most_frequent_type
        FROM ai_statistik WITH (NOLOCK)
        WHERE 1=1 ${dateFilter} ${typeFilter}
      )
      SELECT
        thumbs_up as positiveFeedback,
        thumbs_down as negativeFeedback,
        no_feedback as noFeedback,
        total_conversations as totalCount,
        avg_time_to_ai_report as avgTimeToAiReport,
        avg_time_to_approval as avgTimeToApproval,
        ISNULL(most_frequent_type, 'N/A') as mostFrequentType
      FROM TimeStats
    `;
    
    console.log('Executing KPI stats query:', query);
    console.log('With parameters:', sqlParams);
    
    // Execute the query
    const request = pool.request();
    
    // Add parameters to the request
    sqlParams.forEach(param => {
      request.input(param.name, param.type, param.value);
    });
    
    const result = await request.query(query);
    console.log('KPI stats result:', result.recordset[0]);
    
    // Send the results
    res.json(result.recordset[0] || {
      positiveFeedback: 0,
      negativeFeedback: 0,
      noFeedback: 0,
      totalCount: 0,
      avgTimeToAiReport: 0,
      avgTimeToApproval: 0,
      mostFrequentType: "N/A"
    });
  } catch (err) {
    console.error('Error fetching KPI stats:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Timeline stats endpoint
app.get('/api/timeline-stats', async (req, res) => {
  try {
    if (!pool) await connectToDatabase();
    console.log('Fetching timeline stats...');
    
    // Parse query parameters
    const { startDate, endDate, interval, type } = req.query;
    console.log('Timeline stats request params:', { startDate, endDate, interval, type });
    
    // Determine the date format and group by clause based on interval
    let dateFormat = "CONVERT(VARCHAR(10), referat_godkendt_at, 120)";
    let groupByClause = "CONVERT(VARCHAR(10), referat_godkendt_at, 120)";
    
    if (interval === 'days') {
      // For days, use the exact date without any grouping
      dateFormat = "CAST(referat_godkendt_at AS DATE)";
      groupByClause = "CAST(referat_godkendt_at AS DATE)";
    } else if (interval === 'weeks') {
      dateFormat = "DATEADD(DAY, -DATEPART(WEEKDAY, referat_godkendt_at) + 1, CAST(referat_godkendt_at AS DATE))";
      groupByClause = "DATEADD(DAY, -DATEPART(WEEKDAY, referat_godkendt_at) + 1, CAST(referat_godkendt_at AS DATE))";
    } else if (interval === 'months') {
      dateFormat = "DATEFROMPARTS(YEAR(referat_godkendt_at), MONTH(referat_godkendt_at), 1)";
      groupByClause = "DATEFROMPARTS(YEAR(referat_godkendt_at), MONTH(referat_godkendt_at), 1)";
    } else if (interval === 'quarters') {
      dateFormat = "DATEFROMPARTS(YEAR(referat_godkendt_at), ((DATEPART(QUARTER, referat_godkendt_at) - 1) * 3) + 1, 1)";
      groupByClause = "DATEFROMPARTS(YEAR(referat_godkendt_at), ((DATEPART(QUARTER, referat_godkendt_at) - 1) * 3) + 1, 1)";
    } else if (interval === 'years') {
      dateFormat = "DATEFROMPARTS(YEAR(referat_godkendt_at), 1, 1)";
      groupByClause = "DATEFROMPARTS(YEAR(referat_godkendt_at), 1, 1)";
    }
    
    console.log('Determined date format:', dateFormat);
    console.log('Determined group by clause:', groupByClause);
    
    // SQL query parameters
    let sqlParams = [];
    let dateFilter = '';
    let typeFilter = '';
    
    // Process date filters
    if (startDate || endDate) {
      // Function to convert DD.MM.YYYY to YYYY-MM-DD format
      const formatDateForSQL = (dateStr) => {
        if (!dateStr) return null;
        
        // If date is already in DD.MM.YYYY format, convert it
        if (dateStr.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
          const [day, month, year] = dateStr.split('.');
          return `${year}-${month}-${day}`;
        }
        
        // If date is in YYYY-MM-DD format, use as is
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return dateStr;
        }
        
        // Otherwise, try to parse the date
        try {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        } catch (err) {
          console.error('Error parsing date:', err);
        }
        
        return null;
      };
      
      // Process date range (startDate and endDate)
      const formattedStartDate = formatDateForSQL(startDate);
      const formattedEndDate = formatDateForSQL(endDate);
      
      if (formattedStartDate && formattedEndDate) {
        dateFilter = "AND CAST(referat_godkendt_at AS DATE) BETWEEN @startDate AND @endDate";
        sqlParams.push({ name: 'startDate', type: sql.Date, value: formattedStartDate });
        sqlParams.push({ name: 'endDate', type: sql.Date, value: formattedEndDate });
        console.log('Filtering by date range:', formattedStartDate, 'to', formattedEndDate);
      } else if (formattedStartDate) {
        dateFilter = "AND CAST(referat_godkendt_at AS DATE) >= @startDate";
        sqlParams.push({ name: 'startDate', type: sql.Date, value: formattedStartDate });
        console.log('Filtering by start date:', formattedStartDate);
      } else if (formattedEndDate) {
        dateFilter = "AND CAST(referat_godkendt_at AS DATE) <= @endDate";
        sqlParams.push({ name: 'endDate', type: sql.Date, value: formattedEndDate });
        console.log('Filtering by end date:', formattedEndDate);
      }
    }
    
    // Add type filter if present
    if (type) {
      typeFilter = "AND samtyp_type = @type";
      sqlParams.push({ name: 'type', type: sql.VarChar, value: type });
      console.log('Filtering by type:', type);
    }
    
    // First, get all the records we need to process
    const recordsQuery = `
      SELECT
        lbnr,
        ${dateFormat} as date,
        referat,
        AI_Referat as aiReferat
      FROM ai_statistik WITH (NOLOCK)
      WHERE 1=1 ${dateFilter} ${typeFilter}
    `;
    
    console.log('Executing records query:', recordsQuery);
    console.log('With parameters:', sqlParams);
    
    // Execute the query to get records
    const recordsRequest = pool.request();
    
    // Add parameters to the request
    sqlParams.forEach(param => {
      recordsRequest.input(param.name, param.type, param.value);
    });
    
    const recordsResult = await recordsRequest.query(recordsQuery);
    console.log(`Found ${recordsResult.recordset.length} records for processing`);
    
    // Process records to calculate section changes
    const processedRecords = recordsResult.recordset.map(record => {
      // Skip records without both AI referat and approved referat
      if (!record.aiReferat || !record.referat) {
        return {
          ...record,
          viHarAftaltChanges: 0,
          viHarIDagTaltOmChanges: 0,
          dinJobsogningIndtilNuChanges: 0,
          uaendredeSektioner: 0
        };
      }
      
      // Calculate changes for each section using diffWords
      const viHarAftaltChanges = countSectionChanges(record.aiReferat, record.referat, 'viHarAftalt');
      const viHarIDagTaltOmChanges = countSectionChanges(record.aiReferat, record.referat, 'viHarIDagTaltOm');
      const dinJobsogningIndtilNuChanges = countSectionChanges(record.aiReferat, record.referat, 'dinJobsogningIndtilNu');
      
      return {
        ...record,
        viHarAftaltChanges,
        viHarIDagTaltOmChanges,
        dinJobsogningIndtilNuChanges,
        uaendredeSektioner: (viHarAftaltChanges === 0 && viHarIDagTaltOmChanges === 0 && dinJobsogningIndtilNuChanges === 0) ? 1 : 0
      };
    });
    
    console.log('Processed records:', processedRecords);
    
    // Now get the basic stats from the database
    const statsQuery = `
      WITH DailyStats AS (
        SELECT
          ${dateFormat} as date,
          COUNT(*) as total_count,
          ISNULL(SUM(CASE WHEN feedback = '1' THEN 1 ELSE 0 END), 0) as positive_feedback,
          ISNULL(SUM(CASE WHEN feedback = '-1' THEN 1 ELSE 0 END), 0) as negative_feedback,
          ISNULL(AVG(CASE
            WHEN transcription_recieved_at IS NOT NULL AND ai_referat_recieved_at IS NOT NULL
            AND DATEDIFF(MINUTE, transcription_recieved_at, ai_referat_recieved_at) > 0 
            AND DATEDIFF(MINUTE, transcription_recieved_at, ai_referat_recieved_at) < 1000
            THEN CAST(DATEDIFF(MINUTE, transcription_recieved_at, ai_referat_recieved_at) AS FLOAT)
            ELSE NULL
          END), 0) as avg_time_to_ai_report,
          ISNULL(AVG(CASE
            WHEN transcription_recieved_at IS NOT NULL AND referat_godkendt_at IS NOT NULL
            AND DATEDIFF(MINUTE, transcription_recieved_at, referat_godkendt_at) > 0    
            AND DATEDIFF(MINUTE, transcription_recieved_at, referat_godkendt_at) < 1000 
            THEN CAST(DATEDIFF(MINUTE, transcription_recieved_at, referat_godkendt_at) AS FLOAT)
            ELSE NULL
          END), 0) as avg_time_to_approval
        FROM ai_statistik WITH (NOLOCK)
        WHERE 1=1 ${dateFilter} ${typeFilter}
        GROUP BY ${groupByClause}
      )
      SELECT
        CONVERT(VARCHAR(10), date, 120) as date,
        total_count as totalCount,
        positive_feedback as positiveFeedback,
        negative_feedback as negativeFeedback,
        avg_time_to_ai_report as avgTimeToAiReport,
        avg_time_to_approval as avgTimeToApproval
      FROM DailyStats
      ORDER BY date
    `;
    
    console.log('Executing stats query:', statsQuery);
    
    // Execute the query to get stats
    const statsRequest = pool.request();
    
    // Add parameters to the request
    sqlParams.forEach(param => {
      statsRequest.input(param.name, param.type, param.value);
    });
    
    const statsResult = await statsRequest.query(statsQuery);
    console.log(`Found ${statsResult.recordset.length} stats records`);
    
    // Combine the stats with the processed section changes
    const combinedResults = statsResult.recordset.map(stat => {
      // Find all records for this date, accounting for different interval groupings
      const dateRecords = processedRecords.filter(record => {
        // For days, we need exact date matching
        if (interval === 'days') {
          const recordDate = new Date(record.date).toISOString().split('T')[0];
          const statDate = new Date(stat.date).toISOString().split('T')[0];
          return recordDate === statDate;
        } 
        // For weeks, we need to match the week
        else if (interval === 'weeks') {
          const recordDate = new Date(record.date);
          const statDate = new Date(stat.date);
          
          // Get the week start date (Monday) for both dates
          const recordWeekStart = new Date(recordDate);
          recordWeekStart.setDate(recordDate.getDate() - recordDate.getDay() + (recordDate.getDay() === 0 ? -6 : 1));
          recordWeekStart.setHours(0, 0, 0, 0);
          
          const statWeekStart = new Date(statDate);
          statWeekStart.setDate(statDate.getDate() - statDate.getDay() + (statDate.getDay() === 0 ? -6 : 1));
          statWeekStart.setHours(0, 0, 0, 0);
          
          return recordWeekStart.getTime() === statWeekStart.getTime();
        }
        // For months, quarters, and years, match by the stat date
        else {
          const recordDate = new Date(record.date);
          const statDate = new Date(stat.date);
          
          if (interval === 'months') {
            return recordDate.getFullYear() === statDate.getFullYear() && 
                   recordDate.getMonth() === statDate.getMonth();
          } else if (interval === 'quarters') {
            const recordQuarter = Math.floor(recordDate.getMonth() / 3);
            const statQuarter = Math.floor(statDate.getMonth() / 3);
            return recordDate.getFullYear() === statDate.getFullYear() && 
                   recordQuarter === statQuarter;
          } else if (interval === 'years') {
            return recordDate.getFullYear() === statDate.getFullYear();
          }
          
          // Default fallback to exact date matching
          const recordDateStr = new Date(record.date).toISOString().split('T')[0];
          const statDateStr = new Date(stat.date).toISOString().split('T')[0];
          return recordDateStr === statDateStr;
        }
      });
      
      // Calculate section changes for this date
      const viHarAftalt = dateRecords.reduce((sum, record) => sum + record.viHarAftaltChanges, 0);
      const viHarIDagTaltOm = dateRecords.reduce((sum, record) => sum + record.viHarIDagTaltOmChanges, 0);
      const dinJobsogningIndtilNu = dateRecords.reduce((sum, record) => sum + record.dinJobsogningIndtilNuChanges, 0);
      const uaendredeSektioner = dateRecords.reduce((sum, record) => sum + record.uaendredeSektioner, 0);
      
      return {
        ...stat,
        viHarAftalt,
        viHarIDagTaltOm,
        dinJobsogningIndtilNu,
        uaendredeSektioner
      };
    });
    
    console.log(`Found ${combinedResults.length} timeline records`);
    
    // Send the results
    res.json(combinedResults);
  } catch (err) {
    console.error('Error fetching timeline stats:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Samtaletyper endpoint
app.get('/api/samtaletyper', async (req, res) => {
  try {
    if (!pool) await connectToDatabase();
    console.log('Fetching samtaletyper...');
    
    // Query to get distinct conversation types
    const query = `
      SELECT DISTINCT
        samtyp_type,
        samtyp_type as ledetekst
      FROM ai_statistik WITH (NOLOCK)
      WHERE samtyp_type IS NOT NULL AND samtyp_type <> ''
      ORDER BY samtyp_type
    `;
    
    console.log('Executing samtaletyper query:', query);
    
    // Execute the query
    const result = await pool.request().query(query);
    console.log(`Found ${result.recordset.length} samtaletyper`);
    
    // Send the results
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching samtaletyper:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// API endpoint for fetching conversation summaries
app.get('/api/samind_referat', async (req, res) => {
  try {
    if (!pool) await connectToDatabase();
    console.log('Fetching samind referat...');

    // Parse date parameters with proper format conversion
    const { startDate, endDate, date, type } = req.query;
    
    // SQL query parameters
    let sqlParams = [];
    let dateFilter = '';
    
    // Process date filters
    if (startDate || endDate || date) {
      // Function to convert DD.MM.YYYY to YYYY-MM-DD format
      const formatDateForSQL = (dateStr) => {
        if (!dateStr) return null;
        
        // If date is already in DD.MM.YYYY format, convert it
        if (dateStr.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
          const [day, month, year] = dateStr.split('.');
          return `${year}-${month}-${day}`;
        }
        
        // If date is in YYYY-MM-DD format, use as is
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return dateStr;
        }
        
        // Otherwise, try to parse the date
        try {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        } catch (err) {
          console.error('Error parsing date:', err);
        }
        
        return null;
      };
      
      // If we have a specific date, use that for filtering
      if (date) {
        const formattedDate = formatDateForSQL(date);
        if (formattedDate) {
          dateFilter = "AND CAST(referat_godkendt_at AS DATE) = @date";
          sqlParams.push({ name: 'date', type: sql.Date, value: formattedDate });
          console.log('Filtering by specific date:', formattedDate);
        }
      } else {
        // Otherwise use date range (startDate and endDate)
        const formattedStartDate = formatDateForSQL(startDate);
        const formattedEndDate = formatDateForSQL(endDate);
        
        if (formattedStartDate && formattedEndDate) {
          dateFilter = "AND CAST(referat_godkendt_at AS DATE) BETWEEN @startDate AND @endDate";
          sqlParams.push({ name: 'startDate', type: sql.Date, value: formattedStartDate });
          sqlParams.push({ name: 'endDate', type: sql.Date, value: formattedEndDate });
          console.log('Filtering by date range:', formattedStartDate, 'to', formattedEndDate);
        } else if (formattedStartDate) {
          dateFilter = "AND CAST(referat_godkendt_at AS DATE) >= @startDate";
          sqlParams.push({ name: 'startDate', type: sql.Date, value: formattedStartDate });
          console.log('Filtering by start date:', formattedStartDate);
        } else if (formattedEndDate) {
          dateFilter = "AND CAST(referat_godkendt_at AS DATE) <= @endDate";
          sqlParams.push({ name: 'endDate', type: sql.Date, value: formattedEndDate });
          console.log('Filtering by end date:', formattedEndDate);
        }
      }
    }
    
    // Add type filter if present
    let typeFilter = '';
    if (type) {
      typeFilter = "AND samtyp_type = @type";
      sqlParams.push({ name: 'type', type: sql.VarChar, value: type });
      console.log('Filtering by type:', type);
    }
    
    // Build the WHERE clause
    let whereClause = "WHERE 1=1"; // Always true condition to start the WHERE clause
    if (dateFilter) {
      whereClause += ` ${dateFilter}`; // Note: dateFilter already includes AND
    }
    if (typeFilter) {
      whereClause += ` ${typeFilter}`; // Note: typeFilter already includes AND
    }
    
    // Build the final query
    const query = `
      SELECT TOP 100
        lbnr,
        referat,
        AI_Referat as aiReferat,
        feedback,
        referat_godkendt_at,
        transcription_recieved_at,
        AI_Referat_Recieved_At as ai_referat_recieved_at,
        referat_started_at,
        samtyp_type,
        feedback as feedback_beskrivelse,
        regenerated,
        DATEDIFF(MINUTE, referat_started_at, referat_godkendt_at) as tid_til_godkendelse,
        DATEDIFF(MINUTE, transcription_recieved_at, AI_Referat_Recieved_At) as tid_til_ai_referat
      FROM ai_statistik WITH (NOLOCK)
      ${whereClause}
      ORDER BY referat_godkendt_at DESC
    `;
    
    console.log('Executing query:', query);
    console.log('With parameters:', sqlParams);
    
    // Execute the query
    const request = pool.request();
    
    // Add parameters to the request
    sqlParams.forEach(param => {
      request.input(param.name, param.type, param.value);
    });
    
    const result = await request.query(query);
    console.log(`Found ${result.recordset.length} records`);
    
    // Send the results
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching samind referat:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Frontend should be running on port ${process.env.DEV_FRONTEND_PORT_ALT || 83}`);
});

// Connect to database on startup
connectToDatabase().catch(err => {
  console.error('Failed to connect to database on startup:', err);
  process.exit(1);
});
