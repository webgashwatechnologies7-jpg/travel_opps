import React from 'react';
import { ArrowLeft, MessageSquare, Plus, MoreVertical, Search, ExternalLink } from 'lucide-react';

const ChannelsSidebar = ({ onBack }) => {
    // Dummy channels to replicate UI
    const channels = [
        {
            id: 'ch_1',
            name: 'WhatsApp Channels',
            desc: 'Find and follow accounts you care about',
            verified: true,
            followers: '10M'
        },
        {
            id: 'ch_2',
            name: 'Travel Updates',
            desc: 'Stay updated with global travel news',
            verified: true,
            followers: '5.2M'
        }
    ];

    return (
        <div className="flex flex-col h-full overflow-hidden animate-in slide-in-from-left duration-300" style={{ background: '#111b21' }}>
            {/* Header */}
            <div className="flex items-end gap-6 px-4 pb-4 pt-10 shrink-0 h-[108px]" style={{ background: '#202c33' }}>
                <button onClick={onBack} className="text-[#aebac1] hover:text-[#e9edef] transition-colors mb-1">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-[#e9edef] text-xl font-medium">Channels</h2>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto whatsapp-scroll">
                <div className="p-4 border-b border-[#1f2c33]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-[#e9edef] text-lg font-medium">Find channels</h3>
                        <div className="flex gap-4">
                            <Plus className="text-[#8696a0] cursor-pointer" size={20} />
                            <MoreVertical className="text-[#8696a0] cursor-pointer" size={20} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {channels.map(channel => (
                            <div key={channel.id} className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-[#202c33] shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1">
                                        <h4 className="text-[#e9edef] text-[15px] font-medium truncate">{channel.name}</h4>
                                        {channel.verified && <span className="w-3 h-3 bg-[#00a884] rounded-full flex items-center justify-center text-[8px] text-white">✓</span>}
                                    </div>
                                    <p className="text-[#8696a0] text-xs truncate">{channel.desc}</p>
                                </div>
                                <button className="px-4 py-1.5 rounded-full border border-[#2a3942] text-[#00a884] text-sm font-medium hover:bg-[#202c33] transition-colors">
                                    Follow
                                </button>
                            </div>
                        ))}
                    </div>

                    <button className="w-full mt-6 py-2 px-4 rounded-lg bg-[#202c33] text-[#00a884] text-sm font-medium hover:bg-[#2a3942] transition-colors flex items-center justify-center gap-2">
                        Discover more <ExternalLink size={14} />
                    </button>
                </div>

                <div className="px-6 py-10 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-[#202c33] flex items-center justify-center mb-4">
                        <MessageSquare size={32} className="text-[#aebac1] opacity-50" />
                    </div>
                    <h4 className="text-[#e9edef] text-[17px] mb-2">Keep up with your favorite topics</h4>
                    <p className="text-[#8696a0] text-sm font-light leading-relaxed">
                        Find and follow channels to stay updated on what’s happening.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ChannelsSidebar;
