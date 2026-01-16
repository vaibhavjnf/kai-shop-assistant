'use client';

/**
 * CartDisplay Component
 * Live order view with animations
 */

import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Trash2, IndianRupee } from 'lucide-react';
import { useKAIStore } from '@/lib/store';

export function CartDisplay() {
    const { cart, total, removeFromCart, orderStatus } = useKAIStore();

    return (
        <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-white" />
                <h2 className="font-bold text-white">YOUR ORDER</h2>
                {cart.length > 0 && (
                    <span className="ml-auto bg-white/20 text-white text-sm px-2 py-0.5 rounded-full">
                        {cart.length} items
                    </span>
                )}
            </div>

            {/* Items */}
            <div className="p-4 max-h-[400px] overflow-y-auto">
                <AnimatePresence mode="popLayout">
                    {cart.length === 0 ? (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-zinc-500 text-center py-8"
                        >
                            Your cart is empty
                            <br />
                            <span className="text-sm">Start ordering by speaking or typing!</span>
                        </motion.p>
                    ) : (
                        cart.map((item, index) => (
                            <motion.div
                                key={item.name}
                                initial={{ opacity: 0, x: 50, scale: 0.8 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: -50, scale: 0.8 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                className="flex items-center gap-3 p-3 mb-2 bg-zinc-800/50 rounded-xl group"
                            >
                                {/* Item info */}
                                <div className="flex-1">
                                    <p className="font-medium text-white">{item.name}</p>
                                    <p className="text-sm text-zinc-400">
                                        {item.quantity} × ₹{item.price}
                                    </p>
                                </div>

                                {/* Total */}
                                <div className="text-amber-400 font-bold flex items-center">
                                    <IndianRupee className="w-4 h-4" />
                                    {item.total}
                                </div>

                                {/* Remove button */}
                                {orderStatus !== 'complete' && (
                                    <button
                                        onClick={() => removeFromCart(item.name)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-500/20 rounded-lg"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-400" />
                                    </button>
                                )}
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Total */}
            {cart.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-t border-zinc-800 p-4"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Total</span>
                        <span className="text-2xl font-bold text-white flex items-center">
                            <IndianRupee className="w-6 h-6 text-amber-400" />
                            <span className="text-amber-400">{total}</span>
                        </span>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
