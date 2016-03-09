/**
 * Created by bala on 22/7/15.
 */
var PropertiesReader = require('properties-reader');
var fs = require('fs');
var btDetail = require('./BT/BTDetails');
var backendDetails = require('./backend/backendDetails');

var defaultTier = 'NodeJS';
var defaultServer = 'Nsecom';
var defaultInstance = 'Nsecom';
var defaultNdcPort = '7892';
var defaultNdcHost = 'localhost';

var vectorPrefix;

var vectorPrefixID;

function AgentSetting()
{
}
AgentSetting.BTMap = new Object();

AgentSetting.getBTData = function(filename)
{
    AgentSetting.btrecordMap = new Object();
    AgentSetting.categoryMap = new Object();
    AgentSetting.backendRecordMap = new Object();

    var data = fs.readFileSync(filename).toString().split("\r\n");
    for (var i = 0; i < data.length; i++) {
        var BT = new Object();

        var dataValue = data[i].split("|");
        var url = dataValue[0];
        BT.slow = dataValue[1];
        BT.vryslow = dataValue[2];
        AgentSetting.categoryMap[url] = BT;


        //myTime = setInterval(AgentSetting.alertFunc, 60000);
    }
    myTime = setInterval(AgentSetting.alertFunc, 30000);
}
AgentSetting.setDefault = function () {
    AgentSetting.tier = defaultTier;
    AgentSetting.server = defaultServer;
    AgentSetting.instance = defaultInstance;
    AgentSetting.ndcPort = defaultNdcPort;
    AgentSetting.ndcHost = defaultNdcHost;

}

AgentSetting.getData = function (filename) {
    AgentSetting.methodId = 0;
    AgentSetting.backendID = 0;
    AgentSetting.seqId = 0;

    AgentSetting.isToInstrument = false;    // It will true when control connection has made.

    AgentSetting.isRequested = false;       //check only for http requests
    AgentSetting.filename = filename;
    AgentSetting.bciStartUpTime = new Date().getTime();
    AgentSetting.flowMap = new Object();

    if (filename == undefined) {
        AgentSetting.setDefault();
        return AgentSetting;
    }
    var properties = null;

    try {
        properties = PropertiesReader(filename);
    }
    catch (err) {
        console.log("Cannot read propery file due to : " + err);
        AgentSetting.setDefault();
        return AgentSetting;

    }
    AgentSetting.tier = properties.get('tier');
    AgentSetting.server = properties.get('server');
    AgentSetting.instance = properties.get('instance');
    AgentSetting.ndcPort = properties.get('ndcPort');
    AgentSetting.ndcHost = properties.get('ndcHost');
    //console.log(AgentSetting);

    return AgentSetting;
};

AgentSetting.checkDuration = function(duration){
    if(duration.minDuration == Number.MAX_VALUE){
        duration.minDuration = 0;
    }

    if(duration.minNormalDuration == Number.MAX_VALUE){
        duration.minNormalDuration = 0;
    }

    if(duration.minSlowDuration == Number.MAX_VALUE){
        duration.minSlowDuration = 0;
    }

    if(duration.minVerySlowDuration == Number.MAX_VALUE){
        duration.minVerySlowDuration = 0;
    }

    if(duration.minErrorDuration == Number.MAX_VALUE){
        duration.minErrorDuration = 0;
    }

}

AgentSetting.make74Data = function(data74,BTID){
    return '74,' + vectorPrefixID + BTID + ':' + vectorPrefix + data74.BTName + '|' + data74.reqPerSecond + ' ' + data74.avgRespTime + ' ' + data74.minDuration + ' ' + data74.maxDuration + ' ' + data74.count + ' ' + '0.0' + ' ' + data74.errorsPerSecond + ' ' + data74.normalAvgRespTime + ' ' + data74.minNormalDuration + ' ' + data74.maxNormalDuration + ' ' + data74.NormalCount + ' ' + data74.slowAvgRespTime + ' ' + data74.minSlowDuration + ' ' + data74.maxSlowDuration + ' ' + data74.SlowCount + ' ' + data74.verySlowAvgRespTime + ' ' + data74.minVerySlowDuration + ' ' + data74.maxVerySlowDuration + ' ' + data74.VerySlowCount + ' ' + data74.errorsAvgRespTime + ' ' + data74.minErrorDuration + ' ' + data74.maxErrorDuration + ' ' + data74.errorCount + ' ' + data74.slowAndVerySlowPct + '\n';

}

