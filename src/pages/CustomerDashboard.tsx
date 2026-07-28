import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuthStore } from '../store';
import { Store, User, Mail, Phone, Pencil, CheckCircle2, AlertCircle, Save, X, Sparkles } from 'lucide-react';

export function CustomerDashboard() {
  const { user, updateUser } = useAuthStore();
  const [vendors, setVendors] = useState<any[]>([]);
  const [loyaltyAccounts, setLoyaltyAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  useEffect(() => {
    Promise.all([
      api.getVendors(),
      api.getCustomerLoyalty().catch(() => [])
    ]).then(([vendorsData, loyaltyData]) => {
      setVendors(vendorsData);
      setLoyaltyAccounts(loyaltyData || []);
      setLoading(false);
    });
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage(null);

    try {
      const res = await api.updateUserProfile({
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone,
      });

      if (res.user) {
        updateUser(res.user);
        setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditingProfile(false);
      }
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-500 font-medium">Loading customer dashboard...</div>;

  return (
    <div className="space-y-8">
      {/* Customer Profile Banner Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-teal-500 text-white rounded-2xl flex items-center justify-center text-2xl font-black shadow-sm shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{user?.name}</h1>
                <span className="bg-teal-50 text-teal-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-teal-100">
                  Customer Account
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Manage your account profile contact details for quotes and orders.</p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsEditingProfile(!isEditingProfile);
              setProfileMessage(null);
            }}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors shadow-sm"
          >
            {isEditingProfile ? (
              <>
                <X className="w-4 h-4" />
                <span>Cancel Editing</span>
              </>
            ) : (
              <>
                <Pencil className="w-4 h-4 text-teal-400" />
                <span>Edit Profile</span>
              </>
            )}
          </button>
        </div>

        {profileMessage && (
          <div className={`mt-4 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
            profileMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {profileMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>{profileMessage.text}</span>
          </div>
        )}

        {/* View Mode */}
        {!isEditingProfile ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 text-sm">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <User className="w-5 h-5 text-teal-600 shrink-0" />
              <div>
                <p className="text-xs font-medium text-slate-400">Full Name</p>
                <p className="font-semibold text-slate-900">{user?.name || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <Mail className="w-5 h-5 text-teal-600 shrink-0" />
              <div>
                <p className="text-xs font-medium text-slate-400">Email Address</p>
                <p className="font-semibold text-slate-900">{user?.email || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <Phone className="w-5 h-5 text-teal-600 shrink-0" />
              <div>
                <p className="text-xs font-medium text-slate-400">Telephone Number</p>
                <p className="font-semibold text-slate-900">{user?.phone || 'No phone added yet'}</p>
              </div>
            </div>
          </div>
        ) : (
          /* Edit Mode Form */
          <form onSubmit={handleSaveProfile} className="pt-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Update Account Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none bg-slate-50"
                  placeholder="Your Full Name"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none bg-slate-50"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Telephone Number</label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none bg-slate-50"
                  placeholder="e.g. +1 (758) 555-0199"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-xl font-bold text-xs transition-colors disabled:opacity-50 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>{savingProfile ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Customer Loyalty Rewards Overview */}
      {loyaltyAccounts.length > 0 && (
        <div className="bg-gradient-to-r from-teal-600 to-emerald-700 rounded-3xl p-6 text-white shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <h2 className="text-xl font-bold">My Store Loyalty Reward Points</h2>
            </div>
            <span className="text-xs bg-white/20 text-white font-semibold px-3 py-1 rounded-full">
              {loyaltyAccounts.length} Connected Stores
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {loyaltyAccounts.map((acc: any) => (
              <Link
                key={acc.id}
                to={`/vendor/${acc.vendor_id}`}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/20 transition-all flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-sm text-white">{acc.business_name || 'Vendor Store'}</p>
                  <p className="text-[11px] text-teal-100">Click to visit store & redeem</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-amber-300">{acc.points}</p>
                  <p className="text-[10px] uppercase font-bold text-teal-200">Points</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Browse Vendors Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Browse Vendors</h2>
          <span className="text-xs text-slate-500 font-medium">{vendors.length} Vendors Available</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vendors.map((vendor) => (
            <Link key={vendor.id} to={`/vendor/${vendor.id}`} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 shrink-0 border border-slate-100 overflow-hidden">
                    {vendor.logo_url ? (
                      <img src={vendor.logo_url} alt={vendor.business_name} className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-8 h-8" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-600 transition-colors">{vendor.business_name}</h3>
                    <p className="text-xs text-slate-400">By {vendor.owner_name}</p>
                  </div>
                </div>
                <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">{vendor.description || 'No description provided.'}</p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-teal-600 font-bold">
                <span>View Store Products</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>

        {vendors.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 text-slate-500 text-sm">
            No vendors found. Check back later!
          </div>
        )}
      </div>
    </div>
  );
}

