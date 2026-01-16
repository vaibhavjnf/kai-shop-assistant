'use client';

/**
 * ChatInput Component
 * Text input for typing orders
 */

import { useState, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';
import { useKAIStore } from '@/lib/store';
import { sendMessage } from '@/lib/api';

export function ChatInput() {
    const [input, setInput] = useState('');
    const {
        sessionId,
        cart,
        isProcessing,
        setProcessing,
        addMessage,
        addToCart,
        removeFromCart,
        setSuggestions,
        setOrderStatus,
        setShowQR
    } = useKAIStore();

    const handleSend = async () => {
        if (!input.trim() || isProcessing) return;

        const message = input.trim();
        setInput('');
        setProcessing(true);
        addMessage('customer', message);

        try {
            const response = await sendMessage({
                session_id: sessionId,
                message,
                current_cart: cart,
            });

            // Add AI message
            addMessage('kai', response.speech);

            // Update cart
            if (response.items_added?.length) {
                addToCart(response.items_added);
            }
            if (response.items_removed?.length) {
                response.items_removed.forEach((item) => removeFromCart(item.name));
            }

            // Update suggestions
            setSuggestions(response.suggestions || []);

            // Update order status
            setOrderStatus(response.order_status);

            // Show QR if order complete
            if (response.order_status === 'complete') {
                setTimeout(() => setShowQR(true), 500);
            }

        } catch (error) {
            addMessage('kai', 'Maaf kijiye, kuch gadbad ho gayi. Phir se try kijiye.');
        } finally {
            setProcessing(false);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex items-center gap-3">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your order... (e.g., 2 samosa aur 1 chai)"
                disabled={isProcessing}
                className="
          flex-1 px-5 py-4 
          bg-zinc-800/50 border border-zinc-700 
          rounded-xl text-white placeholder-zinc-500
          focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
          transition-all duration-200
          disabled:opacity-50
        "
            />
            <motion.button
                onClick={handleSend}
                disabled={!input.trim() || isProcessing}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="
          p-4 rounded-xl
          bg-gradient-to-r from-amber-500 to-orange-500
          hover:from-amber-400 hover:to-orange-400
          disabled:from-zinc-700 disabled:to-zinc-800 disabled:cursor-not-allowed
          transition-all duration-200
        "
            >
                {isProcessing ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                    <Send className="w-6 h-6 text-white" />
                )}
            </motion.button>
        </div>
    );
}
