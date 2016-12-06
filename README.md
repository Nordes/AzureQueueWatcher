# AzureQueueWatcher
Generate log file regarding the status of the queues in a Azure Storage Account.
This tool can be used from any computer as long as NodeJS is installed.


In combinaison with LogStash+Kibana (or other log forwarder + reporting) this 
can be very useful in order to monitor what is happening. Template regarding 
NewRelic and ElasticSearch are also provided (See Features).


This can be quite convenient to see if the queues are behaving as expected 
and how many items are in the poison queues.


 ___Soon___, triggers will be available
in order to send notification when certain threshold criteria are met.

### Reporting: NewRelic Data Insights example 
```SQL
SELECT  average(approximateMessageCount) FROM AzureQueueWatcher since 1 hours ago FACET queueName LIMIT  100 TIMESERIES 1 minutes
```
![image](https://cloud.githubusercontent.com/assets/446572/20577536/1541c658-b1c3-11e6-89e1-dc3ff5c59478.png)


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
node app.js
```

# Configuration
Please look into the **config.sample.json** of the current repo. 

# Options?
## Clean logs folder
```shell
node app.js --clean
```

# Features
## LogStash
Use the power of LogStash and combine the data analysis/alerts with __NewRelic__ OR __Kibana/ElasticSearch__ (_AKA ELK_).

Templates can be found in _templates/logstash_ folder. After entering some basic configuration you will be ready to go. 
Launch LogStash and then launch the AzureQueueWatcher.

## Send directly to NewRelic Insights
_Not yet implemented_

## Install as a Windows Service
_Not yet implemented_

## Deploy as an Azure WebJob
_Only an idea for now, nothing serious_
