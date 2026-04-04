const express = require("express");
const router = express.Router();

const AuthController = require("../controllers/authController");
const verifyToken = require("../middleware/authMiddleware");
const verifyJwtOnly = require("../middleware/verifyJwtOnly");

// Public routes
router.post("/register", AuthController.register);
router.post("/login", AuthController.login);

// Logout → only verify JWT, do NOT check DB token match
router.post("/logout", verifyJwtOnly, AuthController.logout);

module.exports = router;
