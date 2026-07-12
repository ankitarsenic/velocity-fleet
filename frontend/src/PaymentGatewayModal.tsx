import React, { useState } from 'react';
import { X, CheckCircle, CreditCard, Smartphone, Briefcase, ChevronRight } from 'lucide-react';

export interface PaymentTarget {
  type: 'trip' | 'maintenance';
  id: number;
  amount: number;
}

interface PaymentGatewayModalProps {
  target: PaymentTarget;
  onClose: () => void;
  onSuccess: () => void;
}

type PaymentMethod = 'upi' | 'card' | 'finance';
type PaymentState = 'idle' | 'processing' | 'success';

export default function PaymentGatewayModal({ target, onClose, onSuccess }: PaymentGatewayModalProps) {
  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [txnId, setTxnId] = useState<string>('');

  const handlePay = async () => {
    setPaymentState('processing');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/payments/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reference_id: target.id,
          amount: target.amount,
          payment_method: method,
          record_type: target.type
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTxnId(data.transaction_id || `TXN-${Math.floor(Date.now() / 1000)}`);
        setPaymentState('success');
        
        // Auto close after 3 seconds
        setTimeout(() => {
          onSuccess();
        }, 3000);
      } else {
        // Fallback to idle if error
        setPaymentState('idle');
        alert('Payment failed. Please try again.');
      }
    } catch (error) {
      console.error("Payment error", error);
      setPaymentState('idle');
      alert('Network error. Please try again.');
    }
  };

  return (
    <div className="payment-modal-overlay">
      <div className="payment-card">
        
        {/* SUCCESS STATE */}
        {paymentState === 'success' ? (
          <div className="payment-content" style={{ width: '100%' }}>
            <div className="payment-success-pane">
              <div className="success-icon-wrapper">
                <CheckCircle size={40} />
              </div>
              <h3>Payment Successful</h3>
              <p>Your settlement for {target.type === 'trip' ? 'Trip' : 'Maintenance'} #{target.id} has been processed.</p>
              <div className="txn-id">Transaction ID: {txnId}</div>
            </div>
          </div>
        ) : (
          /* IDLE / PROCESSING STATE */
          <>
            <div className="payment-sidebar">
              <div className="payment-sidebar-title">Payment Method</div>
              
              <div 
                className={`payment-nav-item ${method === 'upi' ? 'active' : ''}`}
                onClick={() => paymentState === 'idle' && setMethod('upi')}
              >
                <Smartphone size={20} />
                <span>UPI / QR</span>
                {method === 'upi' && <ChevronRight size={16} style={{ marginLeft: 'auto' }} />}
              </div>
              
              <div 
                className={`payment-nav-item ${method === 'card' ? 'active' : ''}`}
                onClick={() => paymentState === 'idle' && setMethod('card')}
              >
                <CreditCard size={20} />
                <span>Credit / Debit Card</span>
                {method === 'card' && <ChevronRight size={16} style={{ marginLeft: 'auto' }} />}
              </div>
              
              <div 
                className={`payment-nav-item ${method === 'finance' ? 'active' : ''}`}
                onClick={() => paymentState === 'idle' && setMethod('finance')}
              >
                <Briefcase size={20} />
                <span>Pay Later / Finance</span>
                {method === 'finance' && <ChevronRight size={16} style={{ marginLeft: 'auto' }} />}
              </div>
            </div>

            <div className="payment-content">
              <button 
                className="tracker-close-btn" 
                onClick={onClose}
                disabled={paymentState === 'processing'}
                style={{ top: '24px', right: '24px', backgroundColor: '#f1f5f9', color: '#64748b' }}
              >
                <X size={20} />
              </button>

              <div className="payment-header">
                <h2>Checkout</h2>
                <p>Complete your settlement to mark as PAID.</p>
              </div>

              <div className="payment-amount-badge">
                ₹{target.amount.toLocaleString()}
              </div>

              {/* DYNAMIC CONTENT PANE */}
              <div style={{ flex: 1 }}>
                
                {method === 'upi' && (
                  <div className="animation-fade">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
                      <div style={{ width: '140px', height: '140px', backgroundColor: '#f1f5f9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #cbd5e1', marginBottom: '16px' }}>
                        <Smartphone size={40} color="#94a3b8" />
                      </div>
                      <p style={{ color: '#64748b', fontSize: '14px' }}>Scan QR to Pay with any UPI app</p>
                    </div>
                    <div className="payment-form-group">
                      <label className="payment-label">Or enter UPI ID / VPA</label>
                      <input type="text" className="payment-input" placeholder="e.g. driver@oksbi" />
                    </div>
                  </div>
                )}

                {method === 'card' && (
                  <div className="animation-fade">
                    <div className="payment-form-group">
                      <label className="payment-label">Card Number</label>
                      <input type="text" className="payment-input" placeholder="0000 0000 0000 0000" />
                    </div>
                    <div className="card-row">
                      <div className="payment-form-group">
                        <label className="payment-label">Expiry Date</label>
                        <input type="text" className="payment-input" placeholder="MM/YY" />
                      </div>
                      <div className="payment-form-group">
                        <label className="payment-label">CVV</label>
                        <input type="password" className="payment-input" placeholder="123" />
                      </div>
                    </div>
                    <div className="payment-form-group">
                      <label className="payment-label">Cardholder Name</label>
                      <input type="text" className="payment-input" placeholder="Name on card" />
                    </div>
                  </div>
                )}

                {method === 'finance' && (
                  <div className="animation-fade">
                    <div className="payment-form-group">
                      <label className="payment-label">Select Financial Partner</label>
                      <select className="payment-input">
                        <option>TransitOps Capital</option>
                        <option>HDFC Fleet Finance</option>
                        <option>Shriram Transport Finance</option>
                      </select>
                    </div>
                    <div className="payment-form-group" style={{ marginTop: '24px' }}>
                      <label className="payment-label">EMI Tenure (Months)</label>
                      <input type="range" min="3" max="12" step="3" defaultValue="3" style={{ width: '100%', marginTop: '12px' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '12px', marginTop: '8px', padding: '0 4px' }}>
                        <span>3</span>
                        <span>6</span>
                        <span>9</span>
                        <span>12</span>
                      </div>
                    </div>
                  </div>
                )}
                
              </div>

              <div className="payment-action">
                <button 
                  className="btn-cancel-pay" 
                  onClick={onClose}
                  disabled={paymentState === 'processing'}
                >
                  Cancel
                </button>
                <button 
                  className={`btn-pay ${paymentState === 'processing' ? 'processing' : ''}`} 
                  onClick={handlePay}
                  disabled={paymentState === 'processing'}
                >
                  {paymentState === 'processing' ? (
                    <>
                      <svg className="spinner" viewBox="0 0 50 50">
                        <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                      </svg>
                      Processing with Bank...
                    </>
                  ) : (
                    `Pay ₹${target.amount.toLocaleString()}`
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
