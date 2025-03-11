# AiTranskipering

A React application for AI-assisted transcription and summarization of conversations with a dashboard for statistics and analytics.

## Features

- Dashboard with various statistics charts
- Conversation summary view
- Filtering capabilities
- Section change tracking
- Feedback analysis

## Tech Stack

- Frontend: React, Recharts, TailwindCSS
- Backend: Node.js, Express
- Database: SQL Server

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- SQL Server database

### Installation

1. Clone the repository
```bash
git clone https://github.com/carstengissel/AiTranskipering.git
cd AiTranskipering
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
DB_SERVER=your_db_server
DB_DATABASE=your_database
DB_USER=your_username
DB_PASSWORD=your_password
```

4. Start the development server
```bash
npm run run:app
```

This will start both the backend server on port 3002 and the frontend on port 83.

## Scripts

- `npm run start` - Start the React frontend
- `npm run server` - Start the backend server
- `npm run run:app` - Start both frontend and backend
- `npm run build` - Build the React app for production
- `npm run build:iis` - Build for IIS deployment

## Project Structure

- `/src` - React frontend code
  - `/components` - React components
  - `/context` - React context providers
  - `/services` - API services
  - `/utils` - Utility functions
- `/backend` - Node.js backend code
  - `/sql` - SQL queries and database functions
- `/deployment` - Deployment configuration
- `/python` - Python scripts for text comparison

## License

This project is private and not licensed for public use.