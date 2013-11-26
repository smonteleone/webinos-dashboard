var initialServices = {}, timeout, serviceId;

function hasValue(refNode){
	var children = refNode.children,
	res = false;

	for (var i = 0; i < children.length; i++) {
		var child = children[i]; 
		if (child.type == "fieldset"){
			res |= hasValue(child);
		} else {
			res |= (children[i].value && children[i].value.length > 0) ;
		}
		if (res) {
			break;
		}
	}

	return res;
}

function getConfiguration(refNode) {
	var length = refNode.children.length,
	element = null,
	isArray = false,
	isOptional = false,
	res = "";

	for (var i = 0; i < length; i++) {
		element = refNode.children[i];
		isOptional = (element.getAttribute("class") + '').search(/\b(optional)\b/gi) > -1;
		switch(element.type)
		{
			case "text":
			case "hidden":
			case "select-one":
				if (!isOptional || (element.value && element.value.length > 0)) {
					res += element.name?('"' + element.name + '":'):'';
					res += '"' + element.value + '"';
				}
				break;

			case "fieldset":
				if (!isOptional || hasValue(element)) {
					if (element.name) {
						res += '"' + element.name + '":';
					}

					tmp = getConfiguration(element);

					if (tmp.length > 0 || element.name) {
						isArray = (element.getAttribute("class") + '').search(/\b(array)\b/gi) > -1;
						openingChar = (isArray?'[':'{')
						closingChar = (isArray?']':'}');
						res += openingChar + tmp + closingChar;
					}
				}
				break;
		}
    	if (res.length > 0) {
			res += ((i==length-1)?'':',');
		}
	}

	return res.replace(/,+/g, ",").replace(/,+$/, "");
}

function setConfiguration(apiName, apiURI)
{
    var successCB = function (data) {
        alert("Configuration set!");
        webinos.discovery.findServices(new ServiceType(apiURI), {
            onFound: function(service) {
                if (!initialServices[service.id]){
                    console.log(service.id);
                    showPeopleForService(service.id);
                }
            }
        });
    }

    var errorCB = function (err) {
        alert("Error while setting configuration.");
        console.log(err);
    }
    
    webinos.discovery.findServices(new ServiceType(apiURI), {
        onFound: function(service) { 
            initialServices[service.id] = service;
            if (timeout) {
                clearTimeout(timeout)
            }
            timeout = setTimeout(
                function() {
                    console.log(initialServices);
                    var rootNode = document.getElementById(apiName);
                    var config = '{' + getConfiguration(rootNode) + '}';
                    console.log("Config: " + config);
                    webinos.configuration.setServiceConfiguration(" ", apiURI, JSON.parse(config).params.instances, successCB, errorCB);
                }
              , 300);
        } 
    });

}

