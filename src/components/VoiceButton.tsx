'use client';

/**
 * VoiceButton Component
 * Animated microphone button with listening state
 */

import { motion } from 'framer-motion';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useKAIStore } from '@/lib/store';

export function VoiceButton() {
    const { isListening, isProcessing, setListening } = useKAIStore();

    const handleClick = () => {
        if (!isProcessing) {
            setListening(!isListening);
        }
    };

    return (
        <motion.button
            onClick={handleClick}
            disabled={isProcessing}
            className={`
        relative w-20 h-20 rounded-full
        flex items-center justify-center
        transition-all duration-300 ease-out
        ${isListening
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/50'
                    : 'bg-gradient-to-br from-zinc-700 to-zinc-800 hover:from-zinc-600 hover:to-zinc-700'
                }
        ${isProcessing ? 'cursor-wait' : 'cursor-pointer'}
      `}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: isProcessing ? 1 : 1.05 }}
        >
            {/* Pulsing ring when listening */}
            {isListening && (
                <>
                    <motion.div
                        className="absolute inset-0 rounded-full bg-amber-400/30"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <motion.div
                        className="absolute inset-0 rounded-full bg-amber-400/20"
                        animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                    />
                </>
            )}

            {/* Icon */}
            <motion.div
                animate={{ scale: isListening ? [1, 1.1, 1] : 1 }}
                transition={{ duration: 0.5, repeat: isListening ? Infinity : 0 }}
            >
                {isProcessing ? (
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : isListening ? (
                    <Mic className="w-8 h-8 text-white" />
                ) : (
                    <MicOff className="w-8 h-8 text-zinc-400" />
                )}
            </motion.div>
        </motion.button>
    );
}
