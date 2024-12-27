const User = require("../models/User");
const { generateToken } = require("../config/jwt");

const authController = {
  async register(req, res, next) {
    try {
      const { username, email, password } = req.body;

      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });

      if (existingUser) {
        return res.status(400).json({
          message: "Utilisateur ou email déjà existant",
        });
      }

      const user = await User.create({
        username,
        email,
        password,
      });

      const token = generateToken(user);

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 heures
      });
      res.redirect("/cards");
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({
          message: "Email ou mot de passe incorrect",
        });
      }

      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          message: "Email ou mot de passe incorrect",
        });
      }

      const token = generateToken(user);

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 heures
      });
      res.redirect("/cards");
    } catch (error) {
      next(error);
    }
  },

  async getProfile(req, res, next) {
    try {
      const user = await User.findById(req.user.id)
        .select("-password")
        .populate("collection");

      if (!user) {
        return res.status(404).json({
          message: "Utilisateur non trouvé",
        });
      }

      res.json({
        success: true,
        user,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const { username, email } = req.body;
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { username, email },
        { new: true, runValidators: true }
      ).select("-password");

      res.json({
        success: true,
        user,
      });
    } catch (error) {
      next(error);
    }
  },

  async renderRegisterPage(req, res, next) {
    res.render("auth/register");
  },

  async renderLoginPage(req, res, next) {
    res.render("auth/login");
  },
};

module.exports = authController;
