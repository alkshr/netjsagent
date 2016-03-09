/**
 * Created by Siddhant on 04-09-2015.
 */

var fs = require('fs');
//var BTMap = new Object();
var Regex = require("regex");
var  flowpathhandler = require('../flowpath-handler.js');
var agentsetting = require('../agent-setting');

function BTConfiguration()
{

}


BTConfiguration.getData = function (filename) {

    var data = fs.readFileSync(filename).toString().split("\r\n");
    try {
        for(var i = 0; i<data.length; i++) {

            var BTConf = new Object();
            var dataValue = data[i].split("|");
            var urlPattern = dataValue[5];
            BTConf.BTName = dataValue[1];
            BTConf.BTID = dataValue[2];
            BTConf.BTMatchMode = dataValue[3];
            BTConf.BTIncluMode = dataValue[4];

            agentsetting.BTMap[urlPattern] = BTConf;
        }
    }catch (err){
        console.log(err);
    }
}

String.prototype.startsWith = function(searchString, position) {
    position = position || 0;
    return this.indexOf(searchString, position) === position;
};

BTConfiguration.matchData = function(url)
{
    var retBTConf = new Object();
    var  keys = Object.keys(agentsetting.BTMap);
    for (var i = 0; i <keys.length; i++) {
        var BTMapKey = keys[i];
        var BTmapValue = agentsetting.BTMap[keys[i]];

        if(BTmapValue.BTMatchMode == 1){
            if(url.startsWith(BTMapKey)){
                retBTConf.BTID = BTmapValue.BTID;
                retBTConf.BTName = BTmapValue.BTName;
                return retBTConf;
            }
        }else if(BTmapValue.BTMatchMode == 0){

            var regex = new Regex(BTMapKey);
            if(regex.test(url)){
                retBTConf.BTID = BTmapValue.BTID;
                retBTConf.BTName = BTmapValue.BTName;
                return retBTConf;
            }
        }
    }
    return null;

}

module.exports = BTConfiguration;