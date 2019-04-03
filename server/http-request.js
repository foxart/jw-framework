"use strict";
/** @type {*} */
const Cookie = require("cookie");
const Url = require("url");
/*fa*/
const FaServerHttpContentTypeClass = require("fa-nodejs/server/http-content-type");
let NL = '\r\n'; // RFC2046 S4.1.1
let BOUNDARY_PREFIX = NL + '--'; // RFC2046 S5.1.1
let HEADER_PAIR_DELIM = ':';
let HEADER_SUB_DELIM = '=';

function parse(result, contentType, data) {
	if (data.substr(0, NL.length) !== NL) {
		data = NL + data;
	}
	let params = parseHeaderValue(contentType);
	if (params.hasOwnProperty('boundary')) {
		let parts = data.split(BOUNDARY_PREFIX + params.boundary);
		console.error(contentType, params, parts);
		parts.forEach(function (chunk, i, arr) {
			// split the headers and body for this chunk
			let pieces = splitHeaderBody(chunk);
			// console.warn(pieces)
			// if (pieces.header && pieces.body) {
			// 	// build headers object
			// 	let headers = parseHeader(pieces.header);
			// 	// if nested multipart form-data, recurse
			// 	if (headers.hasOwnProperty('content-type') && headers['content-type'].indexOf('multipart/form-data') === 0) {
			// 		parse(result, headers['content-type'], pieces.body);
			// 	} else if (headers.hasOwnProperty('content-disposition')) {
			// 		let disposition = parseHeaderValue(headers['content-disposition']);
			// 		if (disposition.hasOwnProperty('name')) {
			// 			// console.warn(self.fields);
			// 			result.fields.push(disposition.name);
			// 			result.parts[disposition.name] = {
			// 				headers: headers,
			// 				disposition: disposition,
			// 				mime: headers['content-type'] || '',
			// 				body: pieces.body
			// 			};
			// 		}
			// 	}
			// }
		});
	}
	return result;
}

function splitHeaderBody(data) {
	// let sections = data.split(NL + NL, 2);
	let sections = data.split(NL + NL);
	return {
		header: sections[0] || '',
		body: sections[1] || ''
	};
}

function parseHeader(header) {
	let result = {};
	let parameters = header.split(NL).map(function (item) {
		return item.trim();
	}).filter(function (v) {
		return !!v;
	});
	parameters.forEach(function (item) {
		// let keyValue = item.split(HEADER_PAIR_DELIM, 2);
		let keyValue = item.split(HEADER_PAIR_DELIM);
		if (typeof keyValue[1] === 'string') {
			keyValue[1] = keyValue[1].trim();
		}
		result[keyValue[0].toLowerCase().trim()] = keyValue[1];
	});
	return result;
}

function parseHeaderValue(value) {
	let result = {};
	let parameters = value.split(';').map(function (item) {
		return item.trim();
	}).filter(function (v) {
		return !!(v || v.indexOf('='));
	});
	parameters.forEach(function (item) {
		// let keyValue = item.split(HEADER_SUB_DELIM, 2);
		let keyValue = item.split(HEADER_SUB_DELIM);
		if (typeof keyValue[1] === 'string') {
			keyValue[1] = keyValue[1].replace(/^[\s'"]+|[\s'"]+$/g, '');
			result[keyValue[0].toLowerCase().trim()] = keyValue[1];
		}
	});
	return result;
}

class FaHttpRequestClass {
	/**
	 *
	 * @param conf
	 * @param method
	 * @param headers
	 * @param url
	 * @param body
	 * @return {{path: string, headers: *, request: {}, input: *, method: string, post, get}}
	 */
	constructor(conf, method, headers, url, body) {
		this._FaConverterClass = require("fa-nodejs/base/converter")(conf);
		this._FaServerHttpContentType = new FaServerHttpContentTypeClass();
	}

	/**
	 *
	 * @return {FaConverterClass}
	 * @private
	 */
	get _converter() {
		return this._FaConverterClass;
	}

	/**
	 *
	 * @return {FaServerHttpContentType}
	 * @private
	 */
	get _contentType() {
		return this._FaServerHttpContentType;
	}

	checkMultipart(contentType) {
		return contentType.trim().indexOf('multipart/form-data') === 0;
	}

	parseMultipart(body) {
		// console.info(body);
		// if (body.substr(0, NL.length) !== NL) {
		// 	body = NL + body;
		// }
		let boundary = body.substr(0, body.indexOf(NL));
		let tmp = body.split(boundary);
		console.warn(boundary, tmp);
	}

	/**
	 *
	 * @param req
	 * @param body
	 * @return {{path: string, headers: *, input: *, method: string, post, cookie, get}}
	 */
	formatRequest(req, body) {
		let url = Url.parse(req.url);
		let get = null;
		let post = null;
		let cookie = null;
		let client = {
			ip: (req.headers['x-forwarded-for'] || '').split(',').pop() ||
				req.connection.remoteAddress ||
				req.socket.remoteAddress ||
				req.connection.socket.remoteAddress
		};
		if (url.query) {
			get = this._converter.fromUrlEncoded(url.query);
		}
		if (["PATCH", "POST", "PUT"].has(req.method)) {
			if (this.checkMultipart(req.headers["content-type"])) {
				// post = this.parse({fields: [], parts: {}}, req.headers['content-type'], body);
				post = this.parseMultipart(body);
			} else {
				switch (req.headers["content-type"]) {
					case this._contentType.json:
						post = this._converter.fromJson(body);
						break;
					case this._contentType.xml:
						post = this._converter.fromXml(body);
						break;
					case this._contentType.urlencoded:
						post = this._converter.fromUrlEncoded(body);
						break;
					default:
						post = body;
				}
			}
		}
		if (req.headers["cookie"]) {
			cookie = Cookie.parse(req.headers["cookie"]);
		}
		return {
			client: client,
			headers: req.headers,
			method: req.method.toLowerCase(),
			path: url.pathname,
			get: get,
			post: post,
			cookie: cookie,
			// request: (typeof get === "object" && typeof post === "object") ? Object.assign({}, get, post) : {},
			input: body,
		};
	}
}

/**
 *
 * @type {FaHttpRequestClass}
 */
module.exports = FaHttpRequestClass;
