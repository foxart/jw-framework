"use strict";
/*node*/
const Buffer = require("buffer").Buffer;
const FastXmlParser = require("fast-xml-parser");
const FileType = require("file-type");

/**
 *
 * @param json
 * @returns {boolean}
 */
function isJson(json) {
	try {
		return typeof JSON.parse(json) === "object";
	} catch (e) {
		return false;
	}
}

/**
 *
 * @param mongoId
 * @returns {boolean}
 */
function isMongoId(mongoId) {
	try {
		return new RegExp("^[0-9a-fA-F]{24}$").test(mongoId.toString());
	} catch (e) {
		return false;
	}
}

/**
 *
 * @param xml
 * @returns {boolean}
 */
function isXml(xml) {
	try {
		return FastXmlParser.validate(xml) === true;
	} catch (e) {
		return false;
	}
}

function isCircular(object, circular) {
	if (object && typeof object === "object") {
		if (circular.indexOf(object) !== -1) {
			return true;
		}
		circular.push(object);
		for (let key in object) {
			// if (object.hasOwnProperty(key) && isCircular(object[key], circular)) {
			if (object[key] && isCircular(object[key], circular)) {
				return true;
			}
		}
	}
	return false;
}

function getType(data) {
	if (data === null) {
		return "null";
	} else if (Array.isArray(data)) {
		return "array";
	} else if (typeof data === "boolean") {
		return "bool";
	} else if (typeof data === 'number' && data % 1 === 0) {
		return "int";
	} else if (typeof data === "number" && data % 1 !== 0) {
		return "float";
	} else if (data instanceof Date) {
		return "date";
	} else if (typeof data === "function") {//!isNaN(Date.parse(data))
		return "function";
	} else if (data instanceof Error) {
		return "error";
	} else if (typeof data === "object") {
		if (isMongoId(data)) {
			return "mongoId";
		} else if (data instanceof RegExp) {
			return "regExp";
		} else if (data.byteLength) {
			if (FileType(data)) {
				return "file";
			} else {
				return "buffer";
			}
		} else {
			return "object";
		}
	} else if (typeof data === "string") {
		if (isJson(data)) {
			return "json";
		} else if (isXml(data)) {
			return "xml";
		} else if (FileType(Buffer(data, "base64"))) {
			return "file";
		} else {
			return "string";
		}
	} else {
		return "undefined";
	}
}

function getLength(data, type) {
	if (type === "array") {
		return data.length;
	} else if (type === "buffer") {
		return data.byteLength;
	} else if (type === "file") {
		return data.byteLength ? data.byteLength : Buffer(data, "base64").byteLength;
	} else if (type === "function") {
		return data.toString().length;
	} else if (type === "json") {
		return data.length;
	} else if (type === "object") {
		return Object.keys(data).length;
	} else if (type === "string") {
		return data.length;
	} else if (type === "xml") {
		return data.length;
	} else {
		return null;
	}
}

function parseObject(data, type) {
	// console.write("PARSE", type);
	if (type === "json") {
		return JSON.parse(data);
	} else if (type === "xml") {
		return FastXmlParser.parse(data, {});
	} else {
		return data;
	}
}

function beautifyObject(data, wrapper, level) {
	let circular = [];
	let nl = '\n';
	let object = parseObject(data, getType(data));
	let result = "";
	for (let keys = Object.keys(object), i = 0, end = keys.length - 1; i <= end; i++) {
		let item = object[keys[i]];
		let itemType = getType(item);
		let itemLength = getLength(item, itemType);
		/**/
		let key = wrapper.wrapDataKey(keys[i], itemType, itemLength, level);
		// let value = isCircular(object, circular) ? wrapper.circular(object, object.length) : wrapper.wrapDataValue(objectType, beautify(object, wrapper, level), level);
		let value = isCircular(item, circular) ? wrapper.circular(item, level) : beautify(item, wrapper, level);
		/**/
		if (i === 0) {
			result += `${key}${value},${nl}`;
		} else if (i === end) {
			result += `${key}${value}${nl}`;
		} else {
			result += `${key}${value},${nl}`;
		}
	}
	return result;
}

function beautify(data, wrapper, level = 0) {
	switch (getType(data)) {
		case "array":
			return wrapper.array(beautifyObject(data, wrapper, level + 1), level);
		case "bool":
			return wrapper.bool(data, level);
		case "buffer":
			return wrapper.buffer(data, level);
		case "date":
			return wrapper.date(data, level);
		case "error":
			return wrapper.error(data, level + 1);
		case "file":
			return wrapper.file(data, level);
		case "float":
			return wrapper.float(data, level);
		case "function":
			return wrapper.function(data, level + 1);
		case "json":
			return wrapper.json(beautifyObject(data, wrapper, level + 1), level);
		case "int":
			return wrapper.int(data, level);
		case "mongoId":
			return wrapper.mongoId(data, level);
		case "null":
			return wrapper.null(data, level);
		case "object":
			return wrapper.object(beautifyObject(data, wrapper, level + 1), level);
		case "regExp":
			return wrapper.regExp(data.toString(), level);
		case "string":
			return wrapper.string(data, level + 1);
		case "undefined":
			return wrapper.undefined(data, level);
		case "xml":
			return wrapper.xml(beautifyObject(data, wrapper, level + 1), level);
		default:
			return wrapper.default(data);
	}
}

const FaBeautifyPlain = require("./plain");
const FaBeautifyConsole = require("./console");
const FaBeautifyConsoleType = require("./console-type");
const FaBeautifyHtml = require("./html");
const FaBeautifyHtmlType = require("./html");
/*new*/
exports.plain = function (data) {
	return beautify(data, new FaBeautifyPlain());
};
exports.console = function (data) {
	return beautify(data, new FaBeautifyConsole());
};
exports.consoleType = function (data) {
	return beautify(data, new FaBeautifyConsoleType());
};
exports.html = function (data) {
	return `<div class="fa-beautify">${beautify(data, new FaBeautifyHtml())}</div>`;
};
exports.htmlType = function (data) {
	return beautify(data, new FaBeautifyHtmlType());
};
