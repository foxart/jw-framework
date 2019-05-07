"use strict";
/*node*/
const Buffer = require("buffer").Buffer;
const Http = require("http");
const Https = require("https");
/** @type {*} */
const MimeTypes = require("mime-types");
/*fa-nodejs*/
const FaError = require("fa-nodejs/base/error");
const FaTrace = require("fa-nodejs/base/trace");
const FaBaseFile = require("fa-nodejs/base/file");
const FaConsoleColor = require("fa-nodejs/console/console-helper");
const FaConverterClass = require("fa-nodejs/base/converter");
const FaServerHttpRequestClass = require("fa-nodejs/server/http-request");
const FaHttpResponse = require("fa-nodejs/server/http-response");
const FaServerHttpContentType = require("./http-content-type");
const FaServerHttpStatusCode = require("./http-status-code");
const FaBaseRouter = require("fa-nodejs/base/router");

class FaServerHttp {
	constructor(configuration) {
		this._FaHttpConfigurationClass = require("./http-configuration")(configuration);
		this._FaConverterClass = new FaConverterClass(this.Configuration.converter);
		// console.info(configuration);
		this._FaFile = new FaBaseFile(this.Configuration.path);
		this._FaFilePrivate = new FaBaseFile(this.Configuration.private);
		this._FaRouter = new FaBaseRouter(this);
		this._FaAssetRouter = new FaBaseRouter(this);
		this._FaHttpResponse = FaHttpResponse;
		this._FaServerHttpRequest = new FaServerHttpRequestClass(this.Configuration.converter);
		this._FaHttpContentType = new FaServerHttpContentType();
		this._FaHttpStatusCode = new FaServerHttpStatusCode();
		// this.HttpServer = this._createHttp(this.Configuration);
		this._createHttp(this.Configuration);
		this._trace = FaTrace.trace(1);
	}

	/**
	 *
	 * @return {{protocol: string, host: string, port: number, path: string, converter: {}}}
	 * @constructor
	 */
	get Configuration() {
		return this._FaHttpConfigurationClass;
	}

	/**
	 *
	 * @return {FaConverterClass}
	 * @constructor
	 */
	get Converter() {
		return this._FaConverterClass;
	}

	/**
	 *
	 * @return {FaBaseFile}
	 * @constructor
	 */
	get File() {
		return this._FaFile;
	}

	get FilePrivate() {
		return this._FaFilePrivate;
	}

	/**
	 *
	 * @return {FaRouterClass}
	 */
	get Router() {
		return this._FaRouter;
	}

	/**
	 *
	 * @return {FaRouterClass}
	 */
	get Assets() {
		return this._FaAssetRouter;
	}

	/**
	 *
	 * @return {FaServerHttpContentType}
	 */
	get type() {
		return this._FaHttpContentType;
	}

	/**
	 *
	 * @return {FaServerHttpStatusCode}
	 */
	get status() {
		return this._FaHttpStatusCode;
	}

	/**
	 *
	 * @param configuration
	 * @return {Server}
	 * @private
	 */
	_createHttp(configuration) {
		let self = this;

		console.info(configuration, process.cwd());
		const options = {
			key: this.FilePrivate.readFileSync("ssl/server.key"),
			cert: this.FilePrivate.readFileSync("ssl/server.cert")
		};
		Https.createServer(options, function (req, res) {
			self._listenHttp(req, res);
		}).listen(443, function () {
			console.log(`FaHttp ${FaConsoleColor.effect.bold}${FaConsoleColor.color.green}\u2714${FaConsoleColor.effect.reset} {protocol}://{host}:{port} <{path}>`.replaceAll(Object.keys(configuration).map(function (key) {
				return `{${key}}`;
			}), Object.values(configuration)));
		});
		// return _HttpsServer;
		Http.createServer(function (req, res) {
			self._listenHttp(req, res);
		}).listen(configuration.port, function () {
			console.log(`FaHttp ${FaConsoleColor.effect.bold}${FaConsoleColor.color.green}\u2714${FaConsoleColor.effect.reset} {protocol}://{host}:{port} <{path}>`.replaceAll(Object.keys(configuration).map(function (key) {
				return `{${key}}`;
			}), Object.values(configuration)));
		});
	}

	/**
	 *
	 * @param req
	 * @param res
	 * @private
	 */
	_listenHttp(req, res) {
		let context = this;
		// let Multiparty = require("multiparty");
		// let form = new Multiparty.Form();
		// form.parse(req, function (err, fields, files) {
		// 	// console.error(err);
		// 	if (fields || files) {
		// 		console.info(fields);
		// 		console.warn(files);
		// 	}
		// });
		let body = "";
		req.on("data", function (chunk) {
			body += chunk;
		});
		req.on("error", function (error) {
			context._respondHttp(req, res, error);
		});
		req.on("end", function () {
			context._handleRequest(context._FaServerHttpRequest.formatRequest(req, body)).then(function (result) {
				context._respondHttp(req, res, result);
			}).catch(function (result) {
				context._respondHttp(req, res, result);
			});
		});
	};

