import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useCartStore, useAuthStore } from '../store';
import { Plus, Globe, MapPin, Phone, FileText, Facebook, Instagram, Linkedin, MessageSquare, Sparkles, Tag } from 'lucide-react';

export function VendorStore() {
  const { id } = useParams<{ id: string }>();
  const [vendor, setVendor] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loyaltyInfo, setLoyaltyInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (id) {
      const promises: Promise<any>[] = [
        api.getVendor(Number(id)),
        api.getProducts(Number(id))
      ];
      if (user) {
        promises.push(api.getVendorLoyalty(Number(id)).catch(() => null));
      }

      Promise.all(promises).then(([vendorData, productsData, loyaltyData]) => {
        setVendor(vendorData);
        setProducts(productsData);
        if (loyaltyData) {
          setLoyaltyInfo(loyaltyData);
        }
        setLoading(false);
      });
    }
  }, [id, user]);

  if (loading) return <div className="text-center py-20">Loading store...</div>;
  if (!vendor) return <div className="text-center py-20">Vendor not found.</div>;

  return (
    <div>
      <div className="bg-white rounded-3xl p-8 mb-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center gap-6">
        {vendor.logo_url ? (
          <img src={vendor.logo_url} alt={vendor.business_name} className="w-28 h-28 object-cover rounded-2xl shadow-sm border border-slate-100 shrink-0" />
        ) : (
          <div className="w-28 h-28 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center text-4xl font-bold shrink-0">
            {vendor.business_name.charAt(0)}
          </div>
        )}
        <div className="flex-grow space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900">{vendor.business_name}</h1>
              {vendor.owner_name && <p className="text-xs text-slate-400">By {vendor.owner_name}</p>}
            </div>

            {/* Social & Website Header Links */}
            <div className="flex flex-wrap items-center gap-2">
              {vendor.user_id && (
                <Link
                  to={`/messages?userId=${vendor.user_id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Message Vendor</span>
                </Link>
              )}
              {vendor.website && (
                <a
                  href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 text-xs font-semibold transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Website</span>
                </a>
              )}
              {vendor.facebook_url && (
                <a
                  href={vendor.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  title="Facebook Page"
                >
                  <Facebook className="w-4 h-4 text-blue-600" />
                </a>
              )}
              {vendor.instagram_url && (
                <a
                  href={vendor.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  title="Instagram Profile"
                >
                  <Instagram className="w-4 h-4 text-pink-600" />
                </a>
              )}
              {vendor.linkedin_url && (
                <a
                  href={vendor.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  title="LinkedIn Page"
                >
                  <Linkedin className="w-4 h-4 text-blue-700" />
                </a>
              )}
            </div>
          </div>

          <p className="text-slate-600 text-sm max-w-3xl">{vendor.description || 'Welcome to our store!'}</p>

          {/* Contact Details */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
            {vendor.address && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-teal-600" /> {vendor.address}
              </span>
            )}
            {vendor.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-teal-600" /> {vendor.phone}
              </span>
            )}
            {vendor.tax_id && (
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-teal-600" /> Tax ID: {vendor.tax_id}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Loyalty Rewards & Store Promos Banner */}
      {(vendor.enable_loyalty === 1 || vendor.promo_code) && (
        <div className="bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl p-6 text-white mb-8 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <h3 className="text-lg font-bold">Store Rewards & Loyalty Program</h3>
            </div>
            {vendor.enable_loyalty === 1 && (
              <p className="text-xs text-teal-100">
                Earn <strong>{vendor.loyalty_points_per_dollar || 1} points</strong> for every EC $1 spent. Redeem <strong>{vendor.loyalty_points_per_discount || 100} points</strong> for $1 off!
              </p>
            )}
            {vendor.promo_code && (
              <p className="text-xs text-amber-200 font-medium flex items-center gap-1 pt-1">
                <Tag className="w-3.5 h-3.5" />
                <span>Use Promo Code <strong className="bg-white/20 px-2 py-0.5 rounded text-white uppercase">{vendor.promo_code}</strong> at checkout for {vendor.promo_discount_percent}% OFF!</span>
              </p>
            )}
          </div>

          {loyaltyInfo && (
            <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-xl border border-white/20 shrink-0 text-center md:text-right">
              <p className="text-[11px] text-teal-100 uppercase tracking-wider font-semibold">Your Loyalty Balance</p>
              <p className="text-2xl font-black text-amber-300">{loyaltyInfo.points || 0} <span className="text-xs font-bold text-white">pts</span></p>
            </div>
          )}
        </div>
      )}

      <h2 className="text-2xl font-bold text-slate-900 mb-6">Products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => {
          const hasDiscount = product.discount_percent > 0;
          const discountedPrice = hasDiscount ? product.price * (1 - product.discount_percent / 100) : product.price;

          return (
            <div key={product.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col relative overflow-hidden">
              {hasDiscount && (
                <div className="absolute top-3 right-3 bg-rose-500 text-white font-extrabold text-[11px] px-2.5 py-1 rounded-full shadow-sm z-10">
                  {product.discount_percent}% OFF
                </div>
              )}
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-48 object-cover rounded-xl mb-4" />
              ) : (
                <div className="w-full h-48 bg-slate-100 rounded-xl mb-4 flex items-center justify-center text-slate-400">
                  No Image
                </div>
              )}
              <div className="flex justify-between items-start mb-1">
                <h3 className="text-lg font-bold text-slate-900">{product.name}</h3>
                {product.sku && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono">{product.sku}</span>}
              </div>
              <p className="text-sm text-slate-500 mb-2 flex-grow line-clamp-2">{product.description}</p>
              <div className="mb-4">
                <span className={`text-xs font-medium ${product.stock_quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {product.stock_quantity > 0 ? `In Stock (${product.stock_quantity})` : 'Out of Stock'}
                </span>
              </div>
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                <div>
                  {hasDiscount ? (
                    <div>
                      <p className="text-xl font-bold text-teal-600">EC ${discountedPrice.toFixed(2)}</p>
                      <p className="text-xs text-slate-400 line-through">EC ${product.price.toFixed(2)}</p>
                    </div>
                  ) : (
                    <p className="text-xl font-bold text-teal-600">EC ${product.price.toFixed(2)}</p>
                  )}
                  <p className="text-xs text-slate-400">+ {product.vat_percent}% VAT</p>
                </div>
                <button
                  onClick={() => addItem({
                    product_id: product.id,
                    name: product.name,
                    price: discountedPrice,
                    vat_percent: product.vat_percent,
                    discount_percent: product.discount_percent,
                    quantity: 1,
                    vendor_id: vendor.id,
                    vendor_name: vendor.business_name,
                    vendor_logo: vendor.logo_url,
                    vendor_address: vendor.address,
                    vendor_phone: vendor.phone,
                    vendor_tax_id: vendor.tax_id,
                    vendor_website: vendor.website,
                    vendor_facebook: vendor.facebook_url,
                    vendor_instagram: vendor.instagram_url,
                    vendor_linkedin: vendor.linkedin_url
                  })}
                  disabled={product.stock_quantity <= 0}
                  className="bg-slate-900 hover:bg-teal-500 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={product.stock_quantity > 0 ? "Add to Cart" : "Out of Stock"}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {products.length === 0 && (
        <div className="text-center py-20 text-slate-500 bg-white rounded-2xl border border-slate-100">
          This vendor has no products yet.
        </div>
      )}
    </div>
  );
}
