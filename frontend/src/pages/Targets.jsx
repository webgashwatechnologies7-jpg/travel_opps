import React, { useState, useEffect } from 'react';
import { usersAPI, targetsAPI } from '../services/api';
import { Pencil, Trash2, Target, Calendar, IndianRupee, Plus, CheckCircle2, AlertCircle, X, Users } from 'lucide-react';
import LogoLoader from '../components/LogoLoader';

/**
 * Executive Suite Employee Targets
 * Premium High-Density Design
 */
const Targets = () => {
  const [users, setUsers] = useState([]);
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    user_id: '',
    month: '',
    target_amount: '',
  });
  const [editingTarget, setEditingTarget] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchTargets();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.list();
      setUsers(response.data.data.users || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const fetchTargets = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.list();
      const allUsers = response.data.data.users || [];

      const targetsPromises = allUsers.map(async (user) => {
        try {
          const userResponse = await usersAPI.get(user.id);
          if (userResponse.data.success && userResponse.data.data.user.targets) {
            return userResponse.data.data.user.targets.map((target) => ({
              id: target.id,
              user_id: user.id,
              user_name: user.name,
              month: target.month,
              target_amount: parseFloat(target.target_amount),
              achieved_amount: parseFloat(target.achieved_amount || 0),
            }));
          }
          return [];
        } catch (err) {
          return [];
        }
      });

      const allTargets = (await Promise.all(targetsPromises)).flat();
      setTargets(allTargets);
    } catch (err) {
      console.error('Failed to fetch targets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const month = formData.month;
      if (!/^\d{4}-\d{2}$/.test(month)) {
        setError('Month must be in YYYY-MM format');
        setSubmitting(false);
        return;
      }

      await targetsAPI.create({
        user_id: parseInt(formData.user_id),
        month: month,
        target_amount: parseFloat(formData.target_amount),
      });

      setSuccess(editingTarget ? 'Target updated successfully!' : 'Target created successfully!');
      setFormData({ user_id: '', month: '', target_amount: '' });
      setEditingTarget(null);
      fetchTargets();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create target');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEdit = (target) => {
    setEditingTarget(target);
    setFormData({
      user_id: target.user_id.toString(),
      month: target.month,
      target_amount: target.target_amount.toString(),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this target?')) return;
    try {
      await targetsAPI.delete(id);
      setSuccess('Target deleted successfully!');
      fetchTargets();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete target');
    }
  };

  const cancelEdit = () => {
    setEditingTarget(null);
    setFormData({ user_id: '', month: '', target_amount: '' });
  };

  const calculateCompletion = (targetAmount, achievedAmount) => {
    if (!targetAmount || targetAmount === 0) return 0;
    return ((achievedAmount / targetAmount) * 100).toFixed(2);
  };

  if (loading && targets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] bg-[#F8FAFC]">
        <LogoLoader text="Assembling performance targets..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-6 lg:px-10 py-8 mb-8 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#2C55D4] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100 ring-4 ring-blue-50">
                 <Target size={24} strokeWidth={2.5} />
              </div>
              <div>
                 <h1 className="text-2xl font-semibold text-gray-800 tracking-tight leading-none">Employee <span className="text-[#2C55D4]">Targets.</span></h1>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                    Performance quota management
                 </p>
              </div>
           </div>
           
           <div className="flex items-center gap-3">
              <div className="bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-100 flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                    {targets.length}
                 </div>
                 <span className="text-[11px] font-bold text-[#2C55D4] uppercase tracking-wider">Active Targets</span>
              </div>
           </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* Create/Edit Form (Left Side) */}
          <div className="xl:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 p-8 border border-slate-50 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 transform translate-x-4 -translate-y-4 opacity-[0.03] transition-transform group-hover:scale-110">
                  <Plus size={100} />
               </div>
               
               <div className="flex justify-between items-center mb-8 relative z-10">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      {editingTarget ? 'Update Quota' : 'Global Quota'}
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure revenue targets</p>
                  </div>
                  {editingTarget && (
                    <button onClick={cancelEdit} className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors">
                      <X size={16} />
                    </button>
                  )}
               </div>

               {error && (
                 <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                   <AlertCircle size={18} />
                   <p className="text-[11px] font-bold uppercase">{error}</p>
                 </div>
               )}

               {success && (
                 <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 p-4 rounded-2xl mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                   <CheckCircle2 size={18} />
                   <p className="text-[11px] font-bold uppercase">{success}</p>
                 </div>
               )}

               <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                 <div className="space-y-2">
                   <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Team Member</label>
                   <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <select
                        name="user_id"
                        value={formData.user_id}
                        onChange={handleChange}
                        required
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[#2C55D4] transition-all"
                      >
                        <option value="">Choose User...</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                   </div>
                 </div>

                 <div className="space-y-2">
                   <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Reporting Month</label>
                   <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input
                        type="month"
                        name="month"
                        value={formData.month}
                        onChange={handleChange}
                        required
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[#2C55D4] transition-all"
                      />
                   </div>
                 </div>

                 <div className="space-y-2">
                   <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Target Amount (₹)</label>
                   <div className="relative">
                      <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input
                        type="number"
                        name="target_amount"
                        value={formData.target_amount}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[#2C55D4] transition-all"
                      />
                   </div>
                 </div>

                 <button
                   type="submit"
                   disabled={submitting}
                   className={`w-full py-4 px-6 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                     editingTarget ? 'bg-amber-500 shadow-amber-200' : 'bg-[#2C55D4] shadow-blue-200'
                   }`}
                 >
                   {submitting ? 'Processing...' : editingTarget ? 'Update Target Quota' : 'Establish Target'}
                 </button>
               </form>
            </div>
            
            {/* Context Widget */}
            <div className="bg-[#1E293B] rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-tr from-[#2C55D4]/10 to-transparent" />
               <div className="relative z-10">
                  <h4 className="text-sm font-bold uppercase tracking-[0.2em] mb-4">Quota Insights</h4>
                  <p className="text-[12px] opacity-60 leading-relaxed">
                     Revenue targets are calculated on a monthly cycle. Confirmed bookings from Lead management flow directly into 'Achieved Amount'.
                  </p>
                  <div className="mt-8 pt-8 border-t border-white/5">
                     <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-80">
                        <span>Success Metric</span>
                        <span className="text-[#10B981]">Real-time</span>
                     </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Data List (Right Side) */}
          <div className="xl:col-span-8">
            <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 overflow-hidden border border-slate-50">
               <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">Targets Inventory</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cross-team performance distribution</p>
                  </div>
               </div>
               
               <div className="overflow-x-auto">
                 <table className="min-w-full divide-y divide-gray-100">
                   <thead className="bg-[#FBFCFE]">
                     <tr>
                       <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee Profile</th>
                       <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target</th>
                       <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Achieved</th>
                       <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completion</th>
                       <th className="px-8 py-5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="bg-white divide-y divide-gray-50">
                     {targets.length === 0 ? (
                       <tr>
                         <td colSpan="5" className="px-8 py-20 text-center">
                           <div className="flex flex-col items-center opacity-30">
                              <Target size={48} className="mb-4" />
                              <p className="text-[10px] font-black uppercase tracking-widest">No target records established</p>
                           </div>
                         </td>
                       </tr>
                     ) : (
                       targets
                         .sort((a, b) => b.month.localeCompare(a.month))
                         .map((target) => {
                           const completion = calculateCompletion(target.target_amount, target.achieved_amount);
                           const completionPercent = parseFloat(completion);

                           return (
                             <tr key={`${target.user_id}-${target.month}`} className="hover:bg-slate-50/50 transition-colors group">
                               <td className="px-8 py-6 whitespace-nowrap">
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-bold text-[13px] group-hover:bg-[#2C55D4] group-hover:text-white transition-all">
                                       {target.user_name?.charAt(0)}
                                    </div>
                                    <div>
                                       <p className="text-[13px] font-semibold text-slate-800 leading-none">{target.user_name}</p>
                                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{target.month}</p>
                                    </div>
                                 </div>
                               </td>
                               <td className="px-8 py-6 text-[13px] font-bold text-slate-700 tabular-nums">
                                 ₹{target.target_amount.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                               </td>
                               <td className="px-8 py-6 text-[13px] font-bold text-[#10B981] tabular-nums">
                                 ₹{target.achieved_amount.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                               </td>
                               <td className="px-8 py-6 min-w-[180px]">
                                 <div className="flex items-center gap-4">
                                   <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden shadow-inner max-w-[100px]">
                                     <div
                                       className={`h-full rounded-full transition-all duration-1000 ${completionPercent >= 100 ? 'bg-emerald-500' : completionPercent >= 75 ? 'bg-[#2C55D4]' : completionPercent >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                       style={{ width: `${Math.min(completionPercent, 100)}%` }}
                                     ></div>
                                   </div>
                                   <span className="text-[11px] font-bold text-slate-800 tabular-nums">
                                     {completion}%
                                   </span>
                                 </div>
                               </td>
                               <td className="px-8 py-6 whitespace-nowrap text-right">
                                  <div className="flex items-center justify-end gap-2">
                                     <button onClick={() => handleEdit(target)} className="w-8 h-8 rounded-lg bg-blue-50 text-[#2C55D4] flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm shadow-blue-100">
                                       <Pencil size={14} />
                                     </button>
                                     <button onClick={() => handleDelete(target.id)} className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm shadow-rose-100">
                                       <Trash2 size={14} />
                                     </button>
                                  </div>
                               </td>
                             </tr>
                           );
                         })
                     )}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Targets;
