/**
 * Created by Siddhant on 22-09-2015.
 */

var agentSetting = require('../agent-setting');
var backendDetails = require('./backendDetails');

function backendRecord(){

}

backendRecord.handleBackendRecord = function(args,duration,backendName) {
    if(agentSetting.backendRecordMap[backendName] == undefined){
        backendRecord.createBackendRecord(args,duration,backendName);
    } else {
        backendRecord.updateBackendRecord(args,duration,backendName);
    }

    }

backendRecord.createBackendRecord = function(args,duration,backendName){
    var backend = new backendDetails();
    agentSetting.backendID = agentSetting.backendID + 1;

    backend.createBackendRecord(args,duration,backendName,agentSetting.backendID);
    backendRecord.dump5(backend);
    agentSetting.backendRecordMap[backendName] = backend;

    //console.log(agentSetting.backendRecordMap);
}
backendRecord.dump5 = function (data)
{
    var data = ' 5 ' + data.BackendName + ',' + data.backendID + '\n';
    if(agentSetting.isToInstrument && agentSetting.dataConnHandler)
    {
        agentSetting.dataConnHandler.client.write(data);
    }
}

backendRecord.updateBackendRecord = function (args,duration,backendName) {
    var backDetails = agentSetting.backendRecordMap[backendName];
    backDetails.updateBackendDetails(args,duration);
    //console.log(backDetails);

}


module.exports = backendRecord;