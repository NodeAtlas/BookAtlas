var website = {};

// Loading modules for this website.
(function (publics) {
	"use strict";

	publics.loadModules = function (NA) {
		var modulePath = (NA.webconfig._needModulePath) ? NA.nodeModulesPath : '';
		
		NA.modules.fs = require('fs');
		NA.modules.socketio = require(modulePath + 'socket.io');
		NA.modules.cookie = require(modulePath + 'cookie');

		return NA;
	};

}(website));



// Asynchrone
(function (publics) {
	"use strict";

	var privates = {};

	publics.asynchrone = function (params) {
		var io = params.io,
			NA = params.NA,
			ejs = NA.modules.ejs,
			fs = NA.modules.fs;

		io.sockets.on('connection', function (socket) {
			var sessionID = socket.handshake.sessionID,
				session = socket.handshake.session;

			socket.on('load-sections', function () {
		        var data = {},
		        	currentVariation = {},
		        	common;

		        currentVariation.specific = JSON.parse(fs.readFileSync(NA.websitePhysicalPath + NA.webconfig.variationsRelativePath + "fr-fr/index.json", 'utf-8'));
		        currentVariation.common = JSON.parse(fs.readFileSync(NA.websitePhysicalPath + NA.webconfig.variationsRelativePath + "fr-fr/common.json", 'utf-8'));

		        data.topPart = {};
		        data.topPart.bepo = ejs.render(fs.readFileSync(NA.websitePhysicalPath + NA.webconfig.componentsRelativePath + "section-bepo.htm", 'utf-8'), currentVariation);
		        data.topPart.offers = ejs.render(fs.readFileSync(NA.websitePhysicalPath + NA.webconfig.componentsRelativePath + "section-offers.htm", 'utf-8'), currentVariation);
		        data.topPart.book = ejs.render(fs.readFileSync(NA.websitePhysicalPath + NA.webconfig.componentsRelativePath + "section-book.htm", 'utf-8'), currentVariation);
		        data.topPart.website = ejs.render(fs.readFileSync(NA.websitePhysicalPath + NA.webconfig.componentsRelativePath + "section-website.htm", 'utf-8'), currentVariation);
		        data.topPart.blog = ejs.render(fs.readFileSync(NA.websitePhysicalPath + NA.webconfig.componentsRelativePath + "section-blog.htm", 'utf-8'), currentVariation);
		        data.topPart["front-end"] = ejs.render(fs.readFileSync(NA.websitePhysicalPath + NA.webconfig.componentsRelativePath + "section-front-end.htm", 'utf-8'), currentVariation);
		        data.topPart["unknown-top"] = ejs.render(fs.readFileSync(NA.websitePhysicalPath + NA.webconfig.componentsRelativePath + "section-unknown-top.htm", 'utf-8'), currentVariation);

				data.bottomPart = {};
		        data.bottomPart["unknown-bottom"] = ejs.render(fs.readFileSync(NA.websitePhysicalPath + NA.webconfig.componentsRelativePath + "section-unknown-bottom.htm", 'utf-8'), currentVariation);
		        data.bottomPart.websites = ejs.render(fs.readFileSync(NA.websitePhysicalPath + NA.webconfig.componentsRelativePath + "section-websites.htm", 'utf-8'), currentVariation);
		        data.bottomPart.skills = ejs.render(fs.readFileSync(NA.websitePhysicalPath + NA.webconfig.componentsRelativePath + "section-skills.htm", 'utf-8'), currentVariation);
		        data.bottomPart['contact-me'] = ejs.render(fs.readFileSync(NA.websitePhysicalPath + NA.webconfig.componentsRelativePath + "section-contact-me.htm", 'utf-8'), currentVariation);
		        data.bottomPart['about-me'] = ejs.render(fs.readFileSync(NA.websitePhysicalPath + NA.webconfig.componentsRelativePath + "section-about-me.htm", 'utf-8'), currentVariation);
		        data.bottomPart.nodeatlas = ejs.render(fs.readFileSync(NA.websitePhysicalPath + NA.webconfig.componentsRelativePath + "section-nodeatlas.htm", 'utf-8'), currentVariation);
		        data.bottomPart.games = ejs.render(fs.readFileSync(NA.websitePhysicalPath + NA.webconfig.componentsRelativePath + "section-games.htm", 'utf-8'), currentVariation);

				socket.emit('load-sections', data);
			});
		});
	};

}(website));



// Set configuration for this website.
(function (publics) {
	"use strict";

	var privates = {};

	publics.setConfigurations = function (NA, callback) {
		var mongoose = NA.modules.mongoose,
			socketio = NA.modules.socketio,
			connect = NA.modules.connect;

		privates.socketIoInitialisation(socketio, NA, function (io) {

			privates.socketIoEvents(io, NA);

			callback(NA);					
		});

	};			

	privates.socketIoInitialisation = function (socketio, NA, callback) {
		var io = socketio.listen(NA.server),
			connect = NA.modules.connect,
			cookie = NA.modules.cookie;

		io.enable('browser client minification');
		if (NA.webconfig._ioGzip) {
			io.enable('browser client gzip');
		}
		io.set('log level', 1);
		io.enable('browser client cache');
		io.set('browser client expires', 86400000 * 30);
		io.enable('browser client etag');
		io.set('authorization', function (data, accept) {

            // No cookie enable.
            if (!data.headers.cookie) {
                return accept('Session cookie required.', false);
            }

            // First parse the cookies into a half-formed object.
            data.cookie = cookie.parse(data.headers.cookie);

            // Next, verify the signature of the session cookie.
            data.cookie = connect.utils.parseSignedCookies(data.cookie, NA.webconfig.session.secret);
             
            // save ourselves a copy of the sessionID.
            data.sessionID = data.cookie[NA.webconfig.session.key];

			// Accept cookie.
            NA.sessionStore.load(data.sessionID, function (error, session) {
                if (error || !session) {
                    accept("Error", false);
                } else {
                    data.session = session;
                    accept(null, true);
                }
            });

        });

    	callback(io);		
	};

	privates.socketIoEvents = function (io, NA) {
		var params = {};

		params.io = io;
		params.NA = NA;

		website.asynchrone(params);
	};

}(website));

// PreRender
(function (publics) {
	"use strict";

	publics.preRender = function (params, mainCallback) {
		var variation = params.variation;

		// Ici on modifie les variables de variations.
		//console.log(params.variation);

		mainCallback(variation);
	};

}(website));

// Render
(function (publics) {
	"use strict";

	publics.render = function (params, mainCallback) {
		var data = params.data;

		// Ici on peut manipuler le DOM côté serveur avant retour client.
		//console.log(params.data);

		mainCallback(data);
	};

}(website));


exports.loadModules = website.loadModules;
exports.setConfigurations = website.setConfigurations;
exports.preRender = website.preRender;
exports.render = website.render;