const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const USER_ROLES = ["CONSUMER", "FARMER"];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address."],
    },
    password: {
      type: String,
      required: [true, "Password is required."],
      minlength: [6, "Password must be at least 6 characters."],
      select: false, // never returned in queries by default
    },
    role: {
      type: String,
      required: [true, "Role is required."],
      enum: {
        values: USER_ROLES,
        message: `Role must be one of: ${USER_ROLES.join(", ")}.`,
      },
    },
    location: {
      type: String,
      required: [true, "Location is required."],
      trim: true,
    },
  },
  { timestamps: true }
);

// Hash password before saving if it was modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method — compare candidate password against stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Safe projection — strip password even when select:false is bypassed
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    location: this.location,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("User", userSchema);
