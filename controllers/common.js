var website = {};

website.components = {};

(function (publics) {
	"use strict";

	website.components.socketio = require('../components/controllers/socket-io');
	website.components.editAtlas = require('../components/controllers/edit-atlas');

	publics.loadModules = function (NA) {
		NA.modules.cookie = require('cookie');
		NA.modules.socketio = require('socket.io');
		
		return NA;
	};

	publics.setConfigurations = function (NA, next) {
		var socketio = NA.modules.socketio;

		website.components.socketio.initialisation(socketio, NA, function (socketio, NA) {
			website.components.socketio.events(socketio, NA, function (params) {
				website.asynchrones(params);
				next(NA);
			});
		});
	};

	publics.asynchrones = function (params) {
		var socketio = params.socketio,
			NA = params.NA,
			ejs = NA.modules.ejs,
			fs = NA.modules.fs;

		socketio.sockets.on('connection', function (socket) {
			website.components.editAtlas.sockets(socket, NA, true);

			socket.on('load-sections', function () {
		        var data = {},
		        	currentVariation = {},
		        	common;

		        currentVariation.specific = JSON.parse(fs.readFileSync(NA.websitePhysicalPath + NA.webconfig.variationsRelativePath + "index.json", 'utf-8'));
		        currentVariation.common = JSON.parse(fs.readFileSync(NA.websitePhysicalPath + NA.webconfig.variationsRelativePath + "common.json", 'utf-8'));
				/*currentVariation.fs = currentVariation.currentRouteParameters.variation;*/
				currentVariation.fc = NA.webconfig.commonVariation;
				currentVariation = website.components.editAtlas.setFilters(currentVariation, NA);

		        data.topPart = {};
		        data.topPart.offers = ejs.render(fs.readFileSync(NA.websitePhysicalPath + NA.webconfig.componentsRelativePath + "section-offers.htm", 'utf-8'), currentVariation);
		        data.topPart.bepo = ejs.render(fs.readFileSync(NA.websitePhysicalPath + NA.webconfig.componentsRelativePath + "section-bepo.htm", 'utf-8'), currentVariation);
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

	publics.changeVariation = function (params, mainCallback) {
		var variation = params.variation,
			NA = params.NA,
			session = params.request.session;

		// variation.fs = false;
		// variation.fc = false;
		/*if (session.hasPermissionForEdit) {*/
			// Le fichier spécifique utilisé pour générer cette vue.
			variation.fs = variation.currentRouteParameters.variation;
			// Le fichier commun utilisé pour générer cette vue.
			variation.fc = variation.webconfig.commonVariation;
		/*}*/

		variation = website.components.editAtlas.setFilters(variation, NA);

		mainCallback(variation);
	};

}(website));

exports.loadModules = website.loadModules;
exports.setConfigurations = website.setConfigurations;
exports.changeVariation = website.changeVariation;