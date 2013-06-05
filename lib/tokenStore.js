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

var TokeStore = function(){
    var store = {};
    var uuid;
    try { uuid = require('node-uuid'); } catch(e) { uuid = null; }
    this.set = function(data){
        var tokenId = this.createTokenId();
        store[tokenId] = data;
        return tokenId;
    };
    this.get = function(tokenId){
        tokenId = "" + tokenId;
//        var data = {};
        if (store.hasOwnProperty(tokenId)){
            //stored data could be 'false', that's why
            //we need to wrap inside an object.
            return {data:store[tokenId]};
//            delete store[tokenId];
        }
        return false;
    };
    this.delete = function(tokenId){
        tokenId = "" + tokenId;
        if (store.hasOwnProperty(tokenId)){
            delete store[tokenId];
            return true;
        }
        return false;
    };
    this.createTokenId = function(){
        var token = "";
        if (uuid != null) {
            token += uuid.v1();
        } else {
            token += (((1+Math.random())*0x10000)|0).toString(16).substring(1);
            token += (((1+Math.random())*0x10000)|0).toString(16).substring(1);
            token += (((1+Math.random())*0x10000)|0).toString(16).substring(1);
        }
        return token;
    }
};
module.exports = TokeStore;