function convert(refNode, refTemplate, refData, isNewArrayElement)
{
	for (var key in refTemplate) {
        var templateElement = refTemplate[key];
        var dataElement = refData ? refData[key] : undefined;
        var iterations = 1;

        if (typeof dataElement == "object" && dataElement.length > 0){
            iterations = dataElement.length;
        }
        
        switch (templateElement.type){
            case "text":
                var label = document.createElement("label"); 
                label.textContent = key;
                if (templateElement.className && templateElement.className.indexOf("hidden") > -1) {
                    label.className = "hidden";
                }
                refNode.appendChild(label);

                var input = document.createElement("input");
                input.type = "text";
                input.name = key;
               
                if (dataElement){
                    input.value = dataElement;
                } else if (templateElement.defaultValue) {
                    input.value = templateElement.defaultValue;
                }

                if (templateElement.className) {
                    input.className = templateElement.className.join(' ');
                }

                refNode.appendChild(input);

                refNode.appendChild(document.createElement("br"));
                break;

            case "select":
                var label = document.createElement("label"); 
                label.textContent = key;
                if (templateElement.className && templateElement.className.indexOf("hidden") > -1) {
                    label.className = "hidden";
                }
                refNode.appendChild(label);

                select = document.createElement("select");
                select.name = key;

                if (templateElement.className) {
                    select.className = templateElement.className.join(' ');
                }

                for (var k in templateElement.values) {
                    optionGroupElement = templateElement.values[k];
                    optgroup = null;

                    if (k.length != 0) {
                        optgroup = document.createElement("optgroup");
                        optgroup.label = k;
                    }

                    for (var j in optionGroupElement) {
                        optionElement = optionGroupElement[j];
                        option = document.createElement("option");
                        option.value = optionElement.value;
                        option.textContent = optionElement.text;
                        if (k.length != 0) {
                            optgroup.appendChild(option);
                        } else {
                            select.appendChild(option);
                        }
                    }
                    if (k.length != 0) {
                        select.appendChild(optgroup);
                    }
                }
                refNode.appendChild(select);

                refNode.appendChild(document.createElement("br"));
                break;

            case "object":

                var fieldset = document.createElement("fieldset");
                fieldset.name = key;
                if (templateElement.className) {
                    fieldset.className = templateElement.className.join(' ');
                }

                if (templateElement.caption) {
                    var legend = document.createElement("legend");
                    legend.textContent = templateElement.caption;
                    fieldset.appendChild(legend);
                }

                refNode.appendChild(convert(fieldset, templateElement.content, dataElement));
                break;

            case "array":
                var fieldset = document.createElement("fieldset");
                fieldset.id = key;
                fieldset.name = key;
                if (templateElement.className) {
                    fieldset.className = templateElement.className.join(' ');
                }
                fieldset.className += " array";
                
                if (templateElement.caption) {
                    var legend = document.createElement("legend");
                    legend.textContent = templateElement.caption;
                    fieldset.appendChild(legend);
                }

                if (dataElement && dataElement.length) {
                    for(var i = dataElement.length - 1; i >= 0; i--){
                        appendArrayElement(fieldset, templateElement.content, dataElement[i]);
                    }
                }
                refNode.appendChild(fieldset);
            break;
        }
    }
    return refNode;
}

function appendArrayElement(arrayRootNode, templateElement, dataElement){
    var elementFieldset = document.createElement("fieldset");
    arrayRootNode.appendChild(convert(elementFieldset, templateElement, dataElement, true));
}

function refresh(){
    $('#APIsData').empty();
    fillAPIsList();
}

function toggleDiv(div, togglingElement){
   $('#' + div).slideToggle();
   if ($('#' + togglingElement).attr('class') === 'expanderControl'){
       $('#' + togglingElement).attr('class', 'expanderControl_collapse');
   } else {
       $('#' + togglingElement).attr('class', 'expanderControl');
   }
}

function fillAPIsList(){

    var errorCB = function () {
        alert("Error while retrieving configuration.");
    };

    var fillHeader = function (data) {

        var fillConfigurationData = function (data){
            console.log("config.json content: " + JSON.stringify(params));
            console.log("template.json content: " + JSON.stringify(data.template));
            $('#' + data.apiName + '_config').append("<input type='button' onClick='javascript:setConfiguration(\"" + data.apiName + "\", \"" + params.apiURI + "\")' value='Set Configuration'>");

            div = document.getElementById(data.apiName + "_config");
            
            form = document.createElement("form");
            form.id = data.apiName;

            div.appendChild(convert(form, data.template, params));
        }

        for (var d in data)
        {
            var html = [
                "<br>"
              , "<h3 id='" + data[d].name + "_expander'>"
              , "<span id='" + data[d].name + "_expanderControl' class='expanderControl'>&nbsp;</span>"
              , data[d].name + "</h3>"
              , "<br>"
              , "<div id='" + data[d].name + "_config' class='config'/>"
                ];
            $('#APIsData').append(html.join(""));
            $('#'+ data[d].name + '_expander').click(toggleDiv.bind(this, data[d].name + "_config", data[d].name + "_expanderControl"));


            webinos.configuration.getAPIServicesConfiguration(data[d], fillConfigurationData, errorCB);
        }
    };

    webinos.discovery.findConfigurableAPIs((params && params.apiURI) ? params.apiURI : null, fillHeader, errorCB);
} 

var params = null;
 
$(document).ready(function(){    
    webinos.session.addListener('registeredBrowser', function(){
        webinos.dashboard.getData(
            function(tokenData){
                params = tokenData;
                console.log("***********************************" + JSON.stringify(params) + "******************************************");
                refresh();
            },
            function(){
                console.log("***************************************************************************");
                console.log("No Token Found!");
                console.log("***************************************************************************");
                refresh();
            }
        );

    });
});

