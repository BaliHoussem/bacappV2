const { getDefaultConfig } = require("expo/metro-config");
const { createProxyMiddleware } = require("http-proxy-middleware");

const config = getDefaultConfig(__dirname);

config.server = {
  enhanceMiddleware: (middleware) => {
    const apiProxy = createProxyMiddleware({
      target: "http://localhost:3000",
      changeOrigin: true,
      logLevel: "warn",
    });

    return (req, res, next) => {
      if (req.url && req.url.startsWith("/api/")) {
        return apiProxy(req, res, next);
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
