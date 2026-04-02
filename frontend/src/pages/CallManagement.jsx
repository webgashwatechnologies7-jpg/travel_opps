import { useState, useEffect, useMemo, useRef } from 'react';
// Layout removed - handled by nested routing
import { useErrorHandler } from '../hooks/useErrorHandler';
import { toast } from 'react-toastify';
import { callsAPI, leadsAPI, companySettingsAPI } from '../services/api';
import {
  Phone, Play, Pause, Filter, Plus, X, Search, Calendar,
  Clock, User, Download, FileText, ChevronRight, Hash,
  ArrowUpRight, ArrowDownLeft, ShieldCheck, Headphones,
  Volume2, MoreVertical, Trash2, Edit3
} from 'lucide-react';
import LogoLoader from '../components/LogoLoader';

const DEFAULT_FILTERS = {
  employee_id: '',
  lead_id: '',
  phone_number: '',
  date_from: '',
  date_to: '',
  duration_min: '',
  duration_max: '',
  status: '',
  source: '',
  mapping_status: '',
};

const CallManagement = () => {
  const { executeWithErrorHandling } = useErrorHandler();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [leads, setLeads] = useState([]);
  const [recordingUrls, setRecordingUrls] = useState({});
  const [activeRecordingId, setActiveRecordingId] = useState(null);
  const [noteModalCall, setNoteModalCall] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [savingNote, setSavingNote] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadCalls(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadCalls(true),
      loadEmployees(),
      loadLeads()
    ]);
    setLoading(false);
  };

  const loadCalls = async (silent = false) => {
    const result = await executeWithErrorHandling(() => callsAPI.list(filters));
    if (result.success) {
      setCalls(result.data.data.calls || []);
    }
  };

  const loadEmployees = async () => {
    const result = await executeWithErrorHandling(() => companySettingsAPI.getUsers());
    if (result.success) {
      setEmployees(result.data.data.users || []);
    }
  };

  const loadLeads = async () => {
    const result = await executeWithErrorHandling(() => leadsAPI.list({ per_page: 100 }));
    if (result.success) {
      setLeads(result.data.data.leads || []);
    }
  };

  const handleLoadRecording = async (callId) => {
    if (recordingUrls[callId]) {
      setActiveRecordingId(callId);
      return;
    }

    const result = await executeWithErrorHandling(() => callsAPI.getRecording(callId));
    if (result.success) {
      const blob = new Blob([result.data], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      setRecordingUrls(prev => ({ ...prev, [callId]: url }));
      setActiveRecordingId(callId);
    }
  };

  const formatDuration = (seconds) => {
    const s = Number(seconds || 0);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'no-answer':
      case 'busy': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'failed': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <div>
      <div className="space-y-6 max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
              <Headphones className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Recording Hub</h1>
              <p className="text-sm text-gray-500 font-medium">Monitor team calls and analyze recordings in real-time.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all border ${showFilters ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-900'}`}
            >
              <Filter className="w-5 h-5" />
              {showFilters ? 'Hide Filters' : 'Filter Calls'}
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-in slide-in-from-top-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Employee</label>
                <select
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium"
                  value={filters.employee_id}
                  onChange={(e) => setFilters({ ...filters, employee_id: e.target.value })}
                >
                  <option value="">All Employees</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Client Name</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search lead..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium text-sm"
                    value={filters.phone_number}
                    onChange={(e) => setFilters({ ...filters, phone_number: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">From Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium"
                  value={filters.date_from}
                  onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">To Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium"
                  value={filters.date_to}
                  onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-50">
              <button
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="px-6 py-2.5 text-gray-500 font-bold hover:text-gray-900 transition-colors"
              >
                Reset All
              </button>
              <button
                onClick={() => loadCalls()}
                className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Active Player Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gradient-to-br from-gray-900 to-indigo-950 p-6 rounded-[2rem] shadow-xl text-white sticky top-24">
              <div className="flex items-center justify-between mb-8">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Volume2 className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400/80">LIVE PLAYER</span>
              </div>

              {activeRecordingId ? (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold truncate">
                      {calls.find(c => c.id === activeRecordingId)?.lead?.client_name || 'Anonymous Call'}
                    </h3>
                    <p className="text-blue-200/60 text-sm font-medium">
                      {calls.find(c => c.id === activeRecordingId)?.employee?.name || 'Unknown Staff'}
                    </p>
                  </div>

                  {/* Waveform Placeholder - Visual only */}
                  <div className="flex items-end justify-center gap-1 h-12 py-2">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 bg-blue-500/40 rounded-full transition-all duration-300 ${isPlaying ? 'animate-pulse' : ''}`}
                        style={{ height: `${Math.random() * 100}%` }}
                      />
                    ))}
                  </div>

                  <div className="space-y-4">
                    <audio
                      ref={audioRef}
                      src={recordingUrls[activeRecordingId]}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onTimeUpdate={(e) => setProgress((e.target.currentTime / e.target.duration) * 100)}
                      className="hidden"
                    />

                    <div className="relative h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-blue-500 transition-all duration-200"
                        style={{ width: `${progress || 0}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-center gap-6">
                      <button className="text-white/40 hover:text-white transition-colors">
                        <ArrowDownLeft className="w-5 h-5 rotate-45" />
                      </button>
                      <button
                        onClick={() => isPlaying ? audioRef.current.pause() : audioRef.current.play()}
                        className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl shadow-blue-500/20"
                      >
                        {isPlaying ? <Pause className="w-8 h-8 fill-white" /> : <Play className="w-8 h-8 fill-white ml-1" />}
                      </button>
                      <button className="text-white/40 hover:text-white transition-colors">
                        <ArrowUpRight className="w-5 h-5 rotate-45" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center space-y-4 opacity-40">
                  <Play className="w-12 h-12 mx-auto" />
                  <p className="text-sm font-bold uppercase tracking-widest">Select a call<br />to play recording</p>
                </div>
              )}
            </div>

            {/* Stats mini-widgets */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Logs</p>
                <p className="text-2xl font-black text-gray-900">{calls.length}</p>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Missed</p>
                <p className="text-2xl font-black text-gray-900">{calls.filter(c => c.status !== 'completed').length}</p>
              </div>
            </div>
          </div>

          {/* Call Logs Table */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Call Details</th>
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Employee</th>
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Duration</th>
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-10">
                           <LogoLoader text="Fetching records..." compact={true} />
                        </td>
                      </tr>
                    ) : calls.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-20 text-center text-gray-400 font-bold uppercase tracking-widest">
                          No call records found
                        </td>
                      </tr>
                    ) : (
                      calls.map((call) => (
                        <tr key={call.id} className={`group hover:bg-blue-50/30 transition-all ${activeRecordingId === call.id ? 'bg-blue-50/50' : ''}`}>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className={`p-2 rounded-xl border ${call.direction === 'inbound' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                                {call.direction === 'inbound' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-gray-900">{call.lead?.client_name || 'Unknown Contact'}</p>
                                  {call.mapping_status === 'unmapped' && (
                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-red-100 text-red-600 uppercase tracking-tighter">Unmapped</span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mt-0.5">
                                  <Hash className="w-3 h-3" /> {call.contact_phone || call.to_number}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 border border-gray-200 uppercase">
                                {call.employee?.name?.charAt(0) || '?'}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-800">{call.employee?.name || 'External SIM'}</p>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Staff Member</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 text-gray-700 font-bold">
                              <Clock className="w-4 h-4 text-gray-400" />
                              {formatDuration(call.duration_seconds)}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(call.status)}`}>
                              {call.status || 'unknown'}
                            </span>
                            <p className="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-tighter">
                              {new Date(call.call_started_at || call.created_at).toLocaleDateString()} · {new Date(call.call_started_at || call.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {call.recording_available ? (
                                <button
                                  onClick={() => handleLoadRecording(call.id)}
                                  className={`p-2.5 rounded-xl transition-all ${activeRecordingId === call.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-200'}`}
                                >
                                  <Play className={`w-5 h-5 ${activeRecordingId === call.id ? 'fill-current' : ''}`} />
                                </button>
                              ) : (
                                <div className="p-2.5 rounded-xl bg-gray-50 text-gray-300 cursor-not-allowed">
                                  <Play className="w-5 h-5" />
                                </div>
                              )}
                              <button
                                onClick={() => setNoteModalCall(call)}
                                className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-900 hover:text-white transition-all"
                              >
                                <FileText className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Robust Notes Modal */}
      {noteModalCall && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gray-900 p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Call Insights</h3>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mt-1">
                  Log ID: #{noteModalCall.id}
                </p>
              </div>
              <button onClick={() => setNoteModalCall(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-4 max-h-[30vh] overflow-y-auto pr-2 custom-scroll">
                {noteModalCall.notes?.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <Edit3 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No notes yet</p>
                  </div>
                ) : (
                  noteModalCall.notes.map(note => (
                    <div key={note.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 relative group">
                      <p className="text-sm text-gray-800 font-medium leading-relaxed">{note.note}</p>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200/50">
                        <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase">
                          {note.user?.name} · {new Date(note.created_at).toLocaleDateString()}
                        </p>
                        <button
                          onClick={() => { setEditingNoteId(note.id); setNoteText(note.note); }}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Add Internal Note</label>
                <textarea
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all outline-none min-h-[120px] font-medium text-sm"
                  placeholder="Summarize the conversation or add follow-up instructions..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => { setNoteText(''); setEditingNoteId(null); }}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!noteText.trim()) return;
                      setSavingNote(true);
                      const res = editingNoteId
                        ? await executeWithErrorHandling(() => callsAPI.updateNote(noteModalCall.id, editingNoteId, noteText))
                        : await executeWithErrorHandling(() => callsAPI.addNote(noteModalCall.id, noteText));

                      if (res.success) {
                        setNoteText('');
                        setEditingNoteId(null);
                        loadCalls(true);
                        // Refresh modal data
                        const refreshed = await callsAPI.get(noteModalCall.id);
                        if (refreshed.success) setNoteModalCall(refreshed.data.data.call);
                      }
                      setSavingNote(false);
                    }}
                    disabled={savingNote || !noteText.trim()}
                    className="flex-[2] bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 transition-all"
                  >
                    {savingNote ? 'Processing...' : (editingNoteId ? 'Update Insight' : 'Save Insight')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
                .custom-scroll::-webkit-scrollbar { width: 4px; }
                .custom-scroll::-webkit-scrollbar-track { background: transparent; }
                .custom-scroll::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 20px; }
                .custom-scroll::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
            `}} />
    </div>
  );
};

export default CallManagement;
