# AiTranskipering IIS Deployment Guide

This document provides step-by-step instructions for deploying the AiTranskipering application to Internet Information Services (IIS).

## Prerequisites

Before deploying, ensure you have the following installed on your IIS server:

1. **Node.js** - Latest LTS version recommended
2. **iisnode** - For running Node.js applications in IIS
3. **URL Rewrite Module** - For handling client-side routing
4. **IIS Manager** - For configuring the application in IIS

## Deployment Steps

### 1. Build the Application

From the root directory of your project, run:

```
npm run build:iis
```

This command will:
- Build the React frontend application
- Create a `deployment` folder with all necessary files
- Copy the backend files to the deployment folder
- Create a minimal package.json with only the required dependencies

### 2. Copy Files to IIS Server

Copy the entire contents of the `deployment` folder to your IIS server.

### 3. Configure IIS

1. Open **IIS Manager**
2. Create two applications:

   a. **AiTranskipering_backend**:
   - Create a new application under your desired site
   - Set the alias to `AiTranskipering_backend`
   - Set the physical path to the root of the copied deployment folder
   - Set the application pool to use "No Managed Code"

   b. **AiTranskipering_frontend**:
   - Create a new application under your desired site
   - Set the alias to `AiTranskipering_frontend`
   - Set the physical path to the `build` folder inside the deployment folder

### 4. Install Dependencies

1. Open a command prompt with administrator privileges
2. Navigate to the deployment folder on your IIS server
3. Run `npm install` to install the required dependencies

### 5. Configure Application Pool

1. In IIS Manager, select the application pool used by AiTranskipering_backend
2. Right-click and select "Advanced Settings"
3. Set "Enable 32-Bit Applications" to `True`
4. Set "Managed Pipeline Mode" to `Integrated`
5. Set ".NET CLR Version" to `No Managed Code`

### 6. Verify Configuration

1. Check that the `web.config` file exists in the root of the deployment folder
2. Ensure the web.config has the correct handlers and rewrite rules for Node.js applications
3. Verify that the `server.js` file is configured to serve static files from the `build` folder

### 7. Test the Application

1. Open a web browser and navigate to your IIS site
2. Verify that the frontend is loading correctly
3. Test API endpoints to ensure the backend is functioning properly

## Troubleshooting

If you encounter issues during deployment:

1. **Check IIS logs** - Located in `%SystemDrive%\inetpub\logs\LogFiles`
2. **Check Node.js console output** - Enable logging in iisnode by modifying the web.config
3. **Verify file permissions** - Ensure the IIS user has read/write access to the application folders
4. **Check Node.js version** - Make sure the server has the correct version of Node.js installed

## Running Locally

To run the application locally:

1. Open a terminal in the root directory of your project
2. Install the dependencies if you haven't already:
   ```
   npm install
   ```
3. Run the following command to start both the frontend and backend concurrently:
   ```
   npm run dev
   ```

This command will:
- Start the React development server for the frontend, typically on http://localhost:83
- Start the backend server, typically on http://localhost:3002

You can now access the application by opening a web browser and navigating to http://localhost:83.

If you need to run the frontend and backend separately:

- To run only the frontend:
  ```
  npm start
  ```
- To run only the backend:
  ```
  cd backend && node server.js
  ```
