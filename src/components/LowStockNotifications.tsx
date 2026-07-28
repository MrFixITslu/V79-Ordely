import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, Settings, RefreshCw, Plus, Package } from 'lucide-react';
import { api } from '../api';

interface Product {
  id: number;
  name: string;
  sku?: string;
  stock_quantity: number;
  image_url?: string;
  price: number;
}

interface LowStockNotificationsProps {
  products: Product[];
  onStockUpdated: () => void;
}

export function LowStockNotifications({ products, onStockUpdated }: LowStockNotificationsProps) {
  const [threshold, setThreshold] = useState<number>(() => {
    const saved = localStorage.getItem('vendor_low_stock_threshold');
    return saved ? parseInt(saved, 10) : 5;
  });

  const [showSettings, setShowSettings] = useState(false);
  const [stockInputs, setStockInputs] = useState<{ [key: number]: number }>({});
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem('vendor_low_stock_threshold', threshold.toString());
  }, [threshold]);

  const lowStockProducts = products.filter((p) => p.stock_quantity <= threshold);
  const outOfStockCount = lowStockProducts.filter((p) => p.stock_quantity === 0).length;

  const handleQuickRestock = async (productId: number, currentStock: number, addAmount: number) => {
    const newStock = (stockInputs[productId] !== undefined ? stockInputs[productId] : currentStock) + addAmount;
    setUpdatingId(productId);
    try {
      await api.updateStock(productId, newStock);
      setStockInputs((prev) => ({ ...prev, [productId]: newStock }));
      onStockUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to update stock');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSetExactStock = async (productId: number) => {
    const newStock = stockInputs[productId];
    if (newStock === undefined || isNaN(newStock) || newStock < 0) return;
    setUpdatingId(productId);
    try {
      await api.updateStock(productId, newStock);
      onStockUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to update stock');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header Bar */}
      <div className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b ${
        lowStockProducts.length > 0 
          ? outOfStockCount > 0 
            ? 'bg-red-50/70 border-red-100 text-red-900' 
            : 'bg-amber-50/70 border-amber-100 text-amber-900'
          : 'bg-emerald-50/70 border-emerald-100 text-emerald-900'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${
            lowStockProducts.length > 0
              ? outOfStockCount > 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
              : 'bg-emerald-100 text-emerald-600'
          }`}>
            {lowStockProducts.length > 0 ? (
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg">Inventory Stock Notifications</h3>
              {lowStockProducts.length > 0 && (
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  outOfStockCount > 0 ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'
                }`}>
                  {lowStockProducts.length} {lowStockProducts.length === 1 ? 'item' : 'items'}
                </span>
              )}
            </div>
            <p className="text-xs opacity-80 mt-0.5">
              {lowStockProducts.length > 0
                ? `${outOfStockCount > 0 ? `${outOfStockCount} out of stock. ` : ''}Items with stock ≤ ${threshold} units require attention.`
                : `All inventory is healthy! No products are below the ${threshold}-unit threshold.`}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white shadow-xs border border-slate-200 hover:bg-slate-50 transition-colors text-slate-700"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Threshold: {threshold} units</span>
          </button>
        </div>
      </div>

      {/* Threshold Config Panel */}
      {showSettings && (
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-700">Set Low Stock Alert Threshold:</label>
            <div className="flex items-center gap-1">
              {[3, 5, 10, 15, 20].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setThreshold(num)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                    threshold === num
                      ? 'bg-teal-600 text-white font-bold'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Custom Threshold:</span>
            <input
              type="number"
              min="0"
              value={threshold}
              onChange={(e) => setThreshold(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-16 px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
      )}

      {/* Low Stock Items Grid */}
      {lowStockProducts.length > 0 && (
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lowStockProducts.map((product) => {
              const currentInputVal = stockInputs[product.id] ?? product.stock_quantity;
              const isOut = product.stock_quantity === 0;

              return (
                <div
                  key={product.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                    isOut
                      ? 'bg-red-50/40 border-red-200/80 shadow-2xs'
                      : 'bg-amber-50/30 border-amber-200/80'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-lg border border-slate-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs flex-shrink-0">
                        <Package className="w-5 h-5 text-slate-400" />
                      </div>
                    )}

                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{product.name}</h4>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                            isOut
                              ? 'bg-red-600 text-white'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isOut ? 'Out of Stock' : `Low: ${product.stock_quantity} left`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {product.sku && (
                          <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-500">
                            {product.sku}
                          </span>
                        )}
                        <span className="text-xs font-semibold text-slate-600">
                          EC ${product.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Restock Action Bar */}
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={updatingId === product.id}
                        onClick={() => handleQuickRestock(product.id, product.stock_quantity, 5)}
                        className="text-xs bg-white hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <Plus className="w-3 h-3" />
                        +5 Stock
                      </button>
                      <button
                        type="button"
                        disabled={updatingId === product.id}
                        onClick={() => handleQuickRestock(product.id, product.stock_quantity, 10)}
                        className="text-xs bg-white hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <Plus className="w-3 h-3" />
                        +10 Stock
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        value={currentInputVal}
                        onChange={(e) =>
                          setStockInputs({
                            ...stockInputs,
                            [product.id]: Math.max(0, parseInt(e.target.value) || 0),
                          })
                        }
                        className="w-14 px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white text-center font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <button
                        type="button"
                        disabled={updatingId === product.id}
                        onClick={() => handleSetExactStock(product.id)}
                        className="text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                      >
                        {updatingId === product.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          'Save'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
