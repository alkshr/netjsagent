/**
 * Created by compass241 on 17-08-2015.
 */

var Formatter = require('./njstrace/formatter.js');
var backend = require ('./backend/backendDetails');
var buffer = require('buffer');
var njstrace = require('./njstrace/njsTrace');
var category = require('./category');
var path  = require('path');
var requestMap = new Object();
var methodMap = new Object();
var data;
var randomId = 0;
var ms = require('microseconds');
var agentSetting = require("./agent-setting");
var flowMap;
var clientConn = require("./client");
var threadID = 10;
var threadSeq = 10.1;
var btconf = require('./BT/btconfiguration');
var btrecord = require('./BT/BTRecord');
var ut = require("./util");
var newID;
var newName;
var firstmethodtimeId = '';
var p;
var onExitFlag = false;


//var getNamespace = require('request-local');


// Create my custom Formatter class
function MyFormatter() {
    // No need to call Formatter ctor here
}
// But must "inherit" from Formatter
require('util').inherits(MyFormatter, Formatter);


// Implement the onEntry method
MyFormatter.prototype.onEntry = function(args) {
    agentSetting.seqId = agentSetting.seqId + 1 ;


    try {

        if(agentSetting.isRequested == false) {
            return;
        }
        var date = new Date();
        var current_time = date.getTime();
        var sec_time = parseInt(current_time / 1000);

        var functionArguments = '';
        //console.log("Name of function called- "+args.args.callee);

        var k=0;
        for (k = 0; k < args.args.length; k++)
        {
            var obj = args.args[k];
            if(obj) {
                if (functionArguments !== ''){
                    functionArguments = functionArguments+","+typeof obj;}
                else
                {
                    functionArguments = typeof obj;
                }
            }

        }

        var dirName = path.dirname(args.file);
        var baseName = path.basename(args.file, '.js');

        if (dirName == ".")
            dirName = "-";

        var methodData = dirName + "." + baseName + '.' + args.name + '(' + functionArguments + ')_' + args.line;

        var randomMethodId;

        if (methodMap[methodData] == undefined) {
            if (agentSetting.isToInstrument && agentSetting.dataConnHandler) {
                agentSetting.methodId = agentSetting.methodId + 1;
                methodMap[methodData] = agentSetting.methodId;
                randomMethodId = agentSetting.methodId;

                var methodMetaData = '5,' + methodData + ',' + randomMethodId;

                agentSetting.dataConnHandler.client.write(methodMetaData + "\n");
            }
        }


        var requestedObj = args.cavisson_req;


        if (requestedObj == undefined)
        {
            requestedObj = ut.getRequestObject(args.args);
        }

        if(requestedObj == undefined)
        {
            return;
        }


        var localFlowPathId = requestedObj['flowPathId'];


        var timeAccCav = current_time - (agentSetting.cavEpochDiff * 1000);
        var startUpTime = timeAccCav - requestedObj.timeInMillis;

        var methodEntryData = methodMap[methodData] + '_0_' + startUpTime + '__';

        var flowpath = agentSetting.flowMap[localFlowPathId];

        if(!flowpath)
        {
            flowpath=new Object();
            firstmethodtimeId = methodMap[methodData];

            flowpath.firstmethodid=firstmethodtimeId;
            flowpath.flowpathtime=requestedObj.timeInMillis+(agentSetting.cavEpochDiff * 1000);
            agentSetting.flowMap[localFlowPathId]=flowpath;
        }

        var data = '';
        if (flowpath.seqblob!==undefined)
            flowpath.seqblob = flowpath.seqblob + methodEntryData;
        else
            flowpath.seqblob = methodEntryData;

        //agentSetting.flowMap[localFlowPathId] = data;
    }
    catch(err) {
        console.log("Error in dumping entry data" + err);
    }
};

function  getRequestObjectFromStackMap(stackMap)
{
    var keys = Object.keys(stackMap);

    for(var i = 0; i < keys.length; i++)
    {
        var requestedArgument = ut.checkArguments(stackMap[keys[i]].stackArgs, "IncomingMessage")
            if(requestedArgument)
            return requestedArgument;
    }
}


function getResponseObject(functionArguments)
{
    if(functionArguments == null)
    {
        return null;
    }
    else if(functionArguments.callee.caller == null)
    {
        return null;
    }
    var requestedArgument = ut.checkArguments(functionArguments, "ServerResponse");

    if(requestedArgument)
        return requestedArgument;
    else
        return  getResponseObject(functionArguments.callee.caller.arguments);
}

