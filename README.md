# AzureQueueWatcher
Generate log file regarding the status of the queues in a Azure Storage Account.

In combinaison with LogStash+Kibana (or other log forwarder + reporting) this can be very useful in order to monitor what is happening.

# Configuration
| Configuration name | Available | Value(s) | Description |
|------------------------|:-----:|------|---|
| watchAllQueues | Y | bool | Watch all the available queues in the account |
| watchIndefinite | Y | bool | Watch for unlimited number of time |
| watchDelayInMs | Y | integer | Trigger the request to the queue each Nms |
| watchNumberOfExecution | Y | integer | Maximum number of execution if _watchIndefinite_ is _false_ |
| watchQueueNames | N | Array[&lt;string&gt;] | Names of the queues to watch if _watchAllQueues_ is _false_ |
| jobLoggerName | Y (partial) | string | Name of the job used for the _log file name_ and the _log data_|
| jobLogFolder | Y | string | Path where the logs will be put into ( ex.: "./logs/" ) |
| azureStorageConnectionString | Y | string | Azure storage connection string used to connect to the storage Account|

# Start the engine
From the root folder, rename the **config.json.conf** to **config.json** and fill the azure configuration connectionstring and the other configurations.

Download the NodeJS dependencies
```
npm install
```

To run
```
npm start
```

To clean the logs
```
node program.js --clean
```

# TODO(s)
* Give possibility to write into an Azure table instead of a logfile (See MS Azure LogStash tools on GitHub)
* Implement the naming of the logfiles
* Create an example with Logstash (index + dashboard template)
* Maybe try to combine with elastic beats? (not so sure, but it is more lightweight than logstash)
* ...Waiting for more ideas...
