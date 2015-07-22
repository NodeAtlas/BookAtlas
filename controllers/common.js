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
			path = NA.modules.path,
			ejs = NA.modules.ejs,
			fs = NA.modules.fs;

		socketio.sockets.on('connection', function (socket) {
			website.components.editAtlas.sockets(socket, NA, true);

			socket.on('load-sections', function (dataEmit) {
		        var data = {},
	        		currentVariation = {};

        		/* Asynchrone render of template and variations */
				currentVariation = NA.addSpecificVariation(dataEmit.variation + ".json", dataEmit.lang, currentVariation);
		        currentVariation = NA.addCommonVariation(dataEmit.lang, currentVariation);

		        /* Asynchrone addon for editAtlas render */
				currentVariation.fs = dataEmit.variation + ".json";
				currentVariation.fc = NA.webconfig.commonVariation;
				currentVariation = website.components.editAtlas.setFilters(currentVariation, NA);

				/* Asynchrone Top Components */
		        data.topPart = {};
		        data.topPart.offers = NA.newRender("section-offers.htm", currentVariation);
		        data.topPart.offers = NA.newRender("section-offers.htm", currentVariation);
		        data.topPart.bepo = NA.newRender("section-bepo.htm", currentVariation);
		        data.topPart.book = NA.newRender("section-book.htm", currentVariation);
		        data.topPart.website = NA.newRender("section-website.htm", currentVariation);
		        data.topPart.blog = NA.newRender("section-blog.htm", currentVariation);
		        data.topPart["front-end"] = NA.newRender("section-front-end.htm", currentVariation);
		        data.topPart["unknown-top"] = NA.newRender("section-unknown-top.htm", currentVariation);

				/* Asynchrone Top Components */
				data.bottomPart = {};
		        data.bottomPart["unknown-bottom"] = NA.newRender("section-unknown-bottom.htm", currentVariation);
		        data.bottomPart.websites = NA.newRender("section-websites.htm", currentVariation);
		        data.bottomPart.skills = NA.newRender("section-skills.htm", currentVariation);
		        data.bottomPart['contact-me'] = NA.newRender("section-contact-me.htm", currentVariation);
		        data.bottomPart['about-me'] = NA.newRender("section-about-me.htm", currentVariation);
		        data.bottomPart.nodeatlas = NA.newRender("section-nodeatlas.htm", currentVariation);
		        data.bottomPart.games = NA.newRender("section-games.htm", currentVariation);

		        /* Load Components */
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