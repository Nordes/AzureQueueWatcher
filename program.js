'use strict'

const azureQueueWatcher = require('./modules/azureQueueWatcher');
const nconf = require('nconf');

nconf.env().file({ file: 'config.json', search: true, format: require('hjson') }).argv();
const jobSettings = nconf.get('jobSettings');
const watchSettings = nconf.get('watchSettings');

console.log('Starting...');
const aqw = azureQueueWatcher(jobSettings);

if (!nconf.get('clean')) {
  console.log('-> Initializing all the watch')
  watchSettings.forEach(function (settings, index, allSettings) {
    aqw.start(settings);
  });

  console.log('-> All ready to go...');
}
else {
  console.log('-> Cleaning the logs')
  aqw.clean();
}
