import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store';
import { api } from '../api';
import { Plus, Package, DollarSign, TrendingUp, Pencil, Trash2, X, Globe, Facebook, Instagram, Linkedin, MapPin, Phone, FileText, Sparkles } from 'lucide-react';
import { ImageUploader } from '../components/ImageUploader';
import { SalesRevenueChart } from '../components/SalesRevenueChart';
import { LowStockNotifications } from '../components/LowStockNotifications';

export function VendorDashboard() {

  const user = useAuthStore((state) => state.user);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [vatPercent, setVatPercent] = useState('15');
  const [discountPercent, setDiscountPercent] = useState('0');
  const [imageUrl, setImageUrl] = useState('');
  const [sku, setSku] = useState('');
  const [stockQuantity, setStockQuantity] = useState('0');

  const [profile, setProfile] = useState({
    business_name: '',
    description: '',
    logo_url: '',
    address: '',
    phone: '',
    tax_id: '',
    website: '',
    facebook_url: '',
    instagram_url: '',
    linkedin_url: '',
    enable_loyalty: false,
    loyalty_points_per_dollar: '1',
    loyalty_points_per_discount: '100',
    promo_code: '',
    promo_discount_percent: '0'
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Edit Product State
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editVatPercent, setEditVatPercent] = useState('15');
  const [editDiscountPercent, setEditDiscountPercent] = useState('0');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editStockQuantity, setEditStockQuantity] = useState('0');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const vendorData = await api.getVendors();
      const myVendor = vendorData.find((v: any) => v.owner_name === user?.name);
      
      if (myVendor) {
        setProfile({
          business_name: myVendor.business_name || '',
          description: myVendor.description || '',
          logo_url: myVendor.logo_url || '',
          address: myVendor.address || '',
          phone: myVendor.phone || '',
          tax_id: myVendor.tax_id || '',
          website: myVendor.website || '',
          facebook_url: myVendor.facebook_url || '',
          instagram_url: myVendor.instagram_url || '',
          linkedin_url: myVendor.linkedin_url || '',
          enable_loyalty: myVendor.enable_loyalty === 1 || myVendor.enable_loyalty === true,
          loyalty_points_per_dollar: (myVendor.loyalty_points_per_dollar ?? 1).toString(),
          loyalty_points_per_discount: (myVendor.loyalty_points_per_discount ?? 100).toString(),
          promo_code: myVendor.promo_code || '',
          promo_discount_percent: (myVendor.promo_discount_percent ?? 0).toString()
        });
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
        discount_percent: Number(discountPercent),
        image_url: imageUrl,
        sku,
        stock_quantity: Number(stockQuantity)
      });
      setName('');
      setDescription('');
      setPrice('');
      setVatPercent('15');
      setDiscountPercent('0');
      setImageUrl('');
      setSku('');
      setStockQuantity('0');
      fetchData();
      alert('Product added successfully!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStartEditProduct = (product: any) => {
    setEditingProduct(product);
    setEditName(product.name || '');
    setEditDescription(product.description || '');
    setEditPrice(product.price !== undefined ? product.price.toString() : '');
    setEditVatPercent(product.vat_percent !== undefined ? product.vat_percent.toString() : '15');
    setEditDiscountPercent(product.discount_percent !== undefined ? product.discount_percent.toString() : '0');
    setEditImageUrl(product.image_url || '');
    setEditSku(product.sku || '');
    setEditStockQuantity(product.stock_quantity !== undefined ? product.stock_quantity.toString() : '0');
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      await api.updateProduct(editingProduct.id, {
        name: editName,
        description: editDescription,
        price: Number(editPrice),
        vat_percent: Number(editVatPercent),
        discount_percent: Number(editDiscountPercent),
        image_url: editImageUrl,
        sku: editSku,
        stock_quantity: Number(editStockQuantity)
      });
      setEditingProduct(null);
      fetchData();
      alert('Product updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update product');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.deleteProduct(id);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateVendorProfile(profile);
      setIsEditingProfile(false);
      fetchData();
      alert('Profile updated successfully!');
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
        <button 
          onClick={() => setIsEditingProfile(!isEditingProfile)}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Pencil className="w-4 h-4" />
          <span>{isEditingProfile ? 'Cancel Profile Edit' : 'Edit Business Profile'}</span>
        </button>
      </div>

      {/* Vendor Profile Header Card */}
      {!isEditingProfile && profile.business_name && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center gap-6">
          {profile.logo_url ? (
            <img src={profile.logo_url} alt={profile.business_name} className="w-20 h-20 object-cover rounded-xl shadow-sm border border-slate-100 shrink-0" />
          ) : (
            <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center text-3xl font-bold shrink-0">
              {profile.business_name.charAt(0)}
            </div>
          )}
          <div className="flex-grow space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{profile.business_name}</h3>
                <p className="text-xs text-slate-500">{profile.description || 'No description added yet.'}</p>
              </div>

              {/* Social & Website Links */}
              <div className="flex items-center gap-2">
                {profile.website && (
                  <a
                    href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 text-xs font-semibold transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Website</span>
                  </a>
                )}
                {profile.facebook_url && (
                  <a href={profile.facebook_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors" title="Facebook">
                    <Facebook className="w-4 h-4 text-blue-600" />
                  </a>
                )}
                {profile.instagram_url && (
                  <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors" title="Instagram">
                    <Instagram className="w-4 h-4 text-pink-600" />
                  </a>
                )}
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors" title="LinkedIn">
                    <Linkedin className="w-4 h-4 text-blue-700" />
                  </a>
                )}
              </div>
            </div>

            {/* Contact Information Bar */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
              {profile.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" /> {profile.address}
                </span>
              )}
              {profile.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-teal-600" /> {profile.phone}
                </span>
              )}
              {profile.tax_id && (
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-teal-600" /> Tax ID: {profile.tax_id}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {isEditingProfile && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Business Profile Details</h3>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Business Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    value={profile.business_name}
                    onChange={(e) => setProfile({...profile, business_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Business Description</label>
                  <textarea
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    rows={3}
                    value={profile.description}
                    onChange={(e) => setProfile({...profile, description: e.target.value})}
                  />
                </div>
                <div>
                  <ImageUploader
                    label="Business Logo"
                    value={profile.logo_url}
                    onChange={(url) => setProfile({...profile, logo_url: url})}
                    placeholder="Upload logo file or drop image here"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Business Address</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    value={profile.address}
                    onChange={(e) => setProfile({...profile, address: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    value={profile.phone}
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tax ID / VAT Number</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    value={profile.tax_id}
                    onChange={(e) => setProfile({...profile, tax_id: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Social Media & Website Links Section */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 mb-4">Website & Social Media Links</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Website URL</label>
                  <input
                    type="url"
                    placeholder="https://yourbusiness.com"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm"
                    value={profile.website}
                    onChange={(e) => setProfile({...profile, website: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Facebook Page URL</label>
                  <input
                    type="url"
                    placeholder="https://facebook.com/yourbusiness"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm"
                    value={profile.facebook_url}
                    onChange={(e) => setProfile({...profile, facebook_url: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Instagram Profile URL</label>
                  <input
                    type="url"
                    placeholder="https://instagram.com/yourbusiness"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm"
                    value={profile.instagram_url}
                    onChange={(e) => setProfile({...profile, instagram_url: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">LinkedIn Company URL</label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/company/yourbusiness"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm"
                    value={profile.linkedin_url}
                    onChange={(e) => setProfile({...profile, linkedin_url: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Loyalty System & Store Discounts Section */}
            <div className="pt-6 border-t border-slate-100 bg-teal-50/50 p-5 rounded-xl border border-teal-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-teal-600" />
                    Customer Loyalty Program
                  </h4>
                  <p className="text-xs text-slate-500">Enable a points reward system for repeat customers at your store.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.enable_loyalty}
                    onChange={(e) => setProfile({...profile, enable_loyalty: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              {profile.enable_loyalty && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Points Earned per EC $1 Spent</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm bg-white"
                      value={profile.loyalty_points_per_dollar}
                      onChange={(e) => setProfile({...profile, loyalty_points_per_dollar: e.target.value})}
                    />
                    <p className="text-[10px] text-slate-400 mt-1">E.g., 1 point per $1 means a $100 order earns 100 points.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Points Required for EC $1 Discount</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm bg-white"
                      value={profile.loyalty_points_per_discount}
                      onChange={(e) => setProfile({...profile, loyalty_points_per_discount: e.target.value})}
                    />
                    <p className="text-[10px] text-slate-400 mt-1">E.g., 100 points = $1 off customer's next order.</p>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-teal-100/80">
                <h5 className="text-xs font-bold text-slate-800 mb-2">Store Promo Discount Code</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Promo Code (e.g. SUMMER10)</label>
                    <input
                      type="text"
                      placeholder="e.g. SAVE10"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm bg-white uppercase font-mono"
                      value={profile.promo_code}
                      onChange={(e) => setProfile({...profile, promo_code: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Promo Discount %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="10"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm bg-white"
                      value={profile.promo_discount_percent}
                      onChange={(e) => setProfile({...profile, promo_discount_percent: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 rounded-xl transition-colors">
              Save Profile Changes
            </button>
          </form>
        </div>
      )}

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

      {/* Low Stock Alert Notifications */}
      <LowStockNotifications products={products} onStockUpdated={fetchData} />

      {/* Sales & Revenue Trends Analytics Chart */}
      <SalesRevenueChart orders={orders} />

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
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price (EC $)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm"
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
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm"
                    value={vatPercent}
                    onChange={(e) => setVatPercent(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Discount %</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">SKU Code</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <ImageUploader
                  label="Product Image"
                  value={imageUrl}
                  onChange={(url) => setImageUrl(url)}
                  placeholder="Upload product image or drop file here"
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
                    <div className="flex-grow flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-slate-900 leading-tight">{product.name}</h4>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {product.sku && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono">{product.sku}</span>}
                            <button
                              type="button"
                              onClick={() => handleStartEditProduct(product)}
                              className="p-1 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                              title="Edit Product"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-slate-500 line-clamp-1 mb-2 mt-1">{product.description}</p>
                      </div>
                      <div className="flex justify-between items-end pt-2 border-t border-slate-100">
                        <div>
                          {product.discount_percent > 0 ? (
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-bold text-teal-600">
                                  EC ${(product.price * (1 - product.discount_percent / 100)).toFixed(2)}
                                </p>
                                <span className="bg-rose-100 text-rose-700 font-bold text-[10px] px-1.5 py-0.5 rounded">
                                  {product.discount_percent}% OFF
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 line-through">EC ${product.price.toFixed(2)}</p>
                            </div>
                          ) : (
                            <p className="font-bold text-teal-600">EC ${product.price.toFixed(2)}</p>
                          )}
                          <p className="text-[10px] text-slate-400">+ {product.vat_percent}% VAT</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                            product.stock_quantity > 0 ? 'bg-slate-100 text-slate-700' : 'bg-red-100 text-red-600'
                          }`}>
                            Stock: {product.stock_quantity}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-teal-600" />
                Edit Product
              </h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price (EC $)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">VAT %</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm"
                    value={editVatPercent}
                    onChange={(e) => setEditVatPercent(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Discount %</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm"
                    value={editDiscountPercent}
                    onChange={(e) => setEditDiscountPercent(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">SKU Code</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    value={editSku}
                    onChange={(e) => setEditSku(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    value={editStockQuantity}
                    onChange={(e) => setEditStockQuantity(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <ImageUploader
                  label="Product Image"
                  value={editImageUrl}
                  onChange={(url) => setEditImageUrl(url)}
                  placeholder="Upload product image or drop file here"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="w-1/2 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
