/* eslint-disable no-console */

const fetch = require("node-fetch");
const makeAbsolute = require("./makeAbsolute");

const OAUTH2_CLIENT_ID = "get-token-dev-script";
const OAUTH2_CLIENT_SECRET = "get-token-dev-script-secret";
const FAKE_REDIRECT_URI = "http://localhost:1234/redirect";

/* eslint-disable camelcase */
const hydraClient = {
  client_id: OAUTH2_CLIENT_ID,
  client_secret: OAUTH2_CLIENT_SECRET,
  grant_types: ["authorization_code"],
  redirect_uris: [FAKE_REDIRECT_URI],
  response_types: ["code"],
  scope: "offline openid",
  subject_type: "public",
  token_endpoint_auth_method: "client_secret_basic"
};
/* eslint-enable camelcase */

/**
 * @summary Calls Hydra's endpoint to create an OAuth client for this application
 *   if one does not already exist. This works because the Hydra admin port
 *   is exposed on the internal network. Ensure that it is not exposed to the
 *   public Internet in production.
 * @param {String} hydraAdminUrl Hydra private admin URL
 * @returns {Promise<undefined>} Nothing
 */
async function ensureHydraClient(hydraAdminUrl) {
  const getClientResponse = await fetch(makeAbsolute(`/clients/${OAUTH2_CLIENT_ID}`, hydraAdminUrl), {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });

  if (![200, 404, 401].includes(getClientResponse.status)) {
    console.error(await getClientResponse.text());
    throw new Error(`Could not get Hydra client [${getClientResponse.status}]`);
  }

  if (getClientResponse.status === 200) {
    // Update the client to be sure it has the latest config
    const updateClientResponse = await fetch(makeAbsolute(`clients/${OAUTH2_CLIENT_ID}`, hydraAdminUrl), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(hydraClient)
    });

    if (updateClientResponse.status !== 200) {
      console.error(await updateClientResponse.text());
      throw new Error(`Could not update Hydra client [${updateClientResponse.status}]`);
    }
  } else {
    const response = await fetch(makeAbsolute("/clients", hydraAdminUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(hydraClient)
    });

    switch (response.status) {
      case 200:
      // intentional fallthrough!
      // eslint-disable-line no-fallthrough
      case 201:
      // intentional fallthrough!
      // eslint-disable-line no-fallthrough
      case 409:
        break;
      default:
        console.error(await response.text());
        throw new Error(`Could not create Hydra client [${response.status}]`);
    }
  }
}

module.exports = ensureHydraClient;
