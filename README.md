# AzureQueueWatcher
Generate log file regarding the status of the queues in a Azure Storage Account.

In combinaison with LogStash+Kibana (or other log forwarder + reporting) this 
can be very useful in order to monitor what is happening.

This can be quite convenient to see if the queues are behaving as expected 
and how many items are in the poison queues. ___soon___, triggers will be available
in order to send notification when certain threshold criteria are met.

# Usage
Install with ___npm___
```Shell
npm install
```

Rename the **config.sample.json** to **config.json** and update the content of the file. Once
it is completed, you can start the application.

```Shell
npm start
# or 
node program.js
```

# Configuration
Please look into the **config.sample.json** of the current repo. 

# Clean all the logs in one shot? 
Yes, this feature exists. 
```shell
node program.js --clean
```
