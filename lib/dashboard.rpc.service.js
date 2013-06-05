/*******************************************************************************
 *  Code contributed to the webinos project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Copyright 2013 EPU-National Technical University of Athens
 * Author: Christos Botsikas, NTUA
 ******************************************************************************/

var RPCWebinosService = require("webinos-jsonrpc2").RPCWebinosService;
var logger = require("webinos-utilities").webinosLogging(__filename);

var dashboard = require('./dashboard');

var _rpcHandler = null;

var DashboardService = function(rpcHandler, params){
    this.base = RPCWebinosService;
    this.base({
        api: 'Dashboard',
        displayName: 'Dashboard',
        description: 'webinos Dashboard'
    });
    _rpcHandler = rpcHandler;
    if (typeof params.registry == "object"){
        dashboard.setWebinosRegistry(params.registry);
    }else{
        console.log("Dashboard initialization is missing registry");
    }
};

DashboardService.prototype = new RPCWebinosService;

DashboardService.prototype.open = function(params, successCB, errorCB, objectRef){
    if (typeof params.options === "undefined"){
        errorCB("No options provided");
        return;
    }
    dashboard.open(params.options, successCB, errorCB, function(result){
        var rpc = _rpcHandler.createRPC(objectRef, 'onAction', {result: result});
        _rpcHandler.executeRPC(rpc);
    });

};
DashboardService.prototype.getTokenData = function(params, successCB, errorCB, objectRef){
    if (typeof params.tokenId === "undefined"){
        errorCB("No tokenId provided");
        return;
    }
    var storeEntry = dashboard.getTokenData(params.tokenId);
    if (storeEntry){
        successCB(storeEntry);
    }else{
        errorCB("TokenId was not found.");
    }
};
DashboardService.prototype.actionComplete = function(params, successCB, errorCB, objectRef){
    if (typeof params.tokenId === "undefined"){
        errorCB("No tokenId provided");
        return;
    }

    if (dashboard.actionComplete(params.tokenId, params.data)){
        successCB(true);
    }else{
        errorCB("TokenId was not found.");
    }
};
DashboardService.prototype.test = function(params, successCB, errorCB, objectRef){
    successCB(arguments);
};

module.exports = DashboardService;
