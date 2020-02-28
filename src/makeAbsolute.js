const { URL } = require("url");

/**
 * @summary Combine a relative URL with a base URL in a way that
 *   will gracefully handle extra slashes and such
 * @param {String} relativeUrl Relative URL path
 * @param {String} baseUrl Base URL path
 * @return {String} full URL
 */
function makeAbsolute(relativeUrl, baseUrl) {
  const url = new URL(relativeUrl, baseUrl);
  return url.href;
}

module.exports = makeAbsolute;
