/**
 * Created by bala on 23/7/15.
 */

var agentConfReader = require("./agent-setting");
var DataConnectionHandler = require("./dataconnection-handler");
var AutoSensorConnectionHandler = require('./autoSensorConnection-handler');
var dataConnection;
var autoSensorConnection;

function MessageHandler(clientSocket)
{
  this.clientSocket = clientSocket;
  this.handleMessages();
}

MessageHandler.prototype.handleMessages = function()
{
  var clientSocket = this.clientSocket;
  var processId = process.pid;

  var controlMessage = "nd_ctrl_msg_req:appName=" + agentConfReader.getInstance() + ";ndAppServerHost="
        + agentConfReader.getServerName() + ";tierName=" + agentConfReader.getTierName() + ";bciVersion=VERSION 4.1.2.Local BUILD 18"
        + ";bciStartTime=" + agentConfReader.getBCIStartUpTime() + ";ndHome=/opt/cavisson/netdaignostic;pid=" + processId + "\n";


  clientSocket.write(controlMessage);

  clientSocket.on("data", function(data){

      console.log("control message from ndc:" + data.toString());


      var dataArray = data.toString().split(":");

      if(dataArray[0] == "nd_ctrl_msg_rep")
      {

          var messageArray = dataArray[1].toString().split(";");
      }

      if(dataArray[0] == "nd_control_req")
      {
          var messageArray = dataArray[1].split(";");

          var action = messageArray[0].split("=");


          if(action[1] == "start_instrumentation") {

              agentConfReader.isToInstrument = true;
             // agentConfReader.btrecordMap = new Object();


              try {
                  for (var i = 0; i < messageArray.length; i++) {

                      var propertyValuePairs = messageArray[i].split("=");

                      var property = propertyValuePairs[0];
                      var value = propertyValuePairs[1];

                      agentConfReader[property] = value;
                  }
                 dataConnection = new DataConnectionHandler().createDataConn();
                 agentConfReader.dataConnHandler = dataConnection;

                  autoSensorConnection = new AutoSensorConnectionHandler().createAutoSensorConn();
                  agentConfReader.autoSensorConnHandler = autoSensorConnection;
              }
              catch(err) {
                  console.log(err);
              }
          }

          if(action[1] == "stop_instrumentation") {

              if(agentConfReader.dataConnHandler && agentConfReader.dataConnHandler.client) {
                  agentConfReader.isToInstrument = false;
                  agentConfReader.dataConnHandler.client.end();
                  agentConfReader.dataConnHandler.client.destroy();
              }
          }
      }
  });
};


module.exports = MessageHandler;