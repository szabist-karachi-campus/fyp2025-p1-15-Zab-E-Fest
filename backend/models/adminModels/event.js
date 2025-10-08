import mongoose from 'mongoose';

const eventSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    description: { type: String },
    image: { type: String, default: null }, // Store image path
    cap: { type: Number, required: true },
    moduleHead: { type: String, required: true },
    moduleLeader:{type: String, required: true },
    fee: { type: Number, default: 0 },              // ✅ Module Fee
    discount: { type: Number, default: 0 },         // ✅ Discount
    partnerGroup: { type: String, default: "Solo" }, // ✅ Group Type
    finalFee: { type: Number, default: 0 },

  
  },
  { timestamps: true }
);

const Event = mongoose.model('Event', eventSchema);

export default Event;
