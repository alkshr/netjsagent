/**
 * Created by sahil on 10/6/2015.
 */

function util (){}
util.getRequestObject = function(functionArguments)
{
    if(functionArguments == null)

    {
        return null;
    }
    else if(functionArguments.callee.caller == null)
    {
        return null;
    }
    var requestedArgument = util.checkArguments(functionArguments, "IncomingMessage");


    if(requestedArgument.raw || requestedArgument)
        return requestedArgument;

    else
        return  util.getRequestObject(functionArguments.callee.caller.arguments);
}

util.checkArguments = function(args, type){
    var cavisson_details_obj = new Object();
    try {
        if(args == undefined){
            return;
        }
        for (var i = 0; i < args.length; i++) {

            if(args[i] === undefined)
                continue;
            if (args[i].constructor.name == type) {
                if(args[i].flowPathId) {
                    cavisson_details_obj.flowPathId = args[i].flowPathId;
                    cavisson_details_obj.timeInMillis = args[i].timeInMillis;
                    cavisson_details_obj.res = args[i].res;
                    cavisson_details_obj.req=args[i];
                    return cavisson_details_obj;
                }
            }
            if(args[i].raw != undefined && args[i].raw !=null )
            {
                if(args[i].raw.req.flowPathId)
                {
                    cavisson_details_obj.flowPathId = args[i].raw.req.flowPathId;
                    cavisson_details_obj.timeInMillis = args[i].raw.req.timeInMillis;
                    cavisson_details_obj.res = args[i].raw.res;
                    cavisson_details_obj.req=args[i].raw.req;
                    return cavisson_details_obj;
                }

            }
        }
        return false;
    }
    catch(err)
    {
        console.log("Error in checking arguments type" + err);
    }

}
module.exports = util;