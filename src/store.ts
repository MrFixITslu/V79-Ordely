import { create } from 'zustand';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'vendor' | 'admin';
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  token: localStorage.getItem('token') || null,
  login: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));

interface CartItem {
  product_id: number;
  name: string;
  price: number;
  vat_percent: number;
  quantity: number;
  vendor_id: number;
  vendor_name: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (product_id: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  addItem: (item) => set((state) => {
    const existing = state.items.find(i => i.product_id === item.product_id);
    if (existing) {
      return { items: state.items.map(i => i.product_id === item.product_id ? { ...i, quantity: i.quantity + item.quantity } : i) };
    }
    return { items: [...state.items, item] };
  }),
  removeItem: (product_id) => set((state) => ({ items: state.items.filter(i => i.product_id !== product_id) })),
  clearCart: () => set({ items: [] }),
}));