var friendsURI = 'http://webinos.org/subject/id/known';


function showPeopleForService(serviceId) {
    
    getPolicy_PeopleForServices(serviceId, function(people) {
        var permissions = {};

        people.map(function (person) {
            if (person != 'anyUser') {
                var permission = {
                    id: person,
                    personId: person,
                    name: person,
                    serviceId: serviceId,
                    perm: 1
                }
                if (!permissions[person]){
                    permissions[person] = permission;
                }
            }
        });
        webinos.session.getConnectedDevices().map( function(elem) {
            if (people.indexOf(elem.id) == -1) {
                var permission = {
                    id: elem.id,
                    personId: elem.id,
                    name: elem.id,
                    serviceId: serviceId,
                    perm: -1
                }
                if (!permissions[elem.id]) {
                    permissions[elem.id] = permission;
                }
            }
        });

        $("#people").append("<br><br><h1>Share with</h1><br>");
        Object.keys(permissions).map(function (k) {
			if(permissions[k].serviceId == serviceId) {
				if(permissions[k].perm == 1) {
                    $("#people").append("<span id='" + permissions[k].personId + "' class='allow'>" + permissions[k].personId + "</span>");
                    console.log("Allow " + permissions[k].personId);

				} else if(permissions[k].perm == -1) {
                    $("#people").append("<span id='" + permissions[k].personId + "' class='deny'>" + permissions[k].personId + "</span>");
                    console.log("Deny " + permissions[k].personId);
				}
			}
            $("span").on("click", function(){
                if ($(this).attr("class") == "allow") {
                    var self = $(this);
                    console.log("\n\n\n\n" + $(this).attr('id'));
                    
                    setPolicy_ServiceForPeople(
                        $(this).attr("id"),
                        serviceId,
                        "disable",
                        function (){
                            self.attr("class", "deny");
                        },
                        function (){
                            console.log("Error occurred while changing permission");
                        }
                    );
                } else if ($(this).attr("class") == "deny") {
                    var self = $(this);
                    setPolicy_ServiceForPeople(
                        $(this).attr("id"), 
                        serviceId, 
                        "enable",
                        function () {
                            self.attr("class", "allow");
                        },
                        function (){
                            console.log("Error occurred while changing permission");
                        }
                    );
                } 
            });
		});

    });
}

var getPolicy_PeopleForServices = function() {
    var requestorId = null;
    var serviceId = arguments[0];
    if (arguments.length == 2) {
        var successCB = arguments[1];
    } else if (arguments.length == 3) {
        var requestorId = arguments[1];
        var successCB = arguments[2];
    }

    var result = [];
    var done = function(callback) {
        var counter = 0;
        return function (incr) {
            if (0 == (counter += incr))
                callback();
        };
    };
    var sync = done(function() { successCB(result); });
    var test = function (ps, request, user) {
        sync(+1);
        policyeditor.testPolicy(ps, request, function(res) {
            if (res.effect == 0) {
                result.push(user);
            }
            sync(-1);
        });
    };

    webinos.discovery.findServices(new ServiceType('http://webinos.org/core/policymanagement'), {
        onFound: function(service) {
            policyeditor = service;
            policyeditor.bindService({
                onBind: function(service) {
                    policyeditor.getPolicySet(0, function(ps) {
                        var policy = ps.toJSONObject()
                        var policyString = JSON.stringify(policy);
                        var users = webinos.session.getConnectedDevices();
                        for (var i = -1; i < users.length; i++) {
                            var request = {};
                            request.resourceInfo = {};
                            if (isWebinosAPI(serviceId)) {
                                request.resourceInfo.apiFeature = serviceId;
                            }
                            else {
                                request.resourceInfo.serviceId = serviceId;
                            }

                            if(requestorId != null) {
                                request.deviceInfo = {};
                                request.deviceInfo.requestorId = requestorId;
                            }

                            if (i > -1) {
                                request.subjectInfo = {};
                                request.subjectInfo.userId = users[i].id;
                                test(ps, request, users[i].id);
                            }
                            else {
                                test(ps, request, 'anyUser');
                            }

                        }
                    }, null);
                }
            });
        }
    });
};

