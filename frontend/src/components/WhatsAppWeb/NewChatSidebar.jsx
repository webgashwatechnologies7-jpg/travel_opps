import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, User, Users, Plus, Check, ArrowRight } from 'lucide-react';
import { companySettingsAPI, whatsappWebAPI } from '../../services/api';
import { toast } from 'react-toastify';

const NewChatSidebar = ({ onBack, onSelectUser, loading: parentLoading }) => {
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [view, setView] = useState('list'); // 'list', 'new_contact', 'new_group'

    // New Contact State
    const [newContactNumber, setNewContactNumber] = useState('');

    // New Group State
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [groupName, setGroupName] = useState('');

    useEffect(() => {
        const fetchTeam = async () => {
            try {
                const response = await companySettingsAPI.getMyTeam();
                if (response.data.success) {
                    setTeam(response.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch team members:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTeam();
    }, []);

    const filteredTeam = team.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.phone && member.phone.includes(searchTerm))
    );

    const handleStartNewContact = () => {
        if (!newContactNumber) {
            toast.error('Please enter a phone number');
            return;
        }
        const cleanNumber = newContactNumber.replace(/[^0-9]/g, '');
        if (cleanNumber.length < 10) {
            toast.error('Invalid phone number');
            return;
        }

        const jid = cleanNumber.length === 10 ? `91${cleanNumber}@s.whatsapp.net` : `${cleanNumber}@s.whatsapp.net`;
        onSelectUser({
            id: 'temp_' + Date.now(),
            name: `+${cleanNumber}`,
            phone: cleanNumber,
            chat_id: jid
        });
    };

    const handleCreateGroup = async () => {
        if (!groupName) {
            toast.error('Please enter a group name');
            return;
        }
        if (selectedMembers.length === 0) {
            toast.error('Please select at least one member');
            return;
        }

        try {
            setLoading(true);
            const participants = team
                .filter(m => selectedMembers.includes(m.id))
                .map(m => m.phone)
                .filter(p => !!p);

            const response = await whatsappWebAPI.createGroup({
                name: groupName,
                participants: participants
            });

            if (response.data.success) {
                toast.success('Group created successfully!');
                onSelectUser({
                    chat_id: response.data.data.chat_id,
                    chat_name: response.data.data.chat_name
                });
            }
        } catch (error) {
            console.error('Failed to create group:', error);
            toast.error(error.response?.data?.message || 'Failed to create group');
        } finally {
            setLoading(false);
        }
    };

    const toggleMemberSelection = (memberId) => {
        setSelectedMembers(prev =>
            prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        );
    };

    if (view === 'new_contact') {
        return (
            <div className="flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-300" style={{ background: '#111b21' }}>
                <div className="flex items-end gap-6 px-4 pb-4 pt-10 shrink-0 h-[108px]" style={{ background: '#202c33' }}>
                    <button onClick={() => setView('list')} className="text-[#aebac1] hover:text-[#e9edef] transition-colors mb-1">
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="text-[#e9edef] text-xl font-medium">New contact</h2>
                </div>
                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[#00a884] text-sm">Phone Number</label>
                        <input
                            type="text"
                            placeholder="e.g. 9198XXXXXXXX"
                            value={newContactNumber}
                            onChange={(e) => setNewContactNumber(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg outline-none text-[#e9edef]"
                            style={{ background: '#2a3942' }}
                            autoFocus
                        />
                        <p className="text-[11px] text-[#8696a0]">Include country code without + (e.g. 91 for India)</p>
                    </div>
                    <button
                        onClick={handleStartNewContact}
                        className="w-full py-3 bg-[#00a884] text-white rounded-lg font-medium hover:bg-[#008f6f] transition-colors uppercase tracking-wider text-sm"
                    >
                        Start Chat
                    </button>
                </div>
            </div>
        );
    }

    if (view === 'new_group') {
        return (
            <div className="flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-300" style={{ background: '#111b21' }}>
                <div className="flex items-end gap-6 px-4 pb-4 pt-10 shrink-0 h-[108px]" style={{ background: '#202c33' }}>
                    <button onClick={() => setView('list')} className="text-[#aebac1] hover:text-[#e9edef] transition-colors mb-1">
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="text-[#e9edef] text-xl font-medium">Add group members</h2>
                </div>

                <div className="px-3 py-4 shrink-0" style={{ background: '#111b21' }}>
                    <input
                        type="text"
                        placeholder="Group Name"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="w-full px-4 py-2 text-sm rounded-lg outline-none border-b border-[#00a884] mb-4"
                        style={{ background: 'transparent', color: '#e9edef' }}
                    />
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4" style={{ color: '#8696a0' }} />
                        <input
                            type="text"
                            placeholder="Search members"
                            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg outline-none"
                            style={{ background: '#202c33', color: '#e9edef' }}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto whatsapp-scroll">
                    {team.map(member => (
                        <div
                            key={member.id}
                            onClick={() => toggleMemberSelection(member.id)}
                            className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-[#202c33] transition-colors border-b border-[#1f2c33]"
                        >
                            <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${selectedMembers.includes(member.id) ? 'bg-[#00a884] border-[#00a884]' : 'border-[#8696a0]'}`}>
                                {selectedMembers.includes(member.id) && <Check size={14} className="text-white" />}
                            </div>
                            <div className="w-10 h-10 rounded-full bg-[#2a3942] flex items-center justify-center text-[#aebac1] font-semibold">
                                {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-[#e9edef] text-[15px] truncate">{member.name}</h4>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 shrink-0 flex justify-center" style={{ background: '#111b21' }}>
                    <button
                        onClick={handleCreateGroup}
                        disabled={loading || !groupName || selectedMembers.length === 0}
                        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${loading || !groupName || selectedMembers.length === 0 ? 'bg-[#2a3942] text-[#8696a0]' : 'bg-[#00a884] text-white hover:bg-[#008f6f]'}`}
                    >
                        {loading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ArrowRight size={28} />}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-hidden animate-in slide-in-from-left duration-300" style={{ background: '#111b21' }}>
            {/* Header */}
            <div className="flex items-end gap-6 px-4 pb-4 pt-10 shrink-0 h-[108px]" style={{ background: '#202c33' }}>
                <button onClick={onBack} className="text-[#aebac1] hover:text-[#e9edef] transition-colors mb-1">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-[#e9edef] text-xl font-medium">New chat</h2>
            </div>

            {/* Search */}
            <div className="px-3 pt-2 pb-1 shrink-0" style={{ background: '#111b21' }}>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4" style={{ color: '#8696a0' }} />
                    <input
                        type="text"
                        placeholder="Search name or number"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm rounded-lg outline-none"
                        style={{
                            background: '#202c33',
                            color: '#e9edef',
                            fontWeight: 300
                        }}
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto whatsapp-scroll">
                {/* Actions */}
                <div onClick={() => setView('new_group')} className="flex items-center gap-4 px-4 py-4 cursor-pointer hover:bg-[#202c33] transition-colors">
                    <div className="w-12 h-12 rounded-full bg-[#00a884] flex items-center justify-center text-[#e9edef]">
                        <Users size={24} />
                    </div>
                    <span className="text-[#e9edef] text-[17px]">New group</span>
                </div>
                <div onClick={() => setView('new_contact')} className="flex items-center gap-4 px-4 py-4 cursor-pointer hover:bg-[#202c33] transition-colors">
                    <div className="w-12 h-12 rounded-full bg-[#00a884] flex items-center justify-center text-[#e9edef]">
                        <User size={24} />
                    </div>
                    <span className="text-[#e9edef] text-[17px]">New contact</span>
                </div>

                {/* Team Section Title */}
                <div className="px-4 py-6">
                    <h3 className="text-[#00a884] text-sm uppercase tracking-wider">Team Members</h3>
                </div>

                {loading ? (
                    <div className="flex flex-col gap-0 px-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-3 py-3 animate-pulse">
                                <div className="w-12 h-12 rounded-full bg-[#202c33] shrink-0" />
                                <div className="flex-1">
                                    <div className="h-4 bg-[#202c33] rounded w-1/3 mb-2" />
                                    <div className="h-3 bg-[#202c33] rounded w-2/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredTeam.length === 0 ? (
                    <div className="p-10 text-center">
                        <p className="text-[#8696a0] text-sm">No team members found</p>
                    </div>
                ) : (
                    filteredTeam.map(member => (
                        <div
                            key={member.id}
                            onClick={() => onSelectUser(member)}
                            className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-[#202c33] transition-colors border-b border-[#1f2c33]"
                        >
                            <div className="w-12 h-12 rounded-full bg-[#2a3942] flex items-center justify-center text-[#aebac1] font-semibold text-lg">
                                {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-[#e9edef] text-[17px] truncate">{member.name}</h4>
                                <p className="text-[#8696a0] text-sm truncate">
                                    {member.roles?.[0]?.name || 'Team member'} {member.phone ? `• ${member.phone}` : ''}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NewChatSidebar;
