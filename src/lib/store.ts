/**
 * KAI Shop Assistant - Zustand Store
 * Manages cart, session, and UI state
 */

import { create } from 'zustand';

export interface CartItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface KAIMessage {
  role: 'kai' | 'customer';
  text: string;
  timestamp: Date;
}

interface KAIStore {
  // Session
  sessionId: string;
  isListening: boolean;
  orderStatus: 'idle' | 'taking_order' | 'confirming' | 'complete';
  
  // Cart
  cart: CartItem[];
  total: number;
  
  // Messages
  messages: KAIMessage[];
  suggestions: string[];
  
  // UI
  showQR: boolean;
  isProcessing: boolean;
  
  // Usage (mini widget)
  tokensUsed: number;
  
  // Actions
  setListening: (listening: boolean) => void;
  setProcessing: (processing: boolean) => void;
  addToCart: (items: CartItem[]) => void;
  removeFromCart: (itemName: string) => void;
  clearCart: () => void;
  addMessage: (role: 'kai' | 'customer', text: string) => void;
  setSuggestions: (suggestions: string[]) => void;
  setOrderStatus: (status: 'idle' | 'taking_order' | 'confirming' | 'complete') => void;
  setShowQR: (show: boolean) => void;
  addTokens: (count: number) => void;
  resetSession: () => void;
}

const generateSessionId = () => {
  return `KAI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const useKAIStore = create<KAIStore>((set, get) => ({
  // Initial state
  sessionId: generateSessionId(),
  isListening: false,
  orderStatus: 'idle',
  cart: [],
  total: 0,
  messages: [],
  suggestions: [],
  showQR: false,
  isProcessing: false,
  tokensUsed: 0,
  
  // Actions
  setListening: (listening) => set({ isListening: listening }),
  
  setProcessing: (processing) => set({ isProcessing: processing }),
  
  addToCart: (items) => set((state) => {
    const newCart = [...state.cart];
    
    items.forEach((item) => {
      const existing = newCart.find((c) => c.name === item.name);
      if (existing) {
        existing.quantity += item.quantity;
        existing.total = existing.quantity * existing.price;
      } else {
        newCart.push(item);
      }
    });
    
    const total = newCart.reduce((sum, item) => sum + item.total, 0);
    return { cart: newCart, total };
  }),
  
  removeFromCart: (itemName) => set((state) => {
    const newCart = state.cart.filter((item) => item.name !== itemName);
    const total = newCart.reduce((sum, item) => sum + item.total, 0);
    return { cart: newCart, total };
  }),
  
  clearCart: () => set({ cart: [], total: 0 }),
  
  addMessage: (role, text) => set((state) => ({
    messages: [...state.messages, { role, text, timestamp: new Date() }]
  })),
  
  setSuggestions: (suggestions) => set({ suggestions }),
  
  setOrderStatus: (status) => set({ orderStatus: status }),
  
  setShowQR: (show) => set({ showQR: show }),
  
  addTokens: (count) => set((state) => ({ tokensUsed: state.tokensUsed + count })),
  
  resetSession: () => set({
    sessionId: generateSessionId(),
    isListening: false,
    orderStatus: 'idle',
    cart: [],
    total: 0,
    messages: [],
    suggestions: [],
    showQR: false,
    isProcessing: false,
  }),
}));
