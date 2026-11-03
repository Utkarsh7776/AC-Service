import mongoose from 'mongoose';

const BranchSchema = new mongoose.Schema({
  name: { type: String, required: true },       // e.g., "Baner Branch"
  city: { type: String, required: true },
  address: { type: String },
});

const ClientSchema = new mongoose.Schema({
  name:     { type: String, required: true, unique: true },  // e.g., "Dmart", "Pantaloons"
  mobile:   { type: String, trim: true, default: '' },
  email:    { type: String, trim: true, default: '' },
  branches: [BranchSchema],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Client || mongoose.model('Client', ClientSchema);
