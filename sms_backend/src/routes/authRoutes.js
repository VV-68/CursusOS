const express = require("express");
const router = express.Router();

const AuthController = require("../controllers/authController");
const verifyToken = require("../middleware/authMiddleware");

// Public routes
router.post("/login", AuthController.login);

// Token required
router.get("/me", verifyToken, AuthController.me);
router.post("/logout", verifyToken, AuthController.logout);
router.patch("/change-password", verifyToken, AuthController.changePassword);

module.exports = router;
