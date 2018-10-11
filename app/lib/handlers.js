/*
 * Request handlers
 * 
 */

// Dependencies
var _data = require("./data")
var helpers = require("./helpers")
var config = require("../config")

// Define handlers
var handlers = {};

// Users handler
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


handlers._users.get = function (data, callback) {
    // Check that the phone number is valid
    var phone = helpers.validatePhone(data.queryStringObject.phone);

    if (!phone) {
        return callback(400, {"Error" : "Invalid user"});
    }

    // Get the token from the headers
    var token = helpers.validateStringField(data.headers.token);

    handlers._tokens.verifyToken(token, phone, function(isValidToken) {
        if (!isValidToken) {
            return callback(400, {"Error": "Invalid or expired token"});
        }
        _data.read("users", phone, function (err, data) {
            if (err || !data) {
                return callback(400, {"Error": "Invalid data"});
            }
    
            delete data.hashedPassword;
            callback(200, data);
        });
    });
}


handlers._users.put = function (data, callback) {
    var phone = helpers.validatePhone(data.payload.phone);

    if (!phone) {
        return callback(404, {"Error": "Invalid data"});
    }

    // Get the token from the headers
    var token = helpers.validateStringField(data.headers.token);

    handlers._tokens.verifyToken(token, phone, function (isValidToken) {
        if (!isValidToken) {
            return callback(400, { "Error": "Invalid or expired token" });
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
    });
}

handlers._users.delete = function (data, callback) {
    var phone = helpers.validatePhone(data.payload.phone);

    if (!phone) {
        return callback(404, { "Error": "Invalid data" });
    }
    // Get the token from the headers
    var token = helpers.validateStringField(data.headers.token);

    handlers._tokens.verifyToken(token, phone, function (isValidToken) {
        if (!isValidToken) {
            return callback(400, { "Error": "Invalid or expired token" });
        }

        _data.read("users", phone, function(err, userData){
            if (err || !userData) {
                return callback(400, {"Error": "User not found"});
            }

            _data.delete("users", phone, function (err) {
                if (err) {
                    return callback(500, { "Error": "Could not delete user" }) ;
                }

                var userChecks = helpers.validateUserChecks(userData.checks);
                var checksToDelete = userChecks.length;

                if (checksToDelete === 0) {
                    return callback(200);
                }

                var checksDeleted = 0;
                var deletionsErrors = false;

                userChecks.forEach(function (checkId) {
                    _data.delete("checks", checkId, function (err) {
                        if (err) {
                            deletionsErrors = true;
                        }

                        checksDeleted++;
                        if (checksDeleted === checksToDelete) {
                            if (deletionsErrors) {
                                return callback(500, {"Error": "All checks might be not deleted properly"});
                            }
                            return callback(200)
                        }
                    });
                });
            });
        });
    });
}

// Tokens handler
handlers.tokens = function (data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];

    if (acceptableMethods.includes(data.method)) {
        return handlers._tokens[data.method](data, callback);
    }

    callback(405);
};

// Container for all the tokens methos
handlers._tokens = {}

// Create a token
handlers._tokens.post = function (data, callback) {
    var phone = helpers.validatePhone(data.payload.phone);
    var password = helpers.validateStringField(data.payload.password);

    if (!phone || !password) {
        return callback(400, {"Error": "Missing required fields"});
    }

    _data.read("users", phone, function(err, userData) {
        if (err || !userData) {
            return callback(400, { "Error": "Could not find the user\'s data" });
        }

        var hashedPassword = helpers.hash(password);
        if (hashedPassword !== userData.hashedPassword) {
            return callback(400, {"Error": "Invalid user or password"})
        }

        var tokenId = helpers.createRandomString(20);
        var expires = Date.now() + 1000 * 60 * 60;
        var tokenObject = {
            phone: phone,
            id: tokenId,
            expires: expires
        }

        _data.create("tokens", tokenId, tokenObject, function(err) {
            if (err) {
                return callback(500, {"Error": "Could not create the new token"})
            }

            return callback(200, tokenObject);
        });
    });
}

// Obtain a token
handlers._tokens.get = function (data, callback) {
    // Check that the phone number is valid
    var id = helpers.validateStringField(data.queryStringObject.id);

    if (!id) {
        return callback(400, { "Error": "Invalid id" });
    }

    _data.read("tokens", id, function (err, tokenData) {
        if (err || !tokenData) {
            return callback(400, { "Error": "Invalid token" });
        }

        callback(200, tokenData);
    });
}

// Update a token expiration
handlers._tokens.put = function (data, callback) {
    var id = helpers.validateStringField(data.payload.id);
    var extend = typeof (data.payload.extend) === 'boolean' ? data.payload.extend : false;
    
    if (!id || !extend) {
        return callback(400, {"Error": "Missing required fields or invalid"});
    }
    
    _data.read("tokens", id, function(err, tokenData) {
        if (err || !tokenData) {
            return callback(400, {'Error': 'Specified token does not exist'});
        }
    
        if(tokenData.expires <= Date.now()) {
            return callback(400, {'Error': 'Token already expired, cannot be extended'})
        }
    
        tokenData.expires = Date.now() + 1000 * 60 * 600;
    
        _data.update('tokens', id, tokenData, function(err) {
            if (err) {
                return callback(500, {"Error": "Could not update the token expiration"});
            }
            return callback(200, tokenData);
        });
    })
}

// Delete a token
handlers._tokens.delete = function (data, callback) {
    // Check that the phone number is valid
    var id = helpers.validateStringField(data.queryStringObject.id);

    if (!id) {
        return callback(400, { "Error": "Invalid id" });
    }

    _data.read("tokens", id, function (err, tokenData) {
        if (err || !tokenData) {
            return callback(400, { "Error": "Invalid token" });
        }

        _data.delete("tokens", id, function(err) {
            if (err) {
                return callback(500, {"Error": "Error deleting the token"})
            }
            
            return callback(200);
        })
    });
}

