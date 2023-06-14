let WEBSITE_URL = process.env.WEBSITE_URL;
if (WEBSITE_URL) {
  WEBSITE_URL = WEBSITE_URL.endsWith("/") ? WEBSITE_URL : `${WEBSITE_URL}/`;
}

export { WEBSITE_URL };
