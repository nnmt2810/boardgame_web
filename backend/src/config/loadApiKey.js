const fs = require("fs");
const path = require("path");

function loadApiKey() {
  // Đọc từ biến môi trường API_KEY (theo .env của bạn)
  const envKey = process.env.API_KEY;
  if (envKey && envKey.trim().length > 0) {
    return envKey.trim();
  }

  // Nếu không có trong env, đọc từ file apikey.txt
  const filePath = process.env.API_KEY_FILE || path.join(process.cwd(), "apikey.txt");
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const key = raw.toString().trim();
    if (key.length === 0) {
      console.warn(`[loadApiKey] Found file ${filePath} but it is empty.`);
      return undefined;
    }
    return key;
  } catch (err) {
    console.warn(`[loadApiKey] API key file not found or unreadable at ${filePath}`);
    return undefined;
  }
}

const API_KEY = loadApiKey();
if (!API_KEY) {
  console.warn("[loadApiKey] No API key loaded. Set API_KEY in .env or API_KEY_FILE or add apikey.txt");
}

module.exports = {
  API_KEY,
};