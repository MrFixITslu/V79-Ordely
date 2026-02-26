import { Link } from 'react-router-dom';
import { Package, FileText, CreditCard, TrendingUp } from 'lucide-react';

export function Landing() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <div className="max-w-3xl space-y-8">
        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Run Your Business <span className="text-teal-500">Digitally</span> with Ordely
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Orders. Quotes. Invoices. Payments — all in one powerful platform built for Caribbean businesses.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Link to="/register?role=vendor" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-orange-500/30 transition-all hover:-translate-y-1">
            Start Free as a Business
          </Link>
          <Link to="/register?role=customer" className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-slate-900/30 transition-all hover:-translate-y-1">
            Order as a Customer
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-20 text-left">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center mb-4">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Manage Orders</h3>
            <p className="text-slate-600 text-sm">Receive and manage all customer orders in one simple dashboard.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Quotes & Invoices</h3>
            <p className="text-slate-600 text-sm">Generate official branded quotes and professional invoices instantly.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-4">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Easy Payments</h3>
            <p className="text-slate-600 text-sm">Accept Cash on Delivery or online payments securely.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Track Sales</h3>
            <p className="text-slate-600 text-sm">Full visibility into your business growth and performance.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