AgentSetting.alertFunc = function () {

    var overAllBTDetail = new btDetail();

    var keys = Object.keys(AgentSetting.btrecordMap);

    if (keys.length != 0) {
        for (var i = 0; i < keys.length; i++) {

            var btrecordKey = keys[i];

            var eachBTData = AgentSetting.btrecordMap[keys[i]];

            if (eachBTData.count > 0)
            {
                //TODO : There should be monitorIntervalTime in place of 30
                eachBTData.reqPerSecond = eachBTData.count / 30;    // 30 is setInterval time for eachBTDataing data
                eachBTData.avgRespTime = eachBTData.duration / eachBTData.count;
                eachBTData.slowAndVerySlowPct = ( ((eachBTData.SlowCount + eachBTData.VerySlowCount) * 100) / eachBTData.count);
            }

            if (eachBTData.errorCount > 0)
            {
                eachBTData.errorsPerSecond = eachBTData.errorCount / 30;
                eachBTData.errorsAvgRespTime = eachBTData.errorDuration / eachBTData.errorCount;
            }

            if (eachBTData.SlowCount > 0)
            {
                eachBTData.slowAvgRespTime = eachBTData.slowDuration / eachBTData.SlowCount;
            }

            if (eachBTData.NormalCount > 0)
            {
                eachBTData.normalAvgRespTime = eachBTData.normalDuration / eachBTData.NormalCount;
            }

            if (eachBTData.VerySlowCount > 0)
            {
                eachBTData.verySlowAvgRespTime = eachBTData.verySlowDuration / eachBTData.VerySlowCount;
            }

            vectorPrefix = AgentSetting.tierName + AgentSetting.ndVectorSeparator + AgentSetting.ndAppServerHost + AgentSetting.ndVectorSeparator + AgentSetting.appName + AgentSetting.ndVectorSeparator;
            vectorPrefixID = AgentSetting.tierID + "|" + AgentSetting.appID + "|";

            overAllBTDetail.updateOverAllBTDetail(eachBTData);
            if(btrecordKey != undefined ) {
                AgentSetting.checkDuration(eachBTData);

                if (AgentSetting.isToInstrument && AgentSetting.dataConnHandler) {

                    var data74 = AgentSetting.make74Data(eachBTData, btrecordKey);

                    AgentSetting.autoSensorConnHandler.client.write(data74);


                }
            }

            delete AgentSetting.btrecordMap[keys[i]];
        }
    }
    if(overAllBTDetail.BTID != undefined ) {
        AgentSetting.checkDuration(overAllBTDetail);

        if (AgentSetting.isToInstrument && AgentSetting.dataConnHandler) {

            var data74 = AgentSetting.make74Data(overAllBTDetail, overAllBTDetail.BTID);

            AgentSetting.autoSensorConnHandler.client.write(data74);

            //console.log(overAllBTDetail);
        }
    }
    AgentSetting.manage75record();
}

AgentSetting.manage75record = function () {

    var keys = Object.keys(AgentSetting.backendRecordMap);

    if (keys.length != 0) {
        for (var i = 0; i < keys.length; i++) {

            var backendrecordKey = keys[i];
            var eachBackendData = AgentSetting.backendRecordMap[keys[i]];

            // var data5 = eachBackendData.create5record();


            if (eachBackendData.cumCount > 0) {
                //TODO : There should be monitorIntervalTime in place of 30
                eachBackendData.rate = eachBackendData.invocationCount / 30;    // 30 is setInterval time for eachBTDataing data
            }

            if (eachBackendData.errorCumCount > 0) {
                eachBackendData.errorRate = eachBackendData.errorInvocationCount / 30;
            }
            if (AgentSetting.isToInstrument && AgentSetting.dataConnHandler) {
                vectorPrefix = AgentSetting.tierName + AgentSetting.ndVectorSeparator + AgentSetting.ndAppServerHost + AgentSetting.ndVectorSeparator + AgentSetting.appName + AgentSetting.ndVectorSeparator;
                vectorPrefixID = AgentSetting.tierID + "|" + AgentSetting.appID + "|";
                var data75 = AgentSetting.make75Data(eachBackendData);


                //AgentSetting.dataConnHandler.client.write(data5);

                AgentSetting.autoSensorConnHandler.client.write(data75);

            }
            eachBackendData.minDuration = Number.MAX_VALUE;
            eachBackendData.maxDuration = 0;

            eachBackendData.sumDuration = 0;
            eachBackendData.avgDuration = 0;


            //eachBackendData.cumCount = 0;
            eachBackendData.errorCumCount = 0;
            eachBackendData.invocationCount = 0;
            eachBackendData.errorInvocationCount = 0;

            eachBackendData.rate = 0;
            eachBackendData.errorRate = 0;

        }
    }
}

AgentSetting.make75Data = function(data75){
    if(data75.minDuration == Number.MAX_VALUE)
    {
        data75.minDuration = 0;
    }
    return '75,' + vectorPrefixID + data75.backendID + ':' + vectorPrefix + data75.BackendName + '|' + data75.cumCount + ' ' + data75.rate + ' ' + data75.avgDuration + ' ' + data75.minDuration + ' ' + data75.maxDuration + ' ' + data75.invocationCount + ' ' + data75.errorRate + '\n';

}

AgentSetting.getBCIStartUpTime = function () {
    return AgentSetting.bciStartUpTime;

};
AgentSetting.getTierName = function () {
    return AgentSetting.tier;
};

AgentSetting.getServerName = function () {
    return AgentSetting.server;
};

AgentSetting.getInstance = function () {
    return AgentSetting.instance;
};

AgentSetting.getNDCHost = function () {
    return AgentSetting.ndcHost;
};

AgentSetting.getPort = function () {

    var port = AgentSetting.ndcPort;

    try {
        return parseInt(port);
    }
    catch (err) {
        return defaultNdcPort;
    }

};

module.exports = AgentSetting;