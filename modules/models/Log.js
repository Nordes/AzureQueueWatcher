'use strict'
const uuid = require('node-uuid');

class Log{
    constructor(jobLoggerName, iteration, queueName, messageCount, tag){
        // NewRelic needed params
        this.eventType = "AzureQueueWatcher"; // Experimental
        // Others..
        this.tag = tag;
        this.timestamp = new Date().getTime(); // TimeStamp
        this.guid = uuid.v4();
        this.loggerName = jobLoggerName;
        this.iterationSinceStarted = iteration;
        this.queueName = queueName;
        this.approximateMessageCount = messageCount;
    }
}

module.exports = {
    create: Log
}
