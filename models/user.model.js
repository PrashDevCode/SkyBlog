import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    profileImageURL: {
      type: String,
      default: "../public/user.png",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true },
);

// Hash password BEFORE saving to DB
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Method to check password on login
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Static method to find user and verify password
userSchema.statics.matchPassword = async function (email, enteredPassword) {
  const user = await this.findOne({ email });
  if (!user) throw new Error("User not found");

  const isMatch = await user.comparePassword(enteredPassword);
  if (!isMatch) throw new Error("Invalid password");

  return user; // ✅ returns full user object
};

const User = mongoose.model("User", userSchema);
export default User;