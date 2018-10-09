/*
 * Helpers for various tasks
 * 
 */
var crypto = require("crypto");
var config = require("../config");

var helpers = {};

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

    var validatedData = {}

    validatedData.firstName = validateStringField(userdata.firstName);
    validatedData.lastName = validateStringField(userdata.lastName);
    validatedData.phone = validatePhone(userdata.phone);
    validatedData.password = validateStringField(userdata.password);
    validatedData.tosAgreement = validateTos(userdata.tosAgreement);

    validatedData.isValid = !Object.values(validatedData).includes(false);

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