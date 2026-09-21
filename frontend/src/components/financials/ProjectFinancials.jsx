import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  getProjectFinancialsApi,
  createFinancialTransactionApi,
  deleteFinancialTransactionApi,
  unlockProjectFinancialsApi,
  lockProjectFinancialsApi,
} from '../../services/api';

const CATEGORIES = [
  'Material',
  'Labour',
  'Equipment',
  'Transportation',
  'Subcontractor',
  'Utilities',
  'Site Expense',
  'Other',
];

const PAYMENT_METHODS = ['Bank Transfer', 'Cheque', 'Cash', 'UPI', 'Credit'];
const PAYMENT_STATUSES = ['Paid', 'Pending', 'Partial'];

export const ProjectFinancials = ({ project, onNavigate }) => {
  const projectId = project?._id || project?.id;

  // Financial data state
  const [financialData, setFinancialData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLocked, setIsLocked] = useState(false);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [unlockError, setUnlockError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Form states
  const [expenseForm, setExpenseForm] = useState({
    category: 'Material',
    amount: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
    vendorOrClient: '',
    paymentStatus: 'Paid',
    paymentMethod: 'Bank Transfer',
    notes: '',
  });

  const [revenueForm, setRevenueForm] = useState({
    amount: '',
    description: 'Client Milestone Payment',
    date: new Date().toISOString().slice(0, 10),
    vendorOrClient: project?.client || 'Client / Owner',
    paymentStatus: 'Paid',
    paymentMethod: 'Bank Transfer',
    notes: '',
  });

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load project financials from real backend
  const loadFinancials = useCallback(async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      setError(null);

      const res = await getProjectFinancialsApi(projectId);

      if (res.success && res.data) {
        setFinancialData(res.data);
        setTransactions(res.data.transactions || []);
        setIsLocked(false);
      } else if (res.isFinancialLocked) {
        setIsLocked(true);
        setError('Project financials are protected. Please unlock with your security password.');
      } else {
        setError(res.message || 'Unable to load project financial records.');
      }
    } catch (err) {
      if (err.response?.data?.isFinancialLocked || err.message?.includes('locked')) {
        setIsLocked(true);
        setError('Project financials are protected. Please unlock with your security password.');
      } else {
        setError(err.message || 'Failed to connect to financial records service.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadFinancials();
  }, [loadFinancials]);

  // Handle password unlock
  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!passwordInput) {
      setUnlockError('Password is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setUnlockError(null);

      const res = await unlockProjectFinancialsApi(projectId, passwordInput);
      if (res.success && res.financialToken) {
        setIsUnlockModalOpen(false);
        setPasswordInput('');
        setIsLocked(false);
        showToast('Financial records unlocked successfully!');
        loadFinancials();
      } else {
        setUnlockError(res.message || 'Incorrect financial security password.');
      }
    } catch (err) {
      setUnlockError(err.message || 'Failed to authenticate financial access.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle lock
  const handleLock = async () => {
    try {
      await lockProjectFinancialsApi(projectId);
      setIsLocked(true);
      setFinancialData(null);
      setTransactions([]);
      showToast('Project financials locked securely.', 'info');
    } catch (err) {
      console.warn('Lock error:', err);
    }
  };

  // Handle Add Expense Submit
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) {
      showToast('Valid expense amount is required.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        type: 'Expense',
        category: expenseForm.category,
        amount: Number(expenseForm.amount),
        description: expenseForm.description || `${expenseForm.category} procurement`,
        date: expenseForm.date,
        vendorOrClient: expenseForm.vendorOrClient || 'Vendor',
        paymentStatus: expenseForm.paymentStatus,
        paymentMethod: expenseForm.paymentMethod,
        notes: expenseForm.notes,
      };

      const res = await createFinancialTransactionApi(projectId, payload);
      if (res.success) {
        setIsExpenseModalOpen(false);
        setExpenseForm({
          category: 'Material',
          amount: '',
          description: '',
          date: new Date().toISOString().slice(0, 10),
          vendorOrClient: '',
          paymentStatus: 'Paid',
          paymentMethod: 'Bank Transfer',
          notes: '',
        });
        showToast('Expense recorded successfully!');
        loadFinancials();
      } else {
        showToast(res.message || 'Failed to record expense.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error recording expense in database.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Add Revenue Submit
  const handleAddRevenue = async (e) => {
    e.preventDefault();
    if (!revenueForm.amount || Number(revenueForm.amount) <= 0) {
      showToast('Valid revenue amount is required.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        type: 'Revenue',
        category: 'Other',
        amount: Number(revenueForm.amount),
        description: revenueForm.description || 'Client milestone payment',
        date: revenueForm.date,
        vendorOrClient: revenueForm.vendorOrClient || 'Client',
        paymentStatus: revenueForm.paymentStatus,
        paymentMethod: revenueForm.paymentMethod,
        notes: revenueForm.notes,
      };

      const res = await createFinancialTransactionApi(projectId, payload);
      if (res.success) {
        setIsRevenueModalOpen(false);
        setRevenueForm({
          amount: '',
          description: 'Client Milestone Payment',
          date: new Date().toISOString().slice(0, 10),
          vendorOrClient: project?.client || 'Client / Owner',
          paymentStatus: 'Paid',
          paymentMethod: 'Bank Transfer',
          notes: '',
        });
        showToast('Revenue recorded successfully!');
        loadFinancials();
      } else {
        showToast(res.message || 'Failed to record revenue.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error recording revenue in database.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Transaction
  const handleDeleteTransaction = async (txId) => {
    if (!window.confirm('Are you sure you want to delete this financial transaction?')) {
      return;
    }

    try {
      const res = await deleteFinancialTransactionApi(projectId, txId);
      if (res.success) {
        showToast('Transaction deleted successfully.');
        loadFinancials();
      } else {
        showToast(res.message || 'Failed to delete transaction.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete transaction.', 'error');
    }
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesType = typeFilter === 'All' || tx.type === typeFilter;
      const matchesCategory = categoryFilter === 'All' || tx.category === categoryFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        (tx.description && tx.description.toLowerCase().includes(q)) ||
        (tx.vendorOrClient && tx.vendorOrClient.toLowerCase().includes(q)) ||
        (tx.category && tx.category.toLowerCase().includes(q));
      return matchesType && matchesCategory && matchesSearch;
    });
  }, [transactions, typeFilter, categoryFilter, searchQuery]);

  const metrics = financialData?.metrics || {
    totalRevenue: 0,
    totalExpenses: 0,
    profit: 0,
    loss: 0,
    isProfit: true,
    profitMargin: 0,
    expenseBreakdown: {},
    financialStatus: 'Pending Data',
  };

  const isNetPositive = metrics.profit >= 0 && metrics.isProfit;

  return (
    <div style={{ padding: '4px 0 24px 0' }}>
      {/* Toast notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            zIndex: 9999,
            padding: '12px 20px',
            background: toastMessage.type === 'error' ? '#EF4444' : '#10B981',
            color: '#FFFFFF',
            borderRadius: '8px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            fontSize: '0.88rem',
            fontWeight: 600,
          }}
        >
          {toastMessage.msg}
        </div>
      )}

      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', margin: '0 0 4px 0' }}>
            Project Financial Performance
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#64748B', margin: 0 }}>
            Real-time financial tracking, budget reconciliation, and expense management for {project?.name}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {isLocked ? (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setIsUnlockModalOpen(true)}
              style={{
                background: '#0284C7',
                color: '#FFF',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🔒 Unlock Financials
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(true)}
                style={{
                  background: '#EF4444',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>+</span> Add Expense
              </button>
              <button
                type="button"
                onClick={() => setIsRevenueModalOpen(true)}
                style={{
                  background: '#10B981',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>+</span> Add Revenue
              </button>
              <button
                type="button"
                onClick={handleLock}
                style={{
                  background: '#F1F5F9',
                  color: '#475569',
                  border: '1px solid #CBD5E1',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                title="Lock financials"
              >
                🔒 Lock
              </button>
            </>
          )}
        </div>
      </div>

      {/* Locked State Warning */}
      {isLocked && (
        <div
          style={{
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: '10px',
            padding: '24px',
            textAlign: 'center',
            marginBottom: '24px',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔐</div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#92400E', margin: '0 0 6px 0' }}>
            Project Financials Protected
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#B45309', maxWidth: '540px', margin: '0 auto 16px auto' }}>
            This project's financial ledger is protected with secondary password authorization. Please unlock to review revenue, expenses, invoices, and profitability metrics.
          </p>
          <button
            type="button"
            onClick={() => setIsUnlockModalOpen(true)}
            style={{
              background: '#D97706',
              color: '#FFF',
              border: 'none',
              padding: '9px 18px',
              borderRadius: '6px',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Enter Password to Unlock
          </button>
        </div>
      )}

      {/* Main KPI Summary Cards */}
      {!isLocked && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            {/* Total Revenue */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                padding: '18px 20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '6px' }}>
                Total Revenue / Billed
              </div>
              <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#10B981' }}>
                ₹{metrics.totalRevenue.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '4px' }}>
                Verified client receipts & milestones
              </div>
            </div>

            {/* Total Expenses */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                padding: '18px 20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '6px' }}>
                Total Expenses
              </div>
              <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#EF4444' }}>
                ₹{metrics.totalExpenses.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '4px' }}>
                Materials, labour, equipment & ops
              </div>
            </div>

            {/* Net Profit / Loss */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                padding: '18px 20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '6px' }}>
                {isNetPositive ? 'Net Profit' : 'Net Loss'}
              </div>
              <div style={{ fontSize: '1.55rem', fontWeight: 800, color: isNetPositive ? '#10B981' : '#DC2626' }}>
                {isNetPositive ? '+' : '-'}₹{Math.abs(metrics.profit > 0 ? metrics.profit : metrics.loss).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.74rem', color: isNetPositive ? '#059669' : '#DC2626', marginTop: '4px', fontWeight: 600 }}>
                Status: {metrics.financialStatus}
              </div>
            </div>

            {/* Profit Margin % */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                padding: '18px 20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '6px' }}>
                Profit Margin
              </div>
              <div style={{ fontSize: '1.55rem', fontWeight: 800, color: isNetPositive ? '#0284C7' : '#D97706' }}>
                {metrics.profitMargin}%
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '4px' }}>
                Net margin on booked revenue
              </div>
            </div>
          </div>

          {/* Category-Wise Expense Distribution */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              padding: '20px',
              marginBottom: '24px',
            }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: '14px' }}>
              Expense Breakdown by Category
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              {CATEGORIES.map((cat) => {
                const amount = metrics.expenseBreakdown?.[cat] || 0;
                const percent = metrics.totalExpenses > 0 ? Math.round((amount / metrics.totalExpenses) * 100) : 0;

                return (
                  <div key={cat} style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      <span>{cat}</span>
                      <span>₹{amount.toLocaleString('en-IN')} ({percent}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${percent}%`,
                          height: '100%',
                          background:
                            cat === 'Material'
                              ? '#0284C7'
                              : cat === 'Labour'
                              ? '#F59E0B'
                              : cat === 'Equipment'
                              ? '#8B5CF6'
                              : cat === 'Subcontractor'
                              ? '#EC4899'
                              : '#64748B',
                          borderRadius: '4px',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transaction Ledger Table */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              padding: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Transaction History ({filteredTransactions.length})
              </h3>

              {/* Filters */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.82rem',
                    outline: 'none',
                    minWidth: '180px',
                  }}
                />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.82rem',
                    background: '#FFF',
                  }}
                >
                  <option value="All">All Types</option>
                  <option value="Expense">Expenses Only</option>
                  <option value="Revenue">Revenue Only</option>
                </select>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.82rem',
                    background: '#FFF',
                  }}
                >
                  <option value="All">All Categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px' }}>Date</th>
                    <th style={{ padding: '10px 12px' }}>Type</th>
                    <th style={{ padding: '10px 12px' }}>Category</th>
                    <th style={{ padding: '10px 12px' }}>Description</th>
                    <th style={{ padding: '10px 12px' }}>Vendor / Client</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ padding: '32px', textAlign: 'center', color: '#94A3B8' }}>
                        No transactions found matching the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => {
                      const isRev = tx.type === 'Revenue';
                      const txId = tx._id || tx.id;
                      const dateStr = tx.date ? new Date(tx.date).toLocaleDateString() : 'N/A';

                      return (
                        <tr key={txId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '10px 12px', color: '#475569' }}>{dateStr}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                background: isRev ? '#ECFDF5' : '#FEF2F2',
                                color: isRev ? '#059669' : '#DC2626',
                              }}
                            >
                              {tx.type}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: '#334155' }}>
                            {tx.category}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#0F172A' }}>{tx.description}</td>
                          <td style={{ padding: '10px 12px', color: '#64748B' }}>
                            {tx.vendorOrClient || tx.vendor || '—'}
                          </td>
                          <td
                            style={{
                              padding: '10px 12px',
                              textAlign: 'right',
                              fontWeight: 700,
                              color: isRev ? '#10B981' : '#EF4444',
                            }}
                          >
                            {isRev ? '+' : '-'}₹{tx.amount?.toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                background:
                                  tx.paymentStatus === 'Paid'
                                    ? '#F0FDF4'
                                    : tx.paymentStatus === 'Pending'
                                    ? '#FFFBEB'
                                    : '#EFF6FF',
                                color:
                                  tx.paymentStatus === 'Paid'
                                    ? '#15803D'
                                    : tx.paymentStatus === 'Pending'
                                    ? '#B45309'
                                    : '#1D4ED8',
                              }}
                            >
                              {tx.paymentStatus || 'Paid'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleDeleteTransaction(txId)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#EF4444',
                                cursor: 'pointer',
                                fontSize: '0.82rem',
                                padding: '4px 6px',
                              }}
                              title="Delete transaction"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Add Expense Modal */}
      {isExpenseModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
            }}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 16px 0', color: '#0F172A' }}>
              Record Project Expense
            </h3>
            <form onSubmit={handleAddExpense}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Category</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  placeholder="e.g. 85000"
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Description</label>
                <input
                  type="text"
                  required
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="e.g. 50 bags OPC Cement & Steel Rebar"
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Date</label>
                  <input
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Vendor</label>
                  <input
                    type="text"
                    value={expenseForm.vendorOrClient}
                    onChange={(e) => setExpenseForm({ ...expenseForm, vendorOrClient: e.target.value })}
                    placeholder="e.g. Patel Steel Traders"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Payment Status</label>
                  <select
                    value={expenseForm.paymentStatus}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paymentStatus: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  >
                    {PAYMENT_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Payment Method</label>
                  <select
                    value={expenseForm.paymentMethod}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#F8FAFC',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#EF4444',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {isSubmitting ? 'Saving...' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Revenue Modal */}
      {isRevenueModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
            }}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 16px 0', color: '#0F172A' }}>
              Record Project Revenue
            </h3>
            <form onSubmit={handleAddRevenue}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={revenueForm.amount}
                  onChange={(e) => setRevenueForm({ ...revenueForm, amount: e.target.value })}
                  placeholder="e.g. 250000"
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Description</label>
                <input
                  type="text"
                  required
                  value={revenueForm.description}
                  onChange={(e) => setRevenueForm({ ...revenueForm, description: e.target.value })}
                  placeholder="e.g. Milestone 2 Signoff Payment"
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Date</label>
                  <input
                    type="date"
                    value={revenueForm.date}
                    onChange={(e) => setRevenueForm({ ...revenueForm, date: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Client / Payer</label>
                  <input
                    type="text"
                    value={revenueForm.vendorOrClient}
                    onChange={(e) => setRevenueForm({ ...revenueForm, vendorOrClient: e.target.value })}
                    placeholder="e.g. Gujarat Housing Board"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Payment Status</label>
                  <select
                    value={revenueForm.paymentStatus}
                    onChange={(e) => setRevenueForm({ ...revenueForm, paymentStatus: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  >
                    {PAYMENT_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Payment Method</label>
                  <select
                    value={revenueForm.paymentMethod}
                    onChange={(e) => setRevenueForm({ ...revenueForm, paymentMethod: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsRevenueModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#F8FAFC',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#10B981',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {isSubmitting ? 'Saving...' : 'Record Revenue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Security Password Unlock Modal */}
      {isUnlockModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              maxWidth: '400px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
            }}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 8px 0', color: '#0F172A' }}>
              🔒 Unlock Project Financials
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#64748B', marginBottom: '16px' }}>
              Please enter your financial security password to access sensitive project budgets, costs, and profit metrics.
            </p>

            {unlockError && (
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECDD3',
                  color: '#DC2626',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  marginBottom: '12px',
                }}
              >
                {unlockError}
              </div>
            )}

            <form onSubmit={handleUnlock}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Password</label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter financial password"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsUnlockModalOpen(false);
                    setPasswordInput('');
                    setUnlockError(null);
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#F8FAFC',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#0284C7',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {isSubmitting ? 'Verifying...' : 'Unlock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectFinancials;
