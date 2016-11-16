'use strict'
// Documentation:
//      https://docs.microsoft.com/en-us/azure/storage/storage-nodejs-how-to-use-queues
var azureStorage = require("azure-storage");
var fs = require("fs");
var logs = require("./modules/logs.js");
var uuid = require('node-uuid');
var nconf = require('nconf');

nconf.env().argv().file({ file: 'config.json', search: true });

var program = {
    queueSvc: null,
    watch: function(iteration){
        if (iteration > nconf.get("watchNumberOfExecution") && nconf.get("watchIndefinite") === false){
            clearInterval(programTimerId);

            return;
        }

        programTimerId = setTimeout(program.watch, nconf.get("watchDelayInMs"), iteration + 1);
        var guid = uuid.v4();

        console.log("-------------------------" + iteration + "------------------------")

        // Bring back all the existing queues...
        program.queueSvc.listQueuesSegmented(null, function(error, result, response){
            if(error){
                throw error;
            }
            
            // should redo a call to listQueuesSegmented if not completed, see token.
            result.entries.forEach(function(queue) {
                program.getQueueInfo(queue.name, guid);
            }, this);
        });
    },

    getQueueInfo: function (queueName, iteration){
        program.queueSvc.getQueueMetadata(queueName, function(error, result, response){
            if(!error){
                // Queue length is available in result.approximateMessageCount
                var jobLogName = nconf.get("jobLogName");
                var log = new logs.create(jobLogName, iteration, queueName, result.approximateMessageCount);
                console.log(JSON.stringify(log));

                // Todo Add the proper date format to log file.
                var logfile_name = log.jobLogName + '-' + program.formatDate(new Date()) +'.log'
                fs.appendFile(logfile_name, JSON.stringify(log) + "\r\n", function (err) {
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

// Create the queue service
// (storageAccountOrConnectionString, storageAccessKey, host)...
program.queueSvc = azureStorage.createQueueService(nconf.get("AZURE_STORAGE_CONNECTION_STRING"));
var programTimerId = setTimeout(program.watch, 0, 1);
