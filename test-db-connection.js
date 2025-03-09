const sql = require('mssql');

async function testConnection() {
    const config = {
        user: 'fiksliste',
        password: 'Fiksliste2',
        server: 'prd-bi2',
        database: 'Fiksanalysedb',
        options: {
            encrypt: false,
            trustServerCertificate: true,
            enableArithAbort: true,
            connectionTimeout: 30000
        }
    };

    console.log('Testing connection with config:', {
        ...config,
        password: '***'
    });

    try {
        console.log('\nAttempting to connect...');
        const pool = await sql.connect(config);
        console.log('Successfully connected to database!');

        // Test query permissions
        console.log('\nTesting database access...');
        const result = await pool.request().query('SELECT TOP 1 * FROM ai_statistik');
        console.log('Successfully queried ai_statistik table!');
        if (result.recordset.length > 0) {
            console.log('Sample record found:', {
                id: result.recordset[0].id,
                referat_godkendt_at: result.recordset[0].referat_godkendt_at
            });
        }

        await sql.close();
        console.log('\nConnection test completed successfully');
        return true;
    } catch (err) {
        console.error('\nConnection test failed:', err);
        if (err.originalError) {
            console.error('Original error:', {
                message: err.originalError.message,
                code: err.originalError.code,
                state: err.originalError.state,
                number: err.originalError.number
            });
        }
        return false;
    }
}

testConnection()
    .then(success => {
        if (success) {
            console.log('Database connection test passed!');
            process.exit(0);
        } else {
            console.log('\nPlease verify:');
            console.log('1. SQL Server credentials are correct');
            console.log('2. SQL Server is running and accessible');
            console.log('3. Database exists and is accessible');
            process.exit(1);
        }
    })
    .catch(err => {
        console.error('Unexpected error:', err);
        process.exit(1);
    });