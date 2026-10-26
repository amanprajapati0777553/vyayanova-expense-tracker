import mongoose from 'mongoose';
const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  amount: { type: Number, required: true, min: 0.01 },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, required: true, trim: true },
  date: { type: Date, required: true, default: Date.now },
  note: { type: String, trim: true, maxlength: 500, default: '' }
}, { timestamps: true });
transactionSchema.index({ user: 1, date: -1 });
export default mongoose.model('Transaction', transactionSchema);
