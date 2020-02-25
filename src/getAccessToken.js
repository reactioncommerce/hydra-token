/* eslint-disable no-console */

const { URL } = require("url");
const fetch = require("node-fetch");
const simpleOAuth2 = require("simple-oauth2");
const ensureHydraClient = require("./ensureHydraClient");

const HYDRA_OAUTH_URL = "http://localhost:4444";
const HYDRA_ADMIN_URL = "http://localhost:4445";
const OAUTH2_CLIENT_ID = "get-token-dev-script";
const OAUTH2_CLIENT_SECRET = "get-token-dev-script-secret";
const FAKE_REDIRECT_URI = "http://localhost:1234/redirect";

/**
 * @summary Calls Hydra's endpoint to create an OAuth client for this application
 *   if one does not already exist, and then requests an access token that can be
 *   used to request data from the API as `userId`.
 * @param {String} userId The internal database ID of the user for whom to request a token.
 * @param {Object} [options] Options
 * @param {String} [options.hydraOAuthUrl=http://localhost:4444] A Hydra public OAuth URL
 * @param {String} [options.hydraAdminUrl=http://localhost:4445] A Hydra private admin URL. The computer on which
 *   this function is called must have access.
 * @returns {Promise<String>} Access token
 */
async function getAccessToken(userId, options) {
  const {
    hydraAdminUrl = HYDRA_ADMIN_URL,
    hydraOAuthUrl = HYDRA_OAUTH_URL
  } = options || {};

  await ensureHydraClient(hydraAdminUrl);

  // Initialize the OAuth2 Library
  const oauth2 = simpleOAuth2.create({
    client: {
      id: OAUTH2_CLIENT_ID,
      secret: OAUTH2_CLIENT_SECRET
    },
    auth: {
      authorizePath: "/oauth2/auth",
      tokenHost: hydraOAuthUrl,
      tokenPath: "/oauth2/token"
    }
  });

  const authorizationUri = oauth2.authorizationCode.authorizeURL({
    redirect_uri: FAKE_REDIRECT_URI, // eslint-disable-line camelcase
    scope: "openid",
    state: "12345678"
  });

  const startLoginResult = await fetch(authorizationUri, {
    redirect: "manual"
  });
  const redirect1 = startLoginResult.headers.get("location");
  const redirect1Parsed = new URL(redirect1);

  if (redirect1.includes("oauth-error")) {
    throw new Error(redirect1Parsed.searchParams.get("error_hint"));
  }

  const challenge = redirect1Parsed.searchParams.get("login_challenge");
  const cookie = startLoginResult.headers.get("set-cookie");

  const acceptLoginResult = await fetch(`${hydraAdminUrl}/oauth2/auth/requests/login/accept?login_challenge=${challenge}`, {
    method: "PUT",
    body: JSON.stringify({
      subject: userId,
      remember: false
    }),
    headers: {
      "Content-Type": "application/json"
    }
  });

  const { redirect_to: redirect2 } = await acceptLoginResult.json();

  const continueLoginResult = await fetch(redirect2, {
    headers: {
      Cookie: cookie
    },
    redirect: "manual"
  });
  const redirect3 = continueLoginResult.headers.get("location");
  const redirect3Parsed = new URL(redirect3);

  if (redirect3.includes("error_debug")) {
    throw new Error(redirect3Parsed.searchParams.get("error_debug"));
  }

  const consentChallenge = redirect3Parsed.searchParams.get("consent_challenge");
  const nextCookies = continueLoginResult.headers.raw()["set-cookie"];

  const consentResult = await fetch(`${hydraAdminUrl}/oauth2/auth/requests/consent/accept?consent_challenge=${consentChallenge}`, {
    method: "PUT",
    body: JSON.stringify({
      grant_scope: ["openid"], // eslint-disable-line camelcase
      remember: false
    }),
    headers: {
      "Content-Type": "application/json"
    }
  });

  const { redirect_to: redirect4 } = await consentResult.json();

  const postConsentResult = await fetch(redirect4, {
    headers: nextCookies.map((val) => (["Cookie", val])),
    redirect: "manual"
  });
  const redirect5 = postConsentResult.headers.get("location");
  const redirect5Parsed = new URL(redirect5);

  if (redirect5.includes("error_debug")) {
    throw new Error(redirect5Parsed.searchParams.get("error_debug"));
  }

  const code = redirect5Parsed.searchParams.get("code");

  const { access_token: accessToken } = await oauth2.authorizationCode.getToken({
    code,
    redirect_uri: FAKE_REDIRECT_URI, // eslint-disable-line camelcase
    scope: "openid"
  });

  return accessToken;
}

module.exports = getAccessToken;
