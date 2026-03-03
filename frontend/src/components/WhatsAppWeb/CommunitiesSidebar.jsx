import React from 'react';
import { Users, Plus, ChevronRight, Info } from 'lucide-react';

const CommunitiesSidebar = ({ onBack, loading }) => {
    // Dummy communities for now (replicate UI)
    const communities = [
        {
            id: 'comm_1',
            name: 'Travel Opps Community',
            desc: 'Business and travel updates',
            groups: 3,
            lastMsg: 'Announced a new package',
            time: '12:45 PM'
        }
    ];

    return (
        <div className="flex flex-col h-full overflow-hidden animate-in slide-in-from-left duration-300" style={{ background: '#111b21' }}>
            {/* Header */}
            <div className="flex items-center gap-6 px-4 py-4 shrink-0" style={{ background: '#202c33' }}>
                <button onClick={onBack} className="text-[#aebac1] hover:text-[#e9edef] transition-colors">
                    <Users size={24} />
                </button>
                <h2 className="text-[#e9edef] text-xl font-medium">Communities</h2>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto whatsapp-scroll">
                {/* New Community Action */}
                <div className="flex items-center gap-4 px-4 py-4 cursor-pointer hover:bg-[#202c33] transition-colors border-b border-[#1f2c33]">
                    <div className="w-12 h-12 rounded-lg bg-[#00a884] flex items-center justify-center text-white">
                        <Plus size={24} />
                    </div>
                    <span className="text-[#e9edef] text-[17px]">New community</span>
                </div>

                {/* Communities List */}
                {communities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-10 text-center space-y-4">
                        <div className="w-20 h-20 rounded-full bg-[#202c33] flex items-center justify-center">
                            <Users size={40} className="text-[#aebac1] opacity-50" />
                        </div>
                        <h3 className="text-[#e9edef] text-lg">Stay connected with a community</h3>
                        <p className="text-[#8696a0] text-sm font-light">
                            Communities bring members together in topic-based groups, and make it easy to get admin announcements.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {communities.map(comm => (
                            <div key={comm.id} className="group flex items-center gap-4 px-4 py-4 cursor-pointer hover:bg-[#202c33] transition-colors border-b border-[#1f2c33]">
                                <div className="relative shrink-0">
                                    <div className="w-12 h-12 rounded-lg bg-[#2a3942] flex items-center justify-center shadow-sm">
                                        <Users size={24} className="text-[#aebac1]" />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 bg-[#00a884] rounded-full p-0.5 border-2 border-[#111b21]">
                                        <Plus size={8} className="text-white" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <h4 className="text-[#e9edef] text-[17px] font-medium truncate">{comm.name}</h4>
                                        <span className="text-[12px] text-[#8696a0]">{comm.time}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[13px] text-[#8696a0] truncate">{comm.lastMsg}</span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="px-5 py-6 flex flex-col items-center text-center">
                            <Info size={20} className="text-[#8696a0] mb-2" />
                            <p className="text-[13px] text-[#8696a0] font-light leading-relaxed">
                                You can add groups you're an admin of to your communities.
                            </p>
                            <button className="mt-4 text-[#00a884] text-sm font-medium hover:underline">
                                Learn more
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommunitiesSidebar;
