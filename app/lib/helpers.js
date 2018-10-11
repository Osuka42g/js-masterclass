/*
 * Helpers for various tasks
 * 
 */
var crypto = require("crypto");
var config = require("../config");

var helpers = {};

// Public

helpers.hash = function (str) {
    if (typeof(str) !== "string" || str.length === 0) {
        return false;
    }

    return crypto.createHmac("sha256", config.hashingSecret).update(str).digest("hex");
};

helpers.parseJsonToObject = function (str) {
    try {
        return JSON.parse(str);
    } catch (e) {
        return {};
    }
}

helpers.validateUserData = function (userdata) {

    var validatedData = {
        firstName: validateStringField(userdata.firstName),
        lastName: validateStringField(userdata.lastName),
        phone: validatePhone(userdata.phone),
        password: validateStringField(userdata.password),
        tosAgreement: validateTos(userdata.tosAgreement),
    }

    validatedData.isValid = !Object.values(validatedData).includes(false);

    return validatedData;
}

helpers.validateChecksData = function (checksdata) {

    var validatedData = {
        protocol: validateProtocol(checksdata.protocol),
        url: helpers.validateStringField(checksdata.url),
        method: helpers.validateMethod(checksdata.method),
        successCodes: helpers.validateSuccessCodes(checksdata.successCodes),
        timeoutSeconds: helpers.validateTimeoutSeconds(checksdata.timeoutSeconds),
    }

    validatedData.areValidAllFields = !Object.values(validatedData).includes(false);

    return validatedData;
}

helpers.validatePhone = function (phone) {
    return validatePhone(phone);
} 

helpers.validateStringField = function (str) {
    return validateStringField(str);
}

helpers.createRandomString = function (stringLength) {
    stringLength = typeof (stringLength) === 'number' && stringLength > 0 ? stringLength : false;
    if (!stringLength) {
        return false;
    }

    var possibleCharacters = 'abcdefghijkmnlopqrstuwxyz1234567890';
    var str = '';
    for (var i = 0; i < stringLength; i++) {
        var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));

        str += randomCharacter;
    }

    return str;
}

helpers.validateProtocol = function (str) {
    return validateProtocol(str);
}

helpers.validateMethod = function (str) {
    return typeof (str) === "string" && ["post", "get", "put", "delete"].includes(str) ? str : false;
}

helpers.validateSuccessCodes = function (codes) {
    return validateSuccessCodes(codes);
}

helpers.validateTimeoutSeconds = function (timeout) {
    return validateTimeoutSeconds(timeout);
}

helpers.validateUserChecks = function (checks) {
    return validateUserChecks(checks);
}

// Private

function validateProtocol (str) {
    return typeof (str) === "string" && ["http", "https"].includes(str) ? str : false;
}

function validateUserChecks (checks) {
    return typeof (checks) === 'object' && checks instanceof Array ? checks : [];
}

function validateTimeoutSeconds (timeout) {
    return typeof (timeout) === "number" && timeout % 1 === 0 && timeout > 0 && timeout < 6 ? timeout : false;
}

function validateSuccessCodes(codes) {
    return codes instanceof Array && codes.length > 0 ? codes : false;
}

function validateStringField(name) {
    return typeof (name) === "string" && name.trim().length > 0 ? name : false;
}

function validatePhone(phone) {
    return typeof (phone) === "string" && phone.trim().length === 10 ? phone : false;
}

function validateTos(tos) {
    return typeof (tos) === "boolean" ? tos : false;
}

module.exports = helpers;