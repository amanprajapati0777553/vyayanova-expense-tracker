import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChartNoAxesCombined,
  LoaderCircle,
  LogOut,
  Pencil,
  Plus,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const API = import.meta.env.VITE_API_URL
  || `${window.location.protocol}//${window.location.hostname}:5000/api`;
const FALLBACK_API = API.replace('//localhost:', '//127.0.0.1:');
const categories = {
  income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'],
  expense: ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Education', 'Entertainment', 'Travel', 'Other'],
};
const colors = ['#6c5ce7', '#25a879', '#f2a64a', '#4b9fe8', '#e97996', '#8d9bad', '#d2bc50', '#9b78d0'];
const money = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
}).format(value || 0);
const dateText = (date) => new Date(date).toLocaleDateString('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

async function request(path, token, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  let response;
  try {
    response = await fetch(`${API}${path}`, { ...options, headers });
  } catch {
    if (FALLBACK_API === API) {
      throw new Error(`Could not connect to the server at ${API}. Make sure the backend is running on port 5000.`);
    }
    try {
      response = await fetch(`${FALLBACK_API}${path}`, { ...options, headers });
    } catch {
      throw new Error(`Could not connect to the server at ${API}. Make sure the backend is running on port 5000.`);
    }
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Something went wrong.');
  return data;
}

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await request(`/auth/${mode}`, null, {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      onAuth(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-wrap">
      <div className="auth-aside">
        <div className="brand auth-brand"><span className="brand-mark small"><Wallet size={19} /></span><span>VyayaNova</span></div>
        <div className="auth-message">
          <p className="eyebrow">A CALMER WAY TO MANAGE MONEY</p>
          <h2>Make every rupee feel accounted for.</h2>
          <p>Keep your everyday spending visible, organized, and easy to understand.</p>
        </div>
        <div className="auth-orbit"><Wallet size={30} /></div>
      </div>
      <section className="auth-card">
        <div className="auth-card-head">
          <div className="brand-mark"><Wallet size={24} /></div>
          <p className="eyebrow">YOUR MONEY, IN FOCUS</p>
          <h1>{mode === 'login' ? 'Welcome back.' : 'Start saving smarter.'}</h1>
          <p className="muted">{mode === 'login' ? 'Sign in to see where your money goes.' : 'Create an account to organize your finances.'}</p>
        </div>
        <form onSubmit={submit} className="auth-form">
          {mode === 'register' && <label>Full name<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" maxLength="80" /></label>}
          <label>Email address<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
          <label>Password<input required type="password" minLength="8" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /></label>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="primary full" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
        </form>
        <p className="switch-auth">{mode === 'login' ? 'New here?' : 'Already have an account?'} <button className="link-button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p>
        <p className="security-note">Your account is private. Transactions are tied to your login.</p>
      </section>
    </main>
  );
}

function TransactionModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    amount: initial?.amount ?? '',
    type: initial?.type || 'expense',
    category: initial?.category || 'Food',
    date: initial?.date ? new Date(initial.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    note: initial?.note || '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function change(key, value) {
    setForm((old) => ({ ...old, [key]: value, ...(key === 'type' ? { category: categories[value][0] } : {}) }));
  }
  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onSave({ ...form, amount: Number(form.amount), date: new Date(`${form.date}T12:00:00`).toISOString() });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="transaction-title">
        <div className="modal-head"><div><p className="eyebrow">TRANSACTION DETAILS</p><h2 id="transaction-title">{initial ? 'Edit transaction' : 'Add a transaction'}</h2></div><button className="icon-btn" onClick={onClose} aria-label="Close"><X /></button></div>
        <form onSubmit={submit} className="transaction-form">
          <label>Transaction name<input required autoFocus maxLength="120" placeholder="e.g. Monthly salary" value={form.title} onChange={(event) => change('title', event.target.value)} /></label>
          <div className="form-grid">
            <label>Type<select value={form.type} onChange={(event) => change('type', event.target.value)}><option value="expense">Expense</option><option value="income">Income</option></select></label>
            <label>Amount (₹)<input required type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => change('amount', event.target.value)} placeholder="0.00" /></label>
            <label>Category<select value={form.category} onChange={(event) => change('category', event.target.value)}>{categories[form.type].map((category) => <option key={category}>{category}</option>)}</select></label>
            <label>Date<input required type="date" value={form.date} onChange={(event) => change('date', event.target.value)} /></label>
          </div>
          <label>Note (optional)<textarea rows="3" maxLength="500" placeholder="Add a little detail…" value={form.note} onChange={(event) => change('note', event.target.value)} /></label>
          {error && <p className="error" role="alert">{error}</p>}
          <div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={busy}>{busy ? 'Saving…' : initial ? 'Save changes' : 'Add transaction'}</button></div>
        </form>
      </section>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(() => { try { return JSON.parse(localStorage.getItem('pennywise-session')); } catch { return null; } });
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expenses: 0, balance: 0, categories: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [category, setCategory] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  function saveSession(data) { localStorage.setItem('pennywise-session', JSON.stringify(data)); setSession(data); }
  function logout() { localStorage.removeItem('pennywise-session'); setSession(null); setTransactions([]); }
  async function load() {
    if (!session?.token) return;
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (type !== 'all') params.set('type', type);
      if (category !== 'all') params.set('category', category);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const query = params.toString();
      const summaryQuery = from || to ? `?${new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) })}` : '';
      const [tx, sum] = await Promise.all([request(`/transactions${query ? `?${query}` : ''}`, session.token), request(`/transactions/summary${summaryQuery}`, session.token)]);
      setTransactions(tx.transactions); setSummary(sum);
    } catch (err) {
      setError(err.message);
      if (err.message.toLowerCase().includes('session') || err.message.toLowerCase().includes('log in')) logout();
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [session?.token, search, type, category, from, to]);
  async function saveTransaction(data) {
    if (modal?.transaction) await request(`/transactions/${modal.transaction._id}`, session.token, { method: 'PATCH', body: JSON.stringify(data) });
    else await request('/transactions', session.token, { method: 'POST', body: JSON.stringify(data) });
    await load();
  }
  async function removeTransaction(id) {
    if (!window.confirm('Delete this transaction? This cannot be undone.')) return;
    try { await request(`/transactions/${id}`, session.token, { method: 'DELETE' }); await load(); } catch (err) { setError(err.message); }
  }
  const chartData = useMemo(() => summary.categories.map((item) => ({ name: item._id, value: item.total })), [summary.categories]);
  if (!session?.token) return <AuthScreen onAuth={saveSession} />;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark small"><Wallet size={19} /></span><span>VyayaNova</span></div>
        <div className="side-label">WORKSPACE</div>
        <div className="nav-item active"><ChartNoAxesCombined size={18} /> Overview</div>
        <div className="side-bottom"><div className="avatar">{session.user?.name?.charAt(0)?.toUpperCase() || 'U'}</div><div className="user-details"><strong>{session.user?.name || 'User'}</strong><span>{session.user?.email}</span></div><button className="icon-btn logout" onClick={logout} title="Log out" aria-label="Log out"><LogOut size={18} /></button></div>
      </aside>
      <main className="main-content">
        <header className="topbar"><div><p className="eyebrow">PERSONAL FINANCE</p><h1>Good day, {(session.user?.name || 'there').split(' ')[0]} <span className="wave">✦</span></h1><p className="muted">Here’s what’s happening with your money.</p></div><button className="primary add-top" onClick={() => setModal({ transaction: null })}><Plus size={18} /><span>Add transaction</span></button></header>
        {error && <div className="notice" role="alert"><span>{error}</span><button className="link-button" onClick={() => setError('')}>Dismiss</button></div>}
        <section className="stats-grid">
          <article className="stat-card balance-card"><div className="stat-top"><span className="stat-icon balance-icon"><Wallet size={19} /></span><span className="stat-caption">TOTAL BALANCE</span></div><p className="stat-value">{money(summary.balance)}</p><p className="stat-foot">Income minus expenses</p><div className="balance-decoration" /></article>
          <article className="stat-card"><div className="stat-top"><span className="stat-icon income-icon"><TrendingUp size={19} /></span><span className="stat-caption">TOTAL INCOME</span></div><p className="stat-value">{money(summary.income)}</p><p className="stat-foot positive"><ArrowUpRight size={15} /> Money coming in</p></article>
          <article className="stat-card"><div className="stat-top"><span className="stat-icon expense-icon"><TrendingDown size={19} /></span><span className="stat-caption">TOTAL EXPENSES</span></div><p className="stat-value">{money(summary.expenses)}</p><p className="stat-foot negative"><ArrowDownRight size={15} /> Money going out</p></article>
        </section>
        <section className="content-grid">
          <article className="panel transactions-panel"><div className="panel-heading"><div><h2>Recent transactions</h2><p className="muted">Your latest money activity</p></div><span className="count-pill">{transactions.length} records</span></div>
            <div className="filters"><div className="search-box"><Search size={17} /><input aria-label="Search transactions" placeholder="Search transactions…" value={search} onChange={(event) => setSearch(event.target.value)} /></div><select aria-label="Filter by type" value={type} onChange={(event) => setType(event.target.value)}><option value="all">All types</option><option value="income">Income</option><option value="expense">Expenses</option></select><select aria-label="Filter by category" value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{[...new Set([...categories.income, ...categories.expense])].map((item) => <option key={item}>{item}</option>)}</select></div>
            <div className="date-filters"><CalendarDays size={16} /><label>From<input aria-label="Start date" type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label><label>To<input aria-label="End date" type="date" min={from || undefined} value={to} onChange={(event) => setTo(event.target.value)} /></label>{(from || to) && <button className="link-button" onClick={() => { setFrom(''); setTo(''); }}>Clear dates</button>}</div>
            <div className="transaction-list">{loading ? <div className="empty-state"><LoaderCircle className="spin" /><span>Loading transactions…</span></div> : transactions.length === 0 ? <div className="empty-state"><div className="empty-icon"><Wallet size={23} /></div><strong>No transactions found</strong><span>Add your first transaction or change your filters.</span><button className="primary" onClick={() => setModal({ transaction: null })}><Plus size={16} /> Add transaction</button></div> : transactions.map((transaction) => <div className="transaction-row" key={transaction._id}><div className={`transaction-symbol ${transaction.type}`}>{transaction.type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}</div><div className="transaction-info"><strong>{transaction.title}</strong><span>{transaction.category} <i>·</i> {dateText(transaction.date)}</span>{transaction.note && <small>{transaction.note}</small>}</div><div className={`transaction-amount ${transaction.type}`}>{transaction.type === 'income' ? '+' : '−'}{money(transaction.amount)}</div><div className="row-actions"><button className="icon-btn" aria-label={`Edit ${transaction.title}`} title="Edit" onClick={() => setModal({ transaction })}><Pencil size={15} /></button><button className="icon-btn delete-btn" aria-label={`Delete ${transaction.title}`} title="Delete" onClick={() => removeTransaction(transaction._id)}><Trash2 size={15} /></button></div></div>)}</div>
          </article>
          <aside className="panel category-panel"><div className="panel-heading"><div><h2>Spending breakdown</h2><p className="muted">Expenses by category</p></div></div>{chartData.length ? <><div className="chart-wrap"><ResponsiveContainer width="100%" height="210"><PieChart><Pie data={chartData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={83} paddingAngle={3} stroke="none">{chartData.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip formatter={(value) => money(value)} /></PieChart></ResponsiveContainer><div className="chart-center"><span>TOTAL SPENT</span><strong>{money(summary.expenses)}</strong></div></div><div className="category-legend">{chartData.map((item, index) => <div className="legend-row" key={item.name}><span className="legend-dot" style={{ background: colors[index % colors.length] }} /><span>{item.name}</span><strong>{money(item.value)}</strong></div>)}</div></> : <div className="chart-empty"><div className="empty-icon"><ChartNoAxesCombined size={22} /></div><strong>No spending data yet</strong><span>Your expense categories will appear here.</span></div>}<div className="tip-card"><div className="tip-spark">✦</div><div><strong>A little tip</strong><p>Small, consistent check-ins can help you understand spending patterns and plan ahead.</p></div></div></aside>
        </section>
        <footer className="footer">VyayaNova <span>·</span> A clearer view of your money.</footer>
      </main>
      {modal && <TransactionModal initial={modal.transaction} onClose={() => setModal(null)} onSave={saveTransaction} />}
    </div>
  );
}
