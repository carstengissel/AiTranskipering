const fs = require('fs-extra');
const path = require('path');

// Function to ensure directory exists
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Function to copy files with overwrite
const copyFiles = (src, dest) => {
  try {
    fs.copySync(src, dest, { overwrite: true });
    console.log(`Successfully copied ${src} to ${dest}`);
  } catch (err) {
    console.error(`Error copying ${src} to ${dest}:`, err);
    process.exit(1);
  }
};

// Main build function
const buildForIIS = () => {
  const deploymentDir = path.join(__dirname, 'deployment');
  const buildDir = path.join(deploymentDir, 'build');
  
  console.log('Starting IIS build process...');

  // Clean deployment directory if it exists
  if (fs.existsSync(deploymentDir)) {
    fs.removeSync(deploymentDir);
    console.log('Cleaned existing deployment directory');
  }

  // Create deployment directory
  ensureDir(deploymentDir);
  console.log('Created deployment directory');

  // Copy build folder
  copyFiles(
    path.join(__dirname, 'build'),
    buildDir
  );

  // Copy backend files
  copyFiles(
    path.join(__dirname, 'backend', 'server.js'),
    path.join(deploymentDir, 'server.js')
  );

  // Copy web.config
  copyFiles(
    path.join(__dirname, 'backend', 'web.config'),
    path.join(deploymentDir, 'web.config')
  );

  // Copy package files
  const packageJson = require('./package.json');
  
  // Create a minimal package.json for deployment
  const deployPackageJson = {
    name: packageJson.name,
    version: packageJson.version,
    private: true,
    dependencies: {
      express: packageJson.dependencies.express,
      cors: packageJson.dependencies.cors,
      mssql: packageJson.devDependencies.mssql,
      dotenv: packageJson.dependencies.dotenv
    }
  };

  fs.writeFileSync(
    path.join(deploymentDir, 'package.json'),
    JSON.stringify(deployPackageJson, null, 2)
  );
  console.log('Created deployment package.json');

  console.log('IIS build process completed successfully!');
  console.log('\nTo deploy:');
  console.log('1. Copy the contents of the "deployment" folder to your IIS server');
  console.log('2. Create two IIS applications:');
  console.log('   - AiTranskipering_backend: Point to the root of the deployment folder');
  console.log('   - AiTranskipering_frontend: Point to the "build" folder inside the deployment folder');
  console.log('3. Ensure Node.js and iisnode module are installed on the server');
  console.log('4. Set the backend application pool to "No Managed Code"');
};

// Run the build process
buildForIIS();
