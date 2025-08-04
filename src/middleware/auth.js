const jwt = require("jsonwebtoken");
const { config } = require("../config/config");
const { UnauthorizedError } = require("../utils/error-classes");
const User = require("../models/User");

const auth = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Authorization required"));
  }

  const token = authorization.replace("Bearer ", "");

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(payload._id).select("-password");

    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      next(new UnauthorizedError("Invalid token"));
    } else if (err.name === "TokenExpiredError") {
      next(new UnauthorizedError("Token expired"));
    } else {
      next(err);
    }
  }
};

module.exports = auth;
