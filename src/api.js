"use strict";

const fs = require('fs');
const request = require('request');
const cheerio = require('cheerio');
const _ = require('lodash');

exports.baseUrl = "https://www.coop.nl/odoornschippers";
exports.jarPath = 'jar.json';

exports.storeJar = (jar) => {
	fs.writeFileSync(exports.jarPath, JSON.stringify(jar));
};

exports.retrieveJar = () => {
	if(!fs.exists(exports.jarPath)) {
		let jar = request.jar();
		fs.readFileSync('cookies', 'utf8').split('; ').forEach((x) => {
			const kvp = x.split('=');
			jar.setCookie(x, exports.baseUrl);
		});
		return jar;
	} else {
		return JSON.parse(fs.readFileSync(exports.jarPath, 'utf8'));
	}
};

exports.getBasket = (jar, f) => {
	request.get({url: exports.baseUrl+'/winkelmand', jar: jar}, (err, resp, body) => {
		let $ = cheerio.load(body);
		let result = [];
		$('.productItem').each((i, pi) => {
			const amount = parseInt($(pi).find('input').attr('value'));
			const totalPrice = parseFloat($(pi).find('.price').text().replace(',', '.'));
			result.push({
				'id': $(pi).find('.stepper').attr('data-basketstepper-sku'),
				'title': $(pi).find('.productTitle').text(),
				amount,
				totalPrice,
				'price': totalPrice / amount
			});
		});
		f(result);
	});
};

exports.getSyncToken = (jar, f) => {
	request.get({url: exports.baseUrl+'/winkelmand', jar: jar}, (err, resp, body) => {
		let $ = cheerio.load(body);
		f($('.productSearchForm').attr('data-basketstepperssynchronizertoken'));
	});
};

exports.search = (query, jar, f) => {
	request.get({url: exports.baseUrl+'/zoeken?SearchTerm='+encodeURI(query), jar:jar}, (err, resp, body) => {
		let $ = cheerio.load(body);
		let result = [];
		$('.listItem').each((i, pi) => {
			const amount = parseInt($(pi).find('input').attr('value'));
			const price = parseFloat($(pi).find('.price').text().replace(',', '.'));
			result.push({
				'id': $(pi).find('a').attr('href').split('/').pop(),
				'title': $(pi).find('.productTitle').text().trim(),
				amount,
				'totalPrice': price * amount,
				'price': price
			});
		});
		f(result);
	});
};

exports.setAmount = (sku, amount, syncToken, jar, f) => {
	request.post({
		url: exports.baseUrl+"/actions/ViewAjax-Start?TargetPipeline=ViewCart-Dispatch",
		form: {
			addUpdateProductCart: 'addUpdateProductCart',
			SKU: sku,
			Quantity: amount,
			SynchronizerToken: syncToken
		},
		jar: jar
	}, (err, resp, body) => {
		f();
	});
};

exports.purgeBasket = (syncToken, jar, f) => {
	exports.getBasket(jar, (ps) => {
		_.reduce(ps, (g, p) => {
			return () => { exports.setAmount(p.id, 0, syncToken, jar, g); }
		}, f)();
	});
};

