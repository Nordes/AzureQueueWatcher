'use strict'
class Log{
    constructor(jobLogName, iteration, queueName, messageCount){
        this.timeStamp = new Date().getTime(); // TimeStamp
        this.jobLogName = jobLogName;
        this.jobIterationSinceStarted = iteration;
        this.queueName = queueName;
        this.approximateMessageCount = messageCount;
    }
}

module.exports = {
    create: Log
}