var setPolicy_ServiceForPeople = function() {
    var userId = arguments[0];
    var serviceId = arguments[1];
    var requestorId = null;
    if (arguments.length == 5) {
        var access = arguments[2];
        var successCB = arguments[3];
        var errorCB = arguments[4];
    } else if (arguments.length == 6) {
        var requestorId = arguments[2]
        var access = arguments[3];
        var successCB = arguments[4];
        var errorCB = arguments[5];
    }

    webinos.discovery.findServices(new ServiceType('http://webinos.org/core/policymanagement'), {
        onFound: function(service) {
            policyeditor = service;
            policyeditor.bindService({
                onBind: function(service) {
                    policyeditor.getPolicySet(0, function(ps) {
                        var request = {};
                        request.subjectInfo = {};
                        request.subjectInfo.userId = userId;
                        request.resourceInfo = {};
                        if (isWebinosAPI(serviceId)) {
                            request.resourceInfo.apiFeature = serviceId;
                        }
                        else {
                            request.resourceInfo.serviceId = serviceId;
                        }
                        if (requestorId != null) {
                            request.deviceInfo = {};
                            request.deviceInfo.requestorId = requestorId;
                        }
                        policyeditor.testPolicy(ps, request, function(res) {
                            if ((access == 'enable' && res.effect != 0) ||
                                (access == 'disable' && res.effect != 1)) {

                                var newPs = editPolicy(policyeditor, ps, access, request, res);
                                if (!newPs.error) {
                                    policyeditor.testNewPolicy(newPs, request, function (result) {
                                        if ((access == 'enable' && result.effect == 0) ||
                                            (access == 'disable' && result.effect == 1)) {
                                            policyeditor.save(newPs, function() {
                                                successCB('save succesful');
                                            }, function() {
                                                errorCB('save failed');
                                            });
                                        } else {
                                            errorCB('editing failed');
                                        }
                                    }, null);
                                } else {
                                    errorCB(newPs.error);
                                }
                            }
                            else {
                                successCB();
                            }
                        });
                    }, null);
                }
            });
        }
    });
};

