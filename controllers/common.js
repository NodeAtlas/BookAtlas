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
		var socketio = params.socketio,
			NA = params.NA,
			ejs = NA.modules.ejs,
			fs = NA.modules.fs;

		socketio.sockets.on('connection', function (socket) {
			socket.on('load-sections', function () {
		        var data = {},
		        	currentVariation = {},
		        	common;

		        currentVariation.specific = JSON.parse(fs.readFileSync(NA.websitePhysicalPath + NA.webconfig.variationsRelativePath + "index.json", 'utf-8'));
		        currentVariation.common = JSON.parse(fs.readFileSync(NA.websitePhysicalPath + NA.webconfig.variationsRelativePath + "common.json", 'utf-8'));

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

		privates.socketIoInitialisation(socketio, NA, function (socketio) {

			privates.socketIoEvents(socketio, NA);

			callback(NA);					
		});

	};			

	privates.socketIoInitialisation = function (socketio, NA, callback) {
		var optionIo = (NA.webconfig.urlRelativeSubPath) ? { path: NA.webconfig.urlRelativeSubPath + '/socket.io' } : undefined,
			socketio = socketio(NA.server, optionIo),
			cookie = NA.modules.cookie,
			cookieParser = NA.modules.cookieParser;

		socketio.use(function(socket, next) {
			var handshakeData = socket.request;

			if (!handshakeData.headers.cookie) {
                return next(new Error('Cookie de session requis.'));
            }

            handshakeData.cookie = cookie.parse(handshakeData.headers.cookie);
            handshakeData.cookie = cookieParser.signedCookies(handshakeData.cookie, NA.webconfig.session.secret);
    		handshakeData.sessionID = handshakeData.cookie[NA.webconfig.session.key];

			NA.sessionStore.load(handshakeData.sessionID, function (error, session) {
                if (error || !session) {
                	return next(new Error('Aucune session récupérée.'));
                } else {
                    handshakeData.session = session;           			
                    next();
                }
            });
		});

    	callback(socketio);
	};

	privates.socketIoEvents = function (socketio, NA) {
		var params = {};

		params.socketio = socketio;
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