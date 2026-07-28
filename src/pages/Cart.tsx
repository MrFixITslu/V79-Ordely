import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore, useAuthStore } from '../store';
import { api } from '../api';
import { Trash2, FileText, CreditCard, ShoppingCart, Phone, Mail, User as UserIcon, CheckCircle2, Clock, Sparkles, Tag } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function Cart() {
  const { items, removeItem, clearCart } = useCartStore();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  // Loyalty & Promo States per Vendor
  const [loyaltyBalances, setLoyaltyBalances] = useState<Record<number, any>>({});
  const [vendorDetails, setVendorDetails] = useState<Record<number, any>>({});
  const [pointsToRedeem, setPointsToRedeem] = useState<Record<number, number>>({});
  const [promoCodes, setPromoCodes] = useState<Record<number, string>>({});
  const [appliedPromos, setAppliedPromos] = useState<Record<number, boolean>>({});

  const navigate = useNavigate();

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.vendor_id]) {
      acc[item.vendor_id] = { vendor_name: item.vendor_name, items: [] };
    }
    acc[item.vendor_id].items.push(item);
    return acc;
  }, {} as Record<number, { vendor_name: string, items: any[] }>);

  useEffect(() => {
    // Fetch vendor details and customer loyalty info for each vendor in cart
    const vendorIds = Object.keys(groupedItems).map(Number);
    if (vendorIds.length > 0 && user) {
      Promise.all(
        vendorIds.map(async (vId) => {
          try {
            const [vData, lData] = await Promise.all([
              api.getVendor(vId),
              api.getVendorLoyalty(vId).catch(() => ({ points: 0 }))
            ]);
            return { vId, vData, lData };
          } catch (e) {
            return null;
          }
        })
      ).then((results) => {
        const newVDetails: Record<number, any> = {};
        const newLBalances: Record<number, any> = {};
        results.forEach((r) => {
          if (r) {
            newVDetails[r.vId] = r.vData;
            newLBalances[r.vId] = r.lData;
          }
        });
        setVendorDetails(newVDetails);
        setLoyaltyBalances(newLBalances);
      });
    }
  }, [items, user]);

  const handleCheckout = async (initialStatus: 'quote_pending' | 'quote_approved' = 'quote_pending') => {
    if (items.length === 0) return;
    if (!customerPhone.trim()) {
      alert('Please enter your telephone number for the quote and order record.');
      return;
    }

    setLoading(true);
    try {
      for (const vendorIdStr of Object.keys(groupedItems)) {
        const vendorId = Number(vendorIdStr);
        const vendorItems = groupedItems[vendorId].items;
        await api.createOrder({
          vendor_id: vendorId,
          items: vendorItems.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
          payment_method: paymentMethod,
          customer_phone: customerPhone,
          initial_status: initialStatus,
          points_redeemed: pointsToRedeem[vendorId] || 0,
          promo_code: appliedPromos[vendorId] ? promoCodes[vendorId] : undefined
        });
      }
      
      if (user && customerPhone !== user.phone) {
        updateUser({ ...user, phone: customerPhone });
      }

      clearCart();
      if (initialStatus === 'quote_pending') {
        alert('Quote request submitted successfully! Please review and approve the quote in your Orders dashboard to move forward.');
      } else {
        alert('Quote approved & order placed successfully!');
      }
      navigate('/orders');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateQuote = () => {
    if (items.length === 0) return;
    const doc = new jsPDF();
    
    // Vendor Header Branding
    const vendorIds = Object.keys(groupedItems);
    if (vendorIds.length === 1) {
      const vendor = groupedItems[Number(vendorIds[0])].items[0];
      if (vendor.vendor_logo) {
        try { doc.addImage(vendor.vendor_logo, 'PNG', 14, 10, 30, 30); } catch (e) {}
      }
      doc.setFontSize(20);
      doc.setTextColor(0, 179, 164);
      doc.text(vendor.vendor_name, 200, 20, { align: 'right' });
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      let vY = 28;
      if (vendor.vendor_address) { doc.text(vendor.vendor_address, 200, vY, { align: 'right' }); vY += 5; }
      if (vendor.vendor_phone) { doc.text(`Phone: ${vendor.vendor_phone}`, 200, vY, { align: 'right' }); vY += 5; }
      if (vendor.vendor_tax_id) { doc.text(`Tax ID: ${vendor.vendor_tax_id}`, 200, vY, { align: 'right' }); }
    }

    doc.setFontSize(24);
    doc.setTextColor(0);
    doc.text('OFFICIAL QUOTE', 14, 55);
    
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 65);
    doc.text(`Valid Until: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}`, 14, 70);

    // Customer Contact Details (Name, Email, Tel)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PREPARED FOR (CUSTOMER):', 14, 85);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${user?.name || 'Valued Customer'}`, 14, 92);
    doc.text(`Email: ${user?.email || 'N/A'}`, 14, 98);
    doc.text(`Tel: ${customerPhone || user?.phone || 'N/A'}`, 14, 104);

    let currentY = 118;

    Object.values(groupedItems).forEach((group: any) => {
      if (vendorIds.length > 1) {
        doc.setFontSize(14);
        doc.setTextColor(0, 179, 164);
        doc.text(`Vendor: ${group.vendor_name}`, 14, currentY);
        currentY += 10;
      }

      const tableData = group.items.map((item: any) => [
        item.name,
        item.quantity,
        `EC $${item.price.toFixed(2)}`,
        `${item.vat_percent}%`,
        `EC $${(item.price * item.quantity * (1 + item.vat_percent / 100)).toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Item', 'Qty', 'Unit Price', 'VAT', 'Total']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [0, 179, 164] },
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
    });

    const grandTotal = items.reduce((sum, item) => sum + (item.price * item.quantity * (1 + item.vat_percent / 100)), 0);
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text(`Grand Total: EC $${grandTotal.toFixed(2)}`, 14, currentY);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150);
    doc.text('Generated by Ordely - The Caribbean Business Platform', 105, 285, { align: 'center' });

    doc.save(`Ordely_Quote_${new Date().getTime()}.pdf`);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
        <ShoppingCart className="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Your cart is empty</h2>
        <p className="text-slate-500 mb-6">Looks like you haven't added anything yet.</p>
        <button onClick={() => navigate('/customer')} className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-xl font-bold transition-colors">
          Browse Vendors
        </button>
      </div>
    );
  }

  const grandTotal = items.reduce((sum, item) => sum + (item.price * item.quantity * (1 + item.vat_percent / 100)), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <h2 className="text-3xl font-bold text-slate-900 mb-6">Shopping Cart</h2>
        {Object.entries(groupedItems).map(([vendorIdStr, group]: [string, any]) => {
          const vId = Number(vendorIdStr);
          const vDetails = vendorDetails[vId];
          const lBalance = loyaltyBalances[vId]?.points || 0;
          const pointsRate = vDetails?.loyalty_points_per_discount || 100;
          const pointsRedeemed = pointsToRedeem[vId] || 0;
          const pointsDiscountDollar = pointsRedeemed / pointsRate;

          return (
            <div key={vId} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
              <h3 className="text-xl font-bold text-slate-900 pb-4 border-b border-slate-100">Vendor: {group.vendor_name}</h3>
              <div className="space-y-4">
                {group.items.map((item: any) => {
                  const itemTotal = item.price * item.quantity;
                  const vatAmount = itemTotal * (item.vat_percent / 100);
                  return (
                    <div key={item.product_id} className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900">{item.name}</h4>
                        <p className="text-sm text-slate-500">
                          Qty: {item.quantity} × EC ${item.price.toFixed(2)}
                          {item.discount_percent > 0 && (
                            <span className="ml-2 text-xs text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded">
                              ({item.discount_percent}% Product Discount Included)
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="font-bold text-slate-900">EC ${(itemTotal + vatAmount).toFixed(2)}</p>
                          <p className="text-xs text-slate-400">incl. {item.vat_percent}% VAT</p>
                        </div>
                        <button onClick={() => removeItem(item.product_id)} className="text-red-400 hover:text-red-600 transition-colors p-2 bg-red-50 rounded-lg">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Vendor Loyalty & Promo Options */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                {vDetails?.enable_loyalty === 1 && (
                  <div className="bg-teal-50/70 p-3.5 rounded-xl border border-teal-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-teal-600" />
                        Redeem Loyalty Points
                      </span>
                      <span className="text-xs font-bold text-teal-700 bg-teal-100/80 px-2 py-0.5 rounded-full">
                        Balance: {lBalance} pts
                      </span>
                    </div>

                    {lBalance > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="0"
                            max={lBalance}
                            step={pointsRate}
                            value={pointsRedeemed}
                            onChange={(e) => setPointsToRedeem({ ...pointsToRedeem, [vId]: Number(e.target.value) })}
                            className="w-full accent-teal-600"
                          />
                          <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                            {pointsRedeemed} pts
                          </span>
                        </div>
                        {pointsRedeemed > 0 && (
                          <p className="text-xs font-medium text-teal-800">
                            Saves <strong>EC ${pointsDiscountDollar.toFixed(2)}</strong> off this vendor's order!
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">No loyalty points accumulated yet. You will earn points on this purchase!</p>
                    )}
                  </div>
                )}

                {/* Promo Code Input */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-grow">
                    <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Vendor Promo Code (e.g. SAVE10)"
                      value={promoCodes[vId] || ''}
                      onChange={(e) => {
                        setPromoCodes({ ...promoCodes, [vId]: e.target.value.toUpperCase() });
                        setAppliedPromos({ ...appliedPromos, [vId]: false });
                      }}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 uppercase font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const code = (promoCodes[vId] || '').trim().toUpperCase();
                      if (vDetails?.promo_code && code === vDetails.promo_code.toUpperCase()) {
                        setAppliedPromos({ ...appliedPromos, [vId]: true });
                        alert(`Promo code ${code} applied! ${vDetails.promo_discount_percent}% discount added.`);
                      } else {
                        alert('Invalid or expired promo code for this vendor.');
                      }
                    }}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors"
                  >
                    {appliedPromos[vId] ? 'Applied ✓' : 'Apply'}
                  </button>
                </div>
                {appliedPromos[vId] && (
                  <p className="text-xs text-emerald-600 font-semibold">
                    ✓ Promo Code '{promoCodes[vId]}' applied ({vDetails?.promo_discount_percent}% OFF)
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 sticky top-8 space-y-6">
          <h3 className="text-xl font-bold text-slate-900">Order & Quote Summary</h3>

          {/* Customer Contact Info Section */}
          <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-100">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer Contact Info</p>
            <div className="text-sm text-slate-700 space-y-1.5">
              <div className="flex items-center gap-2 font-medium">
                <UserIcon className="w-4 h-4 text-teal-600" />
                <span>{user?.name}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <Mail className="w-4 h-4 text-teal-600" />
                <span>{user?.email}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-teal-600" />
                <span>Telephone Number <span className="text-red-500">*</span></span>
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. +1 (758) 555-0199"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex justify-between text-slate-600 text-sm">
              <span>Subtotal</span>
              <span>EC ${items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600 text-sm">
              <span>VAT</span>
              <span>EC ${items.reduce((sum, item) => sum + (item.price * item.quantity * (item.vat_percent / 100)), 0).toFixed(2)}</span>
            </div>
            {Object.keys(groupedItems).some((vIdStr) => {
              const vId = Number(vIdStr);
              return (pointsToRedeem[vId] || 0) > 0 || appliedPromos[vId];
            }) && (
              <div className="flex justify-between text-emerald-600 font-semibold text-sm">
                <span>Discounts & Rewards</span>
                <span>
                  - EC ${Object.keys(groupedItems).reduce((discountSum, vIdStr) => {
                    const vId = Number(vIdStr);
                    const vDetails = vendorDetails[vId];
                    const vItems = groupedItems[vId].items;
                    const vSubtotal = vItems.reduce((s, i) => s + i.price * i.quantity, 0);
                    
                    let promoDiscount = 0;
                    if (appliedPromos[vId] && vDetails?.promo_discount_percent) {
                      promoDiscount = vSubtotal * (vDetails.promo_discount_percent / 100);
                    }
                    
                    const pointsRate = vDetails?.loyalty_points_per_discount || 100;
                    const pointsDiscount = (pointsToRedeem[vId] || 0) / pointsRate;
                    
                    return discountSum + promoDiscount + pointsDiscount;
                  }, 0).toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-slate-900 pt-3 border-t border-slate-100">
              <span>Estimated Total</span>
              <span className="text-teal-600">
                EC ${Math.max(0, items.reduce((sum, item) => sum + (item.price * item.quantity * (1 + item.vat_percent / 100)), 0) - Object.keys(groupedItems).reduce((discountSum, vIdStr) => {
                  const vId = Number(vIdStr);
                  const vDetails = vendorDetails[vId];
                  const vItems = groupedItems[vId].items;
                  const vSubtotal = vItems.reduce((s, i) => s + i.price * i.quantity, 0);
                  
                  let promoDiscount = 0;
                  if (appliedPromos[vId] && vDetails?.promo_discount_percent) {
                    promoDiscount = vSubtotal * (vDetails.promo_discount_percent / 100);
                  }
                  
                  const pointsRate = vDetails?.loyalty_points_per_discount || 100;
                  const pointsDiscount = (pointsToRedeem[vId] || 0) / pointsRate;
                  
                  return discountSum + promoDiscount + pointsDiscount;
                }, 0)).toFixed(2)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none bg-slate-50 text-sm"
            >
              <option value="COD">Cash on Delivery (COD)</option>
              <option value="Online">Online Payment (Simulated)</option>
            </select>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => handleCheckout('quote_pending')}
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              <Clock className="w-4 h-4" />
              {loading ? 'Processing...' : 'Submit Request for Quote'}
            </button>

            <button
              onClick={() => handleCheckout('quote_approved')}
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              {loading ? 'Processing...' : 'Approve & Place Order Immediately'}
            </button>

            <button
              onClick={generateQuote}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              Download PDF Quote
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