MyFormatter.prototype.onCompleteFlowPath = function(req,res) {

    var localFlowPathId = -1;
    if (req != null) {
        localFlowPathId = req['flowPathId'];
    }
    else {
        return;
    }

    if(req['flowPathId'] == null)
    {
        return;
    }

    var flowpath=agentSetting.flowMap[localFlowPathId];
    if(flowpath.firstmethodseqblob === undefined)
    {
        var date = new Date ();
        var current_time = date.getTime();
        var endTime = current_time - flowpath.flowpathtime;

        flowpath.firstmethodseqblob = flowpath.firstmethodid + '_1_' + endTime + '_1___';

    }

    agentSetting.seqId =0;
    var date = new Date();
    var resp_current_time = date.getTime();

    var respTimeAccCav = resp_current_time - (agentSetting.cavEpochDiff*1000);

    var respTime = respTimeAccCav - req.timeInMillis;

    var cat = category.getCategory(respTime,req['url']);

    var ad = btconf.matchData(req['url']);
    if(ad != null){

        newID = ad.BTID;
        newName = ad.BTName;

        console.log('8,' + newID + "," + newName + "\n");
        var statusCode = res['statusCode'];

        btrecord.createAndUpdateBTRecord(newID,newName,respTime,cat,statusCode);
    }

    if (agentSetting.isToInstrument && agentSetting.dataConnHandler && onExitFlag) {
        try {

            if(flowpath.seqblob ===  undefined)
            {
                var  data  = '4,' + localFlowPathId + ',' + res.statusCode + cat ;
            }
            else {
                var data = '4,' + localFlowPathId + ',' + res.statusCode + ',' + cat + ',' + flowpath.seqblob + flowpath.firstmethodseqblob;
            }
            agentSetting.dataConnHandler.client.write(data + "\n");

            delete agentSetting.flowMap[localFlowPathId];
            req['flowPathId'] = null;

        }catch(err){
            console.log(err);
        }

    }
}


// Implement the onExit method
MyFormatter.prototype.onExit = function(args)
{
    try {

        if(agentSetting.isRequested == false)
            return;

       /* if (args.args == null) {
            console.log("arguments are null");
            return;
        }*/

        var requestedObj = args.cavisson_req;

        if (requestedObj == undefined) {
            requestedObj = ut.getRequestObject(args.arguments);
        }

        if(requestedObj == undefined)
        {
             return;
        }

        var localFlowPathId = -1;
        if (requestedObj != null) {
            localFlowPathId = requestedObj['flowPathId'];
        }
        else {
            return;
        }
        if(requestedObj['flowPathId'] == null)
        {
            return;
        }

        var id;
        var functionArguments = '' ;
        var k=0;

        for (k = 0; k < args.arguments.length; k++) {
            var obj = args.arguments[k];
           // console.log(obj.constructor.name);

            if(obj) {
                if (functionArguments !== ''){
                    functionArguments = functionArguments + "," + typeof obj;
                    }
                else
                {
                    functionArguments = typeof obj;
                }
            }

        }


        var dirName = path.dirname(args.file);
        var baseName = path.basename(args.file, '.js');

        if (dirName == ".")
            dirName = "-";


        var methodData = dirName + "." + baseName + '.' + args.name + '(' + functionArguments + ')_' + args.line;

        var flowpath = agentSetting.flowMap[localFlowPathId];

        var date = new Date ();
        var curr_time = date.getTime();

        var endTime= curr_time -flowpath.flowpathtime;


        if(methodMap[methodData] == flowpath.firstmethodid){
            p = flowpath.firstmethodid + '_1_' + endTime + '_1___';
            flowpath.firstmethodseqblob=p;
        }else{

            var methodExitData = methodMap[methodData] + '_1_' + endTime + '_1___';

            var data = '';

            if (flowpath.seqblob!==undefined)
                flowpath.seqblob = flowpath.seqblob + methodExitData;
            else
                flowpath.seqblob = methodExitData;


            //agentSetting.flowMap[localFlowPathId] = data;
            if(methodExitData) {
                 onExitFlag = true;
            }
        }
        /*if(requestedObj.res.finished)
         {
         console.log("code is in res.finished");
         if(p == undefined) {
         p = firstmethodtimeId + '_1_' + args.span + '_1___';
         }

         agentSetting.seqId =0;
         var date = new Date();
         var resp_current_time = date.getTime();

         var respTimeAccCav = resp_current_time - (agentSetting.cavEpochDiff*1000);

         var respTime = respTimeAccCav - requestedObj.timeInMillis;

         var cat = category.getCategory(respTime,requestedObj.req['originalUrl']);

         var ad = btconf.matchData(requestedObj.req['originalUrl']);
         if(ad != null){

         newID = ad.BTID;
         newName = ad.BTName;

         console.log('8,' + newID + "," + newName + "\n");
         var statusCode = requestedObj.res['statusCode'];

         btrecord.createAndUpdateBTRecord(newID,newName,respTime,cat,statusCode);
         }

         if (agentSetting.isToInstrument && agentSetting.dataConnHandler) {
         try {

         var data = '4,' + localFlowPathId + ',' + requestedObj.res.statusCode + ',' + cat + ',' + agentSetting.flowMap[localFlowPathId] + p;

         agentSetting.dataConnHandler.client.write(data + "\n");
         delete agentSetting.flowMap[localFlowPathId];
         requestedObj['flowPathId']

         = null;
         }catch(err){
         console.log(err);
         }

         }
         }*/
    }
    catch(err)
    {
        console.log("Error in dumping exit data:" + err);
    }
};

module.exports = new MyFormatter();