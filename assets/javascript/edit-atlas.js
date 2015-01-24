var website = website || {},
    $html = $('html'),
    $body = $('body'),
    $window = $(window);

(function (publics) {
    "use strict";

    var privates = {},
        optionsSocket;

    optionsSocket = ($body.data('subpath') !== '') ? { path: '/' + $body.data('subpath') + (($body.data('subpath')) ? "/" : "") + 'socket.io' } : undefined;

    publics.socket = io.connect(($body.data('subpath') !== '') ? $body.data('hostname') : undefined, optionsSocket);

    publics.isEditable = false;

    publics.cleanDataEditAtlas = function ($object) {
        $object.removeAttr("data-edit-targeted");
        $object.find('[data-edit-targeted=true]').removeAttr("data-edit-targeted");
        return $object;
    }

    publics.moveEditableArea = function () {
        var $pc = $(".popup-content"),
            $popup = $(".popup-edit-atlas");

        $pc.mouseleave(function () {
            $.data(this, "draggable", false);
            $.data(this, "offset-x", 0);
            $.data(this, "offset-y", 0);
            $(this).css("cursor", "");
        }).mousedown(function (e) {
            e.stopPropagation();
            if ($(e.target).hasClass('popup-content')) {
                $.data(this, "draggable", true);
                $.data(this, "offset-x", e.pageX);
                $.data(this, "offset-y", e.pageY);
                $(this).css("cursor", "all-scroll");
            }
        }).mouseup(function () {
            $.data(this, "draggable", false);
            $.data(this, "offset-x", 0);
            $.data(this, "offset-y", 0);
            $(this).css("cursor", "");
        }).mousemove(function (e) {
            e.stopPropagation();
            var positionX, positionY, deltaX, deltaY;

            if ($(this).data("draggable")) {
                deltaX = parseInt($(this).data("offset-x") - e.pageX, 10);
                deltaY = parseInt($(this).data("offset-y") - e.pageY, 10);
                positionX = parseInt($(this).offset().left, 10);
                positionY = parseInt($(this).offset().top, 10);

                $(this).css("-webkit-transform", "translateY(0%) translateX(0%)")
                    .css("-moz-transform", "translateY(0%) translateX(0%)")
                    .css("-ms-transform", "translateY(0%) translateX(0%)")
                    .css("-o-transform", "translateY(0%) translateX(0%)")
                    .css("transform", "translateY(0%) translateX(0%)");

                $(this).css("left", positionX - deltaX).css("top", positionY - deltaY);

                $popup.css("left", 0).css("top", 0);

                $.data(this, "offset-x", e.pageX);
                $.data(this, "offset-y", e.pageY);
            }
        }).data("draggable", false).data("offset-x", 0).data("offset-y", 0);
    };

    publics.targetDataEditAtlas = function () {
        function clone(obj) {
            if (null == obj || "object" != typeof obj) return obj;
            var copy = obj.constructor();
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
            }
            return copy;
        }

        $("[data-edit=true]").each(function (i) {
            var $currentDataEdit = $(this),
                $popup = $(".popup-edit-atlas");

            $currentDataEdit.attr('data-edit-targeted', true);

            $currentDataEdit.click(function (e) {
                var $editedObject = $(this),
                    options = {},
                    $template,
                    $clone,
                    content,
                    name,
                    accept = false;

                if (publics.isEditable) {
                    e.preventDefault();

                    $popup.addClass("opened");

                    if ($editedObject.data("edit-type") === "html" &&
                        $popup.find("." + $editedObject.data('edit-path').replace(/\./g, "\\\.").replace(/\[/g, "\\\[").replace(/\]/g, "\\\]")).length === 0) 
                    {
                        $template = $(".popup-edit-atlas .template.html");
                        $clone = $template.clone().removeClass("template");
                        $clone = publics.cleanDataEditAtlas($clone);
                        $popup.find(".insert").before($clone);
                        $clone.find("label").addClass($editedObject.data('edit-path'));
                        $clone.find("label .info").text($editedObject.data('edit-file') + " > " + $editedObject.data('edit-path'));
                        if ($editedObject.data('edit-source')) {
                            $clone.find("textarea").hide();
                            publics.socket.emit('source-variation', {
                                path: $editedObject.data('edit-path'),
                                file: $editedObject.data('edit-file')
                            });
                        } else {
                            $clone.find("textarea").val($editedObject.html().trim());
                        }
                        if (!$editedObject.data('edit-source') || typeof $editedObject.data('edit-source') === 'string') {
                            $clone.find("textarea").keyup(function () {
                                $('[data-edit-path='+ $editedObject.data('edit-path').replace(/\./g, "\\\.").replace(/\[/g, "\\\[").replace(/\]/g, "\\\]") + ']').html($clone.find("textarea").val());
                                if (typeof $editedObject.data('edit-source') === 'string') {
                                    eval($editedObject.data('edit-source'));
                                }
                            });
                        }
                        privates.editedObjects.push($editedObject);
                        publics.targetDataEditAtlas();
                    }

                    if ($editedObject.data("edit-type") === "text" &&
                        $popup.find("." + $editedObject.data('edit-path').replace(/\./g, "\\\.").replace(/\[/g, "\\\[").replace(/\]/g, "\\\]")).length === 0) 
                    {
                        $template = $(".popup-edit-atlas .template.text");
                        $clone = $template.clone().removeClass("template");
                        $clone = publics.cleanDataEditAtlas($clone);
                        $popup.find(".insert").before($clone);
                        $clone.find("label").addClass($editedObject.data('edit-path'));
                        $clone.find("label .info").text($editedObject.data('edit-file') + " > " + $editedObject.data('edit-path'));
                        if ($editedObject.data('edit-source')) {
                            $clone.find("input").hide();
                            publics.socket.emit('source-variation', {
                                path: $editedObject.data('edit-path'),
                                file: $editedObject.data('edit-file')
                            });
                        } else {
                            $clone.find("input").val($editedObject.html().trim());
                        }
                        if (!$editedObject.data('edit-source') || typeof $editedObject.data('edit-source') === 'string') {
                            $clone.find("input").keyup(function () {
                                $('[data-edit-path='+ $editedObject.data('edit-path').replace(/\./g, "\\\.").replace(/\[/g, "\\\[").replace(/\]/g, "\\\]") + ']').html($clone.find("input").val());
                                if (typeof $editedObject.data('edit-source') === 'string') {
                                    eval($editedObject.data('edit-source'));
                                }
                            });
                        }
                        privates.editedObjects.push($editedObject);
                        publics.targetDataEditAtlas();
                    }

                    if ($editedObject.data("edit-attr") === true) {
                        for (var i in $editedObject.data()) {
                            (function () {
                                var name;
                                if (i.indexOf('editAttrName') !== -1) {
                                    name = i.replace('editAttrName', '').toLowerCase();

                                    if ($popup.find("." + $editedObject.data('edit-attr-path-' + name).replace(/\./g, "\\\.").replace(/\[/g, "\\\[").replace(/\]/g, "\\\]")).length === 0) {
                                        accept = true;
                                        $template = $(".popup-edit-atlas .template.text");
                                        $clone = $template.clone().removeClass("template");
                                        $clone = publics.cleanDataEditAtlas($clone);
                                        $popup.find(".insert").before($clone);
                                        $clone.find("label").addClass($editedObject.data('edit-attr-path-' + name));
                                        $clone.find("label .info").text($editedObject.data('edit-attr-file-' + name) + " > " + $editedObject.data('edit-attr-path-' + name));
                                        if ($editedObject.data('edit-attr-source-' + name)) {
                                            $clone.find("input").hide();
                                            publics.socket.emit('source-variation', {
                                                path: $editedObject.data('edit-attr-path-' + name),
                                                file: $editedObject.data('edit-attr-file-' + name)
                                            });
                                        } else {
                                            $clone.find("input").val($editedObject.attr(name).trim());
                                        }
                                        if (!$editedObject.data('edit-attr-source-' + name) || typeof $editedObject.data('edit-attr-source-' + name) === 'string') {
                                            $clone.find("input").keyup(function () {
                                                var currentName = currentName || clone(name);
                                                $('[data-edit-attr-path-' + currentName + '='+ $editedObject.data('edit-attr-path-' + currentName).replace(/\./g, "\\\.").replace(/\[/g, "\\\[").replace(/\]/g, "\\\]") + ']').attr(currentName, $(this).val());
                                                if (typeof $editedObject.data('edit-attr-source-' + name) === 'string') {
                                                    eval($editedObject.data('edit-attr-source-' + name));
                                                }
                                            });
                                        }
                                    }
                                }
                            }())
                        }
                        if (accept) {
                            publics.targetDataEditAtlas();
                            privates.editedObjects.push($editedObject);
                        }
                    }
                }
            });
        });
    };

    publics.editContent = function () {
        var ctrlIsPressed = false,
            $popup = $(".popup-edit-atlas");

        privates.editedObjects = [];

        // Ctrl is currently press ?
        $(document).keyup(function(e) {
            if (!e.ctrlKey) {
                ctrlIsPressed = e.ctrlKey;
                publics.isEditable = false;
                $html.removeClass("is-editable");
            }
        }).keydown(function(e) {
            if (e.ctrlKey) {
                ctrlIsPressed = e.ctrlKey;
                publics.isEditable = true;
                $html.addClass("is-editable");
            }
        });

        $(".popup-edit-atlas .update-variation-change").click(function () {
            var options = [],
                currentOptions,
                name;
                
            if (!website.isEditable) {

                for (var i = 0, l = privates.editedObjects.length; i < l; i++) {
                    if (privates.editedObjects[i].data('edit-type') === 'html') {
                        currentOptions = {};

                        currentOptions.file = privates.editedObjects[i].data("edit-file");
                        currentOptions.path = privates.editedObjects[i].data("edit-path");
                        currentOptions.source = privates.editedObjects[i].data("edit-source");
                        currentOptions.type = 'html';
                        currentOptions.value = $(".popup-edit-atlas ." + privates.editedObjects[i].data("edit-path").replace(/\./g, "\\\.").replace(/\[/g, "\\\[").replace(/\]/g, "\\\]")).next().val().trim();
                        options.push(currentOptions);
                    }

                    if (privates.editedObjects[i].data('edit-type') === 'text') {
                        currentOptions = {};

                        currentOptions.file = privates.editedObjects[i].data("edit-file");
                        currentOptions.path = privates.editedObjects[i].data("edit-path");
                        currentOptions.source = privates.editedObjects[i].data("edit-source");
                        currentOptions.type = 'text';
                        currentOptions.value = $(".popup-edit-atlas ." + privates.editedObjects[i].data("edit-path").replace(/\./g, "\\\.").replace(/\[/g, "\\\[").replace(/\]/g, "\\\]")).next().val().trim();
                        options.push(currentOptions);
                    }

                    if (privates.editedObjects[i].data('edit-attr') === true) {
                        for (var j in privates.editedObjects[i].data()) {
                            if (j.indexOf('editAttrName') !== -1) {
                                name = j.replace('editAttrName', '').toLowerCase();

                                currentOptions = {};

                                currentOptions.file = privates.editedObjects[i].data("edit-attr-file-" + name);
                                currentOptions.path = privates.editedObjects[i].data("edit-attr-path-" + name);
                                currentOptions.type = 'attr';
                                currentOptions.source = privates.editedObjects[i].data("edit-attr-source-" + name);
                                currentOptions.attrName = name;
                                currentOptions.value = $(".popup-edit-atlas ." + privates.editedObjects[i].data("edit-attr-path-" + name).replace(/\./g, "\\\.").replace(/\[/g, "\\\[").replace(/\]/g, "\\\]")).next().val().trim();
                                options.push(currentOptions);
                            }
                        }
                    }
                }

                publics.sendContent(options);

                privates.editedObjects = [];
                $(".popup-edit-atlas .html:not(.template)").remove();
                $(".popup-edit-atlas .text:not(.template)").remove();

                $popup.removeClass("opened");
            }
        });

        $(".popup-edit-atlas .next-variation-change").click(function () {
            $popup.removeClass("opened");
        });

        publics.targetDataEditAtlas();
    };

    publics.sendContent = function (options) {
        publics.socket.emit('update-variation', options);
    };

    publics.sourceContent = function (options) {
        publics.socket.on('source-variation', function (data) {
            var area = $(".popup-edit-atlas ." + data.path.replace(/\./g, "\\\.").replace(/\[/g, "\\\[").replace(/\]/g, "\\\]")).next();
            area.show();
            area.val(data.value);
            area.next().show();
        });
    };

    publics.broadcastContent = function (options) {
        publics.socket.on('update-variation', function (data) {
            if (data.type === 'html') {
                $('[data-edit-path=' + data.path.replace(/\./g, "\\\.").replace(/\[/g, "\\\[").replace(/\]/g, "\\\]") + ']').html(data.value);
                eval(data.source);
            } 
            if (data.type === 'text') {
                $('[data-edit-path=' + data.path.replace(/\./g, "\\\.").replace(/\[/g, "\\\[").replace(/\]/g, "\\\]") + ']').html(data.value);
                eval(data.source);
            }
            if (data.type === 'attr') {
                $('[data-edit-attr-path-' + data.attrName + '=' + data.path.replace(/\./g, "\\\.").replace(/\[/g, "\\\[").replace(/\]/g, "\\\]") + ']').attr(data.attrName, data.value);
                eval(data.source);
            }
        });
    };

    publics.editAtlas = function () {
        publics.editContent();
        publics.broadcastContent();
        publics.sourceContent();
        publics.moveEditableArea();
    };
}(website));