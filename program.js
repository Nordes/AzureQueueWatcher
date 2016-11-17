'use strict'
// Documentation:
//    https://docs.microsoft.com/en-us/azure/storage/storage-nodejs-how-to-use-queues
const azureStorage = require('azure-storage');
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const logs = require('./modules/logs.js');
const uuid = require('node-uuid');
const nconf = require('nconf');

nconf.env().file({ file: 'config.json', search: true }).argv();

var program = {
  queueSvc: null,

  clean: function () {
    // Clean the log files
    var logFolder = nconf.get('jobLogFolder');
    glob(`${logFolder}**/*.log`, function (err, files) {
      if (err) {
        throw err;
      }

      files.forEach(function (file, index) {
        fs.unlink(file, () => {
          if (err) {
            throw err;
          }
          console.log(`File ${file} have been deleted`);
        });
      });
    });
  },

  watch: function (iteration) {
    if (iteration > nconf.get('watchNumberOfExecution') && nconf.get('watchIndefinite') === false) {
      clearInterval(programTimerId);

      return;
    }

    ensureDirectoryExistence(`${nconf.get('jobLogFolder')}/fakefile`);

    programTimerId = setTimeout(program.watch, nconf.get('watchDelayInMs'), iteration + 1);
    var guid = uuid.v4();

    console.log(`------------------------- ${iteration} ------------------------`)

    // Bring back all the existing queues...
    program.queueSvc.listQueuesSegmented(null, function (error, result, response) {
      if (error) {
        throw error;
      }

      // should redo a call to listQueuesSegmented if not completed, see token.
      result.entries.forEach(function (queue) {
        program.getQueueInfo(queue.name, guid);
      }, this);
    });
  },

  getQueueInfo: function (queueName, iteration) {
    program.queueSvc.getQueueMetadata(queueName, function (error, result, response) {
      if (!error) {
        // Queue length is available in result.approximateMessageCount
        var jobLoggerName = nconf.get('jobLoggerName');
        var log = new logs.create(jobLoggerName, iteration, queueName, result.approximateMessageCount);
        console.log(JSON.stringify(log));

        // Todo Add the proper date format to log file.
        var logFolder = nconf.get('jobLogFolder');
        var logfile_name = `${logFolder}${log.jobLoggerName}-${program.formatDate(new Date())}.log`
        fs.appendFile(logfile_name, `${JSON.stringify(log)}\r\n`, function (err) {
          if (err) throw err;
        });
      }
    });
  },

  formatDate: function (date) {
    var d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }
};

function ensureDirectoryExistence(filePath) {
  var dirname = path.dirname(filePath);
  if (directoryExists(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

function directoryExists(path) {
  try {
    return fs.statSync(path).isDirectory();
  }
  catch (err) {
    return false;
  }
}

if (!nconf.get('clean')) {
  // Create the queue service
  // (storageAccountOrConnectionString, storageAccessKey, host)...
  program.queueSvc = azureStorage.createQueueService(nconf.get('azureStorageConnectionString'));
  var programTimerId = setTimeout(program.watch, 0, 1);
}
else {
  program.clean();
}
