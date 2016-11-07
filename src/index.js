"use strict";

const fs = require('fs');
const request = require('request');
const jsdom = require('jsdom');
const _ = require('lodash');

const baseUrl = "https://www.coop.nl/odoornschippers";
const jQueryUrl = "https://code.jquery.com/jquery.js";

let jar = request.jar();
fs.readFileSync('cookies', 'utf8').split('; ').forEach((x) => {
	const kvp = x.split('=');
	jar.setCookie(x, baseUrl);
});

const getBasket = (f) => {
	request.get({url: baseUrl+'/winkelmand', jar: jar}, (err, resp, body) => {
		jsdom.env(body, [jQueryUrl], (err, window) => {
			let result = [];
			window.$('.productItem').each((i, pi) => {
				const amount = parseInt(pi.querySelector('input').getAttribute('value'));
				const totalPrice = parseFloat(pi.querySelector('.price').textContent.replace(',', '.'));
				result.push({
					'id': pi.querySelector('.stepper').getAttribute('data-basketstepper-sku'),
					'title': pi.querySelector('.productTitle').textContent,
					amount,
					totalPrice,
					'price': totalPrice / amount
				});
			});
			f(result);
		});
	});
};

const search = (query, f) => {
	request.get({url: baseUrl+'/zoeken?SearchTerm='+encodeURI(query), jar:jar}, (err, resp, body) => {
		jsdom.env(body, [jQueryUrl], (err, window) => {
			let result = [];
			window.$('.listItem').each((i, pi) => {
				const amount = parseInt(pi.querySelector('input').getAttribute('value'));
				const price = parseFloat(pi.querySelector('.price').textContent.replace(',', '.'));
				result.push({
					'id': pi.querySelector('a').getAttribute('href').split('/').pop(),
					'title': pi.querySelector('.productTitle').textContent.trim(),
					amount,
					'totalPrice': price * amount,
					'price': price
				});
			});
			f(result);
		});
	});
};

getBasket((result) => {
	console.log(result);
});

search('bapao', (result) => { console.log(result) });
