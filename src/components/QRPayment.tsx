'use client';

/**
 * QRPayment Component
 * Dynamic UPI QR code generator
 */

import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, X, IndianRupee } from 'lucide-react';
import { useKAIStore } from '@/lib/store';

interface QRPaymentProps {
    upiId: string;
    shopName: string;
}

export function QRPayment({ upiId, shopName }: QRPaymentProps) {
    const { total, showQR, setShowQR, resetSession } = useKAIStore();

    // Generate UPI payment string
    const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(shopName)}&am=${total}&cu=INR`;

    const handleComplete = () => {
        // Reset session after payment
        setTimeout(() => {
            setShowQR(false);
            resetSession();
        }, 1000);
    };

    if (!showQR) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowQR(false)}
        >
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="bg-zinc-900 rounded-3xl p-8 max-w-sm w-full border border-zinc-800"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={() => setShowQR(false)}
                    className="absolute top-4 right-4 p-2 hover:bg-zinc-800 rounded-full"
                >
                    <X className="w-5 h-5 text-zinc-400" />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">
                        Scan to Pay
                    </h2>
                    <p className="text-zinc-400">{shopName}</p>
                </div>

                {/* Amount */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 mb-6 text-center">
                    <p className="text-white/80 text-sm mb-1">Amount</p>
                    <p className="text-4xl font-bold text-white flex items-center justify-center">
                        <IndianRupee className="w-8 h-8" />
                        {total}
                    </p>
                </div>

                {/* QR Code */}
                <div className="bg-white rounded-2xl p-6 mb-6">
                    <QRCodeSVG
                        value={upiString}
                        size={200}
                        level="H"
                        includeMargin={false}
                        className="w-full h-auto"
                    />
                </div>

                {/* UPI ID */}
                <p className="text-center text-zinc-500 text-sm mb-6">
                    UPI ID: <span className="text-zinc-300">{upiId}</span>
                </p>

                {/* Complete button */}
                <motion.button
                    onClick={handleComplete}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl font-bold text-white flex items-center justify-center gap-2"
                >
                    <CheckCircle2 className="w-5 h-5" />
                    Payment Received
                </motion.button>
            </motion.div>
        </motion.div>
    );
}
