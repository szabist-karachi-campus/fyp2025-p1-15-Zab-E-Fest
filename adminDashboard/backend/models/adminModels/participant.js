import mongoose from 'mongoose';

const studentSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    rollNumber: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    contactNumber: { type: String, required: true },
    module: { type: String, required: true },
    department: { type: String, required: true },
    university: { type: String, required: true },
    fee: { type: Number, required: true },
    stage: { type: String, enum: ["Pre-Qualifier", "Final Round", "Winner"], default: "Pre-Qualifier" },
    grade: { type: String },
    comments: { type: String },
    attendance: { type: String },
    notes: { type: String }
  },
  { timestamps: true }
);

const Student = mongoose.model('Student', studentSchema);

export default Student;
