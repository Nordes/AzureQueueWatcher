'use strict'
const azureQueueWatcher = require('./modules/azureQueueWatcher');
const nconf = require('nconf');
const winston = require('winston');

console.log("Loading configuration file (config.json)...")
nconf.env().file({ file: 'config.json', search: true, format: require('hjson') }).argv();
const jobSettings = nconf.get('jobSettings');
const watchSettings = nconf.get('watchSettings');

winston.level = jobSettings.traceLevel;
console.log('Starting...');
const aqw = azureQueueWatcher(jobSettings);

if (nconf.get('clean')) {
  winston.info('Cleaning the logs')
  aqw.clean();
} else if (nconf.get('install-svc')) {
  // Todo: look to install as a service : http://stackoverflow.com/questions/10547974/how-to-install-node-js-as-windows-service
  switch (nconf.get('install-svc')) {
    case 'windows':
      throw new Error("Not implemented");
    // break;
    case 'linux':
      throw new Error("Not implemented");
    // break;
    default:
      throw new Error("Unsupported configuration");
  }
} else {
  winston.info('Initializing all the watch')
  watchSettings.forEach(function (settings, index, allSettings) {
    aqw.start(settings);
  });

  console.log('Started');
}
