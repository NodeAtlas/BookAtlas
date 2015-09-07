/* jslint node: true */
var website = {};

(function (publics) {

    /**
     * Find a value from JSON path `key` from a variation file content `object`.
     * @param  {Object}        object Object to JSON format.
     * @param  {string}        key    A path to a parameter anywhere (e.i. common.example[4].parameter).
     * @return {Object|string}        Object / string value from require parameter.
     */
    publics.getLookup = function (object, key) {
        if (typeof key === 'string' || typeof key === "number") {
            key = ("" + key).replace(/\[(.*?)\]/g, function (m, key) {
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

    /**
     * Save a `value` to a JSON path `key` into a variation file content `object`.
     * @param  {Object}        object Object to JSON format.
     * @param  {string}        key    A path to a parameter anywhere (e.i. common.example[4].parameter).
     * @param  {Object|string} value  Object / string value you want add.
     */
    publics.setLookup = function (object, key, value) {
        var fields,
            result = object;

        if (typeof key === 'string' || typeof key === "number") {
            fields = ("" + key).replace(/\[(.*?)\]/g, function (m, key) {
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

    /**
     * Order value by file Name
     * @param  {Array.<Object>} options All value and associate file from an array.
     * @return {Array.<Object>}         Array with value order by filename source/dest.
     */
    publics.orderByFile = function (options) {
        var files = {},
            next;

        for (var i = 0, l = options.length; i < l; i++) {
            next = false;
            for (var file in files) {
                if (files.hasOwnProperty(file) && file === options[i].file) {
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

    /**
     * Create extra tags and attr for Front-end findability.
     * @param  {Object}           params                All value for internal transformation.
     * @param  {Object|string}    params.object         The object contain all data (or path to the value 'legacy').
     * @param  {string|undefined} params.markup         Type of Tag used.
     * @param  {boolean}          params.auth           is Savable text ?
     * @param  {string|undefined} params.sourceFunction Function to execute after value modification.
     * @param  {string}           params.pathProperty   Path to the value.
     * @param  {string|undefined} params.property       Set the `attr` where save the value.
     * @param  {string}          params.file            Filename (+ path) to find the value.
     * @param  {string|undefined} params.type           Is a text object or html ?.
     * @return {string}                                 Initial value correctly wrapped for edition.
     */
    publics.createTags = function (params) {
        var claimSource = " ",
            result = params.result,
            object = params.object,
            markup = params.markup,
            auth = params.auth,
            sourceFunction = params.sourceFunction,
            pathProperty = params.pathProperty,
            property = params.property,
            file = params.file,
            type = params.type;

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

        return result;
    };

    /**
     * [prepareTags description]
     * @param  {Object}           params                All value for internal transformation.
     * @param  {Object}           params.NA             NodeAtlas full object.
     * @param  {boolean}          params.activeFront    Transform or not transform the value.
     * @param  {Object|string}    params.object         The object contain all data (or path to the value 'legacy').
     * @param  {string|boolean}   params.auth           Filename (+ path) to find the value, if false value could not be saving.
     * @param  {string}           params.pathProperty   Path to the value.
     * @param  {string|undefined} params.sourceFunction Function to execute after value modification.
     * @param  {string|undefined} params.property       Set the `attr` where save the value.
     * @param  {string|undefined} params.markup         Type of Tag used.
     * @param  {string|undefined} params.type           Is a text object or html ?.
     * @return {string}                                 Initial value correctly wrapped for edition.
     */
    publics.prepareTags = function (params) {
        var file,
        NA = params.NA,
        activateFront = params.activateFront,
        object = params.object,
        auth = params.auth,
        pathProperty = params.pathProperty,
        sourceFunction = params.sourceFunction,
        property = params.property,
        markup = params.markup,
        type = params.type,
        result;

        /*-- Legacy mechanism --*/
        /* By default, the value is from file passed in eh, et or ea. */
        file = auth;
        if (typeof object === 'string' && pathProperty.split(".")[0] === "common") {
            /* But if the file come from `common`, set the common variation. */
            file = NA.webconfig.commonVariation;
        } else if (typeof object !== 'string') {
        /*----------------------*/

            /* Find value of object or return "" */
            object = website.getLookup(object, pathProperty) || "";
            if (file === NA.webconfig.commonVariation) {
                /* set path to common property or... */
                pathProperty = 'common.' + pathProperty;
            } else {
                /* set path to specific property or... */
                pathProperty = 'specific.' + pathProperty;
            }
        }

        result = object;

        /* Execute mechanism also not modify initial DOM with extra tags and attr. */
        if (activateFront !== false) {
            result = publics.createTags({
                object: object,
                markup: markup,
                auth: auth,
                sourceFunction: sourceFunction,
                pathProperty: pathProperty,
                property: property,
                file: file,
                type: type,
                activateFront: activateFront
            });
        }

        /* Go to the creation of output Tags */
        return result;
    };

    /**
     * Add functions usable into Template Files.
     * @param {Object} variation     Add function into variation for an Client-Side utilization.
     * @param {boolean} activateFront [description]
     */
    publics.setFilters = function (variation, activateFront) {
        var NA = this;

        /* Manage editText() or et() functions. */
        variation.et = variation.editText = function (object, arr) {
            return publics.prepareTags({
                NA: NA,
                activateFront: activateFront,
                object: object,
                auth: arr[1],
                pathProperty: arr[0],
                sourceFunction: arr[2],
                property: undefined,
                markup: "span",
                type: "text"
            });
        };

        /* Manage editHtml() or eh() functions. */
        variation.eh = variation.editHtml = function (object, arr) {
            return publics.prepareTags({
                NA: NA,
                activateFront: activateFront,
                object: object,
                auth: arr[1],
                pathProperty: arr[0],
                sourceFunction: arr[2],
                property: undefined,
                markup: "div",
                type: "html"
            });
        };

        /* Manage editAttr() or ea() functions. */
        variation.ea = variation.editAttr = function (object, arr) {
            return publics.prepareTags({
                NA: NA,
                activateFront: activateFront,
                object: object,
                auth: arr[1],
                pathProperty: arr[0],
                sourceFunction: arr[3],
                property: arr[2]
            });
        };

        return variation;
    };

    /**
     * Save value and change it into all browser open.
     * @param  {Object} NA            NodeAtlas full object.
     * @param  {Object} socket        Socket for well working.
     * @param  {Object} options       Data from Client-side.
     * @param  {boolean} activateDemo Allow you to save or not into variation file.
     */
    publics.updateVariation = function (NA, socket, options, activateDemo) {
        var files, object, key,
            fs = NA.modules.fs,
            path = NA.modules.path;

        files = publics.orderByFile(options);

        function changeOnFrontEnd(file, i) {
            key = files[file][i].path.split('.').slice(1).join('.');

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
        }

        function changeOnBackEnd(file) {
            if (typeof activateDemo === 'undefined' || activateDemo) {
                fs.writeFileSync(path.join(NA.websitePhysicalPath, NA.webconfig.variationsRelativePath, file), JSON.stringify(object, undefined, "    "));
            }
        }

        NA.forEach(files, function (file) {
            try {
                object = require(path.join(NA.websitePhysicalPath, NA.webconfig.variationsRelativePath, file));
                if (object) {
                    for (var i = 0, l = files[file].length; i < l; i++) {
                        changeOnFrontEnd(file, i);
                    }
                }
                changeOnBackEnd(file);
            } catch (exception) {
                NA.log(exception);
            }
        });
    };

    /**
     * Get a value from variation file and not from Client DOM
     * @param  {Object} NA      NodeAtlas full object.
     * @param  {Object} socket  Socket for well working.
     * @param  {[type]} options Data from Client-side.
     */
    publics.sourceVariation = function (NA, socket, options) {
        var object, key,
            path = NA.modules.path;

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
            NA.log(exception);
        }
    };

    /**
     * [sockets description]
     * @param  {Object} socket        Socket for well working.
     * @param  {boolean} auth         Where register value.
     * @param  {boolean} activateDemo Allow you to save or not into variation file.
     */
    publics.sockets = function (socket, auth, activateDemo) {
        var NA = this;

        socket.on('update-variation', function (options) {
            if (auth) {
                publics.updateVariation(NA, socket, options, activateDemo);
            }
        });

        socket.on('source-variation', function (options) {
            if (auth) {
                publics.sourceVariation(NA, socket, options);
            }
        });
    };
}(website));

exports.setFilters = website.setFilters;
exports.sockets = website.sockets;