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
    console.log("<Webinos explorer> refreshing");       
    logWebinos();
    
    $('#explorerView').empty();    
    $('#status').html('STATUS:  ');
    if(webinos.session.isConnected()){        
        $('#status').append(webinos.session.getPZPId() + ' is connected to ' + webinos.session.getPZHId());
        fillConnectedDevices();        
    }
    else{ //virgin mode only
        $('#status').append(webinos.session.getPZPId() + ' is not connected');
        $('#explorerView').append("<li class='pzp'>" +
            "<span>"+ webinos.session.getConnectedDevices()[0].friendlyName +"</span>" +
            "<ol class='services' id='" + webinos.session.getConnectedDevices()[0].id + "'></ol>" +
            "</li>");
        fillServices();
    }
}


function fillConnectedDevices(){    
    for(var i=0;i<webinos.session.getConnectedDevices().length;i++){
        $('#explorerView').append('<li class="pzh">' +
            '<span>' + webinos.session.getConnectedDevices()[i].friendlyName + '</span>' +
//            "<ul>" +
//            "<li>Services:" +
            "<ol class='services' id='"+ webinos.session.getConnectedDevices()[i].id + "'></ol>" +
//            "</li>" +
//            "<li>Devices:" +
            "<ul class='pzps' id='"+ webinos.session.getConnectedDevices()[i].id + "_pzp'></ul>" +
//            '</li>' +
//            '</ul>' +
            '</li>');
        
        for(var j=0;j<webinos.session.getConnectedDevices()[i].pzp.length;j++)
            $("[id='"+webinos.session.getConnectedDevices()[i].pzp[j].id.split("/")[0]+"_pzp']").append(
                '<li class="pzp">' +
                '<span>' + webinos.session.getConnectedDevices()[i].pzp[j].friendlyName +'</span>' +
                '<ol class="services" id="' + webinos.session.getConnectedDevices()[i].pzp[j].id +'"></ol>' +
                '</li>');
//        $('#explorerView').append('</ul>');
    }
    fillServices();
}


function fillServices(){
    console.log("webinos explorer: calling service discovery");
    var searchFor = "*";
    if (params && typeof params.service == "string"){
        searchFor = params.service;
    }
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.log("Will look for "+searchFor);
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    webinos.discovery.findServices(new ServiceType(searchFor), {
        onFound: function(service){
            console.log("***************");
            console.log(service.serviceAddress);
            console.log("***************");
            var srvHtml = "";
            srvHtml+="<li class='service'>";
            if (params!=null) srvHtml+="<a onclick='selectService(\""+service.api+"\", \""+service.serviceAddress+"\", \""+service.id+"\")' href='#'>";
            srvHtml+="<span>" + service.displayName + "</span><br/><span style='font-size: 0.8em'>(" + service.description + ")</span>";
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
                console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
                console.log(params);
                console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
                refresh();
            },
            function(){
                console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
                console.log("No Token Found!");
                console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
                refresh();
            }
        );

    });
});


function logWebinos(){
    console.log("-------------------------------------");
    console.log('webinos.session.getSessionId()');
    console.log(webinos.session.getSessionId());
    console.log("---");
    console.log('webinos.session.getConnectedPzh()');
    console.log(webinos.session.getConnectedPzh());
    console.log("---");
    console.log('webinos.session.getConnectedPzp()');
    console.log(webinos.session.getConnectedPzp());
    console.log("---");
    console.log('webinos.session.getConnectedDevices()');
    console.log(webinos.session.getConnectedDevices());
    console.log("---");
    console.log('webinos.session.getPZPId()');
    console.log(webinos.session.getPZPId());
    console.log("---");
    console.log('webinos.session.getPZHId()');
    console.log(webinos.session.getPZHId());
    console.log("---");
    console.log('webinos.session.getFriendlyName()');
    console.log(webinos.session.getFriendlyName());
    console.log("---");
    console.log('webinos.session.isConnected()');
    console.log(webinos.session.isConnected());
    console.log("---");
    console.log('webinos.session.getSessionId()');
    console.log(webinos.session.getSessionId());
    console.log("---");
    console.log('webinos.session.getWebinosVersion()');
    console.log(webinos.session.getWebinosVersion());
    console.log("---");
    console.log('webinos.session.getServiceLocation()');
    console.log(webinos.session.getServiceLocation());
    console.log("---");
    console.log('webinos.session');
    console.log(webinos.session);
    console.log("-------------------------------------");
} 