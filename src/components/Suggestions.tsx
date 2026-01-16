'use client';

/**
 * Suggestions Component
 * Quick add buttons based on AI suggestions
 */

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useKAIStore } from '@/lib/store';

export function Suggestions() {
    const { suggestions } = useKAIStore();

    if (suggestions.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 flex-wrap"
        >
            <div className="flex items-center gap-2 text-zinc-500">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm">Try adding:</span>
            </div>
            {suggestions.map((suggestion) => (
                <motion.button
                    key={suggestion}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="
            px-4 py-2 rounded-full
            bg-amber-500/20 border border-amber-500/30
            text-amber-400 text-sm font-medium
            hover:bg-amber-500/30 transition-colors
          "
                >
                    + {suggestion}
                </motion.button>
            ))}
        </motion.div>
    );
}
