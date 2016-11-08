"use strict";

const fs = require('fs');
const request = require('request');
const cheerio = require('cheerio');
const _ = require('lodash');

const baseUrl = "https://www.coop.nl/odoornschippers";
const jQueryUrl = "https://code.jquery.com/jquery.js";

let jar = request.jar();
fs.readFileSync('cookies', 'utf8').split('; ').forEach((x) => {
	const kvp = x.split('=');
	jar.setCookie(x, baseUrl);
});

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

getBasket((result) => {
	console.log(result);
});

search('bapao', (result) => { console.log(result) });