var editPolicy = function (pe, ps, access, request, res) {
    var userId = request.subjectInfo.userId;
    var serviceId = null;
    if (request.resourceInfo.serviceId) {
        serviceId = request.resourceInfo.serviceId;
    }
    else if (request.resourceInfo.apiFeature) {
        serviceId = request.resourceInfo.apiFeature;
    }
    var requestorId = null;
    var date = new Date().getTime();
    if (request.deviceInfo) {
        requestorId = request.deviceInfo.requestorId;
    }

    var path = JSON.parse(res.user.path);

    // policy with devices
    if (requestorId != null) {
        var policySetPosition = 0;
        var policyPosition = 0;

        var policySet = ps.getPolicySet([userId]);
        if (policySet.matched.length > 0) {
            policySet = policySet.matched[0].toJSONObject();
            // get policy set position
            for (var i = 0; i < path['policy-set'].length; i++) {
                if (path['policy-set'][i].id === policySet.$.id) {
                    policySetPosition = path['policy-set'][i].position;
                    break;
                }
            }

            var policy = null;
            var userIds = policySet.target[0].subject[0]['subject-match'][0].$.match.split(',');
            // check if target contains the friends generic URI or a bag
            if (policySet.target[0].subject[0]['subject-match'][0].$.match === friendsURI || userIds.length > 1) {
                if (userIds.length > 1) {
                    var index = userIds.indexOf(userId);
                    userIds.splice(index, 1);
                    policySet.target[0].subject[0]['subject-match'][0].$.match = userIds.toString();
                }
                // make a copy of the policySet (clone object)
                policySet = JSON.parse(JSON.stringify(policySet));
                // modify policySet ids
                policySet.$.id = 'ps_' + userId + '_' + date;
                policySet.$.description = userId + '-policySet';
                // modify target to replace the generic URI
                policySet.target[0].subject[0]['subject-match'][0].$.match = userId;
                for (var i = 0; i < policySet.policy.length; i++) {
                    // modify policy's and rules' ids
                    var id = 'Default';
                    if (policySet.policy[i].target) {
                        var id = policySet.policy[i].target[0].subject[0]['subject-match'][0].$.match;
                    }
                    policySet.policy[i].$.id = 'p_' + userId + id + '_' + date;
                    policySet.policy[i].$.description = userId + id + '-policy';
                    for (var j = 0; j < policySet.policy[i].rule.length; j++) {
                        policySet.policy[i].rule[j].$.id = 'r_' + userId + id + '_' + ++date;
                    }
                }
            }
            // policy set without friends URI
            else {
                // remove old policy set
                ps.removePolicySet(policySet.$.id);
            }
            var policySetObject = new pe.policyset(policySet);
            var result = policySetObject.getPolicy([requestorId]);
            if (result.matched.length > 0) {
                policy = result.matched[0].toJSONObject();
            }
            else if (result.generic.length > 0) {
                // start from default policy when adding a new device
                policy = result.generic[0].toJSONObject();
            }
            if (policy != null) {
                // get policy position
                for (var i = 0; i < path['policy-set'].length; i++) {
                    if (path['policy-set'][i].id === policySet.$.id) {
                        for (var j = 0; j < path['policy-set'][i].policy.length; j++) {
                            if (path['policy-set'][i].policy[j].id === policy.$.id) {
                                policyPosition = path['policy-set'][i].policy[j].position;
                                break;
                            }
                        }
                        break;
                    }
                }
            }
        }
        // Start from default policy set when adding a new user
        else if (policySet.generic.length > 0) {
            policySet = policySet.generic[0].toJSONObject();
            // get policy set position
            for (var i = 0; i < path['policy-set'].length; i++) {
                if (path['policy-set'][i].id === policySet.$.id) {
                    policySetPosition = path['policy-set'][i].position;
                    break;
                }
            }

            // make a copy of the policySet (clone object)
            policySet = JSON.parse(JSON.stringify(policySet));
            // modify policySet ids
            policySet.$.id = 'ps_' + userId + '_' + date;
            policySet.$.description = userId + '-policySet';
            for (var i = 0; i < policySet.policy.length; i++) {
                // modify policy's and rules' ids
                var id = 'Default';
                if (policySet.policy[i].target) {
                    var id = policySet.policy[i].target[0].subject[0]['subject-match'][0].$.match;
                }
                policySet.policy[i].$.id = 'p_' + userId + id + '_' + date;
                policySet.policy[i].$.description = userId + id + '-policy';
                for (var j = 0; j < policySet.policy[i].rule.length; j++) {
                    policySet.policy[i].rule[j].$.id = 'r_' + userId + id + '_' + ++date;
                }
            }
            policySet.target = [];
            policySet.target.push({'subject': [{'subject-match': [{'$' : {'attr' : 'user-id', 'match' : userId}}]}]});
            var policySetObject = new pe.policyset(policySet);
            var result = policySetObject.getPolicy([requestorId]);
            if (result.matched.length > 0) {
                policy = result.matched[0].toJSONObject();
            }
            else if (result.generic.length > 0) {
                // start from default policy when adding a new device
                policy = result.generic[0].toJSONObject();
            }
            if (policy != null) {
                // get policy position
                for (var i = 0; i < path['policy-set'].length; i++) {
                    if (path['policy-set'][i].id === policySet.$.id) {
                        for (var j = 0; j < path['policy-set'][i].policy.length; j++) {
                            if (path['policy-set'][i].policy[j].id === policy.$.id) {
                                policyPosition = path['policy-set'][i].policy[j].position;
                                break;
                            }
                        }
                        break;
                    }
                }
            }
        }
        // add new policySet
        else {
            policySet = ps.createPolicySet('ps_' + userId + '_' + date, 'first-matching-target', userId + '-policy');
            policySet = policySet.toJSONObject();
            // add default rule
            policySet.policy = [];
            policySet.policy.push({'rule': [{'$' : {'effect' : 'deny', 'id' : 'r_' + userId + '_default'}}]});
        }

        if (policy != null) {
            // this is not the default policy
            if (policy.target) {
                var requestorIds = policy.target[0].subject[0]['subject-match'][0].$.match.split(',');
                // check if target contains a bag
                if (requestorIds.length > 1) {
                    var index = requestorIds.indexOf(requestorId);
                    requestorIds.splice(index, 1);
                    policy.target[0].subject[0]['subject-match'][0].$.match = requestorIds.toString();
                    // make a copy of the policy (clone object)
                    policy = JSON.parse(JSON.stringify(policy));
                    // modify policy's and rules' ids
                    policy.$.id = 'p_' + userId + requestorId + '_' + date;
                    policy.$.description = userId + requestorId + '-policy';
                    for (var i = 0; i < policy.rule.length; i++) {
                        policy.rule[i].$.id = 'r_' + userId + requestorId + '_' + ++date;
                    }
                    // modify target to replace the generic URI
                    policy.target[0].subject[0]['subject-match'][0].$.match = requestorId;
                    policySet.policy.splice(policyPosition, 0, policy);
                }
            }
            // this is the default policy
            else {
                // make a copy of the policy (clone object)
                policy = JSON.parse(JSON.stringify(policy));
                // modify policy's and rules' ids
                policy.$.id = 'p_' + userId + requestorId + '_' + date;
                policy.$.description = userId + requestorId + '-policy';
                for (var i = 0; i < policy.rule.length; i++) {
                    policy.rule[i].$.id = 'r_' + userId + requestorId + '_' + ++date;
                }
                // add target
                policy.target = [];
                policy.target.push({'subject': [{'subject-match': [{'$' : {'attr' : 'requestor-id', 'match' : requestorId}}]}]});
                policySet.policy.splice(policyPosition, 0, policy);
            }
            policy = removeOldResourceMatch(policy, serviceId, access);
        }
        // add new policy
        else {
            policy = createNewPolicy(ps, 'requestor-id', requestorId, userId + requestorId, date);
            policySet.policy.splice(0, 0, policy);
        }
        policy = addResource(policy, userId + requestorId, serviceId, access, ++date);

        var newPolicySet = new pe.policyset(policySet);
        ps.addPolicySet(newPolicySet, policySetPosition);

    }
    // policy without devices
    else {
        var policy = ps.getPolicy([userId]);
        var position = 0;
        if (policy.matched.length > 0) {
            policy = policy.matched[0].toJSONObject();
            for (var i = 0; i < path.policy.length; i++) {
                if (path.policy[i].id === policy.$.id) {
                    position = path.policy[i].position;
                    break;
                }
            }
            var userIds = policy.target[0].subject[0]['subject-match'][0].$.match.split(',');
            // check if target contains the friends generic URI or a bag
            if (policy.target[0].subject[0]['subject-match'][0].$.match === friendsURI || userIds.length > 1) {
                if (userIds.length > 1) {
                    var index = userIds.indexOf(userId);
                    userIds.splice(index, 1);
                    policy.target[0].subject[0]['subject-match'][0].$.match = userIds.toString();
                }
                // make a copy of the policy (clone object)
                policy = JSON.parse(JSON.stringify(policy));
                // modify policy's and rules' ids
                policy.$.id = 'p_' + userId + '_' + date;
                policy.$.description = userId + '-policy';
                for (var i = 0; i < policy.rule.length; i++) {
                    policy.rule[i].$.id = 'r_' + userId + '_' + ++date;
                }
                // modify target to replace the generic URI
                policy.target[0].subject[0]['subject-match'][0].$.match = userId;
            }
            else {
                // remove the old policy
                ps.removePolicy(policy.$.id);
            }

            policy = removeOldResourceMatch(policy, serviceId, access);
        } else {
            if (policy.generic.length > 0) {
                policy = policy.generic[0].toJSONObject();
                for (var i = 0; i < path.policy.length; i++) {
                    if (path.policy[i].id === policy.$.id) {
                        position = path.policy[i].position;
                        break;
                    }
                }
                // make a copy of the policy (clone object)
                policy = JSON.parse(JSON.stringify(policy));
                // modify policy's and rules' ids
                policy.$.id = 'p_' + userId + '_' + date;
                policy.$.description = userId + '-policy';
                for (var i = 0; i < policy.rule.length; i++) {
                    policy.rule[i].$.id = 'r_' + userId + '_' + ++date;
                }
                // add target
                policy.target = [];
                policy.target.push({'subject': [{'subject-match': [{'$' : {'attr' : 'user-id', 'match' : userId}}]}]});
                policy = removeOldResourceMatch(policy, serviceId, access);
            }
            else {
                // new user, add policy
                policy = createNewPolicy(ps, 'user-id', userId, userId, date);
            }
        }

        policy = addResource(policy, userId, serviceId, access, ++date);

        var newPolicy = new pe.policy(policy);
        ps.addPolicy(newPolicy, position);
    }

    return ps;
};

