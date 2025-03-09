const axios = require('axios');

async function testDate(date, expectedViHarAftalt, expectedViHarIDagTaltOm, expectedDinJobsogningIndtilNu) {
    try {
        const response = await axios.get('http://localhost:3002/api/timeline-stats', {
            params: {
                startDate: date,
                endDate: date
            }
        });

        if (!response.data || !response.data[0]) {
            console.log(`No data found for ${date}`);
            return false;
        }

        const data = response.data[0];
        console.log(`\nResults for ${date}:`);
        console.log('- "Vi har aftalt":', data.viHarAftalt, '(Expected:', expectedViHarAftalt, ')');
        console.log('- "Vi har i dag talt om":', data.viHarIDagTaltOm, '(Expected:', expectedViHarIDagTaltOm, ')');
        console.log('- "Din jobsøgning indtil nu":', data.dinJobsogningIndtilNu, '(Expected:', expectedDinJobsogningIndtilNu, ')');

        const success = 
            data.viHarAftalt === expectedViHarAftalt && 
            data.viHarIDagTaltOm === expectedViHarIDagTaltOm && 
            data.dinJobsogningIndtilNu === expectedDinJobsogningIndtilNu;

        console.log('Test result:', success ? 'PASSED ✓' : 'FAILED ✗');
        return success;

    } catch (error) {
        console.error('Error testing section changes:', error.response?.data || error.message);
        return false;
    }
}

async function runTests() {
    try {
        console.log('Testing section changes calculation...\n');

        let allTestsPassed = true;

        // Test February 6, 2025
        console.log('Testing Feb 6, 2025:');
        allTestsPassed &= await testDate('2025-02-06', 2, 3, 1);

        // Test February 10, 2025
        console.log('\nTesting Feb 10, 2025:');
        allTestsPassed &= await testDate('2025-02-10', 5, 5, 2);

        // Test December 17, 2024
        console.log('\nTesting Dec 17, 2024:');
        const dec17Success = await testDate('2024-12-17', 4, 12, 8);
        allTestsPassed &= dec17Success;

        console.log('\nAll tests completed. Final result:', allTestsPassed ? 'PASSED ✓' : 'FAILED ✗');

    } catch (error) {
        console.error('Error running tests:', error);
        process.exit(1);
    }
}

// Run the tests
runTests();