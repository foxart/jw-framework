'use strict';

class FaErrorClass extends Error {
	/**
	 * @param error
	 * @param trace {boolean}
	 */
	constructor(error, trace = true) {
		super();
		let backtrace = trace ? [FaTrace.string(1)] : [];
		this.name = error['name'] ? error['name'] : this.constructor.name;
		this.message = error['message'] ? error['message'] : error;
		this.trace = error['trace'] ? backtrace.concat(error['trace']) : backtrace;
	}

	/**
	 *
	 * @param trace {string}
	 */
	appendTrace(trace) {
		if (trace) {
			this.trace.push(trace);
		}
	}

	/**
	 *
	 * @param trace {string}
	 */
	prependTrace(trace) {
		if (trace) {
			this.trace.unshift(trace);
		}
	}
}
