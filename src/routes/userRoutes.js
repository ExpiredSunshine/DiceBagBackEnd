const express = require("express");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const { config } = require("../config/config");
const User = require("../models/User");
const auth = require("../middleware/auth");
const {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
} = require("../utils/error-classes");

const router = express.Router();

router.post("/signup", async (req, res, next) => {
  try {
    const { name, email, password, avatar } = req.body;

    if (!name || !email || !password) {
      throw new BadRequestError("Name, email, and password are required");
    }

    if (!validator.isEmail(email)) {
      throw new BadRequestError("Invalid email format");
    }

    if (password.length < 6) {
      throw new BadRequestError("Password must be at least 6 characters");
    }

    if (avatar && !validator.isURL(avatar)) {
      throw new BadRequestError("Invalid avatar URL");
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ConflictError("User with this email already exists");
    }

    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      avatar: avatar || "",
    });

    await user.save();

    const token = jwt.sign({ _id: user._id }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      user: userResponse,
      token,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/signin", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new BadRequestError("Email and password are required");
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );

    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const token = jwt.sign({ _id: user._id }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      user: userResponse,
      token,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/users/me", auth, async (req, res, next) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    next(error);
  }
});

router.patch("/users/me", auth, async (req, res, next) => {
  try {
    const { name, email, avatar } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (!name || name.length < 2 || name.length > 30) {
        throw new BadRequestError("Name must be between 2 and 30 characters");
      }
      updates.name = name.trim();
    }

    if (email !== undefined) {
      if (!validator.isEmail(email)) {
        throw new BadRequestError("Invalid email format");
      }

      const existingUser = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: req.user._id },
      });

      if (existingUser) {
        throw new ConflictError("Email is already taken");
      }

      updates.email = email.toLowerCase();
    }

    if (avatar !== undefined) {
      if (avatar && !validator.isURL(avatar)) {
        throw new BadRequestError("Invalid avatar URL");
      }
      updates.avatar = avatar || "";
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ user: updatedUser });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
