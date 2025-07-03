import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, unique: true },
  password: { type: String, required: true },
  provider: { type: String, default: 'local' } // local | google | facebook
});

export default  mongoose.model('participantUser', userSchema);
