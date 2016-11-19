'use strict'
const uuid = require('node-uuid');

class Log{
    constructor(jobLoggerName, iteration, queueName, messageCount){
        this.timeStamp = new Date().getTime(); // TimeStamp
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
