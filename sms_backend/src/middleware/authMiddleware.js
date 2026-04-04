const jwt = require("jsonwebtoken");
const db = require("../db/connection");

const SECRET = "mysecretkey";

const verifyToken = (req, res, next) => {
  const header = req.headers["authorization"];

  if (!header) {
    return res.status(403).json({
      message: "No token provided"
    });
  }

  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Invalid token format"
    });
  }

  const token = header.split(" ")[1];

  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        message: "Invalid or expired token"
      });
    }

    // 🔒 Fetch ONLY this user's stored token
    const sql = "SELECT active_token FROM users WHERE id = ?";
    db.query(sql, [decoded.id], (err, results) => {
      if (err || results.length === 0) {
        return res.status(401).json({
          message: "Unauthorized"
        });
      }

      const storedToken = results[0].active_token;

      // 🔒 Ensure token belongs to THIS user
      if (!storedToken || storedToken !== token) {
        return res.status(401).json({
          message: "Session invalid. Please login again."
        });
      }

      req.user = decoded;
      next();
    });
  });
};

module.exports = verifyToken;
