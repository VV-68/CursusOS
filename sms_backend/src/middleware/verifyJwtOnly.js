const jwt = require("jsonwebtoken");
const { getStudentActiveAcademicState } = require('../services/academicStateService');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

const verifyJwtOnly = async (req, res, next) => {
  const header = req.headers["authorization"];

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role === 'student') {
      const academicState = await getStudentActiveAcademicState(decoded.id);
      if (!academicState || academicState.batch_is_active === false || academicState.batch_is_graduated === true) {
        return res.status(401).json({ message: "Batch is inactive or graduated. Access denied." });
      }
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = verifyJwtOnly;
