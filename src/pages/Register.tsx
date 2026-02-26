import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store';
import { api } from '../api';

export function Register() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'vendor' ? 'vendor' : 'customer';
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'vendor'>(initialRole);
  const [businessName, setBusinessName] = useState('');
  const [error, setError] = useState('');
  
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await api.register({ name, email, password, role, business_name: businessName });
      login(data.user, data.token);
      navigate(data.user.role === 'vendor' ? '/vendor' : '/customer');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
      <h2 className="text-3xl font-bold text-slate-900 mb-6 text-center">Create Account</h2>
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-4 mb-6">
          <button
            type="button"
            onClick={() => setRole('customer')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${role === 'customer' ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Customer
          </button>
          <button
            type="button"
            onClick={() => setRole('vendor')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${role === 'vendor' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Vendor
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
          <input
            type="text"
            required
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            type="email"
            required
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <input
            type="password"
            required
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {role === 'vendor' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Business Name</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>
        )}

        <button type="submit" className={`w-full font-bold py-3 rounded-xl transition-colors text-white ${role === 'vendor' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-teal-500 hover:bg-teal-600'}`}>
          Sign Up
        </button>
      </form>
      <p className="mt-6 text-center text-slate-600 text-sm">
        Already have an account? <Link to="/login" className="text-teal-600 font-semibold hover:underline">Log in</Link>
      </p>
    </div>
  );
}
