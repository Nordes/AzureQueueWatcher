'use strict'
// Could also use "event"...
// https://nodejs.org/api/events.html

// Documentation:
//    https://docs.microsoft.com/en-us/azure/storage/storage-nodejs-how-to-use-queues
const azureStorage = require('azure-storage');
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const logs = require('./models/Log');
const uuid = require('node-uuid');
// If converted to a module, should use "debug" instead (cref: https://blog.risingstack.com/node-js-logging-tutorial/)
const winston = require('winston');

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

  winston.level = jobSettings.traceLevel;

  // Private var
  var tableSvc = null;
  var retryOperations = new azureStorage.ExponentialRetryPolicyFilter();

  // Public methods
  return {
    /**
    * Start watching queues using the settings.
    *
    * @param {object} [settings]                  The watch settings.
    */
    start: function (settings) {
      setTimeout(function () {
        if (settings.numberOfExecution == 0)
          return;

        var queueSvc = getQueueSvc(settings);

        winston.info(`LoggerType: ${jobSettings.loggerType}`)
        if (jobSettings.loggerType === 'azureTable') {
          if (jobSettings.azureTable.storageConnectionString)
            tableSvc = azureStorage.createTableService(jobSettings.azureTable.storageConnectionString).withFilter(retryOperations);
          else if (jobSettings.azureTable.accountKey && jobSettings.azureTable.accountKey)
            tableSvc = azureStorage.createTableService(jobSettings.azureTable.accountName, jobSettings.azureTable.accountKey).withFilter(retryOperations);
          else
            throw Error("LoggerType: Configuration regarding the Azure Table is incomplete")

          winston.debug(`LoggerType ${jobSettings.loggerType}: Try to create table ${jobSettings.azureTable.tableName} if not exists`)
          tableSvc.createTableIfNotExists(jobSettings.azureTable.tableName, function (error, result, response) {
            if (error) {
              throw new Error('Not able to create the AzureTable');
            }

            winston.info(`LoggerType ${jobSettings.loggerType}: Table ${jobSettings.azureTable.tableName}`, { 'created': result.created });

            startWatch(settings, queueSvc);
          });
        }
        else // Log files
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
    clean: cleanFileLogs
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
        // If any settings on the queue name, then do the filtering
        if (watchSettings.queueNames && watchSettings.queueNames.length > 0) {
          watchSettings.queueNames.forEach(function (watchQueueName) {
            if (queue.name.match(new RegExp(watchQueueName))) {
              winston.info(`Registering queue: ${queue.name}`)
              setTimeout(function () {
                return executeWatch(1, watchSettings, queueSvc, queue.name, 0)
              }, 1);
            }
          }, this);
        } else {
          winston.info(`Registering queue: ${queue.name}`);
          setTimeout(function () {
            return executeWatch(1, watchSettings, queueSvc, queue.name, 0)
          }, 1);
        }
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
  * @param {int}     [retryCount]                   Number of try
  */
  function executeWatch(iteration, watchSettings, queueSvc, queueName, retryCount) {
    queueSvc.getQueueMetadata(queueName, function (error, result, response) {
      if (!error) {
        if (watchSettings.numberOfExecution < 0 || iteration + 1 < watchSettings.numberOfExecution) {
          setTimeout(function () {
            return executeWatch(++iteration, watchSettings, queueSvc, queueName, 0);
          }, watchSettings.delay);
        } else {
          console.log(`[${queueName}] Completed maximum number of iteration`);
        }

        // Queue length is available in result.approximateMessageCount
        var log = new logs.create(jobSettings.file.loggerName, iteration, queueName, result.approximateMessageCount);
        winston.debug(JSON.stringify(log));

        logData(log);
      } else {
        // 5 retry count, else throw the error.
        if (error && error.code === 'ETIMEDOUT' && retryCount <= 5) {
          executeWatch(iteration, watchSettings, queueSvc, queueName, ++retryCount);
        } else {
          throw error;
        }
      }
    });
  }

  /**
  * Do the actual cleaning of the logs.
  */
  function cleanFileLogs() {
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
        console.log("-= Done =-");
      }
    } else if (jobSettings.loggerType === 'azureTable') {
      // Todo Clean the azure table
      throw new Error('Not implemented');
    }
  }

  function cleanAzureTableLogs() {
    throw Error('Not implemented');
  }

  /**
  * Send the logs to the proper writer.
  *
  * @param {object} [logData]           The content of the log data.
  */
  function logData(logData) {
    // Todo Add the proper date format to log file.
    switch (jobSettings.loggerType) {
      case 'file': sendToFile(logData);
        break;
      case 'azureTable': sendToAzureTable(logData);
        break;
      case 'newRelic': throw new Error('Log to newRelic not implemented');
      case 'elasticSearch': throw new Error('Log to elasticSearch not implemented');
      default:
        throw new Error('This option for logging data does not exists');
    }
  }

  /**
  * Send the logs to a local file.
  *
  * @param {object} [logData]           The content of the log data.
  */
  function sendToFile(logData) {
    var logfile_name = `${jobSettings.file.logFolder}${logData.loggerName}_${formatDate(new Date())}.log`;
    winston.silly('Send log to file', { "fileName": logfile_name });

    fs.appendFile(logfile_name, `${JSON.stringify(logData)}\r\n`, function (err) {
      if (err) throw err;
    });
  }

  /**
  * Send the logs to azure table.
  *
  * @param {object} [logData]           The content of the log data.
  */
  function sendToAzureTable(logData) {
    // Need to convert the logData to a rowData
    // { PartitionKey: ..., RowKey: ..., ...}
    var rowData = Object.assign({}, { 'PartitionKey': logData.loggerName, RowKey: logData.guid }, logData)

    tableSvc.insertEntity(jobSettings.azureTable.tableName, rowData, function (error, result, response) {
      if (error) throw error;

      winston.silly(`Inserted in AzureTable ${jobSettings.azureTable.tableName}`, result);
    });
  }

  /**
  * [Not in use] Get the type name of the object.
  *
  * @param {object} [obj]               The object to get the type of.
  *
  * @returns {string}                   Name of the type (Ex.: regexp).
  */
  function toType(obj) {
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
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
