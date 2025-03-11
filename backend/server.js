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
// API endpoint for fetching conversation summaries
app.get('/api/samind_referat', async (req, res) => {
  try {
    if (!pool) await connectToDatabase();
    console.log('Fetching samind_referat with params:', req.query);

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