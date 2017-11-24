/*jshint esversion: 6 */
const https = require('https');
const express = require("express");
const bodyParser = require("body-parser");
const fs = require('fs');

const monitor = require("os-monitor");

const databox = require('node-databox');

//
// Get the needed Environment variables
//
const DATABOX_STORE_BLOB_ENDPOINT = process.env.DATABOX_STORE_ENDPOINT;
const DATABOX_ZMQ_ENDPOINT = process.env.DATABOX_ZMQ_ENDPOINT

//HTTPS certs created by the container mangers for this components HTTPS server.
credentials = databox.getHttpsCredentials();


var PORT = process.env.port || '8080';

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get("/status", function(req, res) {
    res.send("active");
});

var vendor = "databox inc";

let tsc = databox.NewTimeSeriesClient(DATABOX_ZMQ_ENDPOINT, false);

let loadavg1 = databox.NewDataSourceMetadata();
loadavg1.Description = 'Databox load average 1 minute';
loadavg1.ContentType = 'application/json';
loadavg1.Vendor = 'Databox Inc.';
loadavg1.Unit = '%';
loadavg1.DataSourceType = 'loadavg1';
loadavg1.DataSourceID = 'loadavg1';
loadavg1.StoreType = 'ts';

let loadavg5 = databox.NewDataSourceMetadata();
loadavg5.Description = 'Databox load average over 5 minutes';
loadavg5.ContentType = 'application/json';
loadavg5.Vendor = 'Databox Inc.';
loadavg5.Unit = '%';
loadavg5.DataSourceType = 'loadavg5';
loadavg5.DataSourceID = 'loadavg5';
loadavg5.StoreType = 'ts';

let loadavg15 = databox.NewDataSourceMetadata();
loadavg15.Description = 'Databox load average over 15 minutes';
loadavg15.ContentType = 'application/json';
loadavg15.Vendor = 'Databox Inc.';
loadavg15.Unit = '%';
loadavg15.DataSourceType = 'loadavg15';
loadavg15.DataSourceID = 'loadavg15';
loadavg15.StoreType = 'ts';

let freemem = databox.NewDataSourceMetadata();
freemem.Description = 'Databox free memory in bytes';
freemem.ContentType = 'application/json';
freemem.Vendor = 'Databox Inc.';
freemem.Unit = 'bytes';
freemem.DataSourceType = 'freemem';
freemem.DataSourceID = 'freemem';
freemem.StoreType = 'ts';

tsc.RegisterDatasource(loadavg1)
.then(()=>{
  return tsc.RegisterDatasource(loadavg5);
})
.then(()=>{
  return tsc.RegisterDatasource(loadavg15);
})
.then(()=>{
  return tsc.RegisterDatasource(freemem);
})
.catch((err)=>{
  console.log("Error registering data source:" + err);
});


https.createServer(credentials, app).listen(PORT);

monitor.start({ delay: 5000 });

// define handler that will always fire every cycle
monitor.on('monitor', function(event) {

  var loadavg1 = event['loadavg'][0];
  var loadavg5 = event['loadavg'][1];
  var loadavg15 = event['loadavg'][2];
  var freemem = event[freemem];
  console.log(loadavg1);

  save('loadavg1', event['loadavg'][0]);
  save('loadavg5', event['loadavg'][1]);
  save('loadavg15',event['loadavg'][2]);
  save('freemem', event['freemem']);

  function save(datasourceid,data) {
    console.log("Saving data::", datasourceid, {"data":data});
    json = {"data":data};
    tsc.Write(datasourceid,json)
    .then((resp)=>{
      console.log("Save got response ", resp);
    })
    .catch((error)=>{
      console.log("Error writing to store:", error);
    });
  }

});

module.exports = app;