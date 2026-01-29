const mongoose = require('mongoose');

const restrictedAirspaceSchema = new mongoose.Schema({
  name: String,
  country: String,
  type: Number,
  icaoClass: Number,
  activity: Number,
  geometry: {
    type: {
      type: String,
      enum: ['Polygon'],
      required: true
    },
    coordinates: [[[Number]]]
  },
  upperLimit: {
    value: Number,
    unit: Number,
    referenceDatum: Number
  },
  lowerLimit: {
    value: Number,
    unit: Number,
    referenceDatum: Number
  },
  hoursOfOperation: Object,
  updatedAt: Date
}, { timestamps: true });

// Enables efficient geospatial queries (bbox filtering, intersections).
restrictedAirspaceSchema.index({ geometry: '2dsphere' });

module.exports = mongoose.model('RestrictedAirspace', restrictedAirspaceSchema);
