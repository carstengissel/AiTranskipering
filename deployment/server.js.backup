require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const path = require('path');

const app = express();

// Force development mode
process.env.NODE_ENV = 'development';

// Debug environment variables
console.log('Environment variables:', {
    NODE_ENV: process.env.NODE_ENV,
    DB_USER: process.env.DB_USER,
    DB_SERVER: process.env.DB_SERVER,
    DB_NAME: process.env.DB_NAME,
    DEV_FRONTEND_PORT: process.env.DEV_FRONTEND_PORT,
    DEV_FRONTEND_PORT_ALT: process.env.DEV_FRONTEND_PORT_ALT,
    PORT: process.env.PORT
});

// Configure CORS based on environment
const isDevelopment = process.env.NODE_ENV === 'development';
const corsOrigins = isDevelopment 
    ? [
        'http://localhost:83',
        'http://localhost:3002',
        'http://localhost:3000',
        'http://localhost:3003'
      ]
    : [process.env.PROD_URL];

console.log(`Running in ${isDevelopment ? 'development' : 'production'} mode`);
console.log('CORS origins:', corsOrigins);

app.use(cors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'build')));

// Database configuration from environment variables
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

console.log('Database config:', {
    ...config,
    password: '***' // Hide password in logs
});

async function connectToDatabase() {
    try {
        await sql.connect(config);
        console.log('Connected to the database');
    } catch (err) {
        console.error('Error connecting to the database:', err);
        throw err; // Re-throw to prevent server from starting if DB connection fails
    }
}

// Helper function to parse and format date for SQL
function formatDateForSQL(dateString) {
    try {
        console.log('Formatting date input:', dateString);
       
        // Handle DD.MM.YYYY format (European format)
        if (typeof dateString === 'string' && dateString.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
            // Example: input "04.11.2024" should become "2024-11-04"
            const parts = dateString.split('.');
            const day = parts[0];    // "04"
            const month = parts[1];  // "11"
            const year = parts[2];   // "2024"
            
            // For European format DD.MM.YYYY to SQL YYYY-MM-DD
            const formatted = `${year}-${month}-${day}`;
            
            console.log('Input date:', dateString, '(DD.MM.YYYY)');
            console.log('Parsed parts:', { day, month, year });
            console.log('Final SQL date:', formatted, '(YYYY-MM-DD)');
            
            return formatted;
        }

        // If already in YYYY-MM-DD format, return as is
        if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return dateString;
        }

        console.error('Could not parse date:', dateString);
        return null;
    } catch (err) {
        console.error('Error formatting date:', err);
        return null;
    }
}

// Helper function to get section filter condition
function getSectionFilterCondition(section) {
    const sectionPatterns = {
        viHarAftalt: '%Vi har aftalt%',
        viHarIDagTaltOm: '%Vi har i dag talt om%',
        dinJobsogningIndtilNu: '%Din jobsøgning indtil nu%'
    };

    return sectionPatterns[section] || null;
}

// Helper function to build date filter condition
function buildDateFilterCondition(date, type = 'exact', field = 'sr.reg_tid') {
    // If no date is provided, return null (no filter)
    if (!date) {
        console.log('No date provided for filter condition');
        return null;
    }

    console.log('Building date filter condition - Input:', { date, type, field });
    const formattedDate = formatDateForSQL(date);
    if (!formattedDate) return null;

    // Add debug logging
    console.log(`Building date filter condition - Date: ${date}, Type: ${type}, Formatted: ${formattedDate}, Field: ${field}`);

    let condition;
    switch (type) {
        case 'start':
            condition = `cast(${field} as date) >= '${formattedDate}'`;
            break;
        case 'end':
            condition = `cast(${field} as date) <= '${formattedDate}'`;
            break;
        case 'exact':
        default:
            condition = `cast(${field} as date) = '${formattedDate}'`;
            break;
    }

    console.log('Generated SQL condition:', condition);
    return condition;
}

