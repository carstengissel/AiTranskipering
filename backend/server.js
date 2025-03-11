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
    
    // Parse date parameters with proper format conversion
    const { startDate, endDate } = req.query;
    
    // SQL query parameters
    let sqlParams = [];
    let dateFilter = '';
    
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
    
    // Build the KPI stats query
    const query = `
      WITH TimeStats AS (
        SELECT
          ISNULL(SUM(CASE WHEN feedback = '1' THEN 1 ELSE 0 END), 0) as thumbs_up,        
          ISNULL(SUM(CASE WHEN feedback = '-1' THEN 1 ELSE 0 END), 0) as thumbs_down,     
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
          COUNT(*) as total_conversations,
          (
            SELECT TOP 1 samtyp_type
            FROM ai_statistik
            WHERE referat_godkendt_at IS NOT NULL ${dateFilter}
            GROUP BY samtyp_type
            ORDER BY COUNT(*) DESC
          ) as most_frequent_type
        FROM ai_statistik WITH (NOLOCK)
        WHERE referat_godkendt_at IS NOT NULL ${dateFilter}
      )
      SELECT
        thumbs_up as positiveFeedback,
        thumbs_down as negativeFeedback,
        avg_time_to_ai_report as avgTimeToAiReport,
        avg_time_to_approval as avgTimeToApproval,
        total_conversations as totalCount,
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
      avgTimeToAiReport: 0,
      avgTimeToApproval: 0,
      totalCount: 0,
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
    
    const interval = req.query.interval || 'day';
    console.log(`Using interval: ${interval}`);
    
    // Parse date parameters with proper format conversion
    const { startDate, endDate } = req.query;
    
    // SQL query parameters
    let sqlParams = [];
    let dateFilter = '';
    
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
    
    // Build the timeline stats query based on the interval
    let groupByClause;
    let dateFormat;
    
    switch (interval) {
      case 'day':
        groupByClause = "CAST(referat_godkendt_at AS DATE)";
        dateFormat = "CAST(referat_godkendt_at AS DATE)";
        break;
      case 'week':
        groupByClause = "DATEPART(YEAR, referat_godkendt_at), DATEPART(WEEK, referat_godkendt_at)";
        dateFormat = "DATEADD(DAY, 1-DATEPART(WEEKDAY, referat_godkendt_at), CAST(referat_godkendt_at AS DATE))";
        break;
      case 'month':
        groupByClause = "DATEPART(YEAR, referat_godkendt_at), DATEPART(MONTH, referat_godkendt_at)";
        dateFormat = "DATEFROMPARTS(DATEPART(YEAR, referat_godkendt_at), DATEPART(MONTH, referat_godkendt_at), 1)";
        break;
      case 'quarter':
        groupByClause = "DATEPART(YEAR, referat_godkendt_at), DATEPART(QUARTER, referat_godkendt_at)";
        dateFormat = "DATEFROMPARTS(DATEPART(YEAR, referat_godkendt_at), 1 + ((DATEPART(QUARTER, referat_godkendt_at) - 1) * 3), 1)";
        break;
      case 'year':
        groupByClause = "DATEPART(YEAR, referat_godkendt_at)";
        dateFormat = "DATEFROMPARTS(DATEPART(YEAR, referat_godkendt_at), 1, 1)";
        break;
      default:
        groupByClause = "CAST(referat_godkendt_at AS DATE)";
        dateFormat = "CAST(referat_godkendt_at AS DATE)";
    }
    
    const query = `
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
          END), 0) as avg_time_to_approval,
          -- Simple section change counts based on LIKE patterns
          SUM(CASE
            WHEN referat LIKE '%Vi har aftalt%' AND ai_referat LIKE '%Vi har aftalt%' AND referat <> ai_referat
            THEN 1 ELSE 0
          END) as viHarAftalt,
          SUM(CASE
            WHEN referat LIKE '%Vi har i dag talt om%' AND ai_referat LIKE '%Vi har i dag talt om%' AND referat <> ai_referat
            THEN 1 ELSE 0
          END) as viHarIDagTaltOm,
          SUM(CASE
            WHEN referat LIKE '%Din jobsøgning indtil nu%' AND ai_referat LIKE '%Din jobsøgning indtil nu%' AND referat <> ai_referat
            THEN 1 ELSE 0
          END) as dinJobsogningIndtilNu,
          SUM(CASE
            WHEN (referat LIKE '%Vi har aftalt%' AND ai_referat LIKE '%Vi har aftalt%' AND referat = ai_referat)
            OR (referat LIKE '%Vi har i dag talt om%' AND ai_referat LIKE '%Vi har i dag talt om%' AND referat = ai_referat)
            OR (referat LIKE '%Din jobsøgning indtil nu%' AND ai_referat LIKE '%Din jobsøgning indtil nu%' AND referat = ai_referat)
            THEN 1 ELSE 0
          END) as uaendredeSektioner
        FROM ai_statistik WITH (NOLOCK)
        WHERE referat_godkendt_at IS NOT NULL ${dateFilter}
        GROUP BY ${groupByClause}
      )
      SELECT
        CONVERT(VARCHAR(10), date, 120) as date,
        total_count as totalCount,
        positive_feedback as positiveFeedback,
        negative_feedback as negativeFeedback,
        avg_time_to_ai_report as avgTimeToAiReport,
        avg_time_to_approval as avgTimeToApproval,
        viHarAftalt,
        viHarIDagTaltOm,
        dinJobsogningIndtilNu,
        uaendredeSektioner
      FROM DailyStats
      ORDER BY date
    `;
    
    console.log('Executing timeline stats query:', query);
    console.log('With parameters:', sqlParams);
    
    // Execute the query
    const request = pool.request();
    
    // Add parameters to the request
    sqlParams.forEach(param => {
      request.input(param.name, param.type, param.value);
    });
    
    const result = await request.query(query);
    console.log(`Found ${result.recordset.length} timeline records`);
    
    // Send the results
    res.json(result.recordset);
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
        samtyp_type as id,
        samtyp_type as name
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
          dateFilter = "CAST(referat_godkendt_at AS DATE) = @date";
          sqlParams.push({ name: 'date', type: sql.Date, value: formattedDate });
          console.log('Filtering by specific date:', formattedDate);
        }
      } else {
        // Otherwise use date range (startDate and endDate)
        const formattedStartDate = formatDateForSQL(startDate);
        const formattedEndDate = formatDateForSQL(endDate);
        
        if (formattedStartDate && formattedEndDate) {
          dateFilter = "CAST(referat_godkendt_at AS DATE) BETWEEN @startDate AND @endDate";
          sqlParams.push({ name: 'startDate', type: sql.Date, value: formattedStartDate });
          sqlParams.push({ name: 'endDate', type: sql.Date, value: formattedEndDate });
          console.log('Filtering by date range:', formattedStartDate, 'to', formattedEndDate);
        } else if (formattedStartDate) {
          dateFilter = "CAST(referat_godkendt_at AS DATE) >= @startDate";
          sqlParams.push({ name: 'startDate', type: sql.Date, value: formattedStartDate });
          console.log('Filtering by start date:', formattedStartDate);
        } else if (formattedEndDate) {
          dateFilter = "CAST(referat_godkendt_at AS DATE) <= @endDate";
          sqlParams.push({ name: 'endDate', type: sql.Date, value: formattedEndDate });
          console.log('Filtering by end date:', formattedEndDate);
        }
      }
    }
    
    // Add type filter if present
    let typeFilter = '';
    if (type) {
      typeFilter = "samtyp_type = @type";
      sqlParams.push({ name: 'type', type: sql.VarChar, value: type });
      console.log('Filtering by type:', type);
    }
    
    // Build the WHERE clause
    let whereClause = "WHERE referat_godkendt_at IS NOT NULL";
    if (dateFilter) {
      whereClause += ` AND ${dateFilter}`;
    }
    if (typeFilter) {
      whereClause += ` AND ${typeFilter}`;
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