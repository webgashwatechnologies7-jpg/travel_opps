import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Loader2, Send, Mail, MessageSquare } from 'lucide-react';
import { marketingEmailCampaignsAPI, marketingWhatsappCampaignsAPI } from '../services/api';

const CampaignProgressModal = ({ isOpen, onClose, campaignId, type, totalLeads }) => {
    const [progress, setProgress] = useState(0);
    const [stats, setStats] = useState({ sent: 0, failed: 0 });
    const [status, setStatus] = useState('processing'); // processing, completed, error
    const [error, setError] = useState(null);

    useEffect(() => {
        let interval;
        if (isOpen && campaignId) {
            interval = setInterval(async () => {
                try {
                    const api = type === 'email' ? marketingEmailCampaignsAPI : marketingWhatsappCampaignsAPI;
                    const response = await api.getOne(campaignId);

                    if (response.data?.success) {
                        const data = response.data.data;
                        const sent = data.sent_count || 0;
                        const failed = data.failed_count || 0;
                        const total = data.total_leads || totalLeads || 1;

                        const currentProgress = Math.min(Math.round(((sent + failed) / total) * 100), 100);
                        setProgress(currentProgress);
                        setStats({ sent, failed });

                        if (data.status === 'sent' || data.status === 'failed' || currentProgress >= 100) {
                            setStatus('completed');
                            clearInterval(interval);
                        }
                    }
                } catch (err) {
                    console.error('Polling error:', err);
                    // Don't stop on single error, maybe temporary network blip
                }
            }, 1500);
        }

        return () => clearInterval(interval);
    }, [isOpen, campaignId, type, totalLeads]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl transform animate-in zoom-in duration-300">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                            {type === 'email' ? <Mail className="w-6 h-6 text-blue-600" /> : <MessageSquare className="w-6 h-6 text-green-600" />}
                            <span>Campaign Progress</span>
                        </h3>
                        {status === 'completed' && (
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col items-center justify-center py-8">
                        {/* Circular Progress */}
                        <div className="relative w-40 h-40 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    className="text-gray-100"
                                    strokeWidth="10"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="70"
                                    cx="80"
                                    cy="80"
                                />
                                <circle
                                    className={`${status === 'completed' ? 'text-green-500' : 'text-blue-600'} transition-all duration-500 ease-out`}
                                    strokeWidth="10"
                                    strokeDasharray={440}
                                    strokeDashoffset={440 - (progress / 100) * 440}
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="70"
                                    cx="80"
                                    cy="80"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-4xl font-extrabold ${status === 'completed' ? 'text-green-600' : 'text-gray-900'}`}>{progress}%</span>
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{status === 'completed' ? 'Done' : 'Sending'}</span>
                            </div>
                        </div>

                        {/* Status Message */}
                        <div className="mt-10 w-full bg-gray-50 rounded-2xl p-4 border border-gray-100">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center">
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Sent Successfully</p>
                                    <p className="text-2xl font-black text-green-600">{stats.sent}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Failed</p>
                                    <p className="text-2xl font-black text-red-500">{stats.failed}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {status === 'completed' ? (
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-100 rounded-2xl">
                                <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
                                <p className="text-sm font-medium text-green-800">
                                    Campaign has been processed successfully.
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform active:scale-[0.98]"
                            >
                                Finish & View Results
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center space-x-3 text-gray-500 animate-pulse">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="font-semibold">Please wait, emails are being dispatched...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CampaignProgressModal;
