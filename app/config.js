/*
 * Create and export configuration variables
 * 
 */

// Container for all the environments
var environments = {};

// Staging (default) environment
environments.staging = {
    httpPort: 3000,
    httpsPort: 3001,
    envName: "staging",
    hashingSecret: "somethingSuperSecret",
    maxChecks: 5
};

// Production environment
environments.production = {
    httpPort: 5000,
    httpsPort: 5001,
    envName: "production",
    hashingSecret: "somethingSuperSecretAgain",
    maxChecks: 5
};

// Determine which environment was passed as a command-line argument
var currentEnvironment = typeof (process.env.NODE_ENV) === "string" ? process.env.NODE_ENV.toLowerCase() : "";

// Check that current environment is one of the above, if not, default to staging
var environmentToExport = typeof (environments[currentEnvironment]) === "object" ? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;