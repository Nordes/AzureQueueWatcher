# AzureQueueWatcher
Generate log file regarding the status of the queues in a Azure Storage Account.

In combinaison with LogStash+Kibana (or other log forwarder + reporting) this 
can be very useful in order to monitor what is happening.

# Usage
Install with ___npm___
```
npm install
```

Rename the **config.sample.json** to **config.json** and update the content of the file. Once
it is completed, you can start the application.

```Batchfile
npm start
# or 
node program.js
```

# Configuration
Please look into the **config.sample.json** of the current repo. 

# Clean all the logs in one shot? 
Yes, this feature exists. 
```
node program.js --clean
```
