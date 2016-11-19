'use strict'

const azureQueueWatcher = require('./modules/azureQueueWatcher');
const nconf = require('nconf');

nconf.env().file({ file: 'config.json', search: true, format: require('hjson') }).argv();
const jobSettings = nconf.get('jobSettings');
const watchSettings = nconf.get('watchSettings');

const aqw = azureQueueWatcher(jobSettings);

if (!nconf.get('clean')) {
  watchSettings.forEach(function (settings, index, allSettings) {
    aqw.start(settings);
  });
}
else {
  aqw.clean();
}

process.exit;