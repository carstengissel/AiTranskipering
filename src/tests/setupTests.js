// Mock axios
jest.mock('axios');

// Configure axios mock
const axios = require('axios');

// Sample data for mocking API responses
const mockReferatData = {
  referat: `Vi har aftalt:
- Point A
- Point B
Vi har i dag talt om:
- Topic X
- Topic Y
Din jobsøgning indtil nu:
- Progress A
- Progress B`,
  aiReferat: `Vi har aftalt:
- Point A
- Point C
Vi har i dag talt om:
- Topic X
Din jobsøgning indtil nu:
- Progress A
- Progress C`
};

// Setup default axios mock responses
axios.get.mockImplementation((url) => {
  switch (url) {
    case '/api/samind_referat':
      return Promise.resolve({ data: [mockReferatData] });
    default:
      return Promise.reject(new Error('Not found'));
  }
});
