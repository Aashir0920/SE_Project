const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['bank', 'paypal'], required: true },
  details: {
    accountNumber: { type: String },
    routingNumber: { type: String },
    paypalEmail: { type: String },
  },
  status: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Payout', payoutSchema);