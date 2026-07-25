// Strips MongoDB operator keys (anything starting with "$" or containing
// ".") out of request input, so a client can't smuggle an operator like
// {"email": {"$ne": null}} into a query built from user input.
//
// We use express-mongo-sanitize's sanitize() function directly rather than
// its middleware() export. The middleware always does `req[key] = target`
// for body/params/query — fine for body/params, but req.query in Express 5
// is a getter with no setter (it re-parses req.url fresh on every access),
// so that assignment throws a TypeError. sanitize() itself mutates the
// target object in place and returns the same reference, so we can call it
// directly and only need a workaround for the `query` property.
const { sanitize } = require("express-mongo-sanitize");

const mongoSanitizeMiddleware = (req, res, next) => {
  if (req.body && typeof req.body === "object") sanitize(req.body);
  if (req.params && typeof req.params === "object") sanitize(req.params);

  // Snapshot req.query once, sanitize that snapshot in place, then
  // redefine the property as a plain value for the rest of this request —
  // reassigning it directly would hit the same getter-only error the
  // library's own middleware runs into on Express 5.
  const query = req.query;
  if (query && typeof query === "object") {
    sanitize(query);
    Object.defineProperty(req, "query", {
      value: query,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }

  next();
};

module.exports = mongoSanitizeMiddleware;
