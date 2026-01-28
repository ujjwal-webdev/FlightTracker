const mongoose = require('mongoose');

const flightPriceSchema = new mongoose.Schema({
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  airline: { type: String },
  departure_date: { type: String }, // 'YYYY-MM-DD'
  return_date: { type: String },
  price: { type: Number, required: true },
  currency: { type: String },
  transfers: { type: Number },
  updated_at: { type: Date },
  fetchedAt: { type: Date, default: Date.now }
});

// Speeds up `/prices` and calendar lookups.
flightPriceSchema.index({ origin: 1, destination: 1, departure_date: 1 });

module.exports = mongoose.model('FlightPrice', flightPriceSchema);
