const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 30,
      trim: true,
    },
    avatar: {
      type: String,
      required: false,
      validate: {
        validator(value) {
          return !value || validator.isURL(value);
        },
        message: "You must enter a valid URL",
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      validate: {
        validator: (value) => validator.isEmail(value),
        message: "You must enter a valid email address",
      },
    },
    password: {
      type: String,
      required: true,
      select: false,
      minlength: 6,
    },
    rollHistory: {
      type: [
        {
          id: {
            type: String,
            required: true,
          },
          timestamp: {
            type: Date,
            required: true,
          },
          diceRolled: {
            type: String,
            required: true,
          },
          total: {
            type: Number,
            required: true,
          },
          details: {
            type: Array,
            required: true,
          },
        },
      ],
      default: [],
      maxlength: 200,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
