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
var logger = require("webinos-utilities").webinosLogging(__filename);

var tokenStore = new (require('./tokenStore'))();
var webinosRegistry = null;
var webinosApplauncher = null;


function setWebinosRegistry(registry){
    webinosRegistry = registry;
}
function getApplauncher(){
    if (webinosApplauncher == null){
        if (webinosRegistry == null){
            logger.error("Dashboard is not initialized correctly. Registry is missing.");
            return false;
        }
        var registryLocalServices = webinosRegistry.getRegisteredObjectsMap();
        var applauncherAPI = registryLocalServices["http://webinos.org/api/applauncher"];
        if (applauncherAPI.length == 0){
            logger.error("There is no local applauncher API.");
            return false;
        }
        webinosApplauncher = applauncherAPI[0];
    }
    return webinosApplauncher;
}
function getURL(params){
    var url = "http://localhost:8080/dashboard/";
    var module = getModule(params.module||"");
    if (module.name) url += module.name + "/";
    return url;
}
var open = function (params, successCB, errorCB, actionCB){
    if (typeof successCB != "function") successCB = function(){};
    if (typeof errorCB != "function") errorCB = function(){};
    if (typeof actionCB != "function") actionCB = function(){};
    if (typeof params == 'undefined' || params==null) params={};
    if (typeof params == 'string') params={module:params};
    if (!params.hasOwnProperty('module')) params.module = "";
    var applauncherAPI;
    if(applauncherAPI = getApplauncher()){
        var dashboardUrlToOpen = getURL(params);
        if (params.hasOwnProperty('data')){
            var tokenId = tokenStore.set({params:params.data, actionCB:actionCB});
//                var tokenId = dashboardTokenData.set(params.options);
            dashboardUrlToOpen += "?tokenId=" + tokenId;
        }
        applauncherAPI.launchApplication(
            [dashboardUrlToOpen],
            function(){
                successCB(true);
            },
            function(error){
                errorCB("Applauncher API failed to open dashboard. Error: "+error);
            }
        );
    } else {
        errorCB("There is no local applauncher API.");
    }
};
var pendingActions = {};
var getTokenData = function (tokenId){
    var token = tokenStore.get(tokenId);
    if (token){
        tokenStore.delete(tokenId);
        pendingActions[tokenId] = token.data.actionCB;
        return token.data.params;
    }else{
        return false;
    }
};
var actionComplete = function (tokenId, data){
    if (pendingActions.hasOwnProperty(tokenId)){
        pendingActions[tokenId](data);
        delete pendingActions[tokenId];
        return true;
    }
    return false;
};

var dashboardModules = {};
var setModule = function(name, webroot){
    dashboardModules[name] = {
        name: name,
        webroot: webroot,
        main: 'index.html'
    };
};
var getModule = function(name){
    return dashboardModules[name] || {};
};

module.exports = {
    setWebinosRegistry: setWebinosRegistry,
    open: open,
    getTokenData: getTokenData,
    actionComplete: actionComplete,
    modules:{
        add: setModule,
        get: getModule
    }

};
