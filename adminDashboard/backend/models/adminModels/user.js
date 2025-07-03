import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  profileImage: { type: String },
}, {
  timestamps: true // Add timestamps for when documents are created/updated
});

const User = mongoose.model("AdminEmail", UserSchema);
export default User;