var removeOldResourceMatch = function (policy, serviceId, access) {
    var removedResourceMatch = false
    for (var i = 0; i < policy.rule.length; i++) {
        if ((policy.rule[i].$.effect == 'permit' && access == 'disable') ||
            (policy.rule[i].$.effect == 'deny' && access == 'enable')) {
            if (policy.rule[i].condition && (policy.rule[i].condition[0].$.combine == 'or' ||
                (policy.rule[i].condition[0].$.combine == 'and' && policy.rule[i].condition[0]['resource-match'].length < 2))) {

                for (var j = 0; j < policy.rule[i].condition[0]['resource-match'].length; j++) {
                    if (policy.rule[i].condition[0]['resource-match'][j].$.match == serviceId) {
                        policy.rule[i].condition[0]['resource-match'].splice(j,1);
                        removedResourceMatch = true;
                        break;
                    }
                }
                if (removedResourceMatch == true && policy.rule[i].condition[0]['resource-match'].length == 0) {
                    policy.rule.splice(i,1);
                    break;
                }
            }
        }
    }
    return policy;
}

var createNewPolicy = function (ps, attr, match, id, date) {
    var policy = ps.createPolicy('p_' + id + '_' + date, 'first-applicable', id + '-policy');
    var subject = {};
    subject['subject-match'] = [];
    subject['subject-match'].push({'$' : {'attr' : attr, 'match' : match}});
    policy.addSubject('s_' + id, subject);
    policy = policy.toJSONObject();
    // add default rule
    policy.rule = [];
    policy.rule.push({'$' : {'effect' : 'deny', 'id' : 'r_' + id + '_default'}});
    return policy;
}

