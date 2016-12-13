/* jslint node: true */
var website = {};

website.components = {};

(function (publics) {
	"use strict";

	website.components.editAtlas = require('./modules/edit-atlas');
	website.components.componentAtlas = require('./modules/component-atlas');

	publics.setModules = function () {
		var NA = this,
			path = NA.modules.path;

		NA.modules.nodemailer = require('nodemailer');
		NA.modules.jshashes = require('jshashes');
		NA.modules.common = require(path.join(NA.serverPath, NA.webconfig.variationsRelativePath, 'fr-fr/common.json'));
	};

	publics.setConfigurations = function (next) {
		var NA = this,
			route = NA.webconfig.routes;

	    route["/javascript/hashes.min.js"] = {
	        "view": "../node_modules/jshashes/hashes.min.js",
	        "headers": {
	        	"Content-Type": "text/javascript; charset=utf-8"
	        }
	    };

		website.setSocket.call(NA);

		next();
	};

	publics.setSocket = function () {
		var NA = this,
			io = NA.io,
			nodemailer = NA.modules.nodemailer,
			common = NA.modules.common;

		io.sockets.on('connection', function (socket) {
			var session = socket.request.session,
				activeDemo = true;

			if (session.account) {
				activeDemo = false;
			}

			website.components.editAtlas.sockets.call(NA, socket, true, !activeDemo);

			socket.on('account-login', function (data) {
				var dataResponse = {};

				if (!session.account) {
					if (data.email === NA.webconfig._emailAccountAuth &&
						data.password === NA.webconfig._passwordAccountAuth)
					{
						session.account = {};
						session.touch().save();

						dataResponse.authSuccess = true;
					} else {
						dataResponse.authSuccess = false;
					}

					socket.emit('account-login', dataResponse);
				}
			});

			socket.on('account-logout', function (data) {
				if (session.account) {
					session.account = undefined;
					session.touch().save();

					socket.emit('account-logout', data);
				}
			});

			socket.on('load-sections', function (dataEmit) {
		        var data = {},
	        		currentVariation = {};

        		/* Asynchrone render of template and variations */
				currentVariation = NA.addSpecificVariation(dataEmit.variation + ".json", dataEmit.lang, currentVariation);
		        currentVariation = NA.addCommonVariation(dataEmit.lang, currentVariation);

		        /* Asynchrone addon for editAtlas render */
				currentVariation.languageCode = dataEmit.lang;
				currentVariation.fs = dataEmit.lang + "/" + dataEmit.variation + ".json";
				currentVariation.fc = dataEmit.lang + "/" + NA.webconfig.commonVariation;
				currentVariation = website.components.editAtlas.setFilters.call(NA, currentVariation);

				/* Asynchrone Top Components */
		        data.topPart = {};
		        data.topPart.offers = NA.newRender("partials/section-offers.htm", currentVariation);
		        data.topPart.offers = NA.newRender("partials/section-offers.htm", currentVariation);
		        data.topPart.bepo = NA.newRender("partials/section-bepo.htm", currentVariation);
		        data.topPart.book = NA.newRender("partials/section-book.htm", currentVariation);
		        data.topPart.website = NA.newRender("partials/section-website.htm", currentVariation);
		        data.topPart.blog = NA.newRender("partials/section-blog.htm", currentVariation);
		        data.topPart["front-end"] = NA.newRender("partials/section-front-end.htm", currentVariation);
		        data.topPart["unknown-top"] = NA.newRender("partials/section-unknown-top.htm", currentVariation);

				/* Asynchrone Top Components */
				data.bottomPart = {};
		        data.bottomPart["unknown-bottom"] = NA.newRender("partials/section-unknown-bottom.htm", currentVariation);
		        data.bottomPart.websites = NA.newRender("partials/section-websites.htm", currentVariation);
		        data.bottomPart.skills = NA.newRender("partials/section-skills.htm", currentVariation);
		        data.bottomPart['contact-me'] = NA.newRender("partials/section-contact-me.htm", currentVariation);
		        data.bottomPart['about-me'] = NA.newRender("partials/section-about-me.htm", currentVariation);
		        data.bottomPart.nodeatlas = NA.newRender("partials/section-nodeatlas.htm", currentVariation);
		        data.bottomPart.games = NA.newRender("partials/section-games.htm", currentVariation);

		        /* Load Components */
				socket.emit('load-sections', data);
			});

			socket.on('send-email', function (data) {
				// Prepare email.
				var transporter = nodemailer.createTransport('smtps://' + NA.webconfig._smtpLoginAuth + ':' + NA.webconfig._smtpPasswordAuth + '@in-v3.mailjet.com'),
					mailOptions = {
					    from: common.email.from,
					    to: common.email.to,
						replyTo: common.email.replyTo.anonyme,
					    subject: common.email.subject.anonyme,
					    text: data.detail
					};

				if (data.name) {
					mailOptions.subject = data.name + " " + common.email.subject.auth;
				}
				if (data.name && data.email) {
					mailOptions.replyTo = '"' + data.name + '" <' + data.email + '>';
					mailOptions.subject = data.name + ' ' + common.email.subject.reply + ' (' + data.email + ')';
				}

				// Send mail with defined transport object.
				transporter.sendMail(mailOptions, function(error) {
				    if (error) {
				        return socket.emit('send-email', error);
				    }

			        /* Inform client. */
					socket.emit('send-email');
				});

			});
		});
	};

	publics.changeVariation = function (params, mainCallback) {
		var NA = this,
			variation = params.variation,
			session = params.request.session;

		variation.session = session;

		variation.fs = ((variation.languageCode) ? variation.languageCode + "/": "") + variation.currentRouteParameters.variation;
		variation.fc = ((variation.languageCode) ? variation.languageCode + "/": "") + variation.webconfig.commonVariation;

		variation = website.components.editAtlas.setFilters.call(NA, variation);
		variation = website.components.componentAtlas.includeComponents.call(NA, variation, "components", "mainTag", "componentName");

		mainCallback(variation);
	};

}(website));

exports.setModules = website.setModules;
exports.setConfigurations = website.setConfigurations;
exports.changeVariation = website.changeVariation;