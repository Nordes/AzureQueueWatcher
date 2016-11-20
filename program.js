'use strict'
const azureQueueWatcher = require('./modules/azureQueueWatcher');
const nconf = require('nconf');

nconf.env().file({ file: 'config.json', search: true, format: require('hjson') }).argv();
const jobSettings = nconf.get('jobSettings');
const watchSettings = nconf.get('watchSettings');

console.log('Starting...');
const aqw = azureQueueWatcher(jobSettings);

if (nconf.get('clean')) {
  console.log('-> Cleaning the logs')
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
  console.log('-> Initializing all the watch')
  watchSettings.forEach(function (settings, index, allSettings) {
    aqw.start(settings);
  });

  console.log('-> All ready to go...');
}
