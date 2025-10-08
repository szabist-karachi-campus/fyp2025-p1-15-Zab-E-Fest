import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, unique: true },
  password: { type: String, required: true },
  mobile: { type: String, default: '' },
  profileImage: { type: String, default: null },
  provider: { type: String, default: 'local' }, // local | google | facebook
  // Password reset support
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
});

export default  mongoose.model('participantUser', userSchema);
