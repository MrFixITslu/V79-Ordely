import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store';
import { api } from '../api';
import { Plus, Package, DollarSign, TrendingUp } from 'lucide-react';

export function VendorDashboard() {
  const user = useAuthStore((state) => state.user);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [vatPercent, setVatPercent] = useState('15');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const vendorData = await api.getVendors();
      const myVendor = vendorData.find((v: any) => v.owner_name === user?.name);
      
      if (myVendor) {
        const [productsData, ordersData] = await Promise.all([
          api.getProducts(myVendor.id),
          api.getOrders()
        ]);
        setProducts(productsData);
        setOrders(ordersData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createProduct({
        name,
        description,
        price: Number(price),
        vat_percent: Number(vatPercent),
        image_url: imageUrl
      });
      setName('');
      setDescription('');
      setPrice('');
      setVatPercent('15');
      setImageUrl('');
      fetchData();
      alert('Product added successfully!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-center py-20">Loading dashboard...</div>;

  const totalRevenue = orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-900">Vendor Dashboard</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Revenue</p>
            <p className="text-2xl font-bold text-slate-900">EC ${totalRevenue.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Pending Orders</p>
            <p className="text-2xl font-bold text-slate-900">{pendingOrders}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Products</p>
            <p className="text-2xl font-bold text-slate-900">{products.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 sticky top-8">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-teal-500" />
              Add New Product
            </h3>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price (EC $)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">VAT %</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    value={vatPercent}
                    onChange={(e) => setVatPercent(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Image URL (Optional)</label>
                <input
                  type="url"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
              <button type="submit" className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 rounded-xl transition-colors mt-4">
                Add Product
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-6">My Products</h3>
            {products.length === 0 ? (
              <p className="text-slate-500 text-center py-10">No products added yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {products.map((product) => (
                  <div key={product.id} className="border border-slate-100 rounded-xl p-4 flex gap-4">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-20 h-20 object-cover rounded-lg" />
                    ) : (
                      <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs text-center p-2">
                        No Image
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-slate-900">{product.name}</h4>
                      <p className="text-sm text-slate-500 line-clamp-1 mb-2">{product.description}</p>
                      <p className="font-bold text-teal-600">EC ${product.price.toFixed(2)} <span className="text-xs text-slate-400 font-normal">+ {product.vat_percent}% VAT</span></p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
