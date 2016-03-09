/**
 * Created by Siddhant on 18-09-2015.
 */


var net = require('net');
var agentConfReader = require("./agent-setting");
var AutoMessageMessageHandler = require("./autoSensorMessage-handler");


function autoSensorConnHandler(){

}

autoSensorConnHandler.prototype.createAutoSensorConn = function(){

    this.client = null;
    this._createServer();
    return this;
};



autoSensorConnHandler.prototype._createServer = function()
{
    var currBCIClient = this;
    var client = new net.Socket();
    this.client = client;

    try {

        client.connect(agentConfReader.getPort(), agentConfReader.getNDCHost(), function () {

        });
        client.on('error', function(err)
        {
            console.log("retry");

        });

        client.on('connect', function() {
            new AutoMessageMessageHandler(this);

        });
    }
    catch(err)
    {
        console.log("error" + err);
    }
};

module.exports = autoSensorConnHandler;