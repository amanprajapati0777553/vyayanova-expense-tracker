import { Router } from 'express';
import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import auth from '../middleware/auth.js';
const router = Router();
router.use(auth);
const fields = (body) => ({ title: body.title?.trim(), amount: Number(body.amount), type: body.type, category: body.category?.trim(), date: body.date, note: body.note || '' });
function validate(data) {
  if (!data.title || data.title.length > 120) return 'Enter a title of up to 120 characters.';
  if (!Number.isFinite(data.amount) || data.amount <= 0) return 'Amount must be greater than zero.';
  if (!['income', 'expense'].includes(data.type)) return 'Choose income or expense.';
  if (!data.category) return 'Choose a category.';
  if (data.note.length > 500) return 'Note must be 500 characters or fewer.';
  if (data.date && Number.isNaN(new Date(data.date).getTime())) return 'Enter a valid date.';
  return null;
}
function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
router.get('/summary', async (req, res) => {
  try {
    const match = { user: new mongoose.Types.ObjectId(req.user.id) };
    const { from, to } = req.query;
    if (from || to) match.date = {};
    if (from) {
      const start = parseDate(from);
      if (!start) return res.status(400).json({ message: 'Enter a valid start date.' });
      match.date.$gte = start;
    }
    if (to) {
      const end = parseDate(to);
      if (!end) return res.status(400).json({ message: 'Enter a valid end date.' });
      end.setHours(23,59,59,999); match.date.$lte = end;
    }
    const rows = await Transaction.aggregate([{ $match: match }, { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }]);
    const income = rows.find(r => r._id === 'income')?.total || 0;
    const expenses = rows.find(r => r._id === 'expense')?.total || 0;
    const categoryRows = await Transaction.aggregate([{ $match: { ...match, type: 'expense' } }, { $group: { _id: '$category', total: { $sum: '$amount' } } }, { $sort: { total: -1 } }]);
    res.json({ income, expenses, balance: income - expenses, categories: categoryRows });
  } catch { res.status(500).json({ message: 'Could not load summary.' }); }
});
router.get('/', async (req, res) => {
  try {
    const query = { user: req.user.id };
    if (req.query.type && ['income','expense'].includes(req.query.type)) query.type = req.query.type;
    if (req.query.category) query.category = req.query.category;
    if (req.query.from || req.query.to) query.date = {};
    if (req.query.from) {
      const start = parseDate(req.query.from);
      if (!start) return res.status(400).json({ message: 'Enter a valid start date.' });
      query.date.$gte = start;
    }
    if (req.query.to) {
      const end = parseDate(req.query.to);
      if (!end) return res.status(400).json({ message: 'Enter a valid end date.' });
      end.setHours(23,59,59,999); query.date.$lte = end;
    }
    if (req.query.search) query.title = { $regex: req.query.search, $options: 'i' };
    const transactions = await Transaction.find(query).sort({ date: -1, createdAt: -1 }).limit(500);
    res.json({ transactions });
  } catch { res.status(500).json({ message: 'Could not load transactions.' }); }
});
router.post('/', async (req, res) => {
  try {
    const data = fields(req.body); const error = validate(data);
    if (error) return res.status(400).json({ message: error });
    const transaction = await Transaction.create({ ...data, date: data.date || new Date(), user: req.user.id });
    res.status(201).json({ transaction });
  } catch { res.status(500).json({ message: 'Could not create transaction.' }); }
});
router.patch('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid transaction ID.' });
    const data = fields(req.body); const error = validate(data);
    if (error) return res.status(400).json({ message: error });
    const transaction = await Transaction.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, data, { new: true, runValidators: true });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found.' });
    res.json({ transaction });
  } catch { res.status(500).json({ message: 'Could not update transaction.' }); }
});
router.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found.' });
    res.json({ message: 'Transaction deleted.' });
  } catch { res.status(500).json({ message: 'Could not delete transaction.' }); }
});
export default router;
