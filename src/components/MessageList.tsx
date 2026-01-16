'use client';

/**
 * MessageBubble Component
 * Chat message display
 */

import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import { useKAIStore, KAIMessage } from '@/lib/store';

export function MessageList() {
    const { messages } = useKAIStore();

    return (
        <div className="space-y-3 max-h-[300px] overflow-y-auto p-4">
            {messages.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-zinc-500">
                        Welcome to Jodhpur Namkeen!
                    </p>
                    <p className="text-sm text-zinc-600 mt-1">
                        Start by saying &quot;Hello&quot; or typing your order
                    </p>
                </div>
            ) : (
                messages.map((msg, i) => (
                    <MessageBubble key={i} message={msg} />
                ))
            )}
        </div>
    );
}

function MessageBubble({ message }: { message: KAIMessage }) {
    const isKAI = message.role === 'kai';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${isKAI ? '' : 'flex-row-reverse'}`}
        >
            {/* Avatar */}
            <div className={`
        w-8 h-8 rounded-full flex items-center justify-center shrink-0
        ${isKAI
                    ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                    : 'bg-zinc-700'
                }
      `}>
                {isKAI ? (
                    <Bot className="w-5 h-5 text-white" />
                ) : (
                    <User className="w-5 h-5 text-zinc-300" />
                )}
            </div>

            {/* Bubble */}
            <div className={`
        max-w-[80%] px-4 py-3 rounded-2xl
        ${isKAI
                    ? 'bg-zinc-800 text-white rounded-tl-none'
                    : 'bg-amber-500/20 text-amber-100 rounded-tr-none'
                }
      `}>
                <p className="text-sm leading-relaxed">{message.text}</p>
            </div>
        </motion.div>
    );
}
