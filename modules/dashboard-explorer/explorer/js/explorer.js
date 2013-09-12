function selectService(api, address, id){
    webinos.dashboard.actionComplete(
        {api:api, address:address, id:id},
        function(){
            //Hack needed for some chrome versions that do not close the tab.
            //http://productforums.google.com/forum/#!topic/chrome/GjsCrvPYGlA
            window.open('', '_self', '');
            window.close();
        });
}

function refresh(){
    console.debug("<Webinos explorer> refreshing");       
    logWebinosSession();
    
    $('#explorerView').empty();    
    $('#status').html('STATUS:  ');
    $('#status').append(webinos.session.getPZPId() + ' is connected to ' + webinos.session.getPZHId());
    fillConnectedDevices();        
}


function fillConnectedDevices(){    
    for(var i=0;i<webinos.session.getConnectedDevices().length;i++){                        
        $('#explorerView').append('<li class="pzh">' +
            '<span id="'+ webinos.session.getConnectedDevices()[i].id + '_pzh">' + webinos.session.getConnectedDevices()[i].friendlyName  + '</span>' +
            '<ol class="services" id="'+ webinos.session.getConnectedDevices()[i].id + '"></ol>' +
            '<ul class="pzps" id="'+ webinos.session.getConnectedDevices()[i].id + '_pzp"></ul>' +
            '</li>');
        document.getElementById(webinos.session.getConnectedDevices()[i].id+'_pzh').style.color = (webinos.session.getConnectedDevices()[i].connected == true) ? "green" : "red";
        document.getElementById(webinos.session.getConnectedDevices()[i].id+'_pzh').style.fontWeight = "bold";

        if (webinos.session.getConnectedDevices()[i].pzp) { // only loop if exists. If not enrolled, it doesn't.
            for(var j=0;j<webinos.session.getConnectedDevices()[i].pzp.length;j++){
                $("[id='"+webinos.session.getConnectedDevices()[i].pzp[j].id.split("/")[0]+"_pzp']").append(
                    '<li class="pzp">' +
                    '<span id="'+ webinos.session.getConnectedDevices()[i].pzp[j].id +'_pzp">' + webinos.session.getConnectedDevices()[i].pzp[j].friendlyName +'</span>' +
                    '<ol class="services" id="' + webinos.session.getConnectedDevices()[i].pzp[j].id +'"></ol>' +
                    '</li>');
                document.getElementById(webinos.session.getConnectedDevices()[i].pzp[j].id+'_pzp').style.color = (webinos.session.getConnectedDevices()[i].pzp[j].connected == true) ? "green" : "red";
            }
        }
    }
    fillServices();
}


function fillServices(){
    console.debug("webinos explorer: calling service discovery");
    var searchFor = "*";
    if (params && typeof params.service == "string"){
        searchFor = params.service;
    }
    console.debug("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.debug("Will look for "+searchFor);
    console.debug("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    webinos.discovery.findServices(new ServiceType(searchFor), {
        onFound: function(service){
            console.debug("***************");
            console.debug(service.serviceAddress);
            console.debug("***************");
            var srvHtml = "";
            srvHtml+="<li class='service'>";
            //if(params!=null) 
                srvHtml+="<a onclick='selectService(\""+service.api+"\", \""+service.serviceAddress+"\", \""+service.id+"\")' href='#" + service.id + "'>";
            srvHtml+="<span  style='font-style:italic'>" + service.displayName + "</span><br/><span style='font-size: 0.8em; font-style:italic;'>(" + service.description + ")</span>";
            if (params!=null) srvHtml+="</a>";
            srvHtml+="</li>";
            $("[id='" + service.serviceAddress + "']").append(srvHtml);

        }
    });
}

var params = null;
$(document).ready(function(){    
    $("#refresh").bind('click', refresh);
    webinos.session.addListener('registeredBrowser', function(){
        webinos.dashboard.getData(
            function(tokenData){
                params = tokenData;
                console.debug("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
                console.debug(params);
                console.debug("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
                refresh();
            },
            function(){
                console.debug("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
                console.debug("No Token Found!");
                console.debug("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
                refresh();
            }
        );

    });
});


function logWebinosSession(){
    console.debug("-------------------------------------");
    console.debug('webinos.session.getSessionId()');
    console.debug(webinos.session.getSessionId());
    console.debug("---");
    console.debug('webinos.session.getConnectedPzh()');
    console.debug(webinos.session.getConnectedPzh());
    console.debug("---");
    console.debug('webinos.session.getConnectedPzp()');
    console.debug(webinos.session.getConnectedPzp());
    console.debug("---");
    console.debug('webinos.session.getConnectedDevices()');
    console.debug(webinos.session.getConnectedDevices());
    console.debug("---");
    console.debug('webinos.session.getPZPId()');
    console.debug(webinos.session.getPZPId());
    console.debug("---");
    console.debug('webinos.session.getPZHId()');
    console.debug(webinos.session.getPZHId());
    console.debug("---");
    console.debug('webinos.session.getFriendlyName()');
    console.debug(webinos.session.getFriendlyName());
    console.debug("---");
    console.debug('webinos.session.isConnected()');
    console.debug(webinos.session.isConnected());
    console.debug("---");
    console.debug('webinos.session.getSessionId()');
    console.debug(webinos.session.getSessionId());
    console.debug("---");
    console.debug('webinos.session.getWebinosVersion()');
    console.debug(webinos.session.getWebinosVersion());
    console.debug("---");
    console.debug('webinos.session.getServiceLocation()');
    console.debug(webinos.session.getServiceLocation());
    console.debug("---");
    console.debug('webinos.session');
    console.debug(webinos.session);
    console.debug("-------------------------------------");
} 