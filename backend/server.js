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

// Helper function to build date filter condition
function buildDateFilterCondition(date, type = 'exact', field = 'ai_referat_recieved_at') {
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

// Endpoint to get data from ai_statistik (tidligere samtale_transcription_statisics)
app.get('/api/samind_referat', async (req, res) => {
    try {
        const { startDate, endDate, type } = req.query;
        console.log('Raw request query parameters:', req.query);
        console.log('Fetching samtale data...', { startDate, endDate, type });
        const whereConditions = [];
        
        if (startDate) {
            const dateCondition = buildDateFilterCondition(startDate, 'start', 'referat_godkendt_at');
            if (dateCondition) {
                whereConditions.push(dateCondition);
            }
        }
        if (endDate) {
            const dateCondition = buildDateFilterCondition(endDate, 'end', 'referat_godkendt_at');
            if (dateCondition) {
                whereConditions.push(dateCondition);
            }
        }
        if (type && type !== 'all') {
            whereConditions.push(`samtyp_type = '${type}'`);
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
            SELECT 
                referat,
                ai_referat as aiReferat,
                feedback,
                feedback_tekst as feedbackTekst,
                samtyp_type,
                regenerated,
                DATEDIFF(MINUTE, transcription_recieved_at, ai_referat_recieved_at) as tid_fra_transskription_til_ai_referat,
                DATEDIFF(MINUTE, transcription_recieved_at, referat_godkendt_at) as tid_til_godkendelse,
                transcription_recieved_at,
                ai_referat_recieved_at,
                referat_started_at,
                referat_godkendt_at
            FROM ai_statistik WITH (NOLOCK)
            ${whereClause}
            ORDER BY referat_godkendt_at DESC`;

        console.log('Executing query:', query);
        const request = new sql.Request();
        const result = await request.query(query);
        console.log(`Fetched ${result.recordset.length} records from ai_statistik`);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching data:', err);
        res.status(500).json({ error: 'An error occurred while fetching data' });
    }
});

// Endpoint to get AI referat data
app.get('/api/samind_ai_referat', async (req, res) => {
    try {
        const { startDate, endDate, type } = req.query;
        console.log('Raw request query parameters:', req.query);
        console.log('Fetching AI referat data...', { startDate, endDate, type });
        const whereConditions = [];
        
        if (startDate) {
            const dateCondition = buildDateFilterCondition(startDate, 'start', 'ai_referat_recieved_at');
            if (dateCondition) {
                whereConditions.push(dateCondition);
            }
        }
        if (endDate) {
            const dateCondition = buildDateFilterCondition(endDate, 'end', 'ai_referat_recieved_at');
            if (dateCondition) {
                whereConditions.push(dateCondition);
            }
        }
        if (type && type !== 'all') {
            whereConditions.push(`samtyp_type = '${type}'`);
        }

        const whereClause = whereConditions.length > 0 
            ? `WHERE ${whereConditions.join(' AND ')}` 
            : '';

        const query = `
            SELECT 
                ai_referat,
                samtyp_type,
                feedback,
                feedback_tekst as feedbackTekst,
                regenerated,
                DATEDIFF(MINUTE, transcription_recieved_at, ai_referat_recieved_at) as tid_fra_transskription_til_ai_referat,
                DATEDIFF(MINUTE, ai_referat_recieved_at, referat_godkendt_at) as tid_til_godkendelse,
                transcription_recieved_at,
                ai_referat_recieved_at,
                referat_started_at,
                referat_godkendt_at
            FROM ai_statistik WITH (NOLOCK)
            ${whereClause}
            ORDER BY ai_referat_recieved_at DESC`;

        console.log('Executing query:', query);
        const request = new sql.Request();
        const result = await request.query(query);
        console.log(`Fetched ${result.recordset.length} records`);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching AI referat data:', err);
        res.status(500).json({ error: 'An error occurred while fetching data' });
    }
});

// Endpoint to get samtaletyper
app.get('/api/samtaletyper', async (req, res) => {
    try {
        console.log('Fetching samtaletyper...');
        const result = await sql.query`
            SELECT DISTINCT 
                samtyp_type
            FROM ai_statistik WITH (NOLOCK)
            WHERE samtyp_type IS NOT NULL
            ORDER BY samtyp_type
        `;
        console.log(`Fetched ${result.recordset.length} distinct conversation types`);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching conversation types:', err);
        res.status(500).json({ error: 'An error occurred while fetching conversation types' });
    }
});

// Endpoint to get KPI statistics
app.get('/api/kpi-stats', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        console.log('Fetching KPI statistics...', { startDate, endDate });
        
        const whereConditions = [];
        if (startDate) {
            const dateCondition = buildDateFilterCondition(startDate, 'start', 'referat_godkendt_at');
            if (dateCondition) whereConditions.push(dateCondition);
        }
        if (endDate) {
            const dateCondition = buildDateFilterCondition(endDate, 'end', 'referat_godkendt_at');
            if (dateCondition) whereConditions.push(dateCondition);
        }

        const whereClause = whereConditions.length > 0 
            ? `WHERE ${whereConditions.join(' AND ')}` 
            : '';

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
                    AVG(CASE
                        WHEN referat LIKE '%Vi har aftalt%' AND ai_referat LIKE '%Vi har aftalt%'
                        AND referat != ai_referat
                        THEN 1 ELSE 0
                    END) * 100 as vi_har_aftalt_change_rate,
                    AVG(CASE
                        WHEN referat LIKE '%Vi har i dag talt om%' AND ai_referat LIKE '%Vi har i dag talt om%'
                        AND referat != ai_referat
                        THEN 1 ELSE 0
                    END) * 100 as vi_har_talt_om_change_rate,
                    AVG(CASE
                        WHEN referat LIKE '%Din jobsøgning indtil nu%' AND ai_referat LIKE '%Din jobsøgning indtil nu%'
                        AND referat != ai_referat
                        THEN 1 ELSE 0
                    END) * 100 as jobsogning_change_rate
                FROM ai_statistik WITH (NOLOCK)
                ${whereClause}
            ),
            TopTypesJson AS (
                SELECT 
                    (
                        SELECT TOP 5 
                            samtyp_type,
                            COUNT(*) as count
                        FROM ai_statistik WITH (NOLOCK)
                        WHERE samtyp_type IS NOT NULL 
                        ${whereClause ? 'AND ' + whereConditions.join(' AND ') : ''}
                        GROUP BY samtyp_type
                        ORDER BY count DESC
                        FOR JSON PATH
                    ) as json_data
            )
            SELECT 
                t.*,
                ISNULL(j.json_data, '[]') as top_conversation_types
            FROM TimeStats t
            CROSS JOIN TopTypesJson j
        `;

        console.log('Executing KPI query:', query);
        const request = new sql.Request();
        const result = await request.query(query);
        
        // Format the response
        const stats = result.recordset[0];
        let mostFrequentType = "N/A";
        let topTypes = [];
        
        try {
            if (stats.top_conversation_types) {
                topTypes = JSON.parse(stats.top_conversation_types);
                mostFrequentType = topTypes && topTypes[0] ? topTypes[0].samtyp_type : "N/A";
            }
        } catch (jsonError) {
            console.error('Error parsing top conversation types:', jsonError);
            mostFrequentType = "N/A";
        }

        const response = {
            positiveFeedback: stats.thumbs_up || 0,
            negativeFeedback: stats.thumbs_down || 0,
            avgTimeToAiReport: Math.round(stats.avg_time_to_ai_report || 0),
            avgTimeToApproval: Math.round(stats.avg_time_to_approval || 0),
            totalCount: stats.total_conversations || 0,
            mostFrequentType,
            topTypes,
            viHarAftaltChangeRate: Math.round(stats.vi_har_aftalt_change_rate || 0),
            viHarTaltOmChangeRate: Math.round(stats.vi_har_talt_om_change_rate || 0),
            jobsogningChangeRate: Math.round(stats.jobsogning_change_rate || 0)
        };

        console.log('KPI stats calculated:', response);
        res.json(response);
    } catch (err) {
        console.error('Error fetching KPI statistics:', err);
        res.status(500).json({ error: 'An error occurred while fetching KPI statistics', details: err.message });
    }
});

// Endpoint to get timeline statistics
app.get('/api/timeline-stats', async (req, res) => {
    try {
        const { startDate, endDate, interval = 'day' } = req.query;
        console.log('Fetching timeline statistics...', { startDate, endDate, interval });

        const whereConditions = [];
        if (startDate) {
            const dateCondition = buildDateFilterCondition(startDate, 'start', 'referat_godkendt_at');
            if (dateCondition) whereConditions.push(dateCondition);
        }
        if (endDate) {
            const dateCondition = buildDateFilterCondition(endDate, 'end', 'referat_godkendt_at');
            if (dateCondition) whereConditions.push(dateCondition);
        }

        const whereClause = whereConditions.length > 0 
            ? `WHERE ${whereConditions.join(' AND ')}` 
            : '';

        const query = `
            WITH DailyStats AS (
                SELECT 
                    CAST(referat_godkendt_at AS DATE) as date,
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
                    SUM(CASE
                        WHEN referat LIKE '%Vi har aftalt%' AND ai_referat LIKE '%Vi har aftalt%'
                        AND referat != ai_referat
                        THEN 1 ELSE 0
                    END) as viHarAftalt,
                    SUM(CASE
                        WHEN referat LIKE '%Vi har i dag talt om%' AND ai_referat LIKE '%Vi har i dag talt om%'
                        AND referat != ai_referat
                        THEN 1 ELSE 0
                    END) as viHarIDagTaltOm,
                    SUM(CASE
                        WHEN referat LIKE '%Din jobsøgning indtil nu%' AND ai_referat LIKE '%Din jobsøgning indtil nu%'
                        AND referat != ai_referat
                        THEN 1 ELSE 0
                    END) as dinJobsogningIndtilNu,
                    SUM(CASE
                        WHEN (referat LIKE '%Vi har aftalt%' AND ai_referat LIKE '%Vi har aftalt%' AND referat = ai_referat)
                        OR (referat LIKE '%Vi har i dag talt om%' AND ai_referat LIKE '%Vi har i dag talt om%' AND referat = ai_referat)
                        OR (referat LIKE '%Din jobsøgning indtil nu%' AND ai_referat LIKE '%Din jobsøgning indtil nu%' AND referat = ai_referat)
                        THEN 1 ELSE 0
                    END) as uaendredeSektioner
                FROM ai_statistik WITH (NOLOCK)
                WHERE referat_godkendt_at IS NOT NULL
                ${whereClause ? 'AND ' + whereConditions.join(' AND ') : ''}
                GROUP BY CAST(referat_godkendt_at AS DATE)
            )
            SELECT 
                date,
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

        console.log('Executing timeline query:', query);
        const request = new sql.Request();
        const result = await request.query(query);

        // Log raw results
        console.log('Raw SQL result:', result.recordset);

        // Format the response
        const timelineData = result.recordset.map(row => ({
            date: row.date,
            totalCount: row.totalCount || 0,
            positiveFeedback: row.positiveFeedback || 0,
            negativeFeedback: row.negativeFeedback || 0,
            avgTimeToAiReport: Math.round(row.avgTimeToAiReport || 0),
            avgTimeToApproval: Math.round(row.avgTimeToApproval || 0),
            viHarAftalt: row.viHarAftalt || 0,
            viHarIDagTaltOm: row.viHarIDagTaltOm || 0,
            dinJobsogningIndtilNu: row.dinJobsogningIndtilNu || 0,
            uaendredeSektioner: row.uaendredeSektioner || 0,
            count: row.totalCount || 0
        }));

        console.log(`Timeline stats calculated with ${timelineData.length} data points`);
        console.log('First data point:', timelineData[0]);
        console.log('Last data point:', timelineData[timelineData.length - 1]);

        res.json(timelineData);
    } catch (err) {
        console.error('Error fetching timeline statistics:', err);
        res.status(500).json({ error: 'An error occurred while fetching timeline statistics' });
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
