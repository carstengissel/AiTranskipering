const sql = require('mssql');
require('dotenv').config({ path: require('path').join(__dirname, '../../backend/.env') });

// Helper function to format date for SQL
function formatDateForSQL(dateString) {
    if (typeof dateString === 'string' && dateString.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
        const parts = dateString.split('.');
        return `${parts[2]}-${parts[1]}-${parts[0]}`; // Convert DD.MM.YYYY to YYYY-MM-DD
    }
    return dateString;
}

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || '',
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

console.log('Database config:', {
    user: config.user,
    server: config.server,
    database: config.database
});

async function getTestReferat(date = '25.11.2024', medlIdent = '1000418733') {
    try {
        await sql.connect(config);
        const formattedDate = formatDateForSQL(date);
        console.log(`Fetching referats for date: ${formattedDate} and medl_ident: ${medlIdent}`);
        
        const query = `
            SELECT TOP 10
                sr.referat,
                sar.referat as aiReferat,
                sr.reg_tid,
                sar.reg_tid as ai_reg_tid,
                sr.medl_ident,
                sr.samind_lbnr
            FROM samind_referat sr WITH (NOLOCK)
            INNER JOIN samind_ai_referat sar WITH (NOLOCK)
                ON sr.medl_ident = sar.medl_ident 
                AND sr.samind_lbnr = sar.samind_lbnr
            WHERE CAST(sr.reg_tid AS DATE) = '${formattedDate}'
            AND sr.medl_ident = '${medlIdent}'
            ORDER BY sr.reg_tid DESC`;
        
        const result = await sql.query(query);
        console.log(`Found ${result.recordset.length} referats for date ${formattedDate} and medl_ident ${medlIdent}`);
        
        if (result.recordset.length === 0) {
            // If no results for exact date, try getting the closest date
            const alternativeQuery = `
                SELECT TOP 10
                    sr.referat,
                    sar.referat as aiReferat,
                    sr.reg_tid,
                    sar.reg_tid as ai_reg_tid,
                    sr.medl_ident,
                    sr.samind_lbnr
                FROM samind_referat sr WITH (NOLOCK)
                INNER JOIN samind_ai_referat sar WITH (NOLOCK)
                    ON sr.medl_ident = sar.medl_ident 
                    AND sr.samind_lbnr = sar.samind_lbnr
                WHERE CAST(sr.reg_tid AS DATE) <= '${formattedDate}'
                AND sr.medl_ident = '${medlIdent}'
                ORDER BY sr.reg_tid DESC`;
            
            const alternativeResult = await sql.query(alternativeQuery);
            console.log(`Found ${alternativeResult.recordset.length} referats from closest date for medl_ident ${medlIdent}`);
            return alternativeResult.recordset[0];
        }
        
        return result.recordset[0];
    } catch (err) {
        console.error('Database error:', err);
        throw err;
    } finally {
        await sql.close();
    }
}

module.exports = { getTestReferat };
