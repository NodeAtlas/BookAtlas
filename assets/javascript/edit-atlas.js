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
    publics.ctrl = {};
    privates.auto = false;

    privates.toDash = function(text) {
        return text.replace(/([A-Z])/g, function ($1) { return "-" + $1.toLowerCase(); });
    };

    privates.cleanPath = function (path) {
        return path.replace(/\./g, "\\\.").replace(/\[/g, "\\\[").replace(/\]/g, "\\\]");
    };

    privates.cleanName = function (name) {
        return name.replace(/\$/g, "\\\$");
    };

    publics.cleanDataEditAtlas = function ($object) {
        $object.removeAttr("data-edit-targeted");
        $object.find('[data-edit-targeted=true]').removeAttr("data-edit-targeted");
        return $object;
    };

    publics.clone = function (object) {
        var copy;

        if (null === object || undefined === object || "object" !== typeof object) {
            return object;
        }
        if (object instanceof Date) {
            copy = new Date();
            copy.setTime(object.getTime());
            return copy;
        }
        if (object instanceof Array) {
            return object.slice(0);
        }
        if (object instanceof Object) {
            copy = {};
            for (var attr in object) {
                if (object.hasOwnProperty(attr)) {
                    copy[attr] = publics.clone(object[attr]);
                }
            }
            return copy;
        }
    };

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
                $popup.removeClass("docked-right");
                $popup.removeClass("docked-left");
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
                deltaX = parseInt($(this).data("offset-x") - e.pageX + $window.scrollLeft(), 10);
                deltaY = parseInt($(this).data("offset-y") - e.pageY + $window.scrollTop(), 10);
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

        $(".to-left").click(function () {
            $pc.attr("style", "");
            $popup
                .attr("style", "")
                .addClass("docked-left")
                .removeClass("docked-right");
            privates.resizeArea();
            $window.bind("resize", privates.resizeArea);
        });
        $(".anchor").click(function () {
            $pc.attr("style", "");
            $popup
                .attr("style", "")
                .removeClass("docked-left")
                .removeClass("docked-right");
            $popup.find(".templates").height("");
            $window.unbind("resize", privates.resizeArea);
        });
        $(".to-right").click(function () {
            $pc.attr("style", "");
            $popup
                .attr("style", "")
                .addClass("docked-right")
                .removeClass("docked-left");
            privates.resizeArea();
            $window.bind("resize", privates.resizeArea);
        });

    };

    privates.resizeArea = function () {
         var $pc = $(".popup-content"),
            $popup = $(".popup-edit-atlas");

        if ($popup.hasClass("docked-left") || $popup.hasClass("docked-right")) {
            $popup.find(".templates").height($popup.height() - $popup.find("#wysiwyg").height() - $popup.find("#wysiwyg-bottom").height() - 100);
        }
    };

    publics.eaNumberId = 0;

    publics.addhocEditAtlas = function () {
        $("select").each(function () {
            var $opener = $(this),
                $subpart = $opener.find("[data-edit=true]");

            $opener.removeAttr("data-addhoc");

            if ($subpart.length) {
                $opener.attr("data-addhoc", true);
            }

            function setPropagation() {
                if ($subpart.length > 0 && $html.hasClass("is-editable")) {
                    $subpart.each(function () {
                        privates.loadData($(this), undefined);
                    });
                    $opener.blur();
                }
            }

            $opener.unbind("click", setPropagation).bind("click", setPropagation);
        });
        $("a").each(function () {
            var $opener = $(this),
                $subpart = $opener.find("[data-edit=true]");

            $opener.removeAttr("data-addhoc");

            if ($subpart.length) {
                $opener.attr("data-addhoc", true);
            }

            function setPropagation() {
                if ($subpart.length > 0 && $html.hasClass("is-editable")) {
                    $subpart.each(function () {
                        privates.loadData($(this), undefined);
                    });
                }
            }

            $opener.unbind("click", setPropagation).bind("click", setPropagation);
        });
    };

    privates.loadData = function ($editedObject, e) {
        var $template,
            $clone,
            $popup = $(".popup-edit-atlas"),
            accept = false;

        if ($html.hasClass("is-editable")) {

            if (typeof e !== 'undefined') {
                if (document.activeElement.tagName === 'A') {
                    e.preventDefault();
                }
            }

            $popup.addClass("opened");

            if ($editedObject.data("edit-type") === "html" &&
                $popup.find("." + privates.cleanPath($editedObject.data('edit-path'))).length === 0) 
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
                    $clone.find("label").attr("data-cancel", $editedObject.html().trim());
                }

                if (!$editedObject.data('edit-source') || typeof $editedObject.data('edit-source') === 'string') {
                    $clone.find("textarea").keyup(function () {
                        var $this = $('[data-edit-path='+ privates.cleanPath($editedObject.data('edit-path')) + ']');
                        $this.html($clone.find("textarea").val());
                        if (typeof $editedObject.data('edit-source') === 'string') {
                            eval($editedObject.data('edit-source'));
                        }
                    });
                }

                $clone.find(".cancel").click(function () {
                    var $this;
                    if (!$html.hasClass("is-editable")) {
                        $this = $('[data-edit-path='+ privates.cleanPath($editedObject.data('edit-path')) + ']');
                        $this.html($clone.find("label").attr("data-cancel"));
                        if (typeof $editedObject.data('edit-source') === 'string') {
                            eval($editedObject.data('edit-source'));
                        }
                        if (typeof CKEDITOR !== 'undefined') {
                            if (Object.keys(CKEDITOR.instances).length > 0) {
                                CKEDITOR.instances[$clone.find("textarea").attr("id")].destroy();
                            }
                        }
                        $clone.remove();
                        privates.closePopupIfAllCancel();
                    }
                });

                privates.editedObjects.push($editedObject);
                publics.targetDataEditAtlas();

                $clone.find(".wysiwyg").click(function () {
                    var $wysiwyg = $(this),
                        alreadyLoad = false;

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
                                var $this;
                                $clone.find("textarea").val(CKEDITOR.instances[i].getData());
                                $this = $('[data-edit-path='+ privates.cleanPath($editedObject.data('edit-path')) + ']');
                                $this.html(CKEDITOR.instances[i].getData());
                                if (typeof $editedObject.data('edit-source') === 'string') {
                                    eval($editedObject.data('edit-source'));
                                }
                            });
                            CKEDITOR.instances[i].on("instanceReady", function(e) {
                                privates.resizeArea();
                            });
                        }
                    }

                    if (!$html.hasClass("is-editable")) {
                        $wysiwyg.parents(".html").addClass("alternative");

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
                    }
                });

                $clone.find(".plaintext").click(function () {
                    var $plainText = $(this);

                    if (!$html.hasClass("is-editable")) {
                        $plainText.parents(".html").removeClass("alternative");
                        if (typeof CKEDITOR !== 'undefined') {
                            if (Object.keys(CKEDITOR.instances).length > 0) {
                                CKEDITOR.instances[$plainText.parents(".html").find("textarea").attr("id")].destroy();
                            }
                        }
                        privates.resizeArea();
                    }
                });

                publics.eaNumberId++;
            }

            if ($editedObject.data("edit-type") === "text" &&
                $popup.find("." + privates.cleanPath($editedObject.data('edit-path'))).length === 0) 
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
                    $clone.find("label").attr("data-cancel", $editedObject.html().trim());
                }
                if (!$editedObject.data('edit-source') || typeof $editedObject.data('edit-source') === 'string') {
                    $clone.find("input").keyup(function () {
                        var $this = $('[data-edit-path='+ privates.cleanPath($editedObject.data('edit-path')) + ']');
                        $this.html($clone.find("input").val());
                        if (typeof $editedObject.data('edit-source') === 'string') {
                            eval($editedObject.data('edit-source'));
                        }
                    });
                }

                $clone.find(".cancel").click(function () {
                    var $this;
                    if (!$html.hasClass("is-editable")) {
                        $this = $('[data-edit-path='+ privates.cleanPath($editedObject.data('edit-path')) + ']');
                        $this.html($clone.find("label").attr("data-cancel"));
                        if (typeof $editedObject.data('edit-source') === 'string') {
                            eval($editedObject.data('edit-source'));
                        }
                        $clone.remove();
                        privates.closePopupIfAllCancel();
                    }
                });

                privates.editedObjects.push($editedObject);
                publics.targetDataEditAtlas();
            }

            /* Close if click on item */
            setTimeout(function() {
                if (!privates.autoQuit) {
                    if (typeof privates.onKeyup !== 'undefined') {
                        privates.onKeyup();
                    }
                    $html.removeClass("is-editable");
                }
            }, 500);
            /* --- */

            if ($editedObject.data("edit-attr") === true) {
                for (var i in $editedObject.data()) {
                    (function () {
                        var name;
                        if (i.indexOf('editAttrName') !== -1) {
                            name = privates.toDash(i.replace('editAttrName', '')).slice(1);

                            if ($popup.find("." + privates.cleanPath($editedObject.data('edit-attr-path-' + name))).length === 0) {
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
                                    if (name === '$text') {
                                        $clone.find("input").val($editedObject.html().trim());
                                        $clone.find("label").attr("data-cancel", $editedObject.html().trim());
                                    } else {
                                        $clone.find("input").val($editedObject.attr(name).trim());
                                        $clone.find("label").attr("data-cancel", $editedObject.attr(name).trim());
                                    }
                                }
                                var currentName = currentName || publics.clone(name);
                                if (!$editedObject.data('edit-attr-source-' + name) || typeof $editedObject.data('edit-attr-source-' + name) === 'string') {
                                    $clone.find("input").keyup(function () {
                                        var $this;
                                        if (currentName === '$text') {
                                            $this = $('[data-edit-attr-path-' + privates.cleanName(currentName) + '='+ privates.cleanPath($editedObject.data('edit-attr-path-' + currentName)) + ']');
                                            $this.html($(this).val());         
                                        } else {
                                            $this = $('[data-edit-attr-path-' + currentName + '='+ privates.cleanPath($editedObject.data('edit-attr-path-' + currentName)) + ']');
                                            $this.attr(currentName, $(this).val());
                                        }
                                        if (typeof $editedObject.data('edit-attr-source-' + currentName) === 'string') {
                                            eval($editedObject.data('edit-attr-source-' + currentName));
                                        }
                                    });
                                }
                                $clone.find(".cancel").click(function () {
                                    var $this;
                                    if (!$html.hasClass("is-editable")) {
                                        if (currentName === '$text') {
                                            $this = $('[data-edit-attr-path-' + privates.cleanName(currentName) + '='+ privates.cleanPath($editedObject.data('edit-attr-path-' + currentName)) + ']');
                                            $this.html($(this).parents(".text:first").find("label").attr("data-cancel"));
                                        } else {
                                            $this = $('[data-edit-attr-path-' + currentName + '='+ privates.cleanPath($editedObject.data('edit-attr-path-' + currentName)) + ']');
                                            $this.attr(currentName, $(this).parents(".text:first").find("label").attr("data-cancel"));
                                        }
                                        if (typeof $editedObject.data('edit-attr-source-' + currentName) === 'string') {
                                            eval($editedObject.data('edit-attr-source-' + currentName));
                                        }
                                        $(this).parents(".text:first").remove();
                                        privates.closePopupIfAllCancel();
                                    }
                                });
                            }
                        }
                    }());
                }
                if (accept) {
                    publics.targetDataEditAtlas();
                    privates.editedObjects.push($editedObject);
                }
            }
        }
    };

    privates.closePopupIfAllCancel = function () {
        var $popup = $(".popup-edit-atlas");
        if ($popup.find(".html:not(.template), .text:not(.template)").length === 0) {
            $popup.removeClass("opened");
        }
    };

    publics.targetDataEditAtlas = function () {
        publics.addhocEditAtlas();

        $("[data-edit=true]").each(function (i) {
            var $currentDataEdit = $(this);

            $currentDataEdit.attr('data-edit-targeted', true);

            $currentDataEdit.click(function (e) {
                privates.loadData($(this), e);
            });
        });
    };

    publics.editContent = function () {
        var $popup = $(".popup-edit-atlas");

        privates.editedObjects = [];

        $(".popup-edit-atlas .update-variation-change").click(function () {
            var options = [];

            function addVariationForUpdate(type, options, i) {
                var currentOptions = {},
                    name;

                if (privates.editedObjects[i].data('edit-attr') === true) {
                    for (var j in privates.editedObjects[i].data()) {
                        if (j.indexOf('editAttrName') !== -1) {
                            name = privates.toDash(j.replace('editAttrName', '')).slice(1);

                            currentOptions = {};

                            currentOptions.file = privates.editedObjects[i].data("edit-attr-file-" + name);
                            currentOptions.path = privates.editedObjects[i].data("edit-attr-path-" + name);
                            currentOptions.type = type;
                            currentOptions.source = privates.editedObjects[i].data("edit-attr-source-" + name);
                            currentOptions.attrName = name;
                            currentOptions.value = $(".popup-edit-atlas ." + privates.cleanPath(privates.editedObjects[i].data("edit-attr-path-" + name))).next().val().trim();

                            options.push(currentOptions);
                        }
                    }
                } else {         
                    currentOptions = {};

                    currentOptions.file = privates.editedObjects[i].data("edit-file");
                    currentOptions.path = privates.editedObjects[i].data("edit-path");
                    currentOptions.source = privates.editedObjects[i].data("edit-source");
                    currentOptions.type = type;
                    currentOptions.value = $(".popup-edit-atlas ." + privates.cleanPath(privates.editedObjects[i].data("edit-path"))).next().val().trim();
                    
                    options.push(currentOptions);
                }

                return options;
            }
                
            if (!$html.hasClass("is-editable")) {
                for (var i = 0, l = privates.editedObjects.length; i < l; i++) {
                    options = addVariationForUpdate('html', options, i);
                    options = addVariationForUpdate('text', options, i);
                    options = addVariationForUpdate('attr', options, i);
                }

                publics.sendContent(options);
                if (typeof CKEDITOR !== 'undefined') {
                    for (var i in CKEDITOR.instances) {
                        CKEDITOR.instances[i].destroy();
                    }
                }

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

    publics.sourceContent = function () {
        publics.socket.on('source-variation', function (data) {
            var $label = $(".popup-edit-atlas ." + privates.cleanPath(data.path)),
                $area = $label.next();
            $label.attr("data-cancel", data.value);
            $area.show();
            $area.val(data.value);
            $area.next().show();
        });
    };

    publics.broadcastContent = function () {
        publics.socket.on('update-variation', function (data) {
            var $this;
            if (data.type === 'html' || data.type === 'text') {
                $('[data-edit-path=' + privates.cleanPath(data.path) + ']').html(data.value);
            } 
            if (data.type === 'attr') {
                if (data.attrName === '$text') {
                    $this = $('[data-edit-attr-path-' + privates.cleanName(data.attrName) + '=' + privates.cleanPath(data.path) + ']');
                    $this.html(data.value);
                } else {
                    $this = $('[data-edit-attr-path-' + data.attrName + '=' + privates.cleanPath(data.path) + ']');
                    $this.attr(data.attrName, data.value);
                }
            }
            eval(data.source);
        });
    };

    publics.listeningKeystroke = function (onKeyup, onKeyDown) {

        $window.on("keydown", function (e) {
            e = e || event;
            publics.keys[e.keyCode] = true;
            publics.ctrl[e.keyCode] = e.ctrlKey;

            if (publics.ctrl[83] && publics.keys[83] && privates.activate) {
                e.preventDefault();
                if (!privates.auto) {
                    privates.auto = true;
                    privates.timeout = setTimeout(function () {
                        privates.autoQuit = true;
                    }, 1000);

                //if (document.activeElement.tagName !== 'TEXTAREA' && document.activeElement.tagName !== 'INPUT') {
                    if (!$html.hasClass("is-editable")) {
                        if (typeof onKeyDown !== 'undefined') {
                            onKeyDown();
                        }
                        $html.addClass("is-editable");
                    } else {
                        if (typeof onKeyup !== 'undefined') {
                            privates.onKeyup = onKeyup;
                            onKeyup();
                        }
                        $html.removeClass("is-editable");
                    }
                //}
                }
            }
        });
        $window.on("keyup", function (e) {
            e = e || event;
            publics.keys[e.keyCode] = false;
            publics.ctrl[e.keyCode] = false;
            privates.auto = false;
            clearTimeout(privates.timeout);

            if (privates.autoQuit) {
                privates.autoQuit = false;
                if (typeof onKeyup !== 'undefined') {
                    privates.onKeyup = onKeyup;
                    onKeyup();
                }
                $html.removeClass("is-editable");
            }
        });
    };

    publics.editAtlas = function (onKeyup, onKeyDown) {
        privates.activate = $("[data-edit=true]").length;
        publics.editContent();
        publics.broadcastContent();
        publics.sourceContent();
        publics.moveEditableArea();
        publics.listeningKeystroke(onKeyup, onKeyDown);
    };
}(website));