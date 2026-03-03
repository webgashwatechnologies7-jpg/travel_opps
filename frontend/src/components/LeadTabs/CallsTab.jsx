import { useState, useRef } from 'react';
import {
    Phone, Play, Pause, Clock, User, Download, FileText,
    ArrowUpRight, ArrowDownLeft, Headphones, Hash, Calendar
} from 'lucide-react';

const CallsTab = ({ calls = [], loading = false, onPlayRecording, recordingUrls = {}, activeRecordingId }) => {
    const [progress, setProgress] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);

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

    if (loading) {
        return (
            <div className="py-20 text-center">
                <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Fetching Call History...</p>
            </div>
        );
    }

    if (calls.length === 0) {
        return (
            <div className="py-20 text-center bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">No Calls Recorded</h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto mt-1">
                    Calls made by employees to this lead's phone number will appear here automatically.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Active Player (if any) */}
            {activeRecordingId && recordingUrls[activeRecordingId] && (
                <div className="bg-gray-900 rounded-[2rem] p-6 text-white shadow-xl animate-in slide-in-from-top-4 duration-300 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-600/20 rounded-lg">
                                <Headphones className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">Now Playing Recording</h4>
                                <p className="text-[10px] text-blue-300/60 uppercase tracking-widest font-black">Call ID: #{activeRecordingId}</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-medium bg-white/10 px-3 py-1 rounded-full text-blue-200">
                            {formatDuration(calls.find(c => c.id === activeRecordingId)?.duration_seconds)}
                        </span>
                    </div>

                    <div className="space-y-4">
                        <audio
                            ref={audioRef}
                            src={recordingUrls[activeRecordingId]}
                            autoPlay
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            onTimeUpdate={(e) => setProgress((e.target.currentTime / e.target.duration) * 100)}
                            className="hidden"
                        />

                        <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="absolute inset-y-0 left-0 bg-blue-500 transition-all duration-200 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                style={{ width: `${progress || 0}%` }}
                            />
                        </div>

                        <div className="flex items-center justify-center gap-6">
                            <button
                                onClick={() => isPlaying ? audioRef.current.pause() : audioRef.current.play()}
                                className="w-12 h-12 bg-white text-gray-900 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg"
                            >
                                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Calls List */}
            <div className="space-y-4">
                {calls.map((call) => (
                    <div
                        key={call.id}
                        className={`group p-5 rounded-3xl border transition-all ${activeRecordingId === call.id ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-gray-100 hover:border-blue-100 hover:bg-gray-50/50'}`}
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${call.direction === 'inbound' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                                    {call.direction === 'inbound' ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-black text-gray-900 tracking-tight">
                                            {call.direction === 'inbound' ? 'Incoming Call' : 'Outgoing Call'}
                                        </p>
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(call.status)}`}>
                                            {call.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1">
                                        <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                            <User className="w-3.5 h-3.5" /> {call.employee?.name || 'External SIM'}
                                        </p>
                                        <span className="text-gray-300">|</span>
                                        <p className="text-xs text-gray-400 flex items-center gap-1 font-medium">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(call.call_started_at || call.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-black text-gray-900 font-mono tracking-tighter">{formatDuration(call.duration_seconds)}</p>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Duration</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    {call.recording_available ? (
                                        <button
                                            onClick={() => onPlayRecording(call.id)}
                                            className={`h-11 px-6 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${activeRecordingId === call.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-200'}`}
                                        >
                                            <Play className={`w-4 h-4 ${activeRecordingId === call.id ? 'fill-current' : ''}`} />
                                            {activeRecordingId === call.id ? 'Playing...' : 'Play Recording'}
                                        </button>
                                    ) : (
                                        <div className="h-11 px-6 bg-gray-50 text-gray-300 rounded-xl flex items-center gap-2 text-sm font-bold cursor-not-allowed border border-gray-100">
                                            <Phone className="w-4 h-4 opacity-30" />
                                            No Recording
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CallsTab;
