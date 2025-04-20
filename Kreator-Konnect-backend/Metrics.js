const mongoose = require('mongoose');

const metricsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  views: { type: Number, required: true },
  likes: { type: Number, required: true },
  comments: { type: Number, required: true },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Metrics', metricsSchema);