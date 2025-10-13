"use client";

import { X, Calendar, CreditCard, DollarSign, FileText, Download } from "lucide-react";
import * as XLSX from 'xlsx';

interface Payment {
  id: string;
  payment_amount: number;
  payment_date: string;
  payment_method: string;
  billing_period: string;
  reference_number?: string;
  notes?: string;
}

interface PaymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  networkName: string;
  payments: Payment[];
}

export function PaymentHistoryModal({
  isOpen,
  onClose,
  networkName,
  payments
}: PaymentHistoryModalProps) {
  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const totalPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.payment_amount.toString()), 0);

  const handleExportToExcel = () => {
    // Prepare data for Excel
    const exportData = payments.map((payment, index) => ({
      'Payment #': payments.length - index,
      'Date': formatDate(payment.payment_date),
      'Amount (LKR)': parseFloat(payment.payment_amount.toString()).toLocaleString(),
      'Payment Method': payment.payment_method,
      'Billing Period': payment.billing_period || '-',
      'Reference Number': payment.reference_number || '-',
      'Notes': payment.notes || '-'
    }));

    // Add summary row
    exportData.push({
      'Payment #': '',
      'Date': 'TOTAL',
      'Amount (LKR)': totalPaid.toLocaleString(),
      'Payment Method': '',
      'Billing Period': '',
      'Reference Number': '',
      'Notes': ''
    });

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    ws['!cols'] = [
      { wch: 12 },  // Payment #
      { wch: 20 },  // Date
      { wch: 18 },  // Amount
      { wch: 18 },  // Payment Method
      { wch: 18 },  // Billing Period
      { wch: 20 },  // Reference Number
      { wch: 40 }   // Notes
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Payment History');

    // Generate filename with network name and date
    const fileName = `${networkName.replace(/[^a-zA-Z0-9]/g, '_')}_Payment_History_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Save file
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%)',
          border: '1px solid rgba(203, 213, 225, 0.3)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* Header */}
        <div
          className="p-6 border-b border-gray-200"
          style={{
            background: 'linear-gradient(135deg, #5DADE2 0%, #4A9BC7 100%)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                <FileText className="w-6 h-6" />
                Payment History
              </h3>
              <p className="text-white/90 text-base">{networkName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="p-6 border-b border-gray-200" style={{ background: 'rgba(248, 250, 252, 0.5)' }}>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-2xl bg-white border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{payments.length}</div>
              <div className="text-sm text-gray-600 font-medium">Total Payments</div>
            </div>
            <div className="text-center p-4 rounded-2xl bg-white border border-gray-200">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
              <div className="text-sm text-gray-600 font-medium">Total Amount</div>
            </div>
            <div className="text-center p-4 rounded-2xl bg-white border border-gray-200">
              <div className="text-2xl font-bold text-blue-600">
                {payments.length > 0 ? formatCurrency(totalPaid / payments.length) : formatCurrency(0)}
              </div>
              <div className="text-sm text-gray-600 font-medium">Average Payment</div>
            </div>
          </div>
        </div>

        {/* Payment List */}
        <div className="overflow-y-auto max-h-[500px] p-6">
          {payments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No payment history available</p>
              <p className="text-gray-400 text-sm">Payments will appear here once recorded</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment, index) => (
                <div
                  key={payment.id}
                  className="rounded-2xl p-5 transition-all duration-300 hover:transform hover:scale-[1.01]"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
                    border: '1px solid rgba(203, 213, 225, 0.3)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        <DollarSign className="w-6 h-6 text-white" />
                      </div>

                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-xl font-bold text-gray-900">
                            {formatCurrency(parseFloat(payment.payment_amount.toString()))}
                          </h4>
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold border border-green-200">
                            Payment #{payments.length - index}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm font-medium">{formatDate(payment.payment_date)}</span>
                          </div>

                          <div className="flex items-center gap-2 text-gray-600">
                            <CreditCard className="w-4 h-4" />
                            <span className="text-sm font-medium">{payment.payment_method}</span>
                            {payment.billing_period && (
                              <span className="text-sm text-gray-500">• {payment.billing_period}</span>
                            )}
                          </div>

                          {payment.reference_number && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <FileText className="w-4 h-4" />
                              <span className="text-sm">Ref: {payment.reference_number}</span>
                            </div>
                          )}

                          {payment.notes && (
                            <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                              <p className="text-sm text-blue-800">{payment.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-300 font-semibold"
            >
              Close
            </button>
            <button
              onClick={handleExportToExcel}
              disabled={payments.length === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #5DADE2 0%, #4A9BC7 100%)',
                boxShadow: '0 4px 12px rgba(93, 173, 226, 0.3)'
              }}
            >
              <Download className="w-4 h-4" />
              Export History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
