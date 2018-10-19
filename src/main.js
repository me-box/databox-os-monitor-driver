/*jshint esversion: 6 */
const https = require('https');
const express = require("express");
const bodyParser = require("body-parser");
const fs = require('fs');

const monitor = require("os-monitor");

const databox = require('node-databox');

const ws = require('ws');

//
// Get the needed Environment variables
//
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

app.get("/ui", function(req, res) {
  res.send(`<html>
    <head></head>
    <body>
      <h1>Driver OS Monitor</h1>
      <p>This is a simple Databox driver to log local os performance metrics (Free memory, Load Average).</p>
      <p>Install the app-os-monitor to see a graph of its output. </p>
    </body>
  </html>`);
});

var vendor = "databox inc";

//Blob data sources
let tsbc = databox.NewTimeSeriesBlobClient(DATABOX_ZMQ_ENDPOINT, false);
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

//Structured data sources
let tsc = databox.NewTimeSeriesClient(DATABOX_ZMQ_ENDPOINT, false);
let loadavg1Structured = databox.NewDataSourceMetadata();
loadavg1Structured.Description = 'Databox load average 1 minute structured';
loadavg1Structured.ContentType = 'application/json';
loadavg1Structured.Vendor = 'Databox Inc.';
loadavg1Structured.Unit = '%';
loadavg1Structured.DataSourceType = 'loadavg1Structured';
loadavg1Structured.DataSourceID = 'loadavg1Structured';
loadavg1Structured.StoreType = 'ts';

let freememStructured = databox.NewDataSourceMetadata();
freememStructured.Description = 'Databox free memory in bytes structured';
freememStructured.ContentType = 'application/json';
freememStructured.Vendor = 'Databox Inc.';
freememStructured.Unit = 'bytes';
freememStructured.DataSourceType = 'freememStructured';
freememStructured.DataSourceID = 'freememStructured';
freememStructured.StoreType = 'ts';

console.log("RegisterDatasource:: start")
tsbc.RegisterDatasource(loadavg1)
.then((resp)=>{
  console.log("RegisterDatasource(loadavg1)::", resp)
  return tsbc.RegisterDatasource(loadavg5);
})
.then(()=>{
  return tsbc.RegisterDatasource(loadavg15);
})
.then(()=>{
  return tsbc.RegisterDatasource(freemem);
})
.then(()=>{
  return tsc.RegisterDatasource(loadavg1Structured);
})
.then(()=>{
  return tsc.RegisterDatasource(freememStructured);
})
.then(()=>{
  console.log("RegisterDatasource:: end")

  monitor.start({ delay: 1000 });

  // define handler that will always fire every cycle
  monitor.on('monitor', function(event) {

    var loadavg1 = event['loadavg'][0];
    var loadavg5 = event['loadavg'][1];
    var loadavg15 = event['loadavg'][2];
    var freemem = event[freemem];
    console.log(loadavg1);

    saveBlob('loadavg1', event['loadavg'][0])
    .then(()=>{
      return saveBlob('loadavg5', event['loadavg'][1]);
    })
    .then(()=>{
      return saveBlob('loadavg5', event['loadavg'][1]);

    })
    .then(()=>{
      return saveBlob('loadavg15',event['loadavg'][2]);
    })
    .then(()=>{
      return  saveBlob('freemem', event['freemem']);

    })
    .then(()=>{
      return saveStructured('loadavg1Structured', event['loadavg'][0]);

    })
    .then(()=>{
      return saveStructured('freememStructured', event['freemem']);
    })
    .then(()=>{
      event = null
      loadavg1 = null
      loadavg5 = null
      loadavg15 =null
      freemem = null
    })
    .catch((err)=>{
      console.log("Error writing to store:", error);
    })

  });

})
.catch((err)=>{
  console.log("Error registering data source:" + err);
});

function saveBlob(datasourceid,data) {
  let json = {"data":data};
  console.log("Saving data::", datasourceid, json);
  return tsbc.Write(datasourceid,json);
}

function saveStructured(datasourceid,data) {
  let json = {"value":data};
  console.log("Saving data::", datasourceid, json);
  return tsc.Write(datasourceid,json);
}

server = https.createServer(credentials, app).listen(PORT);

const wss = new ws.Server({ server });

server.listen(PORT, () => {
  console.log(`Server started on port ${server.address().port} :)`);
});

wss.on('connection', (ws) => {

  //connection is up, let's add a simple simple event
  ws.on('message', (message) => {

      //log the received message and send it back to the client
      console.log('received: %s', message);
      ws.send(`Hello, you sent -> ${message}`);
  });

  //send immediatly a feedback to the incoming connection
  ws.send('Hi there, I am a WebSocket echo server');
});

module.exports = app;