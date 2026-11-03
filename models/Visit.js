import mongoose from 'mongoose';

const VisitSchema = new mongoose.Schema({
  technicianName: { type: String, required: true },
  technicianId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Technician' }, // optional, links to Technician doc
  clientName:     { type: String, required: true },       // e.g., "Dmart", "Pantaloons"
  branchLocation: { type: String, required: true },        // e.g., "Baner Branch"
  acType:         { type: String, required: true },        // "Ducted AC" | "Cassette AC" | "Split AC" | "VRV System"
  serialNumber:   { type: String, trim: true, default: '' }, // AC Serial / Unit Number
  workDone:       { type: String, trim: true, default: '' }, // Work done description / service notes
  indoorPhotoUrl:  { type: String, required: true },
  outdoorPhotoUrl: { type: String, required: true },
  geoLocation: {
    lat: { type: Number },
    lng: { type: Number },
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Visit || mongoose.model('Visit', VisitSchema);