var addResource = function (policy, Id, serviceId, access, date) {
    var addedResourceMatch = false;

    // add new resource match
    for (var i = 0; i < policy.rule.length; i++) {
        if (((policy.rule[i].$.effect == 'permit' && access == 'enable') ||
            (policy.rule[i].$.effect == 'deny' && access == 'disable')) &&
            policy.rule[i].condition && (policy.rule[i].condition[0].$.combine == 'or' ||
            (policy.rule[i].condition[0].$.combine == 'and' && policy.rule[i].condition[0]['resource-match'].length == 1))) {

            var resourceMatch = {};
            resourceMatch.$ = {};
            if (isWebinosAPI(serviceId)) {
                resourceMatch.$.attr = 'api-feature';
            }
            else {
                resourceMatch.$.attr = 'service-id';
            }
            resourceMatch.$.match= serviceId;
            policy.rule[i].condition[0]['resource-match'].push(resourceMatch);
            if (policy.rule[i].condition[0].$.combine == 'and') {
                policy.rule[i].condition[0].$.combine = 'or';
            }
            addedResourceMatch = true;
        }
    }
    if (addedResourceMatch == false) {
        // add resource failed, try to add a rule
        var rule = {};
        rule.$ = {};
        if (access == 'enable') {
            rule.$.effect = 'permit';
        } else {
            rule.$.effect = 'deny';
        }
        rule.$.id = 'r_' + Id + '_' + date;
        rule.condition = [];
        rule.condition[0] = {};
        rule.condition[0].$ = {};
        rule.condition[0].$.combine = 'or';
        rule.condition[0]['resource-match'] = [];
        rule.condition[0]['resource-match'][0] = {};
        rule.condition[0]['resource-match'][0].$ = {};
        if (isWebinosAPI(serviceId)) {
            rule.condition[0]['resource-match'][0].$.attr = 'api-feature';
        }
        else {
            rule.condition[0]['resource-match'][0].$.attr = 'service-id';
        }
        rule.condition[0]['resource-match'][0].$.match = serviceId;
        policy.rule.splice(0,0,rule);
    }
    return policy;
}

var isWebinosAPI = function(URI) {
    var exp = new RegExp ('.+(?:api|ns|manager|mwc|core)\/(?:w3c\/|api-perms\/|internal\/|discovery\/)?[^\/\.]+','');
    if (exp.exec(URI)) {
        return true;
    }
    else {
        return false;
    }
}
