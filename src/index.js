"use strict";

const fs = require('fs');
const request = require('request');
const cheerio = require('cheerio');
const _ = require('lodash');

const baseUrl = "https://www.coop.nl/odoornschippers";
const jQueryUrl = "https://code.jquery.com/jquery.js";

let jar = null;
let jarPath = 'jar.json';

if(!fs.exists(jarPath)) {
	jar = request.jar();
	fs.readFileSync('cookies', 'utf8').split('; ').forEach((x) => {
		const kvp = x.split('=');
		jar.setCookie(x, baseUrl);
	});
} else {
	jar = JSON.parse(fs.readFileSync(jarPath, 'utf8'));
}

const storeJar = (jar) => {
	fs.writeFileSync(jarPath, JSON.stringify(jar));
}

const byClass = (node, name) => {
	return node.getElementsByClassName(name);
}

const getBasket = (f) => {
	request.get({url: baseUrl+'/winkelmand', jar: jar}, (err, resp, body) => {
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

const getSyncToken = (f) => {
	request.get({url: baseUrl+'/winkelmand', jar: jar}, (err, resp, body) => {
		let $ = cheerio.load(body);
		f($('.productSearchForm').attr('data-basketstepperssynchronizertoken'));
	});
};

const search = (query, f) => {
	request.get({url: baseUrl+'/zoeken?SearchTerm='+encodeURI(query), jar:jar}, (err, resp, body) => {
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

const setAmount = (sku, amount, syncToken, f) => {
	request.post({
		url: baseUrl+"/actions/ViewAjax-Start?TargetPipeline=ViewCart-Dispatch",
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

getSyncToken((tok) => {
	search('bapao', (result) => {
		let p = result[0];

		setAmount(p.id, 3, tok, () => {
			getBasket((result) => {
				console.log(result);
			});
		});
	});
});

