"use strict";

const api = require('./api');

let jar = api.retrieveJar();

api.getSyncToken(jar, (tok) => {
	api.purgeBasket(tok, jar, () => {
		api.search('bapao', jar, (result) => {
			let p = result[0];

			api.setAmount(p.id, 3, tok, jar, () => {
				api.getBasket(jar, (result) => {
					console.log(result);
				});
			});
		});
	});
});
