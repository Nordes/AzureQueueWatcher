'use strict'
// Documentation:
//      https://docs.microsoft.com/en-us/azure/storage/storage-nodejs-how-to-use-queues
var azureStorage = require("azure-storage");
var fs = require("fs");
var nconf = require('nconf');
nconf.env().argv().file({ file: 'config.json', search: true });

// Create the queue service
// (storageAccountOrConnectionString, storageAccessKey, host)...
var queueSvc = azureStorage.createQueueService(nconf.get("AZURE_STORAGE_CONNECTION_STRING"));

// Other
var programTimerId = setTimeout(program, nconf.get("watchDelayInMs"), 1);

function program(iteration){
    if (iteration > nconf.get("watchNumberOfExecution") && nconf.get("watchIndefinite") === false){
        clearInterval(programTimerId);

        return;
    }

    programTimerId = setTimeout(program, nconf.get("watchDelayInMs"), iteration + 1);
    console.log("-------------------------" + iteration + "------------------------")
    // Bring back all the existing queues...
    var abc = queueSvc.listQueuesSegmented(null, function(error, result, response){
        if(error){
            throw error;
        }

        result.entries.forEach(function(queue) {
            getQueueInfo(queue.name, iteration);
        }, this);
    });
}

function getQueueInfo(queueName, iteration){
    queueSvc.getQueueMetadata(queueName, function(error, result, response){
        if(!error){
            // Queue length is available in result.approximateMessageCount
            // console.log(iteration + ": " + queueName + " - " + result.approximateMessageCount);
            var log = new LogFormat(iteration, queueName, result.approximateMessageCount);
            console.log(JSON.stringify(log));

            // Todo Add the proper date format to log file.
            fs.appendFile(log.jobLogName + '-yyyy-mm-dd.txt', JSON.stringify(log) + "\r\n", function (err) {
                if (err) throw err;
            });
        }
    });
}

// http://www.htmlgoodies.com/beyond/javascript/object.create-the-new-way-to-create-objects-in-javascript.html
function LogFormat(iteration, queueName, messageCount){
    this.timeStamp = new Date().getTime(); // TimeStamp
    this.jobLogName = nconf.get("jobLogName");
    this.jobIterationSinceStarted = iteration;
    this.queueName = queueName;
    this.approximateMessageCount = messageCount;
}
