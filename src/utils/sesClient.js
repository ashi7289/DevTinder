const { SESClient } = require("@aws-sdk/client-ses");
const { getCredentials, getSesRegion } = require("../config/aws");

let client;

// Created on first use, so env vars are read after dotenv has loaded
const getSesClient = () => {
  if (!client) {
    client = new SESClient({
      region: getSesRegion(),
      credentials: getCredentials(),
    });
  }
  return client;
};

module.exports = { getSesClient };
