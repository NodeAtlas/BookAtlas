/* jslint node: true */
var website = {};

(function (publics) {
    "use strict";

    publics.setLookup = function (object, key, value) {
        var fields,
            result = object;

        if (typeof key === 'string' || typeof key === "number") {
            fields = ("" + key).replace(/\[(.*?)\]/, function (m, key) {
                return '.' + key;
            }).split('.');
        }

        for (var i = 0, n = fields.length; i < n && result !== undefined; i++) {
            var field = fields[i];

            if (i === n - 1) {
                result[field] = value;
            } else {
                if (typeof result[field] === 'undefined' || !((typeof result[field] === "object") && (result[field] !== null))) {
                    result[field] = {};
                }
                result = result[field];
            }
        }
    };

    publics.getLookup = function (object, key) {
        if (typeof key === 'string' || typeof key === "number") {
            key = ("" + key).replace(/\[(.*?)\]/, function (m, key) {
                return '.' + key;
            }).split('.');
        }

        for (var i = 0, l = key.length; i < l; i++) {
            if (object.hasOwnProperty(key[i])) {
                object = object[key[i]];
            } else { 
                return undefined;
            }
        }

        return object;
    };

    publics.orderByFile = function (options) {
        var files = {},
            next;

        for (var i = 0, l = options.length; i < l; i++) {
            next = false;
            for (var file in files) {
                if (file === options[i].file) {
                    files[options[i].file].push(options[i]);
                    next = true;
                }
            }
            if (!next) {
                files[options[i].file] = [];
                files[options[i].file].push(options[i]);
            }
        }

        return files;
    };

    publics.setFilters = function (variation, NA, activateFront) {
        function setFilter(object, auth, pathProperty, sourceFunction, property, markup, type) {
            var file,
                claimSource = " ",
                result;

            if (typeof object === 'string') {
                if (pathProperty.split(".")[0] === "specific") {
                    file = auth;
                } else {
                    file = NA.webconfig.commonVariation;
                }
            } else {
                file = auth;
                object = website.getLookup(object, pathProperty);
                if (file === NA.webconfig.commonVariation) {
                    pathProperty = 'common.' + pathProperty;
                } else {
                    pathProperty = 'specific.' + pathProperty;
                }
            }

            if (typeof activateFront === 'undefined' || activateFront) {

                if (!object) { object = ""; }

                if (typeof markup !== 'undefined') {
                    if (sourceFunction) {
                        claimSource = ' data-edit-source="' + sourceFunction + '" ';
                    }
                    if (auth) {
                        result = '<' + markup + claimSource + 'data-edit="true" data-edit-type="' + type + '" data-edit-file="' + file + '" data-edit-path="' + pathProperty + '">' +  object + "</" + markup + ">";
                    } else {
                        result = '<' + markup + ' data-edit-path="' + pathProperty + '">' +  object + "</" + markup + ">";
                    }
                } else {
                    if (sourceFunction) {
                        claimSource = ' data-edit-attr-source-' + property + '="' + sourceFunction + '" ';
                    }
                    if (property !== '$text') {               
                        if (auth) {
                            result = object + '" data-edit="true"' + claimSource + 'data-edit-attr="true" data-edit-attr-name-' + property + '="true" data-edit-attr-path-' + property + '="' + pathProperty + '" data-edit-attr-file-' + property + '="' + file;
                        } else {
                            result = object + '" data-edit-attr-path-' + property + '="' + pathProperty;
                        }        
                    } else {
                        if (auth) {
                            result = ' data-edit="true"' + claimSource + 'data-edit-attr="true" data-edit-attr-name-' + property + '="true" data-edit-attr-path-' + property + '="' + pathProperty + '" data-edit-attr-file-' + property + '="' + file + '">' + object;
                        } else {
                            result = ' data-edit-attr-path-' + property + '="' + pathProperty + '">' + object;
                        }   
                    }
                }

            } else {
                result = object;
            }

            return result;
        }

        variation.et = variation.editText = function (object, arr) {
            return setFilter(object, arr[1], arr[0], arr[2], undefined, "span", "text");
        };

        variation.eh = variation.editHtml = function (object, arr) {
            return setFilter(object, arr[1], arr[0], arr[2], undefined, "div", "html");
        };

        variation.ea = variation.editAttr = function (object, arr) {
            return setFilter(object, arr[1], arr[0], arr[3], arr[2]);
        };

        return variation;
    };

    publics.sockets = function (socket, NA, auth, activateDemo) {
        var fs = NA.modules.fs,
            path = NA.modules.path;

        socket.on('update-variation', function (options) {
            var files, object, key;

            if (auth) {
                files = publics.orderByFile(options);
                
                for (var file in files) {
                    if (files.hasOwnProperty(file)) {
                        try {
                            object = require(path.join(NA.websitePhysicalPath, NA.webconfig.variationsRelativePath, file));
                            if (object) {
                                for (var i = 0, l = files[file].length; i < l; i++) {
                                    key = files[file][i].path.split('.').slice(1).join('.');

                                    //if (publics.getLookup(object, key) || publics.getLookup(object, key) === "") {
                                        publics.setLookup(object, key, String(files[file][i].value).toString());

                                        if (!files[file][i].source || typeof files[file][i].source === 'string') {
                                            socket.broadcast.emit('update-variation', {
                                                path: files[file][i].path,
                                                value: files[file][i].value,
                                                source: files[file][i].source,
                                                type: files[file][i].type,
                                                attrName: files[file][i].attrName
                                            });
                                        }
                                    //}
                                }
                            }
                            if (typeof activateDemo === 'undefined' || activateDemo) {
                                fs.writeFileSync(path.join(NA.websitePhysicalPath, NA.webconfig.variationsRelativePath, file), JSON.stringify(object, undefined, "    "));
                            }
                        } catch (exception) {
                            console.log(exception);
                        }
                    }
                }   
            }
        });

        socket.on('source-variation', function (options) {
            var object, key;

            if (auth) {
                try {
                    object = require(path.join(NA.websitePhysicalPath, NA.webconfig.variationsRelativePath, options.file));
                    if (object) {
                        key = options.path.split('.').slice(1).join('.');

                        socket.emit('source-variation', {
                            value: publics.getLookup(object, key),
                            path: options.path
                        });
                    }
                } catch (exception) {
                    console.log(exception);
                }   
            }
        });
    };
}(website));

exports.setFilters = website.setFilters;
exports.sockets = website.sockets;