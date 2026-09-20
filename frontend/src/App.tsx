import React, { useState, useEffect } from 'react';
import { api } from './api';
import type { Client, Invoice, Ledger } from './types';

// Warm Mustard & Line-Art Aesthetic Styles
const lineArtStyles = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(14px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes gentleFloat {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-7px); }
  }

  .animate-fade {
    animation: fadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  .float-anim {
    animation: gentleFloat 3.8s ease-in-out infinite;
  }

  .mustard-bg {
    background-color: #f7c844;
    background-image: radial-gradient(#111111 0.85px, transparent 0.85px);
    background-size: 28px 28px;
  }

  .card-box {
    background-color: #ffffff;
    border: 2.5px solid #111111;
    border-radius: 16px;
    box-shadow: 4px 4px 0px #111111;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .card-box:hover {
    transform: translateY(-2px);
    box-shadow: 6px 6px 0px #111111;
  }

  .btn-mustard {
    border: 2.5px solid #111111;
    border-radius: 10px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 3px 3px 0px #111111;
    transition: all 0.15s ease;
  }
  .btn-mustard:hover {
    transform: translate(-1px, -1px);
    box-shadow: 5px 5px 0px #111111;
  }
  .btn-mustard:active {
    transform: translate(1px, 1px);
    box-shadow: 2px 2px 0px #111111;
  }

  .input-mustard {
    border: 2px solid #111111;
    border-radius: 10px;
    padding: 10px 14px;
    font-weight: 600;
    outline: none;
    background: #ffffff;
    color: #111111;
    transition: all 0.15s ease;
  }
  .input-mustard:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #111111; border-radius: 4px; }
`;

const formatCurrency = (minorAmount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(minorAmount / 100);
};

// Line-Art Freelancer Illustration
const LineArtFreelancer = () => (
  <svg width="260" height="180" viewBox="0 0 260 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="float-anim">
    {/* Beanbag Chair */}
    <path d="M70 140C50 140 40 110 50 85C60 60 90 55 130 55C170 55 200 60 210 85C220 110 210 140 190 140C160 145 100 145 70 140Z" fill="#FFFFFF" stroke="#111111" strokeWidth="3" />
    
    {/* Person Body & Red Pants */}
    <path d="M100 95C100 95 115 125 130 125C145 125 165 95 165 95" fill="#EF4444" stroke="#111111" strokeWidth="3" />
    <path d="M105 125C115 135 145 135 155 125" fill="#EF4444" stroke="#111111" strokeWidth="3" />
    <rect x="115" y="65" width="30" height="35" rx="6" fill="#FFFFFF" stroke="#111111" strokeWidth="3" />
    
    {/* Blue Hair & Head */}
    <circle cx="130" cy="50" r="14" fill="#FFFFFF" stroke="#111111" strokeWidth="3" />
    <path d="M120 42C122 36 138 34 142 42C144 48 132 46 120 42Z" fill="#2563EB" stroke="#111111" strokeWidth="2" />

    {/* Reading Book/Tablet */}
    <rect x="118" y="72" width="24" height="16" rx="2" fill="#FFFFFF" stroke="#111111" strokeWidth="2.5" />
    
    {/* Desk Lamp */}
    <path d="M30 155H60" stroke="#111111" strokeWidth="4" strokeLinecap="round" />
    <path d="M45 155V105L30 80L45 55" stroke="#111111" strokeWidth="3" fill="none" />
    <path d="M45 55L65 40L75 60L55 70L45 55Z" fill="#FFFFFF" stroke="#111111" strokeWidth="3" />

    {/* Book Stack & Coffee */}
    <rect x="25" y="140" width="30" height="8" rx="2" fill="#FFFFFF" stroke="#111111" strokeWidth="2.5" />
    <rect x="22" y="148" width="36" height="7" rx="2" fill="#FFFFFF" stroke="#111111" strokeWidth="2.5" />
    <rect x="35" y="124" width="12" height="16" rx="2" fill="#FFFFFF" stroke="#111111" strokeWidth="2.5" />
    {/* Steam */}
    <path d="M39 118C37 114 41 112 39 108" stroke="#111111" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M43 118C41 114 45 112 43 108" stroke="#111111" strokeWidth="2" fill="none" strokeLinecap="round" />

    {/* Pet Sleeping on Lap */}
    <ellipse cx="130" cy="112" rx="14" ry="8" fill="#FFFFFF" stroke="#111111" strokeWidth="2.5" />
  </svg>
);

export default function App() {
  const [userId, setUserId] = useState<string>('demo-user-1');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Form states
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [invDesc, setInvDesc] = useState('');
  const [invDueDate, setInvDueDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentInput, setPaymentInput] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadClients();
  }, [userId]);

  useEffect(() => {
    if (selectedClientId) {
      loadClientData(selectedClientId);
    } else {
      setLedger(null);
      setInvoices([]);
    }
  }, [selectedClientId, userId]);

  const loadClients = async () => {
    try {
      const data = await api.getClients(userId);
      setClients(data);
      if (data.length > 0) {
        setSelectedClientId(data[0].clientId);
      } else {
        setSelectedClientId('');
      }
    } catch (err: any) {
      console.error('Error fetching clients:', err);
    }
  };

  const loadClientData = async (clientId: string) => {
    try {
      const [ledgerData, invoiceData] = await Promise.all([
        api.getLedger(clientId, userId),
        api.getInvoices(clientId, userId),
      ]);
      setLedger(ledgerData);
      setInvoices(invoiceData);
    } catch (err: any) {
      console.error('Error loading client details:', err);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientEmail) return;
    try {
      const created = await api.createClient({ name: newClientName, email: newClientEmail }, userId);
      setNewClientName('');
      setNewClientEmail('');
      await loadClients();
      setSelectedClientId(created.clientId);
    } catch (err: any) {
      alert(`Failed to create client: ${err.message}`);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !invAmount) return;
    try {
      const amountMinor = Math.round(parseFloat(invAmount) * 100);
      await api.createInvoice(
        selectedClientId,
        { amountMinor, description: invDesc, dueDate: invDueDate },
        userId
      );
      setInvAmount('');
      setInvDesc('');
      setInvDueDate('');
      loadClientData(selectedClientId);
    } catch (err: any) {
      alert(`Failed to create invoice: ${err.message}`);
    }
  };

  const handleRecordPayment = async (invoiceId: string) => {
    const rawVal = paymentInput[invoiceId];
    if (!rawVal) return;
    try {
      const amountMinor = Math.round(parseFloat(rawVal) * 100);
      await api.createPayment(invoiceId, amountMinor, userId);
      setPaymentInput((prev) => ({ ...prev, [invoiceId]: '' }));
      loadClientData(selectedClientId);
    } catch (err: any) {
      alert(`Payment failed: ${err.message}`);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const searchResults = await api.searchInvoices(searchQuery, userId);
      setInvoices(searchResults);
    } catch (err: any) {
      alert(`Search failed: ${err.message}`);
    }
  };

  const handlePdfStatement = async (invoiceId: string) => {
    try {
      const res = await api.generatePdfUrl(invoiceId, userId);
      window.open(res.downloadUrl, '_blank');
    } catch (err: any) {
      alert(`Statement generation failed: ${err.message}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: { bg: string; color: string } } = {
      paid: { bg: '#22c55e', color: '#ffffff' },
      overdue: { bg: '#ef4444', color: '#ffffff' },
      sent: { bg: '#2563eb', color: '#ffffff' },
      draft: { bg: '#e2e8f0', color: '#111111' },
    };
    const s = styles[status] || styles.draft;
    return (
      <span
        style={{
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '11px',
          fontWeight: 800,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          backgroundColor: s.bg,
          color: s.color,
          border: '2px solid #111111',
        }}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="mustard-bg" style={{ minHeight: '100vh', color: '#111111', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '36px 24px' }}>
      <style>{lineArtStyles}</style>

      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        
        {/* Header without Logo */}
        <header
          className="card-box animate-fade"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px',
            padding: '24px 32px',
            backgroundColor: '#ffffff',
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 900, letterSpacing: '-0.03em', color: '#111111' }}>
              Freelancer Ledger
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '8px 16px', borderRadius: '12px', border: '2px solid #111111' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#111111', textTransform: 'uppercase' }}>ACCOUNT:</span>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              style={{
                background: '#ffffff',
                border: '2px solid #111111',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: 800,
                color: '#2563eb',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="demo-user-1">demo-user-1</option>
              <option value="demo-user-2">demo-user-2</option>
            </select>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '28px' }}>
          
          {/* Left Column: Clients */}
          <aside className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card-box" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: '#111111', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Clients
                </h2>
                <span style={{ fontSize: '12px', fontWeight: 800, background: '#2563eb', color: '#ffffff', padding: '3px 10px', borderRadius: '14px', border: '2px solid #111111' }}>
                  {clients.length}
                </span>
              </div>

              {clients.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 12px', color: '#64748b', fontSize: '13px', border: '2px dashed #111111', borderRadius: '12px', background: '#f8fafc' }}>
                  No clients for {userId}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto' }}>
                  {clients.map((c) => {
                    const isSelected = selectedClientId === c.clientId;
                    return (
                      <button
                        key={c.clientId}
                        onClick={() => setSelectedClientId(c.clientId)}
                        className="btn-mustard"
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '12px 14px',
                          background: isSelected ? '#2563eb' : '#ffffff',
                          color: isSelected ? '#ffffff' : '#111111',
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: '15px' }}>{c.name}</div>
                        <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px', fontWeight: 600 }}>{c.email}</div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Add Client Form */}
              <form onSubmit={handleCreateClient} style={{ marginTop: '20px', paddingTop: '18px', borderTop: '2.5px solid #111111' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#111111', marginBottom: '12px', textTransform: 'uppercase' }}>Add Client</div>
                <input
                  type="text"
                  placeholder="Client Name"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="input-mustard"
                  style={{ width: '100%', marginBottom: '10px', boxSizing: 'border-box' }}
                  required
                />
                <input
                  type="email"
                  placeholder="Client Email"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  className="input-mustard"
                  style={{ width: '100%', marginBottom: '14px', boxSizing: 'border-box' }}
                  required
                />
                <button
                  type="submit"
                  className="btn-mustard"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#111111',
                    color: '#ffffff',
                    fontSize: '13px',
                  }}
                >
                  + ADD CLIENT
                </button>
              </form>
            </div>
          </aside>

          {/* Right Column: Metrics, Forms & Invoices */}
          <main className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {selectedClientId && ledger ? (
              <>
                {/* Financial Ledger Metric Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                  <div className="card-box" style={{ padding: '18px', backgroundColor: '#ffffff', borderTop: '6px solid #111111' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>INVOICED</div>
                    <div style={{ fontSize: '22px', fontWeight: 900, color: '#111111', marginTop: '4px' }}>{formatCurrency(ledger.totalInvoiced)}</div>
                  </div>
                  <div className="card-box" style={{ padding: '18px', backgroundColor: '#ffffff', borderTop: '6px solid #22c55e' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#15803d', textTransform: 'uppercase' }}>PAID</div>
                    <div style={{ fontSize: '22px', fontWeight: 900, color: '#15803d', marginTop: '4px' }}>{formatCurrency(ledger.totalPaid)}</div>
                  </div>
                  <div className="card-box" style={{ padding: '18px', backgroundColor: '#ffffff', borderTop: '6px solid #2563eb' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase' }}>OUTSTANDING</div>
                    <div style={{ fontSize: '22px', fontWeight: 900, color: '#1d4ed8', marginTop: '4px' }}>{formatCurrency(ledger.totalOutstanding)}</div>
                  </div>
                  <div className="card-box" style={{ padding: '18px', backgroundColor: '#ffffff', borderTop: '6px solid #ef4444' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#b91c1c', textTransform: 'uppercase' }}>OVERDUE</div>
                    <div style={{ fontSize: '22px', fontWeight: 900, color: '#b91c1c', marginTop: '4px' }}>{formatCurrency(ledger.totalOverdue)}</div>
                  </div>
                </div>

                {/* OpenSearch Bar */}
                <form onSubmit={handleSearch} className="card-box" style={{ display: 'flex', gap: '10px', padding: '12px' }}>
                  <input
                    type="text"
                    placeholder="Search invoices via OpenSearch..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-mustard"
                    style={{ flex: 1, border: 'none' }}
                  />
                  <button type="submit" className="btn-mustard" style={{ padding: '10px 20px', background: '#2563eb', color: '#ffffff' }}>
                    SEARCH
                  </button>
                  <button type="button" onClick={() => loadClientData(selectedClientId)} className="btn-mustard" style={{ padding: '10px 16px', background: '#f1f5f9', color: '#111111' }}>
                    RESET
                  </button>
                </form>

                {/* Create Invoice Card */}
                <div className="card-box" style={{ padding: '24px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 900, color: '#111111', textTransform: 'uppercase' }}>Create New Invoice</h3>
                  <form onSubmit={handleCreateInvoice} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 150px auto', gap: '14px', alignItems: 'end' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#111111', textTransform: 'uppercase', marginBottom: '6px' }}>Amount ($)</label>
                      <input type="number" step="0.01" placeholder="250.00" value={invAmount} onChange={(e) => setInvAmount(e.target.value)} className="input-mustard" style={{ width: '100%', boxSizing: 'border-box' }} required />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#111111', textTransform: 'uppercase', marginBottom: '6px' }}>Description</label>
                      <input type="text" placeholder="Design & Development" value={invDesc} onChange={(e) => setInvDesc(e.target.value)} className="input-mustard" style={{ width: '100%', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#111111', textTransform: 'uppercase', marginBottom: '6px' }}>Due Date</label>
                      <input type="date" value={invDueDate} onChange={(e) => setInvDueDate(e.target.value)} className="input-mustard" style={{ width: '100%', boxSizing: 'border-box' }} />
                    </div>
                    <button type="submit" className="btn-mustard" style={{ padding: '12px 22px', background: '#22c55e', color: '#ffffff', fontSize: '13px' }}>
                      CREATE
                    </button>
                  </form>
                </div>

                {/* Invoices List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#111111', textTransform: 'uppercase' }}>Invoices ({invoices.length})</div>
                  {invoices.length === 0 ? (
                    <div className="card-box" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                      No invoices created for this client yet.
                    </div>
                  ) : (
                    invoices.map((inv) => (
                      <div
                        key={inv.invoiceId}
                        className="card-box"
                        style={{
                          padding: '20px 24px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '14px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ fontWeight: 800, fontSize: '18px', color: '#111111' }}>{inv.description || 'Invoice'}</span>
                              {getStatusBadge(inv.status)}
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginTop: '6px' }}>
                              Due: {inv.dueDate || 'N/A'} • Created: {new Date(inv.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div style={{ fontSize: '22px', fontWeight: 900, color: '#111111' }}>
                            {formatCurrency(inv.amountMinor)}
                          </div>
                        </div>

                        {/* Payment & Statement Toolbar */}
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', paddingTop: '14px', borderTop: '2px solid #f1f5f9' }}>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Amount ($)"
                            value={paymentInput[inv.invoiceId] || ''}
                            onChange={(e) => setPaymentInput({ ...paymentInput, [inv.invoiceId]: e.target.value })}
                            className="input-mustard"
                            style={{ width: '130px', padding: '8px 12px', fontSize: '13px' }}
                          />
                          <button
                            onClick={() => handleRecordPayment(inv.invoiceId)}
                            className="btn-mustard"
                            style={{ padding: '8px 16px', background: '#2563eb', color: '#ffffff', fontSize: '12px' }}
                          >
                            RECORD PAYMENT
                          </button>
                          <button
                            onClick={() => handlePdfStatement(inv.invoiceId)}
                            className="btn-mustard"
                            style={{ padding: '8px 16px', background: '#ffffff', color: '#111111', fontSize: '12px', marginLeft: 'auto' }}
                          >
                            📄 STATEMENT (S3)
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="card-box" style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <LineArtFreelancer />
                <div>
                  <div style={{ fontWeight: 900, fontSize: '20px', color: '#111111', textTransform: 'uppercase' }}>Select or Add a Client</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginTop: '6px', maxWidth: '420px' }}>
                    Choose a client from the sidebar to track invoices, calculate balances, and download pre-signed statements!
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}