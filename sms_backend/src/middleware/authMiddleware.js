const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

const verifyToken = async (req, res, next) => {
  const header = req.headers["authorization"];

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(403).json({ message: "No token provided or invalid format" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = verifyToken;
