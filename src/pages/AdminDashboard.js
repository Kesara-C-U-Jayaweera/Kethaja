import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase/config';
import {
  collection, onSnapshot, doc, updateDoc, deleteDoc,
  addDoc, query, orderBy, serverTimestamp
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const WA = '94763027060';
const FINANCE_PIN = '1981';

/* ══════════════════════════════════════════
   PROFESSIONAL PDF QUOTATION GENERATOR
   A4 Portrait — supports 20+ parts cleanly
══════════════════════════════════════════ */
function generateQuotePDF(order) {
  const items = order.items || [];
  const subtotal = items.reduce((s, i) => s + (parseFloat(i.qty) || 0) * (parseFloat(i.rate) || 0), 0);
  const delivery = parseFloat(order.deliveryCharge) || 0;
  const total = subtotal + delivery;
  const advance = parseFloat(order.advanceAmount) || 0;
  const balance = total - advance;

  const rows = items.map((item, idx) => `
    <tr style="background:${idx % 2 === 0 ? '#fff' : '#fafaf8'}">
      <td style="padding:7px 10px;border-bottom:1px solid #f0f0ee;font-size:11px;color:#444;text-align:center">${idx + 1}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f0f0ee;font-size:11px;color:#111;font-weight:500">${item.desc || '—'}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f0f0ee;font-size:11px;color:#555;text-align:center">${item.partNo || '—'}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f0f0ee;font-size:11px;color:#555;text-align:center">${item.brand || '—'}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f0f0ee;font-size:11px;color:#555;text-align:center">${item.condition || 'New'}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f0f0ee;font-size:11px;color:#555;text-align:center">${item.qty || 0}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f0f0ee;font-size:11px;color:#555;text-align:center">${item.unit || 'Pcs'}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f0f0ee;font-size:11px;color:#555;text-align:right">Rs.${parseFloat(item.rate || 0).toLocaleString()}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f0f0ee;font-size:11px;font-weight:700;color:#111;text-align:right">Rs.${((parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0)).toLocaleString()}</td>
    </tr>`).join('');

  const paymentHTML = order.paymentTerms ? `
    <div style="background:#f8f8f6;border:1px solid #e8e8e4;border-radius:3px;padding:10px 14px;margin-bottom:16px;font-size:11px;color:#555">
      <strong style="color:#111;font-size:10px;text-transform:uppercase;letter-spacing:1px">Payment Terms:</strong>
      &nbsp; ${order.paymentTerms}
    </div>` : '';

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Quotation ${order.quoteNumber}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: A4 portrait; margin: 15mm 15mm 18mm 15mm; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; background: #fff; font-size: 12px; }
  .page { max-width: 780px; margin: 0 auto; }

  /* HEADER */
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 3px solid #c9a84c; margin-bottom: 20px; }
  .biz-name { font-size: 24px; font-weight: 900; letter-spacing: 2px; color: #111; text-transform: uppercase; line-height: 1; margin-bottom: 4px; }
  .biz-tag { font-size: 10px; color: #c9a84c; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; }
  .biz-info { font-size: 11px; color: #666; line-height: 1.7; }
  .logo-box { background: #111; padding: 10px 18px; border-radius: 3px; margin-bottom: 8px; text-align: center; }
  .logo-text { font-size: 16px; font-weight: 900; letter-spacing: 4px; color: #c9a84c; }
  .q-label { background: #c9a84c; color: #000; font-size: 10px; font-weight: 700; padding: 4px 14px; border-radius: 2px; letter-spacing: 2px; text-align: center; display: block; }

  /* META GRID */
  .meta { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; border: 1px solid #e8e8e4; border-radius: 3px; overflow: hidden; margin-bottom: 14px; }
  .mc { padding: 9px 12px; background: #f8f8f6; border-right: 1px solid #e8e8e4; }
  .mc:last-child { border-right: none; }
  .ml { font-size: 8px; font-weight: 700; color: #aaa; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 3px; }
  .mv { font-size: 12px; font-weight: 700; color: #111; }

  /* VEHICLE BAR */
  .vbar { background: #c9a84c; padding: 10px 14px; border-radius: 3px; display: flex; gap: 32px; margin-bottom: 16px; }
  .vl { font-size: 8px; font-weight: 700; color: rgba(0,0,0,0.55); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px; }
  .vv { font-size: 12px; font-weight: 700; color: #000; }

  /* PARTS TABLE */
  .table-wrap { border: 1px solid #e8e8e4; border-radius: 3px; overflow: hidden; margin-bottom: 14px; }
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: #111; }
  thead th { padding: 9px 10px; color: #fff; font-size: 9px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
  thead th.r { text-align: right; }
  thead th.c { text-align: center; }

  /* TOTALS */
  .totals { display: flex; justify-content: flex-end; margin-bottom: 14px; }
  .totals-box { width: 280px; border: 1px solid #e8e8e4; border-radius: 3px; overflow: hidden; }
  .tot-row { display: flex; justify-content: space-between; padding: 7px 12px; font-size: 11px; border-bottom: 1px solid #f0f0ee; }
  .tot-row:last-child { border: none; }
  .tot-row.grand { background: #111; padding: 10px 12px; }
  .tot-row.grand span { color: #fff; font-size: 13px; font-weight: 700; }
  .tot-row.grand span:last-child { color: #c9a84c; font-size: 15px; }
  .tot-row.adv { background: #fdf9f0; }
  .tot-row.bal { background: #fceaea; }
  .tot-row.bal span { color: #b02a2a; font-weight: 700; }

  /* TERMS */
  .terms-title { font-size: 9px; font-weight: 700; color: #aaa; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px; }
  .terms-text { font-size: 10px; color: #888; line-height: 1.7; }

  /* SIGNATURES */
  .sigs { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 40px; padding-top: 14px; border-top: 1px solid #e8e8e4; }
  .sig-line { height: 1px; background: #333; margin-bottom: 6px; }
  .sig-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; text-align: center; color: #333; }
  .sig-sub { font-size: 9px; color: #aaa; text-align: center; margin-top: 2px; }

  /* FOOTER */
  .page-footer { text-align: center; margin-top: 20px; padding-top: 12px; border-top: 1px solid #f0f0ee; font-size: 9px; color: #bbb; letter-spacing: 1px; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { max-width: 100%; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div>
      <div class="biz-name">KETHAJA Enterprises</div>
      <div class="biz-tag">Import Deals in Motor Spare Parts</div>
      <div class="biz-info">
        190/3/B, Deepthika Mawatha, Eluwilla, Panadura, Sri Lanka<br>
        Tel: 0763027060 &nbsp;·&nbsp; Islandwide Delivery Available
      </div>
    </div>
    <div style="text-align:right">
      <div class="logo-box"><span class="logo-text">KETHAJA</span></div>
      <div class="q-label">QUOTATION</div>
    </div>
  </div>

  <!-- META -->
  <div class="meta">
    <div class="mc"><div class="ml">Quote Number</div><div class="mv">${order.quoteNumber}</div></div>
    <div class="mc"><div class="ml">Date</div><div class="mv">${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div></div>
    <div class="mc"><div class="ml">M/s (Customer)</div><div class="mv">${order.clientName || '—'}</div></div>
    <div class="mc"><div class="ml">Contact</div><div class="mv">${order.clientPhone || '—'}</div></div>
  </div>

  <!-- VEHICLE BAR -->
  <div class="vbar">
    <div><div class="vl">Vehicle No</div><div class="vv">${order.vehicleNo || '—'}</div></div>
    <div><div class="vl">Model</div><div class="vv">${order.model || '—'}</div></div>
    <div><div class="vl">Make</div><div class="vv">${order.make || '—'}</div></div>
    ${order.validUntil ? `<div><div class="vl">Valid Until</div><div class="vv">${order.validUntil}</div></div>` : ''}
  </div>

  <!-- PAYMENT TERMS -->
  ${paymentHTML}

  <!-- PARTS TABLE -->
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th style="width:4%;text-align:center">#</th>
          <th style="width:24%;text-align:left">Description</th>
          <th style="width:10%" class="c">Part No.</th>
          <th style="width:10%" class="c">Brand</th>
          <th style="width:10%" class="c">Condition</th>
          <th style="width:6%" class="c">Qty</th>
          <th style="width:6%" class="c">Unit</th>
          <th style="width:12%" class="r">Rate (Rs.)</th>
          <th style="width:14%" class="r">Amount (Rs.)</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>

  <!-- TOTALS -->
  <div class="totals">
    <div class="totals-box">
      ${delivery > 0 ? `
      <div class="tot-row"><span style="color:#666">Subtotal</span><span style="font-weight:600">Rs. ${subtotal.toLocaleString()}</span></div>
      <div class="tot-row"><span style="color:#666">Delivery Charge</span><span style="font-weight:600">Rs. ${delivery.toLocaleString()}</span></div>` : ''}
      <div class="tot-row grand"><span>Total Amount</span><span>Rs. ${total.toLocaleString()}</span></div>
      ${advance > 0 ? `<div class="tot-row adv"><span style="color:#7a5500">Advance Paid</span><span style="color:#7a5500;font-weight:700">Rs. ${advance.toLocaleString()}</span></div>` : ''}
      ${advance > 0 ? `<div class="tot-row bal"><span>Balance Due</span><span>Rs. ${balance.toLocaleString()}</span></div>` : ''}
    </div>
  </div>

  <!-- TERMS -->
  <div style="margin-bottom:24px">
    <div class="terms-title">Terms &amp; Conditions</div>
    <div class="terms-text">All prices are subject to change without prior notice. Delivery charges may apply based on location. This quotation is valid for the specified period only. KETHAJA Enterprises reserves the right to cancel or modify this quotation at any time. All parts are subject to availability.</div>
  </div>

  <!-- SIGNATURES -->
  <div class="sigs">
    <div>
      <div class="sig-line"></div>
      <div class="sig-lbl">Authorized Signature</div>
      <div class="sig-sub">Charitha Jayaweera · KETHAJA Enterprises</div>
    </div>
    <div>
      <div class="sig-line"></div>
      <div class="sig-lbl">Customer Signature</div>
      <div class="sig-sub">M/s: ${order.clientName || '___________________'}</div>
    </div>
  </div>

  <div class="page-footer">KETHAJA Enterprises &nbsp;·&nbsp; 0763027060 &nbsp;·&nbsp; Islandwide Delivery &nbsp;·&nbsp; Sri Lanka</div>
</div>
</body>
</html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 700);
}

/* ══════════════════════════════════════════
   MONTHLY PDF REPORT
══════════════════════════════════════════ */
function generateMonthlyPDF(month, monthOrders, monthRequests) {
  const totalRev = monthOrders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + (o.total || 0), 0);
  const totalProfit = monthRequests.filter(r => r.status === 'done' && r.sell && r.buy).reduce((s, r) => s + (r.sell - r.buy), 0);
  const outstanding = monthOrders.filter(o => o.paymentStatus !== 'paid').reduce((s, o) => s + (o.total || 0) - (o.advanceAmount || 0), 0);
  const rows = monthOrders.map(o => `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #f0f0ee;font-size:11px;color:#c9a84c;font-weight:700">${o.quoteNumber}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f0f0ee;font-size:11px">${o.clientName}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f0f0ee;font-size:11px;text-align:center">${o.items?.length || 0}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f0f0ee;font-size:11px;text-align:right;font-weight:700">Rs.${(o.total || 0).toLocaleString()}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f0f0ee;font-size:11px;text-align:center">
        <span style="padding:2px 8px;border-radius:2px;font-size:9px;font-weight:700;letter-spacing:1px;background:${o.paymentStatus === 'paid' ? '#e8f5ee' : o.paymentStatus === 'partial' ? '#fdf6e3' : '#fceaea'};color:${o.paymentStatus === 'paid' ? '#1a5c36' : o.paymentStatus === 'partial' ? '#7a5500' : '#7a1a1a'}">${(o.paymentStatus || 'UNPAID').toUpperCase()}</span>
      </td>
      <td style="padding:8px 10px;border-bottom:1px solid #f0f0ee;font-size:11px;text-align:center">
        <span style="padding:2px 8px;border-radius:2px;font-size:9px;font-weight:700;background:#f5f5f3;color:#555">${(o.deliveryStatus || 'pending').toUpperCase()}</span>
      </td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Monthly Report ${month}</title>
  <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;color:#111}
  .page{max-width:780px;margin:0 auto;padding:40px}
  .header{background:#111;padding:20px 24px;border-radius:4px;margin-bottom:28px;display:flex;justify-content:space-between;align-items:center}
  .h-title{font-size:20px;font-weight:900;letter-spacing:3px;color:#fff}
  .h-sub{font-size:10px;color:#666;margin-top:3px}
  .month-badge{background:#c9a84c;color:#000;font-size:14px;font-weight:700;padding:8px 20px;border-radius:2px;letter-spacing:1px}
  .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:24px}
  .stat{background:#f8f8f6;border:1px solid #e8e8e4;border-radius:3px;padding:14px}
  .sn{font-size:20px;font-weight:700;color:#111}
  .sl{font-size:9px;color:#999;text-transform:uppercase;letter-spacing:1.5px;margin-top:3px}
  table{width:100%;border-collapse:collapse}
  th{background:#111;color:#fff;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:10px;text-align:left}
  .footer{text-align:center;font-size:9px;color:#bbb;margin-top:24px;padding-top:14px;border-top:1px solid #e8e8e4;letter-spacing:1px}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head>
  <body><div class="page">
  <div class="header">
    <div><div class="h-title">KETHAJA Enterprises</div><div class="h-sub">Monthly Business Report &nbsp;·&nbsp; Confidential</div></div>
    <div class="month-badge">${month}</div>
  </div>
  <div class="stats">
    <div class="stat"><div class="sn">${monthOrders.length}</div><div class="sl">Total Orders</div></div>
    <div class="stat"><div class="sn" style="color:#c9a84c">Rs.${Math.round(totalRev / 1000)}k</div><div class="sl">Revenue Collected</div></div>
    <div class="stat"><div class="sn" style="color:#1a7a45">Rs.${Math.round(totalProfit / 1000)}k</div><div class="sl">Profit</div></div>
    <div class="stat"><div class="sn" style="color:#b02a2a">Rs.${Math.round(outstanding / 1000)}k</div><div class="sl">Outstanding</div></div>
  </div>
  <table><thead><tr>
    <th>Quote No</th><th>Client</th>
    <th style="text-align:center">Parts</th>
    <th style="text-align:right">Total</th>
    <th style="text-align:center">Payment</th>
    <th style="text-align:center">Delivery</th>
  </tr></thead><tbody>${rows}</tbody></table>
  <div style="display:flex;justify-content:flex-end;margin-top:12px">
    <div style="background:#111;padding:10px 20px;border-radius:3px;display:flex;gap:40px">
      <div><div style="font-size:9px;color:#666;text-transform:uppercase;letter-spacing:1px">Month Total</div><div style="font-size:16px;font-weight:700;color:#c9a84c">Rs.${monthOrders.reduce((s, o) => s + (o.total || 0), 0).toLocaleString()}</div></div>
      <div><div style="font-size:9px;color:#666;text-transform:uppercase;letter-spacing:1px">Collected</div><div style="font-size:16px;font-weight:700;color:#fff">Rs.${totalRev.toLocaleString()}</div></div>
    </div>
  </div>
  <div class="footer">KETHAJA Enterprises &nbsp;·&nbsp; Generated ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} &nbsp;·&nbsp; Confidential</div>
  </div></body></html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 700);
}

/* ══════════════════════════════════════════
   WHATSAPP QUOTE
══════════════════════════════════════════ */
function sendWhatsAppQuote(order) {
  const subtotal = order.items?.reduce((s, i) => s + (parseFloat(i.qty) || 0) * (parseFloat(i.rate) || 0), 0) || 0;
  const delivery = parseFloat(order.deliveryCharge) || 0;
  const total = subtotal + delivery;
  const advance = parseFloat(order.advanceAmount) || 0;
  const lines = order.items?.map((i, idx) =>
    `  ${idx + 1}. ${i.desc}${i.brand ? ` (${i.brand})` : ''} ×${i.qty} — Rs.${((parseFloat(i.qty) || 0) * (parseFloat(i.rate) || 0)).toLocaleString()}`
  ).join('\n') || '';
  const msg = `*KETHAJA Enterprises*\n*Quotation ${order.quoteNumber}*\n\nDear ${order.clientName},\n\n🚗 *Vehicle:* ${[order.make, order.model, order.vehicleNo].filter(Boolean).join(' | ') || '—'}\n\n*Parts Quoted:*\n${lines}${delivery > 0 ? `\n\n🚚 Delivery: Rs.${delivery.toLocaleString()}` : ''}\n\n*━━━━━━━━━━━━━━━━*\n*TOTAL: Rs.${total.toLocaleString()}*${advance > 0 ? `\n💰 Advance: Rs.${advance.toLocaleString()}\n⚠️ Balance: Rs.${(total - advance).toLocaleString()}` : ''}${order.paymentTerms ? `\n\n💳 ${order.paymentTerms}` : ''}${order.validUntil ? `\n⏳ Valid until: ${order.validUntil}` : ''}\n\n📞 KETHAJA: +94 76 302 7060\n_Thank you for choosing KETHAJA Enterprises!_`;
  const p = order.clientPhone?.replace(/\D/g, '') || '';
  const fp = p.startsWith('0') ? '94' + p.slice(1) : p;
  window.open(`https://wa.me/${fp}?text=${encodeURIComponent(msg)}`, '_blank');
}

/* ══════════════════════════════════════════
   NEW ORDER MODAL — 3 STEP WIZARD
══════════════════════════════════════════ */
const PAYMENT_PRESETS = [
  'Cash on Delivery',
  'Bank Transfer — Full payment before delivery',
  '50% Advance required before sourcing',
  '30% Advance, 70% on delivery',
  'Full payment on delivery',
];

function NewOrderModal({ onClose, onSave, quoteCount }) {
  const [step, setStep] = useState(1);
  const [client, setClient] = useState({ name: '', phone: '', vehicleNo: '', make: '', model: '' });
  const [items, setItems] = useState([{ desc: '', partNo: '', brand: '', condition: 'New', qty: '1', unit: 'Pcs', rate: '', supplier: '' }]);
  const [delivery, setDelivery] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [advance, setAdvance] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [customPayment, setCustomPayment] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const subtotal = items.reduce((s, i) => s + (parseFloat(i.qty) || 0) * (parseFloat(i.rate) || 0), 0);
  const total = subtotal + (parseFloat(delivery) || 0);
  const quoteNumber = `QT-${String(quoteCount + 1).padStart(3, '0')}`;
  const finalPayment = paymentTerms === '__custom__' ? customPayment : paymentTerms;

  const addItem = () => setItems([...items, { desc: '', partNo: '', brand: '', condition: 'New', qty: '1', unit: 'Pcs', rate: '', supplier: '' }]);
  const removeItem = i => { if (items.length === 1) return; setItems(items.filter((_, idx) => idx !== i)); };
  const updItem = (i, f, v) => { const u = [...items]; u[i][f] = v; setItems(u); };

  const handleSave = async () => {
    if (!client.name || !client.phone) { alert('Client name and phone required.'); return; }
    if (items.some(i => !i.desc || !i.rate)) { alert('Please fill in all item descriptions and rates.'); return; }
    setSaving(true);
    await onSave({
      quoteNumber, clientName: client.name, clientPhone: client.phone,
      vehicleNo: client.vehicleNo, make: client.make, model: client.model,
      items, deliveryCharge: parseFloat(delivery) || 0,
      validUntil, advanceAmount: parseFloat(advance) || 0,
      paymentTerms: finalPayment, notes, subtotal, total,
      status: 'draft', paymentStatus: 'unpaid', deliveryStatus: 'pending',
      type: 'order', createdAt: serverTimestamp(), seenByAdmin: true,
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">New Order / Quotation</div>
            <div style={{ fontSize: '10px', color: '#999', marginTop: '2px', letterSpacing: '1px' }}>
              Quote No: <strong style={{ color: '#c9a84c' }}>{quoteNumber}</strong>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="step-bar">
          {['Client & Vehicle', 'Parts List', 'Payment & Quote'].map((s, i) => (
            <div key={i} className={`step-pill ${step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''}`}
              onClick={() => step > i + 1 && setStep(i + 1)}>
              <span className="step-pill-num">{step > i + 1 ? '✓' : i + 1}</span>
              <span className="step-pill-label">{s}</span>
            </div>
          ))}
        </div>

        <div className="modal-body">
          {/* STEP 1 — CLIENT */}
          {step === 1 && (
            <div>
              <div className="modal-sec">Client Information</div>
              <div className="mrow">
                <div className="mfield"><label>Customer Name *</label><input value={client.name} onChange={e => setClient({ ...client, name: e.target.value })} placeholder="Kamal Perera" /></div>
                <div className="mfield"><label>Phone Number *</label><input value={client.phone} onChange={e => setClient({ ...client, phone: e.target.value })} placeholder="07X XXX XXXX" /></div>
              </div>
              <div className="modal-sec">Vehicle Details</div>
              <div className="mrow">
                <div className="mfield"><label>Vehicle No</label><input value={client.vehicleNo} onChange={e => setClient({ ...client, vehicleNo: e.target.value })} placeholder="ABC-1234" /></div>
                <div className="mfield"><label>Make</label><input value={client.make} onChange={e => setClient({ ...client, make: e.target.value })} placeholder="Toyota" /></div>
              </div>
              <div className="mfield"><label>Model</label><input value={client.model} onChange={e => setClient({ ...client, model: e.target.value })} placeholder="Corolla" /></div>
              <button className="step-next-btn" onClick={() => { if (!client.name || !client.phone) { alert('Name and phone required.'); return; } setStep(2); }}>
                Next: Add Parts →
              </button>
            </div>
          )}

          {/* STEP 2 — PARTS */}
          {step === 2 && (
            <div>
              <div className="modal-sec">Parts List — {items.length} item{items.length !== 1 ? 's' : ''}</div>
              <div className="parts-scroll-wrap">
                <div className="items-table-head">
                  <span style={{ flex: 2, minWidth: '120px' }}>Description *</span>
                  <span style={{ width: '85px' }}>Part No.</span>
                  <span style={{ width: '80px' }}>Brand</span>
                  <span style={{ width: '90px' }}>Condition</span>
                  <span style={{ width: '50px', textAlign: 'center' }}>Qty</span>
                  <span style={{ width: '60px' }}>Unit</span>
                  <span style={{ width: '90px', textAlign: 'right' }}>Rate *</span>
                  <span style={{ width: '90px', textAlign: 'right' }}>Amount</span>
                  <span style={{ width: '90px' }}>Supplier</span>
                  <span style={{ width: '32px' }}></span>
                </div>
                {items.map((item, i) => (
                  <div className="item-row" key={i}>
                    <input style={{ flex: 2, minWidth: '120px' }} value={item.desc} onChange={e => updItem(i, 'desc', e.target.value)} placeholder="Part description" />
                    <input style={{ width: '85px' }} value={item.partNo} onChange={e => updItem(i, 'partNo', e.target.value)} placeholder="OEM No." />
                    <input style={{ width: '80px' }} value={item.brand} onChange={e => updItem(i, 'brand', e.target.value)} placeholder="Brand" />
                    <select style={{ width: '90px' }} value={item.condition} onChange={e => updItem(i, 'condition', e.target.value)}>
                      <option>New</option>
                      <option>Used</option>
                      <option>Reconditioned</option>
                      <option>OEM</option>
                      <option>Aftermarket</option>
                    </select>
                    <input style={{ width: '50px', textAlign: 'center' }} type="number" value={item.qty} onChange={e => updItem(i, 'qty', e.target.value)} min="1" />
                    <select style={{ width: '60px' }} value={item.unit} onChange={e => updItem(i, 'unit', e.target.value)}>
                      <option>Pcs</option>
                      <option>Set</option>
                      <option>Pair</option>
                      <option>Kit</option>
                      <option>Ltr</option>
                    </select>
                    <input style={{ width: '90px', textAlign: 'right' }} type="number" value={item.rate} onChange={e => updItem(i, 'rate', e.target.value)} placeholder="0" />
                    <div style={{ width: '90px', textAlign: 'right', fontSize: '12px', fontWeight: '700', color: '#111', padding: '0 6px', flexShrink: 0 }}>
                      {item.qty && item.rate ? `Rs.${((parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0)).toLocaleString()}` : '—'}
                    </div>
                    <input style={{ width: '90px' }} value={item.supplier} onChange={e => updItem(i, 'supplier', e.target.value)} placeholder="Supplier" />
                    <button className="remove-item-btn" onClick={() => removeItem(i)} disabled={items.length === 1}>×</button>
                  </div>
                ))}
              </div>
              <button className="add-item-btn" onClick={addItem}>+ Add Another Part</button>
              <div className="subtotal-bar">
                <span>{items.length} part{items.length !== 1 ? 's' : ''}</span>
                <span>Subtotal: Rs. {subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button className="step-back-btn" onClick={() => setStep(1)}>← Back</button>
                <button className="step-next-btn" style={{ flex: 1 }} onClick={() => {
                  if (items.some(i => !i.desc || !i.rate)) { alert('Fill all item descriptions and rates.'); return; }
                  setStep(3);
                }}>Next: Payment & Quote →</button>
              </div>
            </div>
          )}

          {/* STEP 3 — PAYMENT */}
          {step === 3 && (
            <div>
              <div className="modal-sec">Payment Terms</div>
              <div className="payment-presets">
                {PAYMENT_PRESETS.map((p, i) => (
                  <button key={i} className={`preset-btn ${paymentTerms === p ? 'active' : ''}`}
                    onClick={() => setPaymentTerms(paymentTerms === p ? '' : p)}>{p}</button>
                ))}
                <button className={`preset-btn ${paymentTerms === '__custom__' ? 'active' : ''}`}
                  onClick={() => setPaymentTerms(paymentTerms === '__custom__' ? '' : '__custom__')}>
                  ✏️ Custom
                </button>
              </div>
              {paymentTerms === '__custom__' && (
                <div className="mfield" style={{ marginTop: '8px' }}>
                  <label>Custom Payment Terms</label>
                  <input value={customPayment} onChange={e => setCustomPayment(e.target.value)} placeholder="e.g. 40% advance, balance on delivery" />
                </div>
              )}

              <div className="modal-sec">Delivery & Validity</div>
              <div className="mrow">
                <div className="mfield"><label>Delivery Charge (Rs.) — 0 if included</label><input type="number" value={delivery} onChange={e => setDelivery(e.target.value)} placeholder="0" /></div>
                <div className="mfield"><label>Advance Amount (Rs.)</label><input type="number" value={advance} onChange={e => setAdvance(e.target.value)} placeholder="0" /></div>
              </div>
              <div className="mrow">
                <div className="mfield"><label>Valid Until</label><input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} /></div>
                <div className="mfield"><label>Internal Notes</label><input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (not on PDF)" /></div>
              </div>

              <div className="quote-summary">
                <div className="qs-row"><span>Subtotal ({items.length} parts)</span><span>Rs. {subtotal.toLocaleString()}</span></div>
                {parseFloat(delivery) > 0 && <div className="qs-row"><span>Delivery</span><span>Rs. {(parseFloat(delivery) || 0).toLocaleString()}</span></div>}
                <div className="qs-row total"><span>Total</span><span>Rs. {total.toLocaleString()}</span></div>
                {parseFloat(advance) > 0 && <>
                  <div className="qs-row" style={{ color: '#888', fontSize: '12px', borderTop: '1px solid #333', paddingTop: '8px', marginTop: '4px' }}><span>Advance Required</span><span>Rs. {(parseFloat(advance) || 0).toLocaleString()}</span></div>
                  <div className="qs-row" style={{ color: '#e05a5a', fontSize: '13px' }}><span>Balance Due</span><span>Rs. {(total - (parseFloat(advance) || 0)).toLocaleString()}</span></div>
                </>}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                <button className="step-back-btn" onClick={() => setStep(2)}>← Back</button>
                <button className="preview-quote-btn" onClick={() => generateQuotePDF({
                  quoteNumber, clientName: client.name, clientPhone: client.phone,
                  vehicleNo: client.vehicleNo, make: client.make, model: client.model,
                  items, deliveryCharge: delivery, validUntil, advanceAmount: advance,
                  paymentTerms: finalPayment, total
                })}>Preview PDF</button>
                <button className="save-quote-btn" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Order'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   CLIENT PROFILE MODAL
══════════════════════════════════════════ */
function ClientProfile({ client, allRequests, allOrders, onClose }) {
  const phone = client.phone || client.clientPhone || '';
  const name = client.name || client.clientName || 'Client';
  const reqs = allRequests.filter(r => r.phone === phone || r.clientPhone === phone);
  const ords = allOrders.filter(o => o.clientPhone === phone);
  const totalSpent = ords.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + (o.total || 0), 0);
  const outstanding = ords.filter(o => o.paymentStatus !== 'paid').reduce((s, o) => s + (o.total || 0) - (o.advanceAmount || 0), 0);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-avatar">{name.charAt(0).toUpperCase()}</div>
          <div><div className="modal-name">{name}</div><div className="modal-phone">{phone}</div></div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-stats">
          <div className="mstat"><div className="mstat-num">{reqs.length + ords.length}</div><div className="mstat-lbl">Orders</div></div>
          <div className="mstat"><div className="mstat-num" style={{ fontSize: '13px', color: '#1a7a45' }}>Rs.{totalSpent.toLocaleString()}</div><div className="mstat-lbl">Total Spent</div></div>
          <div className="mstat"><div className="mstat-num" style={{ fontSize: '13px', color: outstanding > 0 ? '#b02a2a' : '#1a7a45' }}>Rs.{outstanding.toLocaleString()}</div><div className="mstat-lbl">Outstanding</div></div>
        </div>
        <div className="modal-history">
          <div className="modal-sec-label">Full History</div>
          {ords.map(o => (
            <div className="history-item" key={o.id}>
              <div className="history-part">📋 {o.quoteNumber} — {o.items?.length} parts</div>
              <div className="history-vehicle">🚗 {[o.make, o.model, o.vehicleNo].filter(Boolean).join(' ') || '—'}</div>
              <div className="history-meta">
                <span className={`dbadge b-${o.status}`}>{o.status?.toUpperCase()}</span>
                <span className={`dbadge b-${o.paymentStatus === 'paid' ? 'done' : o.paymentStatus === 'partial' ? 'found' : 'new'}`}>{(o.paymentStatus || 'UNPAID').toUpperCase()}</span>
                <span className="history-profit">Rs.{(o.total || 0).toLocaleString()}</span>
              </div>
            </div>
          ))}
          {reqs.map(r => (
            <div className="history-item" key={r.id}>
              <div className="history-part">🔧 {r.part}</div>
              <div className="history-vehicle">🚗 {[r.make, r.model, r.year].filter(Boolean).join(' ') || '—'}</div>
              <div className="history-meta"><span className={`dbadge b-${r.status}`}>{r.status?.toUpperCase()}</span></div>
            </div>
          ))}
          {reqs.length === 0 && ords.length === 0 && <div style={{ color: '#999', fontSize: '12px', padding: '1rem 0' }}>No history yet</div>}
        </div>
        <div className="modal-actions">
          <button className="maction-btn wa" onClick={() => { const p = phone.replace(/\D/g, ''); const fp = p.startsWith('0') ? '94' + p.slice(1) : p; window.open(`https://wa.me/${fp}`, '_blank'); }}>WhatsApp Client</button>
          <button className="maction-btn dark" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   FINANCE PIN
══════════════════════════════════════════ */
function FinancePIN({ onSuccess, onCancel }) {
  const [pin, setPin] = useState('');
  const [err, setErr] = useState(false);
  const check = () => { if (pin === FINANCE_PIN) { onSuccess(); } else { setErr(true); setPin(''); } };
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" style={{ maxWidth: '320px' }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
          <div style={{ fontSize: '36px', marginBottom: '1rem' }}>🔐</div>
          <div style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>Finance Access</div>
          <div style={{ fontSize: '11px', color: '#999', letterSpacing: '1px', marginBottom: '1.5rem' }}>Enter PIN to continue</div>
          <input type="password" maxLength={6} value={pin}
            onChange={e => { setPin(e.target.value); setErr(false); }}
            onKeyDown={e => e.key === 'Enter' && check()}
            style={{ width: '100%', padding: '14px', textAlign: 'center', letterSpacing: '8px', fontSize: '22px', border: `1.5px solid ${err ? '#b02a2a' : '#e8e8e4'}`, borderRadius: '2px', outline: 'none', background: '#f8f8f6', marginBottom: '8px', fontFamily: 'inherit' }}
            placeholder="••••" autoFocus />
          {err && <div style={{ fontSize: '11px', color: '#b02a2a', marginBottom: '10px' }}>Incorrect PIN. Try again.</div>}
          <button className="login-btn" style={{ width: '100%' }} onClick={check}>Unlock Finance</button>
          <span className="login-back" onClick={onCancel} style={{ cursor: 'pointer' }}>← Cancel</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════ */
export default function AdminDashboard() {
  const [requests, setRequests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('overview');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [financeUnlocked, setFinanceUnlocked] = useState(false);
  const [showFinancePIN, setShowFinancePIN] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [newBadge, setNewBadge] = useState(0);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const q1 = query(collection(db, 'requests'), orderBy('createdAt', 'desc'));
    const u1 = onSnapshot(q1, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRequests(data);
      setNewBadge(data.filter(r => r.status === 'new' && !r.seenByAdmin).length);
    });
    const q2 = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const u2 = onSnapshot(q2, snap => setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { u1(); u2(); };
  }, []);

  const handleLogout = async () => { await logout(); navigate('/admin'); };
  const setStatus = async (id, status, col = 'orders') => await updateDoc(doc(db, col, id), { status });
  const setPayment = async (id, ps) => await updateDoc(doc(db, 'orders', id), { paymentStatus: ps });
  const setDeliveryStatus = async (id, ds) => await updateDoc(doc(db, 'orders', id), { deliveryStatus: ds });
  const deleteItem = async (id, col) => { if (!window.confirm('Delete this record?')) return; await deleteDoc(doc(db, col, id)); };
  const updateReqPrice = async (id, field, val) => await updateDoc(doc(db, 'requests', id), { [field]: parseFloat(val) || 0 });
  const markSeen = async (id) => await updateDoc(doc(db, 'requests', id), { seenByAdmin: true });
  const saveOrder = async (data) => await addDoc(collection(db, 'orders'), data);

  /* STATS */
  const now = new Date();
  const thisMonth = now.toISOString().slice(0, 7);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);
  const getMonthOrders = m => orders.filter(o => o.createdAt?.toDate?.()?.toISOString().slice(0, 7) === m);
  const getMonthRequests = m => requests.filter(r => r.createdAt?.toDate?.()?.toISOString().slice(0, 7) === m);
  const thisMonthOrders = getMonthOrders(thisMonth);
  const lastMonthOrders = getMonthOrders(lastMonth);
  const thisMonthRev = thisMonthOrders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + (o.total || 0), 0);
  const lastMonthRev = lastMonthOrders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + (o.total || 0), 0);
  const revChange = lastMonthRev > 0 ? Math.round(((thisMonthRev - lastMonthRev) / lastMonthRev) * 100) : 0;
  const totalProfit = requests.filter(r => r.status === 'done' && r.sell && r.buy).reduce((s, r) => s + (r.sell - r.buy), 0);
  const outstanding = orders.filter(o => o.paymentStatus !== 'paid').reduce((s, o) => s + (o.total || 0) - (o.advanceAmount || 0), 0);
  const convRate = requests.length > 0 ? Math.round((requests.filter(r => r.status === 'done').length / requests.length) * 100) : 0;

  const partCounts = {};
  orders.forEach(o => o.items?.forEach(i => { partCounts[i.desc] = (partCounts[i.desc] || 0) + 1; }));
  const bestParts = Object.entries(partCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const clientMap = {};
  orders.forEach(o => {
    const k = o.clientPhone || o.clientName;
    if (!clientMap[k]) clientMap[k] = { name: o.clientName, phone: o.clientPhone, total: 0, count: 0 };
    clientMap[k].total += (o.total || 0);
    clientMap[k].count += 1;
  });
  const topClients = Object.values(clientMap).sort((a, b) => b.total - a.total).slice(0, 5);
  const allClients = Object.values(clientMap);

  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const m = d.toISOString().slice(0, 7);
    const mo = getMonthOrders(m);
    return { month: d.toLocaleString('default', { month: 'short' }), rev: mo.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + (o.total || 0), 0), count: mo.length };
  });
  const maxRev = Math.max(...chartData.map(d => d.rev), 1);

  const filteredOrders = useMemo(() => {
    let list = orders;
    if (filter !== 'all') list = list.filter(o => o.status === filter || o.paymentStatus === filter || o.deliveryStatus === filter);
    if (search) list = list.filter(o => o.clientName?.toLowerCase().includes(search.toLowerCase()) || o.quoteNumber?.toLowerCase().includes(search.toLowerCase()) || o.clientPhone?.includes(search));
    return list;
  }, [orders, filter, search]);

  const filteredRequests = useMemo(() => {
    let list = requests;
    if (filter !== 'all') list = list.filter(r => r.status === filter);
    if (search) list = list.filter(r => r.name?.toLowerCase().includes(search.toLowerCase()) || r.part?.toLowerCase().includes(search.toLowerCase()) || r.phone?.includes(search));
    return list;
  }, [requests, filter, search]);

  const financeMonthOrders = getMonthOrders(selectedMonth);
  const financeMonthRequests = getMonthRequests(selectedMonth);
  const financeRev = financeMonthOrders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + (o.total || 0), 0);
  const financeProfit = financeMonthRequests.filter(r => r.status === 'done' && r.sell && r.buy).reduce((s, r) => s + (r.sell - r.buy), 0);
  const financeOutstanding = financeMonthOrders.filter(o => o.paymentStatus !== 'paid').reduce((s, o) => s + (o.total || 0) - (o.advanceAmount || 0), 0);
  const financeMargin = financeRev > 0 ? Math.round((financeProfit / financeRev) * 100) : 0;

  return (
    <div className="dashboard">
      {selectedClient && <ClientProfile client={selectedClient} allRequests={requests} allOrders={orders} onClose={() => setSelectedClient(null)} />}
      {showNewOrder && <NewOrderModal onClose={() => setShowNewOrder(false)} onSave={saveOrder} quoteCount={orders.length} />}
      {showFinancePIN && <FinancePIN onSuccess={() => { setFinanceUnlocked(true); setShowFinancePIN(false); setTab('finance'); }} onCancel={() => setShowFinancePIN(false)} />}

      {/* NAV */}
      <div className="dash-nav">
        <div className="dash-nav-left">
          <span className="dash-brand">KETHAJA</span>
          <span className="dash-nav-sub">Business Dashboard</span>
        </div>
        <div className="dash-nav-right">
          {newBadge > 0 && <div className="new-badge">{newBadge} new</div>}
          <button className="dash-exit-btn" onClick={handleLogout}>Sign Out</button>
        </div>
      </div>

      {/* TABS */}
      <div className="dash-tabs">
        {[
          { k: 'overview', label: 'Overview' },
          { k: 'orders', label: `Orders (${orders.length})` },
          { k: 'requests', label: `Requests${newBadge > 0 ? ` · ${newBadge} new` : ''}` },
          { k: 'clients', label: `Clients (${allClients.length})` },
          { k: 'finance', label: '🔐 Finance' },
        ].map(t => (
          <button key={t.k} className={`dash-tab ${tab === t.k ? 'active' : ''}`}
            onClick={() => {
              if (t.k === 'finance' && !financeUnlocked) { setShowFinancePIN(true); return; }
              setTab(t.k); setFilter('all'); setSearch('');
            }}>{t.label}</button>
        ))}
      </div>

      <div className="dash-body">

        {/* ═══ OVERVIEW ═══ */}
        {tab === 'overview' && (
          <div>
            <div className="section-header">
              <div className="section-title-text">Business Overview</div>
              <div style={{ fontSize: '11px', color: '#999' }}>{now.toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
            </div>
            <div className="overview-stats">
              <div className="ov-stat primary">
                <div className="ov-stat-label">This Month's Revenue</div>
                <div className="ov-stat-value">Rs. {thisMonthRev.toLocaleString()}</div>
                <div className={`ov-stat-change ${revChange >= 0 ? 'up' : 'down'}`}>{revChange >= 0 ? '↑' : '↓'} {Math.abs(revChange)}% vs last month</div>
              </div>
              <div className="ov-stat">
                <div className="ov-stat-label">This Month's Orders</div>
                <div className="ov-stat-value">{thisMonthOrders.length}</div>
                <div className="ov-stat-sub">All time: {orders.length}</div>
              </div>
              <div className="ov-stat">
                <div className="ov-stat-label">Total Profit (Requests)</div>
                <div className="ov-stat-value" style={{ color: '#1a7a45' }}>Rs. {totalProfit.toLocaleString()}</div>
                <div className="ov-stat-sub">From completed single requests</div>
              </div>
              <div className="ov-stat danger">
                <div className="ov-stat-label">Outstanding Payments</div>
                <div className="ov-stat-value" style={{ color: '#b02a2a' }}>Rs. {outstanding.toLocaleString()}</div>
                <div className="ov-stat-sub">{orders.filter(o => o.paymentStatus !== 'paid').length} unpaid orders</div>
              </div>
              <div className="ov-stat">
                <div className="ov-stat-label">Conversion Rate</div>
                <div className="ov-stat-value">{convRate}%</div>
                <div className="ov-stat-sub">Requests → Completed</div>
              </div>
              <div className="ov-stat">
                <div className="ov-stat-label">Avg Order Value</div>
                <div className="ov-stat-value">Rs. {orders.length > 0 ? Math.round(orders.reduce((s, o) => s + (o.total || 0), 0) / orders.length).toLocaleString() : '0'}</div>
                <div className="ov-stat-sub">Per order</div>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-title">Revenue — Last 6 Months (Paid Orders)</div>
              <div className="bar-chart">
                {chartData.map((d, i) => (
                  <div className="bar-col" key={i}>
                    <div className="bar-amount">{d.rev > 0 ? `Rs.${Math.round(d.rev / 1000)}k` : '0'}</div>
                    <div className="bar-wrap">
                      <div className="bar-fill" style={{ height: `${Math.max((d.rev / maxRev) * 100, 2)}%`, background: d.month === now.toLocaleString('default', { month: 'short' }) ? '#c9a84c' : '#e8e8e4' }} />
                    </div>
                    <div className="bar-label">{d.month}</div>
                    <div className="bar-count">{d.count} orders</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="two-col">
              <div className="info-card">
                <div className="info-card-title">Best Selling Parts</div>
                {bestParts.length === 0 ? <div className="empty-sm">No data yet</div> :
                  bestParts.map(([part, count], i) => (
                    <div className="rank-row" key={i}>
                      <div className="rank-num">{i + 1}</div>
                      <div className="rank-name">{part}</div>
                      <div className="rank-count">{count}×</div>
                    </div>
                  ))}
              </div>
              <div className="info-card">
                <div className="info-card-title">Top Clients by Value</div>
                {topClients.length === 0 ? <div className="empty-sm">No data yet</div> :
                  topClients.map((c, i) => (
                    <div className="rank-row" key={i} style={{ cursor: 'pointer' }} onClick={() => setSelectedClient(c)}>
                      <div className="rank-num">{i + 1}</div>
                      <div className="rank-name">{c.name}<span style={{ fontSize: '10px', color: '#999', marginLeft: '6px' }}>{c.count} orders</span></div>
                      <div className="rank-count" style={{ color: '#c9a84c' }}>Rs.{Math.round(c.total / 1000)}k</div>
                    </div>
                  ))}
              </div>
            </div>
            <button className="gold-action-btn" onClick={() => setShowNewOrder(true)}>+ New Order / Quotation</button>
          </div>
        )}

        {/* ═══ ORDERS ═══ */}
        {tab === 'orders' && (
          <div>
            <div className="section-header">
              <div className="section-title-text">Orders & Quotations</div>
              <button className="gold-action-btn small" onClick={() => setShowNewOrder(true)}>+ New Order</button>
            </div>
            <div className="search-bar">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by client, quote number or phone..." />
              {search && <button onClick={() => setSearch('')}>×</button>}
            </div>
            <div className="filters">
              {['all', 'draft', 'sent', 'done', 'paid', 'unpaid', 'partial', 'delivered'].map(f => (
                <button key={f} className={`fbtn ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            {filteredOrders.length === 0 ? <div className="empty">No orders found</div> :
              filteredOrders.map(order => {
                const balance = (order.total || 0) - (order.advanceAmount || 0);
                return (
                  <div className="order-card-pro" key={order.id}>
                    <div className="ocp-header">
                      <div>
                        <div className="ocp-client">{order.clientName}</div>
                        <div className="ocp-meta">{order.clientPhone} · {order.createdAt?.toDate?.().toLocaleDateString('en-GB') || '—'}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                        <span className="quote-badge-pro">{order.quoteNumber}</span>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <span className={`status-pill s-${order.status || 'draft'}`}>{order.status || 'draft'}</span>
                          <span className={`status-pill s-pay-${order.paymentStatus || 'unpaid'}`}>{order.paymentStatus || 'unpaid'}</span>
                          <span className={`status-pill s-del-${order.deliveryStatus || 'pending'}`}>{order.deliveryStatus || 'pending'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="ocp-vehicle">🚗 {[order.make, order.model, order.vehicleNo].filter(Boolean).join(' ') || '—'}</div>
                    <div className="ocp-items">
                      {order.items?.slice(0, 4).map((item, i) => (
                        <div key={i} className="ocp-item">
                          <span>🔧 {item.desc}{item.brand ? ` · ${item.brand}` : ''}{item.condition ? ` · ${item.condition}` : ''}{item.supplier ? <span className="supplier-tag">via {item.supplier}</span> : null}</span>
                          <span>×{item.qty} {item.unit} · Rs.{((parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0)).toLocaleString()}</span>
                        </div>
                      ))}
                      {order.items?.length > 4 && <div className="ocp-more">+{order.items.length - 4} more parts — {order.items.length} total</div>}
                    </div>
                    <div className="ocp-financials">
                      <div className="ocp-total">Total: <strong>Rs. {(order.total || 0).toLocaleString()}</strong></div>
                      {order.advanceAmount > 0 && <div className="ocp-advance">Advance: Rs. {(order.advanceAmount || 0).toLocaleString()}</div>}
                      {order.paymentStatus !== 'paid' && balance > 0 && <div className="ocp-balance">Balance: <strong style={{ color: '#b02a2a' }}>Rs. {balance.toLocaleString()}</strong></div>}
                      {order.paymentTerms && <div style={{ fontSize: '11px', color: '#999' }}>💳 {order.paymentTerms}</div>}
                    </div>
                    {order.notes && <div className="ocp-notes">📝 {order.notes}</div>}
                    <div className="ocp-controls">
                      <div className="control-group"><span className="control-label">Payment</span>
                        <select className="control-select" value={order.paymentStatus || 'unpaid'} onChange={e => setPayment(order.id, e.target.value)}>
                          <option value="unpaid">Unpaid</option>
                          <option value="partial">Partial</option>
                          <option value="paid">Paid ✓</option>
                        </select>
                      </div>
                      <div className="control-group"><span className="control-label">Delivery</span>
                        <select className="control-select" value={order.deliveryStatus || 'pending'} onChange={e => setDeliveryStatus(order.id, e.target.value)}>
                          <option value="pending">Pending</option>
                          <option value="dispatched">Dispatched</option>
                          <option value="delivered">Delivered ✓</option>
                        </select>
                      </div>
                      <div className="control-group"><span className="control-label">Status</span>
                        <select className="control-select" value={order.status || 'draft'} onChange={e => setStatus(order.id, e.target.value)}>
                          <option value="draft">Draft</option>
                          <option value="sent">Sent</option>
                          <option value="done">Done ✓</option>
                        </select>
                      </div>
                    </div>
                    <div className="actions">
                      <button className="abtn gold" onClick={() => generateQuotePDF(order)}>📄 PDF Quote</button>
                      <button className="abtn wa" onClick={() => sendWhatsAppQuote(order)}>📱 WhatsApp</button>
                      <button className="abtn wa-reply" onClick={() => setSelectedClient({ name: order.clientName, phone: order.clientPhone })}>👤 Profile</button>
                      <button className="abtn red" onClick={() => deleteItem(order.id, 'orders')}>Delete</button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* ═══ REQUESTS ═══ */}
        {tab === 'requests' && (
          <div>
            <div className="section-header">
              <div className="section-title-text">Customer Requests</div>
              <span style={{ fontSize: '11px', color: '#999' }}>{requests.length} total</span>
            </div>
            <div className="search-bar">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, part or phone..." />
              {search && <button onClick={() => setSearch('')}>×</button>}
            </div>
            <div className="filters">
              {['all', 'new', 'found', 'done'].map(f => (
                <button key={f} className={`fbtn ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}{f === 'new' && newBadge > 0 && <span className="filter-badge">{newBadge}</span>}
                </button>
              ))}
            </div>
            {filteredRequests.length === 0 ? <div className="empty">No requests found</div> :
              filteredRequests.map(req => {
                const profit = req.sell && req.buy ? req.sell - req.buy : null;
                const margin = req.sell > 0 && profit !== null ? Math.round((profit / req.sell) * 100) : 0;
                return (
                  <div className={`req-card ${!req.seenByAdmin && req.status === 'new' ? 'unseen' : ''}`} key={req.id}
                    onClick={() => { if (!req.seenByAdmin) markSeen(req.id); }}>
                    <div className="rc-top">
                      <div><div className="rc-name">{req.name}</div><div className="rc-phone">{req.phone} · {req.createdAt?.toDate?.().toLocaleDateString('en-GB') || 'Just now'}</div></div>
                      <span className={`dbadge b-${req.status}`}>{req.status?.toUpperCase()}</span>
                    </div>
                    <div className="rc-part">🔧 {req.part}</div>
                    <div className="rc-vehicle">🚗 {[req.make, req.model, req.year].filter(Boolean).join(' ') || '—'}</div>
                    {req.desc && <div className="rc-notes">"{req.desc}"</div>}
                    <div className="price-row">
                      <div><div className="pi-lbl">Buy (Rs.)</div><input className="pi" type="number" defaultValue={req.buy || ''} placeholder="0" onChange={e => updateReqPrice(req.id, 'buy', e.target.value)} onClick={e => e.stopPropagation()} /></div>
                      <div><div className="pi-lbl">Sell (Rs.)</div><input className="pi" type="number" defaultValue={req.sell || ''} placeholder="0" onChange={e => updateReqPrice(req.id, 'sell', e.target.value)} onClick={e => e.stopPropagation()} /></div>
                    </div>
                    {profit !== null && <div className="profit-line">Profit: Rs. {profit.toLocaleString()} ({margin}%)</div>}
                    <div className="actions" onClick={e => e.stopPropagation()}>
                      {req.status !== 'found' && <button className="abtn" onClick={() => updateDoc(doc(db, 'requests', req.id), { status: 'found' })}>Mark Found</button>}
                      {req.status !== 'done' && <button className="abtn green" onClick={() => updateDoc(doc(db, 'requests', req.id), { status: 'done' })}>Complete</button>}
                      <button className="abtn wa" onClick={() => { const v = [req.make, req.model, req.year].filter(Boolean).join(' ') || 'N/A'; const msg = `*KETHAJA Update*\n\nHi! Regarding your request for *${req.part}* — we have an update. Please contact us.\n📞 +94 76 302 7060`; window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, '_blank'); }}>Notify Me</button>
                      <button className="abtn wa-reply" onClick={() => { const p = req.phone?.replace(/\D/g, ''); const fp = p?.startsWith('0') ? '94' + p.slice(1) : p; window.open(`https://wa.me/${fp}`, '_blank'); }}>Reply Client</button>
                      <button className="abtn gold" onClick={() => setSelectedClient({ name: req.name, phone: req.phone })}>Profile</button>
                      <button className="abtn red" onClick={() => deleteItem(req.id, 'requests')}>Delete</button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* ═══ CLIENTS ═══ */}
        {tab === 'clients' && (
          <div>
            <div className="section-header">
              <div className="section-title-text">All Clients</div>
              <span style={{ fontSize: '11px', color: '#999' }}>{allClients.length} clients</span>
            </div>
            <div className="search-bar">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients by name or phone..." />
              {search && <button onClick={() => setSearch('')}>×</button>}
            </div>
            {allClients.filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)).length === 0 ?
              <div className="empty">No clients yet</div> :
              allClients.filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search))
                .sort((a, b) => b.total - a.total)
                .map((c, i) => {
                  const cOut = orders.filter(o => o.clientPhone === c.phone && o.paymentStatus !== 'paid').reduce((s, o) => s + (o.total || 0) - (o.advanceAmount || 0), 0);
                  return (
                    <div className="client-card" key={i} onClick={() => setSelectedClient(c)}>
                      <div className="client-avatar">{c.name?.charAt(0).toUpperCase()}</div>
                      <div className="client-info">
                        <div className="client-name">{c.name}</div>
                        <div className="client-phone">{c.phone}</div>
                      </div>
                      <div className="client-stats">
                        <div className="cs-item"><div className="cs-val">{c.count}</div><div className="cs-lbl">Orders</div></div>
                        <div className="cs-item"><div className="cs-val" style={{ color: '#1a7a45' }}>Rs.{Math.round(c.total / 1000)}k</div><div className="cs-lbl">Spent</div></div>
                        {cOut > 0 && <div className="cs-item"><div className="cs-val" style={{ color: '#b02a2a' }}>Rs.{Math.round(cOut / 1000)}k</div><div className="cs-lbl">Owes</div></div>}
                      </div>
                      <div className="client-arrow">→</div>
                    </div>
                  );
                })}
          </div>
        )}

        {/* ═══ FINANCE ═══ */}
        {tab === 'finance' && financeUnlocked && (
          <div>
            <div className="section-header">
              <div className="section-title-text">🔐 Finance Records</div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
                  style={{ padding: '7px 10px', border: '1px solid #e8e8e4', borderRadius: '2px', fontSize: '12px', fontFamily: 'inherit', outline: 'none' }} />
                <button className="gold-action-btn small" onClick={() => generateMonthlyPDF(selectedMonth, financeMonthOrders, financeMonthRequests)}>Export PDF</button>
              </div>
            </div>
            <div className="finance-stats">
              <div className="fin-stat"><div className="fin-stat-label">Revenue Collected</div><div className="fin-stat-value gold">Rs. {financeRev.toLocaleString()}</div></div>
              <div className="fin-stat"><div className="fin-stat-label">Profit</div><div className="fin-stat-value green">Rs. {financeProfit.toLocaleString()}</div></div>
              <div className="fin-stat"><div className="fin-stat-label">Profit Margin</div><div className="fin-stat-value">{financeMargin}%</div></div>
              <div className="fin-stat"><div className="fin-stat-label">Outstanding</div><div className="fin-stat-value red">Rs. {financeOutstanding.toLocaleString()}</div></div>
              <div className="fin-stat"><div className="fin-stat-label">Orders This Month</div><div className="fin-stat-value">{financeMonthOrders.length}</div></div>
              <div className="fin-stat"><div className="fin-stat-label">Advance Collected</div><div className="fin-stat-value">Rs. {financeMonthOrders.reduce((s, o) => s + (o.advanceAmount || 0), 0).toLocaleString()}</div></div>
            </div>
            <div className="finance-table">
              <div className="ft-header">
                <span style={{ width: '90px' }}>Quote No</span>
                <span style={{ flex: 1 }}>Client</span>
                <span style={{ width: '60px', textAlign: 'center' }}>Parts</span>
                <span style={{ width: '120px', textAlign: 'right' }}>Total</span>
                <span style={{ width: '110px', textAlign: 'center' }}>Payment</span>
                <span style={{ width: '110px', textAlign: 'center' }}>Delivery</span>
              </div>
              {financeMonthOrders.length === 0 ? <div className="empty">No orders for this month</div> :
                financeMonthOrders.map(o => (
                  <div className="ft-row" key={o.id}>
                    <span style={{ width: '90px', fontWeight: '700', color: '#c9a84c', fontSize: '12px' }}>{o.quoteNumber}</span>
                    <span style={{ flex: 1, fontSize: '13px' }}>{o.clientName}</span>
                    <span style={{ width: '60px', textAlign: 'center', fontSize: '12px', color: '#555' }}>{o.items?.length || 0}</span>
                    <span style={{ width: '120px', textAlign: 'right', fontWeight: '700', fontSize: '13px' }}>Rs.{(o.total || 0).toLocaleString()}</span>
                    <span style={{ width: '110px', textAlign: 'center' }}>
                      <select className="control-select small" value={o.paymentStatus || 'unpaid'} onChange={e => setPayment(o.id, e.target.value)}>
                        <option value="unpaid">Unpaid</option>
                        <option value="partial">Partial</option>
                        <option value="paid">Paid ✓</option>
                      </select>
                    </span>
                    <span style={{ width: '110px', textAlign: 'center' }}>
                      <span className={`status-pill s-del-${o.deliveryStatus || 'pending'}`}>{o.deliveryStatus || 'pending'}</span>
                    </span>
                  </div>
                ))}
              {financeMonthOrders.length > 0 && (
                <div className="ft-total">
                  <span style={{ width: '90px' }}></span>
                  <span style={{ flex: 1, fontWeight: '700', fontSize: '12px' }}>Month Total</span>
                  <span style={{ width: '60px' }}></span>
                  <span style={{ width: '120px', textAlign: 'right', fontWeight: '900', fontSize: '15px', color: '#c9a84c' }}>Rs.{financeMonthOrders.reduce((s, o) => s + (o.total || 0), 0).toLocaleString()}</span>
                  <span style={{ width: '220px' }}></span>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
