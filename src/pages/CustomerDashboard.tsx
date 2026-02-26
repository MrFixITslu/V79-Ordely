import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Store } from 'lucide-react';

export function CustomerDashboard() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getVendors().then((data) => {
      setVendors(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center py-20">Loading vendors...</div>;

  return (
    <div>
      <h2 className="text-3xl font-bold text-slate-900 mb-8">Browse Vendors</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vendors.map((vendor) => (
          <Link key={vendor.id} to={`/vendor/${vendor.id}`} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
                {vendor.logo_url ? (
                  <img src={vendor.logo_url} alt={vendor.business_name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <Store className="w-8 h-8" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-teal-600 transition-colors">{vendor.business_name}</h3>
                <p className="text-sm text-slate-500">By {vendor.owner_name}</p>
              </div>
            </div>
            <p className="text-slate-600 text-sm line-clamp-2">{vendor.description || 'No description provided.'}</p>
          </Link>
        ))}
      </div>
      {vendors.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          No vendors found. Check back later!
        </div>
      )}
    </div>
  );
}