// Endpoint to get data from samind_referat
app.get('/api/samind_referat', async (req, res) => {
    try {
        const { startDate, endDate, type } = req.query;
        console.log('Raw request query parameters:', req.query);
        console.log('Fetching samind_referat data...', { startDate, endDate, type });
        const whereConditions = [];
        
        if (startDate) {
            const dateCondition = buildDateFilterCondition(startDate, 'start', 'sr.reg_tid');
            if (dateCondition) {
                whereConditions.push(dateCondition);
            }
        }
        if (endDate) {
            const dateCondition = buildDateFilterCondition(endDate, 'end', 'sr.reg_tid');
            if (dateCondition) {
                whereConditions.push(dateCondition);
            }
        }
        if (type && type !== 'all') {
            whereConditions.push(`si.samtyp_type = '${type}'`);
        }

        const whereClause = whereConditions.length > 0 
            ? `WHERE ${whereConditions.join(' AND ')}` 
            : '';

        // Log query parameters
        console.log('Query parameters:', {
            startDate: startDate ? formatDateForSQL(startDate) : 'null',
            endDate: endDate ? formatDateForSQL(endDate) : 'null',
            whereClause: whereClause || 'none'
        });

        const query = `
            SELECT DISTINCT
                sr.*,
                sar.referat as aiReferat,
                sar.feedback,
                sar.feedback_beskrivelse,
                sar.regenerer_dato,
                si.samtyp_type,
                st.ledetekst,
                m.cpr_nr,
                DATEDIFF(MINUTE, si.samtale_dato, sar.reg_tid) as tid_fra_transskription_til_ai_referat,
                
                DATEDIFF(MINUTE, si.samtale_dato, sar.reg_tid) as tid_til_ai_referat,
                DATEDIFF(MINUTE, sar.reg_tid, sr.reg_tid) as tid_til_godkendelse
            FROM samind_referat sr WITH (NOLOCK)
            INNER JOIN samtale_indkaldelse si WITH (NOLOCK)
                ON sr.medl_ident = si.medl_ident 
                AND sr.samind_lbnr = si.lbnr
            INNER JOIN samind_ai_referat sar WITH (NOLOCK)
                ON sr.medl_ident = sar.medl_ident 
                AND sr.samind_lbnr = sar.samind_lbnr
            INNER JOIN samtaletype st WITH (NOLOCK)
                ON si.samtyp_type = st.type
            INNER JOIN medlem m WITH (NOLOCK)
                ON sr.medl_ident = m.ident
            ${whereClause}
            ORDER BY sr.reg_tid DESC`;

        console.log('Executing query:', query);
        const request = new sql.Request();
        const result = await request.query(query);
        console.log(`Fetched ${result.recordset.length} records from samind_referat`);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching data from samind_referat:', err);
        res.status(500).json({ error: 'An error occurred while fetching data' });
    }
});

// Endpoint to get data from samind_ai_referat
app.get('/api/samind_ai_referat', async (req, res) => {
    try {
        const { startDate, endDate, type } = req.query;
        console.log('Raw request query parameters:', req.query);
        console.log('Fetching samind_ai_referat data...', { startDate, endDate, type });
        const whereConditions = [];
        
        if (startDate) {
            const dateCondition = buildDateFilterCondition(startDate, 'start', 'sar.reg_tid');
            if (dateCondition) {
                whereConditions.push(dateCondition);
            }
        }
        if (endDate) {
            const dateCondition = buildDateFilterCondition(endDate, 'end', 'sar.reg_tid');
            if (dateCondition) {
                whereConditions.push(dateCondition);
            }
        }
        if (type && type !== 'all') {
            whereConditions.push(`si.samtyp_type = '${type}'`);
        }

        const whereClause = whereConditions.length > 0 
            ? `WHERE ${whereConditions.join(' AND ')}` 
            : '';

        const query = `
            SELECT 
                sar.*,
                si.samtyp_type,
                st.ledetekst,
                m.cpr_nr,
                DATEDIFF(MINUTE, si.samtale_dato, sar.reg_tid) as tid_fra_transskription_til_ai_referat,
                DATEDIFF(MINUTE, si.samtale_dato, sar.reg_tid) as tid_til_ai_referat,
                DATEDIFF(MINUTE, sar.reg_tid, sr.reg_tid) as tid_til_godkendelse
            FROM samind_referat sr WITH (NOLOCK)
            INNER JOIN samind_ai_referat sar WITH (NOLOCK)
                ON sr.medl_ident = sar.medl_ident 
                AND sr.samind_lbnr = sar.samind_lbnr
            INNER JOIN samtale_indkaldelse si WITH (NOLOCK)
                ON sr.medl_ident = si.medl_ident 
                AND sr.samind_lbnr = si.lbnr
            INNER JOIN samtaletype st WITH (NOLOCK)
                ON si.samtyp_type = st.type
            INNER JOIN medlem m WITH (NOLOCK)
                ON sar.medl_ident = m.ident
            ${whereClause}
            ORDER BY sar.reg_tid DESC`;

        console.log('Executing query:', query);
        const request = new sql.Request();
        const result = await request.query(query);
        console.log(`Fetched ${result.recordset.length} records from samind_ai_referat`);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching data from samind_ai_referat:', err);
        res.status(500).json({ error: 'An error occurred while fetching data' });
    }
});

// Endpoint to get samtaletyper
app.get('/api/samtaletyper', async (req, res) => {
    try {
        console.log('Fetching samtaletyper...');
        const result = await sql.query`
            SELECT DISTINCT 
                si.samtyp_type,
                st.ledetekst
            FROM samind_ai_referat sar
            INNER JOIN samtale_indkaldelse si 
                ON sar.medl_ident = si.medl_ident 
                AND sar.samind_lbnr = si.lbnr
            INNER JOIN samtaletype st 
                ON si.samtyp_type = st.type
            ORDER BY st.ledetekst
        `;
        console.log(`Fetched ${result.recordset.length} distinct conversation types`);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching conversation types:', err);
        res.status(500).json({ error: 'An error occurred while fetching conversation types' });
    }
});

// Catch-all handler
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
});

// Use PORT from environment variable, defaulting to 3002
const PORT = process.env.PORT || 3002;

connectToDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`Frontend should be running on port 83`);
    });
}).catch(err => {
    console.error('Failed to start server due to database connection error:', err);
    process.exit(1);
});
