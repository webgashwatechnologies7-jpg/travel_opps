import React from 'react';
import { RefreshCw, Smartphone } from 'lucide-react';

const QrScanner = ({ qrCode, status, onRefresh }) => {
    return (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-xl max-w-md mx-auto mt-20 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Smartphone className="text-green-500" />
                Connect Your WhatsApp
            </h2>

            <div className="relative p-4 bg-gray-50 rounded-xl mb-6">
                {qrCode ? (
                    <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64 border-2 border-white rounded-lg shadow-sm" />
                ) : (
                    <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded-lg animate-pulse">
                        <RefreshCw className="w-12 h-12 text-gray-300 animate-spin" />
                    </div>
                )}

                {status === 'Connected' && (
                    <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center rounded-lg">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                            <div className="w-8 h-8 bg-green-500 rounded-full" />
                        </div>
                        <p className="text-green-600 font-bold">Connected!</p>
                    </div>
                )}
            </div>

            <div className="space-y-4 text-center">
                <ol className="text-sm text-gray-600 text-left list-decimal pl-5 space-y-2">
                    <li>Open WhatsApp on your phone</li>
                    <li>Tap <strong>Menu</strong> or <strong>Settings</strong> and select <strong>Linked Devices</strong></li>
                    <li>Tap on <strong>Link a Device</strong></li>
                    <li>Point your phone to this screen to capture the code</li>
                </ol>

                <button
                    onClick={onRefresh}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full transition-all font-medium shadow-md shadow-green-200"
                >
                    <RefreshCw size={18} />
                    Refresh QR Code
                </button>
            </div>
        </div>
    );
};

export default QrScanner;
