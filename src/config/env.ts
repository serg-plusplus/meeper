let WEBSITE_URL = process.env.WEBSITE_URL;
if (WEBSITE_URL) {
  WEBSITE_URL = WEBSITE_URL.endsWith("/") ? WEBSITE_URL : `${WEBSITE_URL}/`;
}

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY ?? "test_key";

export { WEBSITE_URL, ENCRYPTION_KEY };
