/**
 * Created by compass241 on 06-08-2015.
 */

var requestMap = new Object();
var methodMap = new Object();
var data;
var randomId = 0;
var agentSetting = require("./agent-setting");
var BigNumber = require('big-integer');
var clientConn = require("./client");
var flowPathId = 4692431487780316542;
var threadID = 10;
var threadSeq = 10.1;
var btConf = require('../lib/BT/btconfiguration');


function flowpathhandler()
{

}
//flowpathhandler.BTMap = new Object();
flowpathhandler.handleFlowPath = function(req,res,args) {

    agentSetting.isRequested = true;
    var date = new Date();
    var current_time = date.getTime();
    var sec_time = parseInt(current_time / 1000);


    var header = req.headers['accept'];

    if (req.hasOwnProperty('url') && (header.indexOf('text/html') > -1 || header.indexOf("*/*")  > -1) ) {
        var id;
        var newID;
        var newName;
        var timeStamp;
        var originalUrl = req['url'];


        if (requestMap[originalUrl] == undefined) {
            try {

                if (agentSetting.isToInstrument && agentSetting.dataConnHandler) {

                    id = agentSetting.BTMap[originalUrl].BTID;

                    if (id == undefined)

                        requestMap[originalUrl] = id;
                    agentSetting.dataConnHandler.client.write('7,' + id + "," + agentSetting.BTMap[originalUrl].BTName + "\n");
                }
            } catch (err) {
                console.log(err);
            }
        }


        else {
            id = requestMap[originalUrl];
        }
        var localFlowPathId = BigNumber(flowPathId).add(1);

        flowPathId = localFlowPathId.toString();
        timeStamp = sec_time - (agentSetting.cavEpochDiff);
        req['flowPathId']= localFlowPathId.toString();
        req.timeInMillis = current_time - (agentSetting.cavEpochDiff*1000);

        if (agentSetting.isToInstrument && agentSetting.dataConnHandler) {
            if(id == undefined)
            {
                id = 0;
                agentSetting.dataConnHandler.client.write('7,' + id + "," + "Others" + "\n");
            }
            agentSetting.dataConnHandler.client.write('2,' + localFlowPathId.toString() + "," + timeStamp + "," + threadID + "," + threadSeq + "," + id + "," + originalUrl + "\n");
        }
    }
}

module.exports = flowpathhandler;