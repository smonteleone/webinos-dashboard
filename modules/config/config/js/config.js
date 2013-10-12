var config;
config = (function () {
    var initialized = false;
    var options = {
        enrolled: false,
        deviceId: "",
        deviceName: "",
        deviceType: "unknown",
        pzhId: ""
    };
    return {
        init: function () {
            if (initialized) return;
            webinos.session.addListener('registeredBrowser', config.readOptions);
            $("#fldPzhProvider").on("change", function(){
                if ($(this).val()=="!custom"){
                    $("#customPzhProvider").show("slow", function(){
                        $("#fldPzhProviderCustom").focus();
                    });
                }else{
                    $("#customPzhProvider").hide("slow");
                }
            });
//            this.setOptions();
            initialized = true;
        },
        readOptions: function(){
            var options = {};
            options.enrolled = webinos.session.isConnected();
            options.deviceId = webinos.session.getPZPId();
            options.deviceName = webinos.session.getFriendlyName(options.deviceId);
            var pzps = webinos.session.getConnectedPzp();
            for (var i in pzps){
                if (pzps[i].id==options.deviceId){
                    if (pzps[i].hasOwnProperty("deviceType"))
                        options.deviceType = pzps[i].deviceType;
                    break;
                }
            }
            options.pzhId = webinos.session.getPZHId();
            config.setOptions(options);
        },
        setOptions: function(opts){
            if (typeof opts != "undefined"){
                for (var i in options){
                    if (typeof opts[i] !== "undefined")
                        options[i] = opts[i];
                }
                this.updateStatus();
                this.updateFriendlyName();
                this.updateDeviceType();
            }
            console.log("+++++++++++++");
            console.log(options);
            console.log("+++++++++++++");
        },
        updateStatus: function(){
            if (options.enrolled){
                $('#sumDeviceStatus').text("Enrolled to '"+options.pzhId+"'");
                $('#fldFriendlyName').attr("disabled", "disabled");
                $('#fldDeviceType').attr("disabled", "disabled");
                $("#btnSaveDevice").attr("disabled", "disabled");
                $("#btnEnroll").attr("disabled", "disabled");
                $("#resetDevice").show();
                $("#enrollDevice").hide();
            } else {
                $('#sumDeviceStatus').text("Not enrolled");
                $("#resetDevice").hide();
                $("#enrollDevice").show();
            }
        },
        updateFriendlyName: function(){
            $('#fldFriendlyName').val(options.deviceName);
            $('#sumDeviceName').text(options.deviceName);
        },
        updateDeviceType: function(){
            $('#fldDeviceType').val(options.deviceType);
            $('#sumDeviceType').text(options.deviceType);
        },
        setFriendlyName: function(name){
            if (options.enrolled) return false;
            name = $.trim(name).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            if (name == "") return false;
            options.deviceName = name;
            var msg = {type:'prop', payload: {status:'setFriendlyName', message:name}};
            webinos.session.message_send(msg);
            this.updateFriendlyName();
            return true;
        },
        setDeviceType: function(type){
            if (options.enrolled) return false;
            type = $.trim(type).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            if (type == "") return false;
            options.deviceType = type;
            var msg = {type:'prop', payload: {status:'setDeviceType', message:type}};
            webinos.session.message_send(msg);
            this.updateDeviceType();
            return true;
        },
        doSaveDevice: function(){
            if (options.enrolled) return false;
            config.setFriendlyName($('#fldFriendlyName').val());
            config.setDeviceType($('#fldDeviceType option:selected').val());
        },
        doEnroll: function(){
            if (options.enrolled) return false;
            var pzhAddress = $("#fldPzhProvider").val();
            if (pzhAddress == "!custom")
                pzhAddress = $("#fldPzhProviderCustom").val();
            pzhAddress = $.trim(pzhAddress).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            if (pzhAddress == "") return false;
            if (pzhAddress == "localhost") {
                alert("Localhost is not supported. Please use your PZH ip instead.");
                return false;
            }
            var msg = {type:'prop', payload:{status:'setPzhProviderAddress', message:pzhAddress}};
            webinos.session.message_send(msg);
            window.location.href ="https://" + pzhAddress + "/login?isPzp=true&port="+webinos.session.getPzpPort()+
                "&deviceType="+options.deviceType+"&friendlyName="+options.deviceName;
        },
        doReset: function(){
            if (!options.enrolled) return false;
            var msg = {type: 'prop', payload: {status:'resetDevice'}};
            webinos.session.message_send(msg);
            // and reload the widget after 500ms to refresh the session
            setTimeout(function(){window.location.reload();}, 500);
        }
    }
})();



$(document).ready(function () {
    enableMenuAndInitFirstPage('config-tabs', 'summary');
    var SwTabs = new SwipeableTabs('config-tabs', 'content');
    SwTabs.init();
    $("#btnSaveDevice").bind('click', config.doSaveDevice);
    $("#btnEnroll").bind('click', config.doEnroll);
    $("#btnReset").bind('click', config.doReset);
    config.init();
//    webinos.session.addListener('registeredBrowser', explorer.readOptions);
});