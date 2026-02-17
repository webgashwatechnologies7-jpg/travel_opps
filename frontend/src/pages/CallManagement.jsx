import { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import { toast } from 'react-toastify';
import { callsAPI, leadsAPI, usersAPI } from '../services/api';
import { Phone, Play, Pause, Filter, Plus, X } from 'lucide-react';

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
  const [mappings, setMappings] = useState([]);
  const [mappingForm, setMappingForm] = useState({
    user_id: '',
    phone_number: '',
    label: '',
    contact_name: '',
    is_active: true,
  });

  useEffect(() => {
    loadCalls();
    loadEmployees();
    loadLeads();
    loadMappings();

    const interval = setInterval(() => {
      loadCalls(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const normalizedFilters = useMemo(() => {
    const params = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        params[key] = value;
      }
    });
    return params;
  }, [filters]);

  const loadCalls = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const response = await callsAPI.list(normalizedFilters);
      setCalls(response.data.data.calls || []);
    } catch (err) {
      console.error('Failed to load calls', err);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await usersAPI.list();
      setEmployees(response.data.data.users || []);
    } catch (err) {
      console.error('Failed to load employees', err);
    }
  };

  const loadLeads = async () => {
    try {
      const response = await leadsAPI.list({ per_page: 1000 });
      setLeads(response.data.data.leads || []);
    } catch (err) {
      console.error('Failed to load leads', err);
    }
  };

  const loadMappings = async () => {
    try {
      const response = await callsAPI.getMappings();
      setMappings(response.data.data.mappings || []);
    } catch (err) {
      console.error('Failed to load mappings', err);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    loadCalls();
  };

  const formatDuration = (seconds) => {
    const total = Number(seconds || 0);
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDateTime = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    return date.toLocaleString('en-IN');
  };

  const handleLoadRecording = async (callId) => {
    try {
      const response = await callsAPI.getRecording(callId);
      const blob = new Blob([response.data], { type: response.headers['content-type'] || 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      setRecordingUrls(prev => ({ ...prev, [callId]: url }));
      setActiveRecordingId(callId);
    } catch (err) {
      toast.error('Failed to load recording');
    }
  };

  const openNotesModal = (call) => {
    setNoteModalCall(call);
    setNoteText('');
    setEditingNoteId(null);
  };

  const handleSaveNote = async () => {
    if (!noteText.trim() || !noteModalCall) {
      return;
    }
    setSavingNote(true);
    try {
      if (editingNoteId) {
        await callsAPI.updateNote(noteModalCall.id, editingNoteId, noteText.trim());
      } else {
        await callsAPI.addNote(noteModalCall.id, noteText.trim());
      }
      await loadCalls(true);
      const refreshed = await callsAPI.get(noteModalCall.id);
      setNoteModalCall(refreshed.data.data.call || null);
      setNoteText('');
      setEditingNoteId(null);
      toast.success(editingNoteId ? 'Note updated successfully' : 'Note added successfully');
    } catch (err) {
      toast.error('Failed to save note');
    } finally {
      setSavingNote(false);
    }
  };

  const handleMappingSubmit = async (e) => {
    e.preventDefault();
    try {
      await callsAPI.createMapping(mappingForm);
      setMappingForm({
        user_id: '',
        phone_number: '',
        label: '',
        contact_name: '',
        is_active: true,
      });
      loadMappings();
      toast.success('Mapping saved successfully');
    } catch (err) {
      toast.error('Failed to save mapping');
    }
  };

  const handleMappingToggle = async (mapping) => {
    try {
      await callsAPI.updateMapping(mapping.id, { is_active: !mapping.is_active });
      loadMappings();
      toast.success(`Mapping ${!mapping.is_active ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      toast.error('Failed to update mapping');
    }
  };

  const handleMappingDelete = async (mappingId) => {
    if (!confirm('Delete this mapping?')) {
      return;
    }
    try {
      await callsAPI.deleteMapping(mappingId);
      loadMappings();
      toast.success('Mapping deleted successfully');
    } catch (err) {
      toast.error('Failed to delete mapping');
    }
  };

  return (
    <Layout>
      <div className="p-6" style={{ backgroundColor: '#D8DEF5', minHeight: '100vh' }}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Phone className="h-6 w-6 text-blue-600" />
            Call Management System
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-700">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-500">Employee</label>
              <select
                value={filters.employee_id}
                onChange={(e) => handleFilterChange('employee_id', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="">All</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Client / Lead</label>
              <select
                value={filters.lead_id}
                onChange={(e) => handleFilterChange('lead_id', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="">All</option>
                {leads.map(lead => (
                  <option key={lead.id} value={lead.id}>{lead.client_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Phone Number</label>
              <input
                type="text"
                value={filters.phone_number}
                onChange={(e) => handleFilterChange('phone_number', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                placeholder="Search by number"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Date From</label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Date To</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Duration Range (sec)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  value={filters.duration_min}
                  onChange={(e) => handleFilterChange('duration_min', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="Min"
                />
                <input
                  type="number"
                  min="0"
                  value={filters.duration_max}
                  onChange={(e) => handleFilterChange('duration_max', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="Max"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="">All</option>
                <option value="completed">Completed</option>
                <option value="no-answer">No Answer</option>
                <option value="busy">Busy</option>
                <option value="failed">Failed</option>
                <option value="in-progress">In Progress</option>
                <option value="queued">Queued</option>
                <option value="initiated">Initiated</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Mapping Status</label>
              <select
                value={filters.mapping_status}
                onChange={(e) => handleFilterChange('mapping_status', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="">All</option>
                <option value="mapped">Mapped</option>
                <option value="unmapped">Unmapped</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Source</label>
              <select
                value={filters.source}
                onChange={(e) => handleFilterChange('source', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="">All</option>
                <option value="mobile">Employee Mobile</option>
                <option value="crm">CRM Click-to-Call</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => loadCalls()}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
            >
              Apply Filters
            </button>
            <button
              onClick={resetFilters}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-200"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-500">Loading calls...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Number</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recording</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {calls.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-6 text-center text-sm text-gray-500">
                        No calls found
                      </td>
                    </tr>
                  ) : (
                    calls.map(call => (
                      <tr key={call.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {call.employee?.name || 'Unassigned'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {call.lead?.client_name || call.contact_name || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {call.from_number || 'N/A'} → {call.to_number || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {formatDuration(call.duration_seconds)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 capitalize">
                          <div className="flex items-center gap-2">
                            <span>{call.status || 'unknown'}</span>
                            {call.mapping_status === 'unmapped' && (
                              <span
                                className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full"
                                title="Number not mapped to any employee"
                              >
                                UNMAPPED
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {formatDateTime(call.call_started_at || call.created_at)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {call.recording_available ? (
                            recordingUrls[call.id] ? (
                              <button
                                onClick={() => setActiveRecordingId(activeRecordingId === call.id ? null : call.id)}
                                className="flex items-center gap-2 text-blue-600 text-sm"
                              >
                                {activeRecordingId === call.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                {activeRecordingId === call.id ? 'Hide' : 'Play'}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleLoadRecording(call.id)}
                                className="text-blue-600 text-sm"
                              >
                                Load
                              </button>
                            )
                          ) : (
                            <span className="text-gray-400 text-sm">N/A</span>
                          )}
                          {recordingUrls[call.id] && activeRecordingId === call.id && (
                            <audio className="mt-2 w-48" controls src={recordingUrls[call.id]} />
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <button
                            onClick={() => openNotesModal(call)}
                            className="text-blue-600 text-sm"
                          >
                            {call.notes?.length ? `View (${call.notes.length})` : 'Add'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-5 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Phone className="h-4 w-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-700">Phone Number Mapping</h2>
          </div>
          <form onSubmit={handleMappingSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
            <select
              value={mappingForm.user_id}
              onChange={(e) => setMappingForm(prev => ({ ...prev, user_id: e.target.value }))}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
              required
            >
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
            <input
              type="text"
              value={mappingForm.phone_number}
              onChange={(e) => setMappingForm(prev => ({ ...prev, phone_number: e.target.value }))}
              placeholder="Phone number"
              className="border border-gray-300 rounded px-3 py-2 text-sm"
              required
            />
            <input
              type="text"
              value={mappingForm.label}
              onChange={(e) => setMappingForm(prev => ({ ...prev, label: e.target.value }))}
              placeholder="Label (owner/vendor)"
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
            <input
              type="text"
              value={mappingForm.contact_name}
              onChange={(e) => setMappingForm(prev => ({ ...prev, contact_name: e.target.value }))}
              placeholder="Contact name"
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </form>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Number</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Label</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {mappings.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-4 text-center text-sm text-gray-500">
                      No mappings created
                    </td>
                  </tr>
                ) : (
                  mappings.map(mapping => (
                    <tr key={mapping.id}>
                      <td className="px-4 py-2 text-sm text-gray-700">{mapping.user?.name || 'N/A'}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{mapping.phone_number}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{mapping.label || 'N/A'}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{mapping.contact_name || 'N/A'}</td>
                      <td className="px-4 py-2 text-sm">
                        <button
                          onClick={() => handleMappingToggle(mapping)}
                          className={`px-2 py-1 rounded text-xs ${mapping.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                        >
                          {mapping.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <button
                          onClick={() => handleMappingDelete(mapping.id)}
                          className="text-red-600 text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {noteModalCall && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Call Notes</h3>
              <button onClick={() => setNoteModalCall(null)}>
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {(noteModalCall.notes || []).length === 0 ? (
                <p className="text-sm text-gray-500">No notes yet</p>
              ) : (
                noteModalCall.notes.map(note => (
                  <div key={note.id} className="border border-gray-200 rounded p-3">
                    <p className="text-sm text-gray-800">{note.note}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {note.user?.name || 'System'} · {formatDateTime(note.created_at)}
                    </p>
                    <button
                      onClick={() => {
                        setEditingNoteId(note.id);
                        setNoteText(note.note);
                      }}
                      className="text-xs text-blue-600 mt-2"
                    >
                      Edit
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4">
              <textarea
                rows="3"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                placeholder="Add note..."
              />
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => {
                    setEditingNoteId(null);
                    setNoteText('');
                  }}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear
                </button>
                <button
                  onClick={handleSaveNote}
                  disabled={savingNote || !noteText.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingNote ? 'Saving...' : (editingNoteId ? 'Update Note' : 'Add Note')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default CallManagement;
