'use strict'
class Log{
    constructor(jobLoggerName, iteration, queueName, messageCount){
        this.timeStamp = new Date().getTime(); // TimeStamp
        this.jobLoggerName = jobLoggerName;
        this.jobIterationSinceStarted = iteration;
        this.queueName = queueName;
        this.approximateMessageCount = messageCount;
    }
}

module.exports = {
    create: Log
}
