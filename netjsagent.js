/**
 * Created by bala on 10/7/15.
 */

var njstrace = require('./lib/njstrace/njsTrace');
var path  = require('path');
var agentSetting = require("./lib/agent-setting");
var clientConn = require("./lib/client");
var methodmanager = require('./lib/methodManager');
var btConf = require('./lib/BT/btconfiguration');
var path = require('path');

NJSInstrument.prototype.instrument = function instrument(filename)
{
    try
    {
        agentSetting.getData();      //getting data for making connection to ndc
        btConf.getData(path.resolve(__dirname)+'/lib/BT/bt');
        njstrace.inject({formatter: methodmanager});

        agentSetting.getBTData(path.resolve(__dirname)+'/lib/BT/BTcategory');
        clientConn.connectToServer();
        var nt = require('./lib/nodetime/index').profile();
    }
    catch(err){
        console.log("Error is :"+err);
    }
};

function NJSInstrument()
{

}

module.exports = new NJSInstrument();