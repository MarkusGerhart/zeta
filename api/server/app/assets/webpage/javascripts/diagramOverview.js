(function ($) {
    'use strict';
    var createProject = function () {

        var name = $("#inputProjectName").val();
        if (name === "") return;

        var data = JSON.stringify({
            "name": name,
            "elements": [],
            "uiState": ""
        });

        $.ajax({
            type: 'POST',
            url: '/metamodels',
            data: data,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                window.location.replace("/overview/" + data._id);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert("Could not create meta model: " + textStatus);
            }
        });

    };

    var createModelInstance = function () {
        var name = $("#inputModelName").val();
        if (name === "") return;
        var id = window.metaModelId;
        var data = {
            "metaModelId": id,
            "model": {
                elements: [],
                name: name,
                uiState: ""
            }
        };

        $.ajax({
            type: 'POST',
            url: '/models',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(data),
            success: function (data, textStatus, jqXHR) {
              window.location.replace("/overview/" + window.metaModelId);
            },
            error: function (jqXHR, textStatus, errorThrown) {
              alert("failed creating model instance: " + textStatus);
            }
        });
    };

    var deleteModelInstance = function (modelId) {
        $.ajax({
            type: 'DELETE',
            url: '/models/' + modelId,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            success: function (data, textStatus, jqXHR) {
                window.location.replace("/overview/" + window.metaModelId);
            },
            error: function (jqXHR, textStatus, errorThrown) {
              alert("failed deleting model instance: " + textStatus);
            }
        });
    };

    $(function () {
        $('[data-toggle="tooltip"]').tooltip();

        $("#btnCreateMetaModel").click(createProject);

        $("#inputProjectName").keypress(function (e) {
            if (e.which == 13) {
                createProject();
                return false;
            }
        });

        $(".delete-project").click(function () {

            event.preventDefault();
            var metamodelId = this.dataset.metamodelId;

            $.ajax({
                type: 'DELETE',
                url: '/metamodels/' + metamodelId,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                success: function (data, textStatus, jqXHR) {
                    window.location.replace("/overview");
                },
                error: function (jqXHR, textStatus, errorThrown) {
                  alert("Could not delete meta model: " + textStatus);
                }
            });
        });

        $("#btnGenerator").click(function () {
            $.ajax({
                type: 'GET',
                url: '/generator/' + window.metaModelId,
                //contentType: "application/json; charset=utf-8",
                //dataType: "json",
                success: function (data, textStatus, jqXHR) {
                    showSuccess(data);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                  showError(jqXHR.responseText)
                }
            });
        });


        $("#inputModelName").keypress(function (e) {
            if (e.which == 13) {
                createModelInstance();
                return false;
            }
        });

        $("#btnCreateModelInstance").click(createModelInstance);

        $(".delete-model-instance").click(function () {
            //prevent default otherwise href to modelEditor
            event.preventDefault();
            var modelId = this.dataset.modelId;
            deleteModelInstance(modelId);
        });

        $("#btnDeleteAllModelInstances").click(function () {
            $("#model-instance-container").children().map(function () {
                if ($(this).is('a')) {
                    var modelId = $(this).children(":first").data("model-id");
                    deleteModelInstance(modelId);
                }
            })
        });

        var showError = function(text) {
            $("#error-panel").fadeOut('slow', function() {
                $("#error-panel").find("div").text(text);
                $("#error-panel").fadeIn('slow');
            });
        };

        var showSuccess = function(text) {
            $("#success-panel").fadeOut('slow', function() {
                $("#success-panel").show();
                $("#success-panel").find("div").text(text);
                $("#success-panel").fadeIn('slow');
            });
        };

        $("[data-hide]").on("click", function(){
            $("." + $(this).attr("data-hide")).hide();
        });
    });
}(jQuery) );
