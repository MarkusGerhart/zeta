var modelExporter = (function modelExporter () {
    'use strict';

    var exportModel;
    var _buildElements;
    var _getAttributeValue;
    var _graph;
    var _showExportSuccess;
    var _showExportFailure;

    exportModel = function(graph) {
        $("[data-hide]").on("click", function(){
            $("." + $(this).attr("data-hide")).hide();
        });

        _graph = graph;
        var elements = _buildElements();
        var uiState = JSON.stringify(_graph.toJSON());

        var data = JSON.stringify({
            name: window._global_model_name,
            elements: elements,
            uiState: uiState
        });

        $.ajax({
            type: 'PUT',
            url: '/models/' + window._global_uuid + "/definition",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            data: data,
            success: function (data, textStatus, jqXHR) {
                _showExportSuccess();
            },
            error: function (jqXHR, textStatus, errorThrown) {
              _showExportFailure("Failure, there occurred an error during saving!");
            }
        });
    };


    _buildElements = function() {
        var elements = [];

        _graph.getElements().forEach(function(ele) {
            var element = {
                id: ele.id,
                mClass: ele.attributes.mClass,
                outputs: {},
                inputs: {},
                attributes: {}
            };

            if(ele.attributes.hasOwnProperty('mClassAttributes')) {
                ele.attributes.mClassAttributes.forEach(function (attr) {

                    var attrInfo = ele.attributes.mClassAttributeInfo.find(function(info) {
                        return info.name === attr.type;
                    });
                    var value = _getAttributeValue(attr.value, attrInfo.type);
                    if (element.attributes.hasOwnProperty(attr.type)) {
                        element.attributes[attr.type].push(value);
                    } else {
                        element.attributes[attr.type] = [value];
                    }
                });
            }

            ele.attributes.mClassAttributeInfo.forEach(function(info) {
                if(!element.attributes.hasOwnProperty(info.name)) {
                    element.attributes[info.name] = [];
                }
            });

            _graph.getConnectedLinks(ele, {outbound: true}).forEach(function(link) {
                if(element.outputs.hasOwnProperty(link.attributes.mReference)) {
                    element.outputs[link.attributes.mReference].push(link.attributes.id);
                } else {
                    element.outputs[link.attributes.mReference] = [link.attributes.id];
                }
            });

            _graph.getConnectedLinks(ele, {inbound: true}).forEach(function(link) {
                if(element.inputs.hasOwnProperty(link.attributes.mReference)) {
                    element.inputs[link.attributes.mReference].push(link.attributes.id);
                } else {
                    element.inputs[link.attributes.mReference] = [link.attributes.id];
                }
            });
            elements.push(element);
        });

        _graph.getLinks().forEach(function(link) {
            var element = {
                id: link.id,
                mReference: link.attributes.mReference,
                source: {},
                target: {},
                attributes: {}
            };
            // In the Metamodel a connection can have multiple sources/targets
            // but in joint.js this is not possible
            element.source[link.attributes.sourceAttribute] = [link.attributes.source.id];
            element.target[link.attributes.targetAttribute] = [link.attributes.target.id];
            elements.push(element);
        });
        return elements;
    };

    _getAttributeValue = function(value, type) {
        var ret = value;
        switch(type) {
            case 'Bool':
                ret = value.toLowerCase() === 'true';
                break;
            case 'Int':
                $.isNumeric(value) ? ret = parseInt(value) : ret = 0;
                break;
            case 'Double':
                $.isNumeric(value) ? ret = parseFloat(ret) : ret = 0.0;
                break;
        }
        return ret;
    };

    _showExportSuccess = function() {
        $("#success-panel").fadeOut('slow', function() {
            $("#error-panel").fadeOut('slow', function() {
                $("#success-panel").show();
                $("#success-panel").find("div").text("Success, model saved!");
                $("#success-panel").fadeIn('slow');
            });
        });
    };

    _showExportFailure = function(reason) {
        $("#success-panel").fadeOut('slow', function() {
            $("#error-panel").fadeOut('slow', function() {
                $("#error-panel").show();
                $("#error-panel").find("div").text(reason);
                $("#error-panel").fadeIn('slow');
            });
        });
    };

    return {
        exportModel : exportModel
    };

})();
