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
var path = require('path');
var url = require('url');
var webinos_utils = require("webinos-utilities");

var dashboard = require('./dashboard');

var handleRequest = function (pathname, req, res) {
    var parsedUrl = url.parse(req.url, true);
    pathname = normalizePathname(parsedUrl.pathname);
    var urlParts = splitPathname(pathname);
    if (urlParts.request != pathname){
        redirect(urlParts.request, res);
        return;
    }
    if (typeof parsedUrl.query.dbg != 'undefined'){
        res.writeHead(200, {"Content-Type": "application/json"});
        res.write(JSON.stringify({uri: pathname, parts: urlParts},"<br/>","\t"));
        res.end();
        return;
    }
    webinos_utils.webinosContent.sendFile(res, urlParts.webroot, urlParts.fullpath, "index.html");
    return;
};

var normalizePathname = function (pathname){
    return pathname;
};

var splitPathname = function (pathname){
    var result = {
        request: "/dashboard",
        module: {},
        relPath: "",
        fullpath: "",
        webroot: path.join(__dirname, '../web/')
    };
    var urlParts;
    if (urlParts = pathname.match(/^\/dashboard(\/.*)?$/)){
        result.relPath = urlParts[1] || "/";
    }
    if (urlParts = result.relPath.match(/^\/([A-Za-z0-9-_]+)(\/.*)?$/)){
        var module = dashboard.modules.get(urlParts[1]);
        if (module.name){
            result.module = module;
            result.webroot = module.webroot;
            result.relPath = urlParts[2] || "/";
        }
    }
    if (result.module.name)
        result.request += "/" + result.module.name;
    result.request += result.relPath;
    result.fullpath = path.join(result.webroot, result.relPath);
    return result;
};

var redirect = function (pathname, res){
    res.statusCode = 301;
    res.setHeader('Location', pathname);
    res.end('Redirecting');
};

module.exports = handleRequest;