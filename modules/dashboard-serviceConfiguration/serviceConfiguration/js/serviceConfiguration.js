
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

function setConfiguration(apiName)
{
    var successCB = function (data) {
        alert("Configuration set!");
    }

    var errorCB = function (err) {
        console.log(err);
    }

    var rootNode = document.getElementById(apiName);
    var config = '{' + getConfiguration(rootNode) + '}';
    console.log("Config: " + config);
    webinos.configuration.setAPIServicesConfiguration(apiName, JSON.parse(config).params, successCB, errorCB);

////    config = config.replace(/,+/g, ",");
//    alert(config);
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
        
/*        if (!isNewArrayElement && !dataElement) {
            if (templateElement.className && templateElement.className.indexOf("optional") < 0) {
                var label = document.createElement("label");
                label.textContent = "Missing configuration for element '" + key + "'";
                refNode.appendChild(label);
            }
           // break;
        }
*/
        switch (templateElement.type){
            case "text":
                var label = document.createElement("label"); 
                label.textContent = key + ":";
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
                label.textContent = key + ":";
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
                
                var addButton = document.createElement("input");
                addButton.type = "button";
                addButton.value = "Add";
                addButton.onclick = function(){
                    appendArrayElement(fieldset, templateElement.content, dataElement);
                }

                fieldset.appendChild(addButton);
//                fieldset.appendChild(document.createElement("hr"));

                if (dataElement && dataElement.length) {
                    for(var i=0; i<dataElement.length; i++){ 
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
    var delButton =  document.createElement("input");

    delButton.type = "button";
    delButton.value = "Remove";

    delButton.onclick = function(){
        elementFieldset.remove();
    }

    arrayRootNode.appendChild(convert(elementFieldset, templateElement, dataElement, true));
    elementFieldset.appendChild(delButton);
 // elementFieldset.appendChild(document.createElement("hr"))
}

function refresh(){
    $('#APIsData').empty();
    fillAPIsList();
}

function toggleDiv(div, togglingElement){
   $('#' + div).slideToggle();
   $('#' + togglingElement).html($('#' + togglingElement).text() == "+"?"-":"+");
}

function fillAPIsList(){

    var errorCB = function () {};

    var fillHeader = function (data) {

        var fillConfigurationData = function (data){
            console.log("config.json content: " + JSON.stringify(data.config));
            console.log("template.json content: " + JSON.stringify(data.template));
            $('#' + data.apiName + '_config').append("<input type='button' onClick='javascript:setConfiguration(\"" + data.apiName + "\")' value='Set Configuration'>");

            div = document.getElementById(data.apiName + "_config");
            
            form = document.createElement("form");
            form.id = data.apiName;

//data_ = JSON.parse('{ "name" : "file", "params" : { "local" : { "shares":[{"name":"nome", "path":"path"}]} }}');

            div.appendChild(convert(form, data.template, data.config));
//            div.appendChild(convert(form, data.template, data_));
        }

        for (var d in data)
        {
            var html = [
                "<br>"
              , "<h3 id='" + data[d].name + "_expander'>"
              , "<span id='" + data[d].name + "_expanderText' class='expanderText'>+</span>"
              , data[d].name + "</h3>"
              , "<br>"
              , "<div id='" + data[d].name + "_config' class='config'/>"
                ];
            $('#APIsData').append(html.join(""));
            $('#'+ data[d].name + '_expander').click(toggleDiv.bind(this, data[d].name + "_config", data[d].name + "_expanderText"));


            webinos.configuration.getAPIServicesConfiguration(data[d], fillConfigurationData, errorCB);
        }
    };

    webinos.discovery.findConfigurableAPIs(params?params:"*", fillHeader, errorCB);
} 

var params = null;

$(document).ready(function(){    
    $("#refresh").bind('click', refresh);
    webinos.session.addListener('registeredBrowser', function(){
        webinos.dashboard.getData(
            function(tokenData){
                params = tokenData;
                console.log("***********************************" + params.apiURI + "******************************************");
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
