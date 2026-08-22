'use client';

import { useState } from 'react';
import type { PaymentRecord } from '@/lib/db/payment-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RotateCcw, Loader2 } from 'lucide-react';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([
    {
      id: 'pay-rec-1',
      bookingId: 'bk-demo-001',
      vehicleId: 'v-001-camry',
      razorpayOrderId: 'order_demo_1001',
      razorpayPaymentId: 'pay_demo_1001_success',
      amount: 265.3,
      currency: 'INR',
      status: 'PAID',
      createdAt: new Date('2026-08-15T08:32:00Z'),
      updatedAt: new Date('2026-08-15T08:32:00Z'),
    },
    {
      id: 'pay-rec-2',
      bookingId: 'bk-demo-002',
      vehicleId: 'v-003-3series',
      razorpayOrderId: 'order_demo_1002',
      razorpayPaymentId: 'pay_demo_1002_success',
      amount: 800.75,
      currency: 'INR',
      status: 'PAID',
      createdAt: new Date('2026-08-16T14:18:00Z'),
      updatedAt: new Date('2026-08-16T14:18:00Z'),
    },
  ]);

  // Refund Modal State
  const [refundingPayment, setRefundingPayment] = useState<PaymentRecord | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  const handleRefund = async () => {
    if (!refundingPayment) return;
    setIsProcessingRefund(true);

    try {
      const res = await fetch(`/api/payments/${refundingPayment.id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'nr-car-hire-admin-secret-2024',
        },
        body: JSON.stringify({ reason: refundReason || 'Admin initiated full refund' }),
      });

      const data = await res.json();
      if (data.success) {
        setPayments((prev) =>
          prev.map((p) => (p.id === refundingPayment.id ? { ...p, status: 'REFUNDED' } : p)),
        );
        setRefundingPayment(null);
        setRefundReason('');
      }
    } catch (err) {
      console.error('Failed to refund payment:', err);
    } finally {
      setIsProcessingRefund(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Payments & Refunds Ledger</h1>
          <p className="text-xs text-slate-400 mt-1">
            Audited transaction ledger for verified Razorpay online payments and gateway refunds.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-900/50 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-5 py-3">Payment ID</th>
              <th className="px-5 py-3">Razorpay Order / Ref</th>
              <th className="px-5 py-3">Vehicle</th>
              <th className="px-5 py-3">Amount (INR)</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                <td className="px-5 py-4 font-mono font-bold text-white">
                  {p.razorpayPaymentId || p.id}
                </td>
                <td className="px-5 py-4 font-mono text-slate-400 text-[11px]">
                  {p.razorpayOrderId}
                </td>
                <td className="px-5 py-4 text-slate-300 font-mono">{p.vehicleId || '—'}</td>
                <td className="px-5 py-4 font-mono font-bold text-gold text-sm">₹{p.amount}</td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      p.status === 'PAID'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : p.status === 'REFUNDED'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  {p.status === 'PAID' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setRefundingPayment(p);
                        setRefundReason('');
                      }}
                      className="h-7 text-[11px] border-slate-700 bg-slate-800 text-slate-200"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" /> Process Refund
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {refundingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-display font-bold text-white">
              Refund Payment: {refundingPayment.razorpayPaymentId}
            </h3>
            <p className="text-xs text-slate-400">
              Confirm refund of ₹{refundingPayment.amount} INR to customer payment method.
            </p>

            <div>
              <Label className="text-slate-300 text-xs">Refund Reason *</Label>
              <Input
                value={refundReason}
                placeholder="e.g. Customer cancellation within 48h window"
                onChange={(e) => setRefundReason(e.target.value)}
                className="mt-1 bg-slate-900 border-slate-800 text-white text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRefundingPayment(null)}
                className="border-slate-800 text-slate-400"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isProcessingRefund}
                onClick={handleRefund}
              >
                {isProcessingRefund ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Confirm Refund'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
