'use client';

/**
 * KAI Shop Assistant - Main Kiosk Page
 * McDonald's-style ordering interface
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store,
  CreditCard,
  RotateCcw,
  Zap,
  Volume2
} from 'lucide-react';

import { useKAIStore } from '@/lib/store';
import { VoiceButton } from '@/components/VoiceButton';
import { CartDisplay } from '@/components/CartDisplay';
import { ChatInput } from '@/components/ChatInput';
import { MessageList } from '@/components/MessageList';
import { Suggestions } from '@/components/Suggestions';
import { QRPayment } from '@/components/QRPayment';
import { saveOrder } from '@/lib/api';

export default function KioskPage() {
  const {
    sessionId,
    cart,
    total,
    orderStatus,
    showQR,
    tokensUsed,
    setShowQR,
    setOrderStatus,
    addMessage,
    resetSession
  } = useKAIStore();

  const [mounted, setMounted] = useState(false);

  // UPI Config
  const upiId = 'hackdomland-4@okhdfcbank';
  const shopName = 'Jodhpur Namkeen';

  useEffect(() => {
    setMounted(true);
    // Greet on mount
    setTimeout(() => {
      addMessage('kai', 'Namaste ji! Jodhpur Namkeen mein aapka swagat hai. Aaj kya lenge?');
    }, 500);
  }, []);

  const handlePayNow = async () => {
    if (cart.length === 0) return;

    // Save order to CSV
    try {
      await saveOrder({
        session_id: sessionId,
        items: cart,
        total,
        status: 'completed'
      });
    } catch (e) {
      console.error('Failed to save order:', e);
    }

    setOrderStatus('complete');
    setShowQR(true);
  };

  const handleNewOrder = () => {
    resetSession();
    setTimeout(() => {
      addMessage('kai', 'Namaste ji! Naya order shuru karte hain. Kya chahiye aapko?');
    }, 300);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white overflow-hidden">
      {/* Ambient gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-zinc-800/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">KAI</h1>
              <p className="text-xs text-zinc-500">Smart Shop Assistant</p>
            </div>
          </div>

          {/* Token counter (mini widget) */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>{tokensUsed} tokens</span>
            </div>
            <button
              onClick={handleNewOrder}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              title="New Order"
            >
              <RotateCcw className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Chat & Input */}
          <div className="space-y-6">
            {/* Shop name */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center lg:text-left"
            >
              <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                Jodhpur Namkeen
              </h2>
              <p className="text-zinc-500 mt-1">Since 1971 • Kota&apos;s Pride</p>
            </motion.div>

            {/* Messages */}
            <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-zinc-800">
              <MessageList />
            </div>

            {/* Suggestions */}
            <Suggestions />

            {/* Input area */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <VoiceButton />
                <div className="flex-1">
                  <ChatInput />
                </div>
              </div>

              {/* Voice status */}
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Volume2 className="w-4 h-4" />
                <span>Click mic to speak or type your order</span>
              </div>
            </div>
          </div>

          {/* Right: Cart */}
          <div className="space-y-6">
            <CartDisplay />

            {/* Pay button */}
            <AnimatePresence>
              {cart.length > 0 && orderStatus !== 'complete' && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  onClick={handlePayNow}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="
                    w-full py-5 rounded-2xl
                    bg-gradient-to-r from-amber-500 to-orange-500
                    hover:from-amber-400 hover:to-orange-400
                    font-bold text-lg text-white
                    flex items-center justify-center gap-3
                    shadow-lg shadow-amber-500/25
                    transition-all duration-200
                  "
                >
                  <CreditCard className="w-6 h-6" />
                  Pay ₹{total} Now
                </motion.button>
              )}
            </AnimatePresence>

            {/* Order complete message */}
            <AnimatePresence>
              {orderStatus === 'complete' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-2xl font-bold text-green-400">
                    Order Complete!
                  </h3>
                  <p className="text-zinc-500 mt-2">
                    Dhanyawad! Aapka order tayyar ho raha hai.
                  </p>
                  <button
                    onClick={handleNewOrder}
                    className="mt-6 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-white transition-colors"
                  >
                    Start New Order
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* QR Payment Modal */}
      <QRPayment upiId={upiId} shopName={shopName} />
    </div>
  );
}
