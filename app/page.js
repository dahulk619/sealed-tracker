'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { PlusCircle, RefreshCw, TrendingUp, DollarSign, Package, ExternalLink } from 'lucide-react';

// Connect securely to your Supabase project layout
const supabaseUrl = "https://rifbdmmktwacmfehodgk.supabase.co";
// NOTE: For front-end safety in Next.js public builds, use your standard public 'anon' key here if you experience issues.
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpZmJkbW1rdHdhY21mZWhvZGdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzAxODkzNiwiZXhwIjoyMDk4NTk0OTM2fQ.DgIBhokWlUm3goZoxTc_gtCkNJz3euxKvG7og1I0crY"; 
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Dashboard() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [qty, setQty] = useState('');
  const [cost, setCost] = useState('');

  // Fetch Inventory
  async function fetchInventory() {
    setLoading(true);
    const { data, error } = await supabase.from('sealed_inventory').select('*').order('created_at', { ascending: false });
    if (!error && data) setInventory(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchInventory();
  }, []);

  // Sync Live Prices from your Vercel Scraper route
  async function handleSync() {
    setSyncing(true);
    try {
      await fetch('/api/scrape-sync');
      await fetchInventory();
    } catch (e) {
      console.error(e);
    }
    setSyncing(false);
  }

  // Add New Item Form Handler
  async function handleAddItem(e) {
    e.preventDefault();
    if (!name || !url || !qty || !cost) return alert('Please fill in all boxes!');

    const { error } = await supabase.from('sealed_inventory').insert([
      {
        product_name: name,
        tcgplayer_url: url,
        quantity: parseInt(qty),
        cost_basis: parseFloat(cost),
        current_market_price: parseFloat(cost) // start it off at cost
      }
    ]);

    if (error) {
      alert(error.message);
    } else {
      setName(''); setUrl(''); setQty(''); setCost('');
      fetchInventory();
    }
  }

  // Calculations
  const totalCost = inventory.reduce((sum, item) => sum + (item.cost_basis * item.quantity), 0);
  const totalValue = inventory.reduce((sum, item) => sum + ((item.current_market_price || item.cost_basis) * item.quantity), 0);
  const totalProfit = totalValue - totalCost;
  const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'sans-serif', padding: '2rem' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#38bdf8' }}>El PoKe pLuG</h1>
          <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0' }}>Sealed Product Portfolio Tracker</p>
        </div>
        <button 
          onClick={handleSync}
          disabled={syncing}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#0284c7', color: 'white', border: 'none', padding: '0.75rem 1.2rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}
        >
          <RefreshCw className={syncing ? 'animate-spin' : ''} size={18} />
          {syncing ? 'Scraping TCGplayer...' : 'Sync Live Prices'}
        </button>
      </div>

      {/* STAT CARDS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '0.5rem' }}>Portfolio Value <DollarSign size={20} color="#38bdf8" /></div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>${totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
        </div>
        <div style={{ backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '0.5rem' }}>Net Profit/Loss <TrendingUp size={20} color={totalProfit >= 0 ? "#10b981" : "#ef4444"} /></div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: totalProfit >= 0 ? '#10b981' : '#ef4444' }}>
            {totalProfit >= 0 ? '+' : ''}${totalProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </div>
        </div>
        <div style={{ backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '0.5rem' }}>Total Cases/Boxes <Package size={20} color="#eab308" /></div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{totalItems} items</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        
        {/* ADD NEW PRODUCT GUI FORM */}
        <div style={{ backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #334155', height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.25rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PlusCircle size={20} /> Add New Inventory
          </h2>
          <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', color: '#94a3b8', fontSize: '0.875rem' }}>Product Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Twilight Masquerade ETB Case" style={{ width: '100%', padding: '0.6rem', borderRadius: '0.375rem', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', color: '#94a3b8', fontSize: '0.875rem' }}>TCGplayer Product URL</label>
              <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://www.tcgplayer.com/product/..." style={{ width: '100%', padding: '0.6rem', borderRadius: '0.375rem', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: '#94a3b8', fontSize: '0.875rem' }}>Quantity</label>
                <input type="number" value={qty} onChange={e => setQty(e.target.value)} placeholder="2" style={{ width: '100%', padding: '0.6rem', borderRadius: '0.375rem', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: '#94a3b8', fontSize: '0.875rem' }}>Total Cost Basis ($)</label>
                <input type="number" step="0.01" value={cost} onChange={e => setCost(e.target.value)} placeholder="1048.05" style={{ width: '100%', padding: '0.6rem', borderRadius: '0.375rem', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', boxSizing: 'border-box' }} />
              </div>
            </div>
            <button type="submit" style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '0.375rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.5rem' }}>
              Save to Database
            </button>
          </form>
        </div>

        {/* INVENTORY VIEWER TABLE */}
        <div style={{ backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #334155', overflowX: 'auto' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.25rem', color: '#38bdf8' }}>Vault Records</h2>
          {loading ? (
            <p style={{ color: '#94a3b8' }}>Loading vault data...</p>
          ) : inventory.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No products registered in the vault yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: '0.875rem' }}>
                  <th style={{ paddingBottom: '0.75rem' }}>Item</th>
                  <th style={{ paddingBottom: '0.75rem' }}>Qty</th>
                  <th style={{ paddingBottom: '0.75rem' }}>Cost Basis</th>
                  <th style={{ paddingBottom: '0.75rem' }}>Live Market Price</th>
                  <th style={{ paddingBottom: '0.75rem' }}>Total Value</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => {
                  const currentPrice = item.current_market_price || item.cost_basis;
                  const itemTotalValue = currentPrice * item.quantity;
                  const itemTotalCost = item.cost_basis * item.quantity;
                  const itemProfit = itemTotalValue - itemTotalCost;

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #1e293b', fontSize: '0.95rem' }}>
                      <td style={{ padding: '0.75rem 0', fontWeight: '500' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span>{item.product_name}</span>
                          <a href={item.tcgplayer_url} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none', marginTop: '0.2rem' }}>
                            TCGplayer Page <ExternalLink size={10} />
                          </a>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 0' }}>{item.quantity}</td>
                      <td style={{ padding: '0.75rem 0', color: '#94a3b8' }}>${item.cost_basis.toFixed(2)}</td>
                      <td style={{ padding: '0.75rem 0', color: '#eab308', fontWeight: 'bold' }}>${currentPrice.toFixed(2)}</td>
                      <td style={{ padding: '0.75rem 0' }}>
                        <div style={{ fontWeight: 'bold' }}>${itemTotalValue.toFixed(2)}</div>
                        <div style={{ fontSize: '0.75rem', color: itemProfit >= 0 ? '#10b981' : '#ef4444' }}>
                          {itemProfit >= 0 ? '▲ +' : '▼ '}${itemProfit.toFixed(2)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
