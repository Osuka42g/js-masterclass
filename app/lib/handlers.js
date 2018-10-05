/*
 * Request handlers
 * 
 */

// Dependencies
var _data = require("./data")
var helpers = require("./helpers")

// Define handlers
var handlers = {};

handlers.users = function (data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];

    if (acceptableMethods.includes(data.method)) {
        return handlers._users[data.method](data, callback);
    }

    callback(405);
};

handlers._users = {};

handlers._users.post = function (data, callback) {
    // Check all fields are filled out

    var vd = helpers.validateUserData(data.payload);

    if (!vd.isValid) {
        return callback(400, { "Error": "Missing required fields" });
    }

    _data.read("users", vd.phone, function (err, data) {
        if(!err) {
            console.log(err);
            return callback(400, { "Error": "User already exists" });
        }

        var hashedPassword = helpers.hash(vd.password);

        if (!hashedPassword) {
            console.log("Error hashing password");
            return callback(500, {"Error": "Error input data"});
        }

        // Create user object
        var userObject = {
            firstName: vd.firstName,
            lastName: vd.lastName,
            phone: vd.phone,
            hashedPassword: hashedPassword,
            tosAgreement: true
        }

        // Store the user
        _data.create("users", vd.phone, userObject, function (err) {
            if (err) {
                console.log(err);
                return callback(500, {"Error": "Could not create the new user"});
            }

            delete(userObject.hashedPassword);
            return callback(200, userObject);
        });
    });

}

// @TODO Only let auth users to get their data
handlers._users.get = function (data, callback) {
    // Check that the phone number is valid
    var phone = helpers.validatePhone(data.queryStringObject.phone);

    if (!phone) {
        return callback(400, {"Error" : "Invalid user"});
    }

    _data.read("users", phone, function (err, data) {
        if (err || !data) {
            return callback(400, {"Error": "Invalid data"});
        }

        delete data.hashedPassword;
        callback(200, data);
    });
}

// @TODO Only let auth users to update their data
handlers._users.put = function (data, callback) {
    var phone = helpers.validatePhone(data.payload.phone);

    if (!phone) {
        return callback(404, {"Error": "Invalid data"});
    }

    var vd = helpers.validateUserData(data.payload);

    if (!vd.firstName && !vd.lastName && !vd.password) {
        return callback(404, { "Error": "Invalid data" });
    }

    _data.read("users", phone, function (err, userData) {
        if (err || !data) {
            return callback(404, { "Error": "Invalid data" });
        }

        if (vd.firstName) {
            userData.firstName = vd.firstName;
        }

        if (vd.lastName) {
            userData.lastName = vd.lastName;
        }

        if (vd.password) {
            userData.password = helpers.hash(vd.password);
        }

        _data.update("users", phone, userData, function (err) {
            if (err) {
                return callback(500, {"Error": "Could not update the user"});
            }

            delete userData.password;
            return callback(200, userData);
        });
    });
}

// @TODO Only let auth users to delete their data
handlers._users.delete = function (data, callback) {
    var phone = helpers.validatePhone(data.payload.phone);

    if (!phone) {
        return callback(404, { "Error": "Invalid data" });
    }

    _data.delete("users", phone, function (err) {
        return err ? callback(500, {"Error": "Could not delete user"}) : callback(200, {});
    });
}

// Ping handler
handlers.ping = function (data, callback) {
    callback(200);
};

handlers.notFound = function (data, callback) {
    callback(404);
};

module.exports = handlers;