'use strict'
// Could also use "event"...
// https://nodejs.org/api/events.html

// Documentation:
//    https://docs.microsoft.com/en-us/azure/storage/storage-nodejs-how-to-use-queues
const azureStorage = require('azure-storage');
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const logs = require('./models/Log.js');
const uuid = require('node-uuid');

module.exports = azureQueueWatcher;

/**
* Singleton job to watch different account.
*
* @param {object} [jobSettings]   The job settings.
*
* @returns                        Available public methods
*/
function azureQueueWatcher(jobSettings) {
  if (!jobSettings) {
    throw new Error("Parameter are not optionnal, but mandatory!")
  }

  // Private var
  // var queueSvc = getQueueSvc();

  // Public methods
  return {
    /**
    * Start watching queues using the settings.
    *
    * @param {object} [settings]                  The watch settings.
    */
    start: function (settings) {
      setTimeout(function () {
        var queueSvc = getQueueSvc(settings);

        startWatch(settings, queueSvc);
      }, 1)
    },

    stop: function () {
        // todo
        // Stop all the "setTimeout"
        throw new Error('Not implemented');
    },

    /**
    * Clean existing logs from the current settings (Azure table or file).
    */
    clean: cleanLogs
  };

  //
  // Private functions
  //

  /**
  * Get the queue service based on the settings.
  *
  * @param {object} [watchSettings]               The watch settings.
  */
  function getQueueSvc(watchSettings) {
    if (watchSettings.storageConnectionString) {
      return azureStorage.createQueueService(watchSettings.storageConnectionString);
    }

    if (watchSettings.accountName && watchSettings.accountKey) {
      return azureStorage.createQueueService(watchSettings.accountName, watchSettings.accountKey);
    }

    throw new Error('Please configure your app.');
  }

  /**
  * Start watching using the settings and the queue service.
  *
  * @param {object} [watchSettings]               The watch settings.
  * @param {object} [queueSvc]                    The Azure Queue services.
  */
  function startWatch(watchSettings, queueSvc) {
    // Ensure that the logging directory exists
    ensureDirectoryExistence(`${jobSettings.file.logFolder}/fakefile`);

    // Bring back all the existing queues...
    queueSvc.listQueuesSegmented(null, function (error, queues, response) {
      if (error) {
        throw error;
      }

      // should redo a call to listQueuesSegmented if not completed, see token.
      queues.entries.forEach(function (queue) {
        // TODO
        // if (queue.Name match anything in my criterias... continue)

        setTimeout(function () {
          return executeWatch(1, watchSettings, queueSvc, queue.name)
        }, watchSettings.delay);
      }, this);
    });
  }

  /**
  * Background job executing the watch.
  *
  * @param {integer} [iteration]             Current iteration number.
  * @param {object}  [watchSettings]         Watch settings.
  * @param {object}  [queueSvc]              Queue services.
  * @param {string}  [queueName]             Name of the current queue.
  */
  function executeWatch(iteration, watchSettings, queueSvc, queueName) {
    queueSvc.getQueueMetadata(queueName, function (error, result, response) {
      if (!error) {

        if (!watchSettings.numberOfExecution >= 0 && iteration+1 <= watchSettings.numberOfExecution) {
          setTimeout(function () {
            return executeWatch(++iteration, watchSettings, queueSvc, queueName)
          }, watchSettings.delay);
        }
        else {
          console.log(`[${queueName}] Completed maximum number of iteration`);
        }

        // Queue length is available in result.approximateMessageCount
        
        var log = new logs.create(jobSettings.file.loggerName, iteration, queueName, result.approximateMessageCount);
        console.log(JSON.stringify(log));

        // Todo Add the proper date format to log file.
        var logfile_name = `${jobSettings.file.logFolder}${log.loggerName}_${formatDate(new Date())}.log`
        fs.appendFile(logfile_name, `${JSON.stringify(log)}\r\n`, function (err) {
          if (err) throw err;
        });
      }
      else {
        throw error;
      }
    });
  }

  /**
  * Do the actual cleaning of the logs.
  */
  function cleanLogs() {
    if (jobSettings.loggerType === 'file') {
      if (jobSettings.file && jobSettings.file.logFolder) {
        // Clean the log files
        glob(`${jobSettings.file.logFolder}**/*.log`, function (err, files) {
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
      }
    }
    else if (jobSettings.loggerType === 'azureTable') {
      // Todo Clean the azure table
      throw new Error('Not implemented');
    }
  }

  /**
  * Validate that the directory exists and try to create the full path if not exists.
  *
  * @param {string} [filePath]               File path where we want to ensure the existence of the directory.
  *
  * @returns {boolean}                       If already exists it will return true.
  */
  function ensureDirectoryExistence(filePath) {
    var dirname = path.dirname(filePath);
    if (directoryExists(dirname)) {
      return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
  }

  /**
  * Validate if the path given is a directory. In case it is a file, it will fail and returns false.
  *
  * @param {string} [path]               Path validate the existence of the directory.
  *
  * @returns {boolean}                   If exists it will return true.
  */
  function directoryExists(path) {
    try {
      return fs.statSync(path).isDirectory();
    }
    catch (err) {
      return false;
    }
  }

  /**
  * Format a date in a YYYY-MM-DD style.
  *
  * @param {date} [date]               Date to format.
  *
  * @returns {string}                 Date in the format YYYY-MM-DD.
  */
  function formatDate(date) {
    var d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }
}
