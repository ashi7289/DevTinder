const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000; // same lifetime as the JWT

// Frontend origin(s) allowed by CORS (REST + Socket.IO).
// CLIENT_URL can hold several, comma separated. Read when called, so it
// doesn't depend on dotenv having loaded before this file is imported.
const getAllowedOrigins = () =>
  (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean);

const getCorsOptions = () => ({
  origin: getAllowedOrigins(),
  credentials: true,
});

// One set of cookie flags for login, signup, logout and account delete.
// - httpOnly: JavaScript can't read the token (blocks theft via XSS)
// - secure:   HTTPS only (on in production)
// - sameSite: "lax" by default; use COOKIE_SAMESITE=none only if the
//             frontend and API are on different sites (needs HTTPS)
const getAuthCookieOptions = () => {
  const isProd = process.env.NODE_ENV === "production";
  const sameSite = (process.env.COOKIE_SAMESITE || "lax").toLowerCase();

  return {
    httpOnly: true,
    secure: isProd || sameSite === "none",
    sameSite,
    maxAge: SEVEN_DAYS,
  };
};

const setAuthCookie = (res, token) =>
  res.cookie("token", token, getAuthCookieOptions());

// clearCookie only works when the flags match the ones used to set it
const clearAuthCookie = (res) => {
  const { maxAge, ...options } = getAuthCookieOptions();
  res.clearCookie("token", options);
};

module.exports = {
  getCorsOptions,
  setAuthCookie,
  clearAuthCookie,
};
