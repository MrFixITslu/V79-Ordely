import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import { useCartStore } from '../store';
import { ShoppingCart, Plus } from 'lucide-react';

export function VendorStore() {
  const { id } = useParams<{ id: string }>();
  const [vendor, setVendor] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    if (id) {
      Promise.all([
        api.getVendor(Number(id)),
        api.getProducts(Number(id))
      ]).then(([vendorData, productsData]) => {
        setVendor(vendorData);
        setProducts(productsData);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) return <div className="text-center py-20">Loading store...</div>;
  if (!vendor) return <div className="text-center py-20">Vendor not found.</div>;

  return (
    <div>
      <div className="bg-white rounded-3xl p-8 mb-8 shadow-sm border border-slate-100 flex items-center gap-6">
        {vendor.logo_url ? (
          <img src={vendor.logo_url} alt={vendor.business_name} className="w-24 h-24 object-cover rounded-2xl shadow-sm" />
        ) : (
          <div className="w-24 h-24 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center text-3xl font-bold">
            {vendor.business_name.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-2">{vendor.business_name}</h1>
          <p className="text-slate-600 max-w-2xl">{vendor.description || 'Welcome to our store!'}</p>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 mb-6">Products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-48 object-cover rounded-xl mb-4" />
            ) : (
              <div className="w-full h-48 bg-slate-100 rounded-xl mb-4 flex items-center justify-center text-slate-400">
                No Image
              </div>
            )}
            <h3 className="text-lg font-bold text-slate-900 mb-1">{product.name}</h3>
            <p className="text-sm text-slate-500 mb-4 flex-grow line-clamp-2">{product.description}</p>
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
              <div>
                <p className="text-xl font-bold text-teal-600">EC ${product.price.toFixed(2)}</p>
                <p className="text-xs text-slate-400">+ {product.vat_percent}% VAT</p>
              </div>
              <button
                onClick={() => addItem({
                  product_id: product.id,
                  name: product.name,
                  price: product.price,
                  vat_percent: product.vat_percent,
                  quantity: 1,
                  vendor_id: vendor.id,
                  vendor_name: vendor.business_name
                })}
                className="bg-slate-900 hover:bg-teal-500 text-white p-2 rounded-lg transition-colors"
                title="Add to Cart"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      {products.length === 0 && (
        <div className="text-center py-20 text-slate-500 bg-white rounded-2xl border border-slate-100">
          This vendor has no products yet.
        </div>
      )}
    </div>
  );
}
