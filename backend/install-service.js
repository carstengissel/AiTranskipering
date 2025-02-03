var Service = require('node-windows').Service;

var svc = new Service({
  name: 'YourAppName',
  description: 'The nodejs server for your application.',
  script: 'C:\\node-apps\\your-app-name\\server.js'
});

svc.on('install', function() {
  svc.start();
});

svc.install();
