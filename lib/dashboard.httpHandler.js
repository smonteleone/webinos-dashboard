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
var fs = require('fs');
var node_exists = fs.exists || path.exists;
var node_existsSync = fs.existsSync || path.existsSync;
var webinos_utils = require("webinos-utilities");
var dust = require("dustjs-linkedin");
require("dustjs-helpers");

dust.optimizers.format = function (ctx, node) {
    return node
};
dust.helpers.linkTo = function (chunk, ctx, bodies, params) {
    // Get the values of all the parameters. The tap function takes care of resolving any variable references
    // used in parameters (e.g. param="{name}"
    var module = dust.helpers.tap(params.module, chunk, ctx);

    return chunk.write(dashboard.getUrl({module: module}));
};

var dashboard = require('./dashboard');

var handleRequest = function (pathname, req, res) {
    var parsedUrl = url.parse(req.url, true);
    pathname = normalizePathname(parsedUrl.pathname);
    var urlParts = splitPathname(pathname);
    if (urlParts.request != pathname) {
        redirect(urlParts.request, res);
        return;
    }
    if (typeof parsedUrl.query.dbg != 'undefined') {
        res.writeHead(200, {"Content-Type": "application/json"});
        res.write(JSON.stringify({url: req.url, pathname: pathname, parts: urlParts}, "<br/>", "\t"));
        res.end();
        return;
    }
    if (urlParts.static) {
        webinos_utils.webinosContent.sendFile(res, urlParts.webroot, urlParts.fullpath, "index.html");
    } else if (urlParts.mode == "html") {
        webinos_utils.webinosContent.sendFile(res, urlParts.module.path, path.join(urlParts.module.path, "index.html"), "index.html");
    } else {
        var moduleContentRegex = /<!--(head|content)-->([\s\S]*?)\s*<!--\/\1-->/g;
        var moduleContent = {
            head: "",
            content: ""
        };
        var showNavigation = true;

        if (urlParts.module) {
            showNavigation = urlParts.module.showNavigation;
            var moduleViewPath = path.join(urlParts.module.path, "index.html");
            if (node_existsSync(moduleViewPath)){
                var moduleContentHtml = fs.readFileSync(moduleViewPath, 'utf8');
                var match;
                while (match = moduleContentRegex.exec(moduleContentHtml)) {
                    moduleContent[match[1]] += match[2];
                }
            }
        }

        if (urlParts.mode == "json") {
            res.writeHead(200, {"Content-Type": "application/json"});
            res.write(JSON.stringify(moduleContent, "\n", "\t"));
            res.end();
            return;
        }

        var ctx = {
            showNavigation: showNavigation,
            head: moduleContent.head,
            content: moduleContent.content,
            currentModule: urlParts.module.name || "",
            currentTitle: urlParts.module.title || ""
        };
        if (showNavigation)
            ctx.modules = dashboard.modules.list();

        var template = fs.readFileSync(path.join(__dirname, '../web/') + "index.html", 'utf8');
        var compiled = dust.compile(template, "normal", false);
        dust.loadSource(compiled);
        dust.render("normal",
            ctx
            , function (err, out) {
                if (err) {
                    console.log('Error: ' + err);
                    return;
                }
                res.writeHead(200, {"Content-Type": "text/html"});
                res.write(out);
                res.end();
            });
    }
    return;
};

var normalizePathname = function (pathname) {
    return pathname;
};

var splitPathname = function (pathname) {
    var result = {
        request: "/dashboard",
        module: false,
        static: true,
        relPath: "",
        fullpath: "",
        webroot: path.join(__dirname, '../web/')
    };
    var urlParts;
    if (urlParts = pathname.match(/^\/dashboard(\/.*)?$/)) {
        result.relPath = urlParts[1] || "/";
        if (result.relPath == "/") {
            result.static = false;
        }
    }
    if (urlParts = result.relPath.match(/^\/([A-Za-z0-9-_]+)(\.(json|html)|\/.*)?$/)) {
        var module = dashboard.modules.get(urlParts[1]);
        if (module) {
            result.module = module;
            result.webroot = path.join(module.path, module.name);
            result.relPath = urlParts[2] || "";
            result.static = (!!!urlParts[3] && (result.relPath != "/" && result.relPath != ""));
            result.mode = urlParts[3] || "";
        }
    }
    if (result.module) {
        result.request += "/" + result.module.name;
        if (result.static)
            result.request += result.relPath;
        else {
            switch (result.mode) {
                case 'html':
                case 'json':
                    result.request += "." + result.mode;
                    break;
            }
        }
    } else {
        result.request += result.relPath;
    }
    result.fullpath = path.join(result.webroot, result.relPath);
    return result;
};

var redirect = function (pathname, res) {
    res.statusCode = 301;
    res.setHeader('Location', pathname);
    res.end('Redirecting');
};

module.exports = handleRequest;