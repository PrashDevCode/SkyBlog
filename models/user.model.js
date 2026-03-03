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
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // only hash if password changed
  this.password = await bcrypt.hash(this.password, 10);
});

// Method to check password on login
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.statics.matchPassword = async function (email, enteredPassword) {
  const user = await this.findOne({ email });
  if (!user) return false;
  return await user.comparePassword(enteredPassword);
};

const User = mongoose.model("User", userSchema);
export default User;
