var explorer;
explorer = (function () {
    var VIEW_STATES = {
        none:0,
        services:1,
        devices:2,
        people:3
    };
    var options = {
        select: VIEW_STATES.none,
        show: VIEW_STATES.services,
        multiselect: false,
        service: "*"
    };

    var initialized = false;
    return {
        init: function () {
            if (initialized) return;
            $(document).on("click", ".selectable > .select", function(e){
                explorer.selectMe.apply($(this).parent(), [e]);
            });
            $(document).on("click", ".entry", function(){
                var $entry = $(this);
                if ($entry.hasClass("togglable")){
                    explorer.toggleMyList.apply(this);
                }else if ($entry.hasClass("selectable")){
                    explorer.selectMe.apply(this);
                }
            });

            this.setOptions();
            initialized = true;
        },
        submitResults: function () {
            var results = [];
            $(".checked").each(function(){
                var $this = $(this);
                var result = {
                    id: $this.attr("id"),
                    type: $this.data("type"),
                    friendlyName: $this.data("friendlyName")
                };
                switch (result.type){
                    case "service":
                        result.api = $this.data("api");
                        result.address = $this.data("address");
                        break;
                    case "device":
                        result.deviceType = $this.data("deviceType");
                        break;
                }
                results.push(result);
                return (options.multiselect);
            });
            webinos.dashboard.actionComplete(
                results,
                function () {
                    $("#btn_submit").attr("disabled", "disabled");
                    //Hack needed for some chrome versions that do not close the tab.
                    //http://productforums.google.com/forum/#!topic/chrome/GjsCrvPYGlA
                    window.open('', '_self', '');
                    window.close();
                });
        },
        readOptions: function(){
            webinos.dashboard.getData(
                function (tokenData) {
                    if (typeof tokenData.select == "undefined")
                        tokenData.select = "services";
                    explorer.setOptions(tokenData);
                    $("#btn_submit").removeAttr("disabled");
                    explorer.refresh();
                },
                function () {
                    $("#btn_submit").attr("disabled", "");
                    explorer.refresh();
                }
            );
        },
        setOptions: function(opts){
            if (typeof opts != "undefined"){
                for (var i in options){
                    if (typeof opts[i] !== "undefined")
                        options[i] = opts[i];
                }

                options.select = (""+options.select).toLowerCase();
                if (!/^(people|devices|services|none)$/.test(options.select)){
                    options.select = "none";
                }
                options.select = VIEW_STATES[options.select];

                options.show = (""+options.show).toLowerCase();
                if (!/^(people|devices|services)$/.test(options.show)){
                    options.show = "services";
                }
                options.show = VIEW_STATES[options.show];

                options.multiselect = !!options.multiselect;
            }

            if (options.show>options.select && options.select!=VIEW_STATES.none){
                options.show = (options.select)?options.select:VIEW_STATES.services;
            }

            $("#explorerView").toggleClass("multiselect", options.multiselect);

            console.log("_________________");
            console.log("Dashboard Options:");
            console.log(options);
            console.log("_________________");
        },
        refresh: function () {
            console.debug("<Webinos explorer> refreshing");
            logWebinosSession();

            $('#explorerView').empty();
//            $('#status').html('STATUS:  ')
//                        .append(webinos.session.getPZPId() + ' is connected to ' + webinos.session.getPZHId());
            this.fillConnectedDevices();
        },
        fillConnectedDevices: function () {
            for (var i = 0; i < webinos.session.getConnectedDevices().length; i++) {
                if (webinos.session.getConnectedDevices()[i].pzp) { // only loop if exists. If not enrolled, it doesn't.
                    this.addPzh(webinos.session.getConnectedDevices()[i]);
                    if (options.show <= VIEW_STATES.devices){
                        for (var j = 0; j < webinos.session.getConnectedDevices()[i].pzp.length; j++) {
                            this.addPzp(webinos.session.getConnectedDevices()[i].pzp[j]);
                        }
                    }
                } else {
                    this.addPerson({id: null, friendlyName: 'Your devices'});
                    if (options.show <= VIEW_STATES.devices)
                        this.addPzp(webinos.session.getConnectedDevices()[i]);
                }
            }
            if (options.show <= VIEW_STATES.services)
                this.fillServices();
        },
        addDevice: function(device, type){
            var personId = device.id;
            if (type == "pzp"){
                personId = personId.split("/")[0];
                if (personId == device.id)
                    personId = null;
            }else{
                this.addPerson({id: personId, friendlyName: device.friendlyName});
            }
            if (options.show <= VIEW_STATES.devices){
                var html = '';
                html += '<div class="entry device ' + type + ' ' + device.deviceType + ' one-action" ' +
                    'data-type="device" ' +
                    'data-device-type="' + type + '" ' +
                    'id="' + device.id + '" ' +
                    'data-friendly-name="'+device.friendlyName.replace(/"/g, "&quot;")+'">';
                html +=     '<div class="btn refresh">';
                html +=         '<span class="icon"/>';
                html +=     '</div>';
                html +=     '<div class="btn select">';
                html +=         '<span class="icon"/>';
                html +=     '</div>';
                html +=     '<div class="entry_content">';
                html +=         '<span class="icon toggle"/>';
                html +=         '<span class="icon status"/>';
                html +=         '<span class="label name">' + device.friendlyName + '</span>';
                html +=     '</div>';
                html += '</div>';
                var $entry = $(html);
                if (device.isConnected == true) {
                    $entry.addClass("online");
                    $("[id='person_" + personId + "']").toggleClass("online", true);
                }
                if (options.select == VIEW_STATES.devices) {
                    $entry.addClass("selectable");
                }

                html  = '<ul class="list" id="' + device.id + '_services"></ul>';
                var $list = $(html);

                $("[id='person_" + personId + "_devices']").append(
                    $(document.createElement('li'))
                        .append($entry)
                        .append($list));

                var $person = $("[id='person_" + personId + "']");
                $person.toggleClass("togglable", true);
                if (options.select == VIEW_STATES.people)
                    $person.toggleClass("one-action", false);
            }
        },
        addPzh: function (pzh) {
            this.addDevice(pzh, "pzh");
        },
        addPzp: function (pzp) {
            this.addDevice(pzp, "pzp");
        },
        addService: function (service) {
            var deviceId = service.serviceAddress;
            var html = '';
            html += '<div class="entry service one-action" ' +
                'id="' + service.id + '" ' +
                'data-type="service" ' +
                'data-api="' + service.api + '" ' +
                'data-address="' + service.serviceAddress + '" ' +
                'data-friendly-name="'+service.displayName.replace(/"/g, "&quot;")+'">';
            html +=     '<div class="btn select">';
            html +=         '<span class="icon"/>';
            html +=     '</div>';
            html +=     '<div class="entry_content">';
            html +=         '<span class="icon status"/>';
            html +=         '<span class="label name">' + service.displayName + '</span><br/>';
            html +=         '<span class="label description">(' + service.description + ')</span>';
            html +=     '</div>';
            html += '</div>';
            var $entry = $(html);
            if (options.select == VIEW_STATES.services)
                $entry.addClass("selectable");

            $("[id='" + deviceId + "_services']").append(
                $(document.createElement('li'))
                    .append($entry));

            var $device = $("[id='" + deviceId + "']");
            $device.toggleClass("togglable", true);
            if (options.select == VIEW_STATES.devices)
                $device.toggleClass("one-action", false);
        },
        addPerson: function (person) {
            var html = '';
            html += '<div class="entry person one-action" ' +
                'id="person_' + person.id + '" ' +
                'data-type="person" ' +
                'data-friendly-name="'+person.friendlyName.replace(/"/g, "&quot;")+'">';
            html +=     '<div class="btn select">';
            html +=         '<span class="icon"/>';
            html +=     '</div>';
            html +=     '<div class="entry_content">';
            html +=         '<span class="icon toggle"/>';
            html +=         '<span class="icon status"/>';
            html +=         '<span class="label name">' + person.friendlyName + '</span>';
            html +=     '</div>';
            html += '</div>';
            var $entry = $(html);
            if (options.select == VIEW_STATES.people) {
                $entry.addClass("selectable");
            }

            html  = '<ul class="list" id="person_' + person.id + '_devices"></ul>';
            var $list = $(html);

            $('#explorerView').append(
                $(document.createElement('li'))
                    .append($entry)
                    .append($list));
        },
        toggleMyList: function (event) {
            var $entry = $(this);
            $entry.parentsUntil("#explorerView", "li").eq(0).children(".list").eq(0).toggleClass("opened");
            $entry.toggleClass("open");
            if (event)
                event.stopPropagation();
        },
        selectMe: function (event) {
            var $entry = $(this);
//            var $entry = $(this).parent();
            if (!options.multiselect){
                $(".checked").removeClass("checked");
            }
            $entry.toggleClass("checked");
            if (event)
                event.stopPropagation();
        },
        fillServices: function () {
            console.debug("webinos explorer: calling service discovery");
            var searchFor = ($.isArray(options.service))?options.service : [options.service];
            for (var i=0; i<searchFor.length; i++){
                console.debug("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
                console.debug("Will look for " + searchFor[i]);
                console.debug("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
                webinos.discovery.findServices(new ServiceType(searchFor[i]), {
                    onFound: function (service) {
                        console.debug("***************");
                        console.debug(service.serviceAddress);
                        console.debug("***************");
                        explorer.addService(service);
                    }
                });
            }
        }
    }
})();



$(document).ready(function () {
    $("#btn_refresh").bind('click', explorer.refresh);
    $("#btn_submit").bind('click', explorer.submitResults);
    explorer.init();
    webinos.session.addListener('registeredBrowser', explorer.readOptions);
    webinos.session.addListener('update', explorer.readOptions);
});

function logWebinosSession() {
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