	/**
	 *
	 * @param req
	 * @param res
	 * @param FaHttpResponse {FaServerHttpResponse}
	 * @private
	 */
	_respondHttp(req, res, FaHttpResponse) {
		if (FaHttpResponse.headers["Content-Type"] === null) {
			if (req.headers.accept) {
				if (req.headers.accept.indexOf(this.type.json) !== -1) {
					FaHttpResponse.headers["Content-Type"] = this.type.json;
				} else if (req.headers.accept.indexOf(this.type.html) !== -1) {
					FaHttpResponse.headers["Content-Type"] = this.type.html;
				} else if (req.headers.accept.indexOf(this.type.urlencoded) !== -1) {
					FaHttpResponse.headers["Content-Type"] = this.type.urlencoded;
				} else if (req.headers.accept.indexOf(this.type.xml) !== -1) {
					FaHttpResponse.headers["Content-Type"] = this.type.xml;
				} else {
					FaHttpResponse.headers["Content-Type"] = this.type.html;
				}
			} else {
				FaHttpResponse.headers["Content-Type"] = this.type.html;
			}
		}
		// let accepts = require("accepts");
		// let accept = accepts(req);
		switch (!FaHttpResponse.content.byteLength && FaHttpResponse.headers["Content-Type"]) {
			case this.type.json:
				FaHttpResponse.content = this.Converter.toJson(FaHttpResponse.content);
				break;
			case this.type.html:
				if (FaHttpResponse.status === this.status.notFound) {
					let res = this.Converter.toHtml(FaHttpResponse.content);
					// let res = this.Converter.toHtml({a:1});
					FaHttpResponse.content = `<html lang="en"><head><title></title><link href="/fa/beautify.css" rel="stylesheet"/><link href="/css/main.css" rel="stylesheet"/></head><body><main>${res}</main></body></html>`;
				} else {
					FaHttpResponse.content = this.Converter.toHtml(FaHttpResponse.content);
				}
				break;
			case this.type.urlencoded:
				FaHttpResponse.content = this.Converter.toUrlencoded(FaHttpResponse.content);
				break;
			case this.type.xml:
				FaHttpResponse.content = this.Converter.toXml(FaHttpResponse.content);
				break;
			// default:
			// FaHttpResponse.content = this.Converter.toHtml(FaHttpResponse.content);
		}
		if (!FaHttpResponse.status) {
			FaHttpResponse.status = this.status.ok;
		}
		if (!FaHttpResponse.content.byteLength) {
			FaHttpResponse.content = Buffer.from(FaHttpResponse.content);
		}
		for (let property in FaHttpResponse.headers) {
			if (FaHttpResponse.headers.hasOwnProperty(property)) {
				if (property === "Content-Type" && FaHttpResponse.headers[property].indexOf(";charset=") === -1) {
					res.setHeader(property, FaHttpResponse.headers[property] + ";charset=utf-8");
				} else {
					res.setHeader(property, FaHttpResponse.headers[property]);
				}
			}
		}
		res.setHeader("Content-Length", FaHttpResponse.content.byteLength);
		res.statusCode = FaHttpResponse.status;
		res.write(FaHttpResponse.content);
		res.end();
		FaHttpResponse = null;
	}

	/**
	 *
	 * @param data
	 * @return {Promise<FaServerHttpResponse>}
	 * @private
	 */
	_handleRequest(data) {
		let self = this;
		let mime = MimeTypes.lookup(data.path);
		let route = this.Router.find(data.path);
		let asset = this.Assets.find(data.path);
		return new Promise(function (resolve, reject) {
			if (route) {
				resolve(self._handleRoute(route, data));
			} else if (asset) {
				resolve(self._handleRoute(asset, data));
			} else if (mime) {
				resolve(self._handleFile(data.path, mime));
			} else {
				reject(self.response(new FaError(`route not found: ${data.path}`).setTrace(self._trace), null, self.status.notFound));
			}
		});
	}

	/**
	 *
	 * @param route {function | string}
	 * @param data {*}
	 * @return {Promise<FaServerHttpResponse>}
	 * @private
	 */
	_handleRoute(route, data) {
		let self = this;
		return new Promise(function (resolve) {
			resolve(route.call(self, data));
		}).then(function (result) {
			if (result instanceof FaHttpResponse) {
				return result;
			} else {
				return self.response(result, null, self.status.ok);
			}
		}).catch(function (e) {
			console.error(e);
			return self.response(new FaError(e).pickTrace(0), null, self.status.internalServerError);
		});
	}

	/**
	 *
	 * @param filename {string}
	 * @param type {string}
	 * @return {FaServerHttpResponse}
	 * @private
	 */
	_handleFile(filename, type) {
		// server1.console.error(filename, type);
		try {
			return this.response(this.File.readFileSync(filename.replace(/^\/?/, "")), type, this.status.ok);
		} catch (e) {
			return this.response(e.message, null, this.status.notFound);
		}
	}

	/**
	 *
	 * @param content
	 * @param type
	 * @param status
	 * @return {FaServerHttpResponse}
	 */
	response(content, type = null, status = null) {
		return new this._FaHttpResponse(content, type, status);
	}
}

/**
 *
 * @type {FaServerHttp}
 */
module.exports = FaServerHttp;
