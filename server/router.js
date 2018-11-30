'use strict';
/*vendor*/
const
	FaError = require('../error/index'),
	FaTraceClass = require('../trace');
/**
 *
 * @type {module.FaHttpRouterClass}
 */
module.exports = class FaHttpRouterClass {
	/**
	 *
	 * @param executor
	 */
	constructor(executor) {
		this._handler_list = {};
		this._trace_list = {};
		this._Trace = new FaTraceClass();
		/**
		 *
		 * @param callback
		 * @return {function(): *}
		 * @private
		 */
		this._constructor = function (callback) {
			return function () {
				return callback.apply(executor, arguments);
			};
		}
	}

	/**
	 *
	 * @return {string[]}
	 */
	get list() {
		return Object.keys(this._handler_list);
	}

	/**
	 *
	 * @param route
	 * @return {function}
	 */
	handler(route) {
		return this._handler_list[route];
	}

	/**
	 *
	 * @param route {string}
	 * @return {boolean}
	 */
	exist(route) {
		return !!this._handler_list[route];
	}

	/**
	 *
	 * @param route {string}
	 * @return {string}
	 */
	trace(route) {
		return this._trace_list[route];
	};

	/**
	 *
	 * @param route {string}
	 * @param callback {function}
	 */
	attach(route, callback) {
		// FaConsole.consoleWarn(callback);
		// FaConsole.consoleWarn(typeof callback);
		let trace = this._Trace.parse(new Error()).string(1);
		// FaConsole.consoleWarn(trace)
		if (this.exist(route) === false) {
			this._handler_list[route] = new this._constructor(callback);
			this._trace_list[route] = trace;
		} else {
			let error = new FaError(`route exist: ${route}`, false);
			error.appendTrace(trace);
			FaConsole.consoleError(error);
		}
	};

	/**
	 *
	 * @param route {string}
	 */
	detach(route) {
		if (this.exist(route) === true) {
			delete this._handler_list[route];
			delete this._trace_list[route];
		} else {
			let trace = this._Trace.parse(new Error()).string(1);
			let error = new FaError(`route not found: ${route}`, false);
			error.appendTrace(trace);
			FaConsole.consoleError(error);
		}
	};
};