// Verify if given tokenId is currently valid for given user
handlers._tokens.verifyToken = function(idToken, phone, callback) {
    _data.read("tokens", idToken, function(err, tokenData) {
        if (err || !tokenData) {
            return callback(false);
        }

        if (tokenData.phone !== phone && tokenData.expires <= Date.now()) {
            return callback(false);
        }

        callback(true);
    });
}


// Checks handler
handlers.checks = function (data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];

    if (acceptableMethods.includes(data.method)) {
        return handlers._checks[data.method](data, callback);
    }

    callback(405);
};

// Container for all the checks methods
handlers._checks = {}

// Checks post
// Create a new check
handlers._checks.post = function (data, callback) {

    var { protocol, url, method, successCodes, timeoutSeconds, areValidAllFields } = helpers.validateChecksData(data.payload);

    if (!areValidAllFields) {
        return callback(400, {"Error": "Invalid or missing data"});
    }

    var token = helpers.validateStringField(data.headers.token);

    _data.read('tokens', token, function(err, tokenData) {
        if (err || !tokenData) {
            return callback(400, {"Error": "Undefined token"});
        }

        var userPhone = tokenData.phone;

        _data.read('users', userPhone, function(err, userData) {
            var checks = helpers.validateUserChecks(userData.checks);

            if (checks.length >= config.maxChecks) {
                return callback(400, {"Error": "Maximum number of checks reached ("+config.maxChecks+")"});
            }

            var checkId = helpers.createRandomString(20);

            var checkObject = {
                id: checkId,
                userPhone: userPhone,
                protocol: protocol,
                url: url,
                method: method,
                successCodes: successCodes,
                timeoutSeconds: timeoutSeconds
            }

            _data.create("checks", checkId, checkObject, function(err) {
                if (err) {
                    return callback(500, {"Error": "Oops!"});
                }

                userData.checks = checks;
                userData.checks.push(checkId);

                _data.update("users", userData.phone, userData, function (err){
                    if (err) {
                        return callback(500, {"Error": "Update userdata with new checks"});
                    }

                    return callback(200, checkObject);
                }) 
            });
        });
    });
};


handlers._checks.get = function (data, callback) {
    var id = helpers.validateStringField(data.queryStringObject.id);

    if (!id) {
        return callback(400, { "Error": "Invalid id" });
    }

    _data.read('checks', id, function (err, checkData) {
        if (err || !checkData) {
            callback(400);
        }
        // Get the token from the headers
        var token = helpers.validateStringField(data.headers.token);
    
        handlers._tokens.verifyToken(token, checkData.phone, function (isValidToken) {
            if (!isValidToken) {
                return callback(403, { "Error": "Invalid or expired token" });
            }
            
            return callback(200, checkData);
        });
    });
}

handlers._checks.put = function (data, callback) {
    var id = helpers.validateStringField(data.payload.id);
    var { protocol, url, method, successCodes, timeoutSeconds } = helpers.validateChecksData(data.payload);

    if (!id) {
        return callback(400, {"Error": "Missing required fields"});
    }

    if (!protocol && !url && !method && !successCodes && !timeoutSeconds) {
        return callback(400, {"Error": "Missing fields to update"});
    }

    _data.read("checks", id, function (err, checkData) {
        if (err || !checkData) {
            return callback(400, {"Error": "CheckId does not exist"});
        }

        var token = helpers.validateStringField(data.headers.token);

        handlers._tokens.verifyToken(token, checkData.phone, function (isValidToken) {
            if (!isValidToken) {
                return callback(403, { "Error": "Invalid or expired token" });
            }

            if (protocol) checkData.protocol = protocol;
            if (url) checkData.url = url;
            if (method) checkData.method = method;
            if (successCodes) checkData.successCodes = successCodes;
            if (timeoutSeconds) checkData.timeoutSeconds = timeoutSeconds;

            _data.update("checks", id, checkData, function(err) {
                if (err) {
                    return callback(500, {"Error": "Could not update the check"})
                }
                return callback(200, checkData);
            });
        });
    });
}


handlers._checks.delete = function (data, callback) {
    // Check that the phone number is valid
    var id = helpers.validateStringField(data.queryStringObject.id);

    if (!id) {
        return callback(400, { "Error": "Invalid id" });
    }

    _data.read("checks", id, function (err, checkData) {
        if (err || !checkData) {
            return callback(400, {"Error": "Provided check data does not exist"});
        }

        // Get the token from the headers
        var token = helpers.validateStringField(data.headers.token);

        handlers._tokens.verifyToken(token, checkData.userPhone, function (isValidToken) {
            if (!isValidToken) {
                return callback(403, { "Error": "Invalid or expired token" });
            }

            _data.delete("checks", id, function (err) {
                if (err) {
                    return callback(500, { "Error": "Could not delete the check" });
                }

                _data.read("users", checkData.userPhone, function (err, userData) {
                    if (err || !userData) {
                        return callback(500, {"Error": "Could not read user data"});
                    }

                    var checks = helpers.validateUserChecks(userData.checks);
                    var checkPosition = checks.indexOf(id);

                    if (checkPosition < 0) {
                        return callback(500, {"Error": "Could not update user"});
                    }

                    checks.splice(checkPosition, 1);
                    userData.checks = checks;

                    _data.update("users", userData.phone, userData, function(err) {
                        if (err) {
                            return callback(500, {"Error": "Could not update user checks"});
                        }

                        return callback(200);
                    });
                });
            });
        });
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