import mongoose from 'mongoose';

const TechnicianSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  address:  { type: String, trim: true, default: '' },
  mobile:   { type: String, trim: true, default: '' },
  email:    { type: String, lowercase: true, trim: true, default: '' },
  loginId:  { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role:     { type: String, default: 'technician' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.Technician || mongoose.model('Technician', TechnicianSchema);

