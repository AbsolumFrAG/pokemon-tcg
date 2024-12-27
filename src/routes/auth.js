const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { auth } = require("../middlewares/auth");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/profile", auth, authController.getProfile);
router.put("/profile", auth, authController.updateProfile);
router.get("/register", authController.renderRegisterPage);
router.get("/login", authController.renderLoginPage);

module.exports = router;
