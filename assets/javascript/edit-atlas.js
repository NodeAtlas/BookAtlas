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

    publics.keys = {};

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

    publics.eaNumberId = 0;

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

                if (publics.keys[17] && publics.keys[18] && publics.keys[69]) {
                    e.preventDefault();

                    $popup.addClass("opened");

                    if ($editedObject.data("edit-type") === "html" &&
                        $popup.find("." + $editedObject.data('edit-path').replace(/\./g, "\\\.").replace(/\[/g, "\\\[").replace(/\]/g, "\\\]")).length === 0) 
                    {
                        $template = $(".popup-edit-atlas .template.html");
                        $clone = $template.clone().removeClass("template");
                        $clone = publics.cleanDataEditAtlas($clone);
                        $clone.find("textarea").attr("id", "ea-editor-" + publics.eaNumberId);
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

                        $clone.find(".wysiwyg").click(function () {
                            var $wysiwyg = $(this),
                                alreadyLoad = false;

                            $wysiwyg.parents(".html").addClass("alternative");

                            function createEditor() {
                                CKEDITOR.disableAutoInline = true;
                                CKEDITOR.inline($wysiwyg.parents(".html:first").find("textarea")[0], {
                                    extraPlugins: 'sharedspace',
                                    entities_latin: false,
                                    entities: false,
                                    sharedSpaces: {
                                        top: 'wysiwyg',
                                        bottom: 'wysiwyg-bottom'
                                    },
                                    toolbar: [
                                        { name: 'document', items: [ 'Source' ] },
                                        { name: 'clipboard', items: [ 'Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo' ] },
                                        { name: 'tools', items: [ 'Maximize', 'ShowBlocks' ] },
                                        '/',
                                        { name: 'editing', items: [ 'Find', 'Replace', '-', 'SelectAll', '-', 'Scayt' ] },
                                        { name: 'basicstyles', items: [ 'Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', 'RemoveFormat' ] },
                                        '/',
                                        { name: 'paragraph', items: [ 'NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'Blockquote', 'CreateDiv', '-', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock', '-', 'BidiLtr', 'BidiRtl' ] },
                                        '/',
                                        { name: 'links', items: [ 'Link', 'Unlink', 'Anchor', 'TextColor', 'BGColor', 'Image', 'Flash', 'Table', 'HorizontalRule', 'Smiley', 'SpecialChar', 'PageBreak', 'Iframe' ] },
                                        '/',
                                        { name: 'styles', items: [ 'Styles', 'Format', 'Font', 'FontSize' ] }
                                    ]
                                });
                                for (var i in CKEDITOR.instances) {
                                    CKEDITOR.instances[i].on('change', function (e, a) {
                                        $clone.find("textarea").val(CKEDITOR.instances[i].getData());
                                        $('[data-edit-path='+ $editedObject.data('edit-path').replace(/\./g, "\\\.").replace(/\[/g, "\\\[").replace(/\]/g, "\\\]") + ']').html(CKEDITOR.instances[i].getData());
                                        if (typeof $editedObject.data('edit-source') === 'string') {
                                            eval($editedObject.data('edit-source'));
                                        }
                                    });
                                }
                            }

                            if (!alreadyLoad) {
                                (function(d, script) {
                                    script = d.createElement('script');
                                    script.type = 'text/javascript';
                                    script.async = true;
                                    script.onload = function(){
                                        alreadyLoad = true;
                                        createEditor();
                                    };
                                    script.src = '//cdn.ckeditor.com/4.4.7/full-all/ckeditor.js';
                                    d.getElementsByTagName('head')[0].appendChild(script);
                                }(document));
                            } else {
                                createEditor();
                            }

                        });

                        $clone.find(".plaintext").click(function () {
                            var $plainText = $(this);

                            $plainText.parents(".html").removeClass("alternative");

                            console.log($plainText.parents(".html").find("textarea").attr("id"));

                            CKEDITOR.instances[$plainText.parents(".html").find("textarea").attr("id")].destroy();
                        });

                        publics.eaNumberId++;
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
        var shiftIsPressed = false,
            $popup = $(".popup-edit-atlas");

        privates.editedObjects = [];

        publics.keys = {};

        $(".popup-edit-atlas .update-variation-change").click(function () {
            var options = [],
                currentOptions,
                name;
                
            if (!(publics.keys[17] && publics.keys[18] && publics.keys[69])) {

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

    publics.listeningKeystroke = function () {
        $window.on("keyup keydown", function (e) {
            e = e || event;
            publics.keys[e.keyCode] = e.type === 'keydown';

            if (publics.keys[17] && publics.keys[18] && publics.keys[69]) {
                $html.addClass("is-editable");
            } else {
                $html.removeClass("is-editable");
            }
        });
    };

    publics.editAtlas = function () {
        publics.editContent();
        publics.broadcastContent();
        publics.sourceContent();
        publics.moveEditableArea();
        publics.listeningKeystroke();
    };
}(website));