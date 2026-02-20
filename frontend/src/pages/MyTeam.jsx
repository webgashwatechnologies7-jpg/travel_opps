import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { usersAPI, companySettingsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Phone, MapPin, User, Search, Filter, Loader2 } from 'lucide-react';

import { useNavigate } from 'react-router-dom';

const MyTeam = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchTeam();
    }, [user]);



    const fetchTeam = async () => {
        try {
            setLoading(true);
            const response = await companySettingsAPI.getMyTeam();
            if (response.data?.success) {
                setTeamMembers(response.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch team members', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredMembers = teamMembers.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (member.role && member.role.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">My Team</h1>
                        <p className="text-gray-500">Manage and view your team members</p>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search team..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredMembers.length > 0 ? (
                            filteredMembers.map((member) => (
                                <div
                                    key={member.id}
                                    onClick={() => navigate(`/my-team/${member.id}`)}
                                    className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300 overflow-hidden group cursor-pointer"
                                >
                                    <div className="p-6">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xl font-bold">
                                                {member.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{member.name}</h3>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                    {member.roles && member.roles.length > 0 ? member.roles.map(r => r.name).join(', ') : 'Team Member'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                                <Mail className="h-4 w-4 text-gray-400" />
                                                <span className="truncate">{member.email}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                                <Phone className="h-4 w-4 text-gray-400" />
                                                <span>{member.phone || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-sm">
                                        <span className={`flex items-center gap-1.5 ${member.is_active ? 'text-green-600' : 'text-red-500'}`}>
                                            <span className={`h-2 w-2 rounded-full ${member.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                            {member.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                        <span className="text-gray-400 text-xs">Joined {new Date(member.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
                                <User className="h-12 w-12 mb-4 text-gray-300" />
                                <p className="text-lg font-medium">No team members found</p>
                                <p className="text-sm">Team members assigned to you will appear here.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default MyTeam;
