"use strict";
/*nodejs*/
/** @type {Object} */
const OracleDb = require("oracledb");
/*fa*/
const FaError = require("fa-nodejs/base/error");
const FaDaoClient = require("fa-nodejs/dao/client");
const FaDaoConnection = require("fa-nodejs/dao/connection");

/*variables*/
class FaDaoOracleClient extends FaDaoClient {
	/**
	 * @constructor
	 * @param FaDaoOracleModel {FaDaoOracleModel}
	 */
	constructor(FaDaoOracleModel) {
		super();
		this._FaDaoOracleModel = FaDaoOracleModel;
	}

	/**
	 *
	 * @return {FaDaoOracleConnection}
	 * @private
	 */
	get _connection() {
		return FaDaoConnection.findConnection(this._FaDaoOracleModel.connection);
	}

	/**
	 *
	 * @return {Promise<Object>}
	 * @private
	 */
	async _connect() {
		let options = this._connection.options;
		// console.warn([this.connector, this.connection.options]);
		// return;
		Object.entries(options).forEach(function ([key, value]) {
			OracleDb[key] = value;
		});
		return await OracleDb.getConnection({
			connectString: this._connection.url,
			user: this._connection.user,
			password: this._connection.password,
		});
	}

	/**
	 *
	 * @param error {Error}
	 * @return {FaError}
	 */
	_error(error) {
		let MatchPattern = "^(.+): (.+)$";
		let MatchExpression = new RegExp(MatchPattern);
		let result = error.message.match(MatchExpression);
		if (result) {
			return new FaError({name: result[1], message: result[2]});
		} else {
			return new FaError(error);
		}
	}

	/**
	 *
	 * @return {Promise<Object>}
	 */
	async open() {
		try {
			let result;
			if (this._connection.persistent) {
				if (FaDaoClient.existClient(this._FaDaoOracleModel.connection)) {
					result = FaDaoClient.findClient(this._FaDaoOracleModel.connection);
				} else {
					result = await this._connect();
					FaDaoClient.attachClient(this._FaDaoOracleModel.connection, result);
				}
			} else {
				result = await this._connect();
			}
			return result;
		} catch (e) {
			throw this._error(e);
		}
	}

	/**
	 * connection {Object}
	 * @return {Promise<boolean>}
	 */
	async close(connection) {
		try {
			if (!this._connection.persistent && connection) {
				await connection.close();
				FaDaoConnection.detachConnection(this._FaDaoOracleModel.connection);
				FaDaoClient.detachClient(this._FaDaoOracleModel.connection);
				return true;
			} else {
				return false;
			}
		} catch (e) {
			throw this._error(e);
		}
	}
}

/**
 *
 * @type {FaDaoOracleClient}
 */
module.exports = FaDaoOracleClient;

