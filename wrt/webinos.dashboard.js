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

(function () {
    var tokenId=null;
//    var pendingResponse = false;
    if (tokenId = window.location.search.match(/(?:[?&])tokenId=([a-zA-Z0-9-_]*)(?:&.*|)$/)){
       tokenId = tokenId[1];
    }else if (typeof widget !== 'undefined' && widget.args && widget.args.tokenId){
        tokenId = widget.args.tokenId;
    }
    var Dashboard = function(rpcHandler){
        this.open = function(options, successCB, errorCB){
            if (typeof successCB != "function") successCB = function(){};
            if (typeof errorCB != "function") errorCB = function(){};
            var rpc = rpcHandler.createRPC('Dashboard', 'open', {options:options});
            webinos.rpcHandler.executeRPC(rpc,
                function (params){
                    successCB(params);
                },
                function (error){
                    errorCB(error);
                }
            );
            return {
                onAction: function(callback){
                    if (typeof callback != "function") return;
                    rpc.onAction = function(params){
                        callback(params);
                        webinos.rpcHandler.unregisterCallbackObject(rpc);
                    };
                    webinos.rpcHandler.registerCallbackObject(rpc);
                }
            }
        };
        this.getData = function(successCB, errorCB){
            if (tokenId == null){
                errorCB("No token found.");
                return;
            }
            this.getDataForTokenId(tokenId, successCB, errorCB);
        };
        this.getDataForTokenId = function(tokenId, successCB, errorCB){
            if (typeof successCB != "function") successCB = function(){};
            if (typeof errorCB != "function") errorCB = function(){};
            var rpc = rpcHandler.createRPC('Dashboard', 'getTokenData', {tokenId:tokenId});
            webinos.rpcHandler.executeRPC(rpc,
                function (params){
//                    pendingResponse = true;
                    successCB(params);
                },
                function (error){
                    errorCB(error);
                }
            );
        };
        this.actionComplete = function(data, successCB, errorCB){
            if (tokenId == null){
                errorCB("No token found.");
                return;
            }
            pendingResponse = false;
            if (typeof successCB != "function") successCB = function(){};
            if (typeof errorCB != "function") errorCB = function(){};
            var rpc = rpcHandler.createRPC('Dashboard', 'actionComplete', {tokenId:tokenId, data:data});
            webinos.rpcHandler.executeRPC(rpc,
                function (params){
                    successCB(params);
                },
                function (error){
                    errorCB(error);
                }
            );
        };
        this.test = function(params){
            var rpc = rpcHandler.createRPC('Dashboard', 'test', params);
            webinos.rpcHandler.executeRPC(rpc,
                function (params){
                    console.log('**********');
                    console.log('test', params);
                    console.log('**********');
                }
            );
        };
    };

    webinos.dashboard = new Dashboard(webinos.rpcHandler);
}());
