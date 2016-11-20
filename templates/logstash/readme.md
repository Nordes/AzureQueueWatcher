# LogStash templates
In this folder you will find templates/sample for LogStash.

# newRelic.sample.conf
New relic configuration. Require the LogStash plugin __logstash-output-newrelic__.
```Bash
bin/logstash-plugin install logstash-output-newrelic
```
Ref.: [LogStash Plugin: logstash-output-newrelic](https://www.elastic.co/guide/en/logstash/current/plugins-outputs-newrelic.html)


Once the configuration is ready you can launch LogStash and then the application in order to start to log shipping.

# elastic.sample.conf
Elastic search sample. Send using the regular plugin the JSON created by the app.
