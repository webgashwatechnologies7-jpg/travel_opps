import { useState, useRef, useEffect } from 'react';
import {
    Phone, Play, Pause, Clock, User, Download, FileText,
    ArrowUpRight, ArrowDownLeft, Headphones, Hash, Calendar, Trash2

} from 'lucide-react';

const CallsTab = ({ calls = [], loading = false, onPlayRecording, onDeleteCall, recordingUrls = {}, activeRecordingId }) => {

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

    // Handle audio play/pause when activeRecordingId changes
    useEffect(() => {
        if (activeRecordingId && recordingUrls[activeRecordingId]) {
            if (audioRef.current) {
                audioRef.current.play().catch(err => console.error("Playback failed", err));
                setIsPlaying(true);
            }
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
                setIsPlaying(false);
            }
        }
    }, [activeRecordingId, recordingUrls]);

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
            {/* Hidden Audio Element */}
            <audio
                ref={audioRef}
                src={activeRecordingId ? recordingUrls[activeRecordingId] : ''}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => {
                    setIsPlaying(false);
                    setProgress(0);
                }}
                onTimeUpdate={(e) => setProgress((e.target.currentTime / e.target.duration) * 100)}
                className="hidden"
            />

            {/* Calls List */}
            <div className="space-y-4">
                {calls.map((call) => {
                    const isActive = activeRecordingId === call.id;
                    return (
                        <div
                            key={call.id}
                            className={`group p-5 rounded-3xl border transition-all ${isActive ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-gray-100 hover:border-blue-100 hover:bg-gray-50/50'}`}
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
                                        {call.recording_available && (
                                            <div className="relative">
                                                <button
                                                    onClick={() => {
                                                        if (isActive && isPlaying) {
                                                            audioRef.current.pause();
                                                        } else if (isActive && !isPlaying) {
                                                            audioRef.current.play();
                                                        } else {
                                                            onPlayRecording(call.id);
                                                        }
                                                    }}
                                                    className={`h-11 px-6 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 min-w-[150px]' : 'bg-gray-100 text-gray-600 hover:bg-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-200'}`}
                                                >
                                                    {isActive && isPlaying ? (
                                                        <>
                                                            <Pause className="w-4 h-4 fill-current" />
                                                            Pause
                                                        </>
                                                    ) : isActive && !isPlaying ? (
                                                        <>
                                                            <Play className="w-4 h-4 fill-current" />
                                                            Resume
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Play className="w-4 h-4" />
                                                            Play Recording
                                                        </>
                                                    )}
                                                </button>
                                                
                                                {/* In-row progress indicator */}
                                                {isActive && (
                                                    <div className="absolute -bottom-2 left-0 right-0 h-1 bg-blue-100 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-blue-600 transition-all duration-200 shadow-[0_0_8px_rgba(37,99,235,0.4)]" 
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {!call.recording_available && (
                                            <div className="h-11 px-6 bg-gray-50 text-gray-300 rounded-xl flex items-center gap-2 text-sm font-bold cursor-not-allowed border border-gray-100">
                                                <Phone className="w-4 h-4 opacity-30" />
                                                No Recording
                                            </div>
                                        )}

                                        <button
                                            onClick={() => onDeleteCall && onDeleteCall(call.id)}
                                            className="w-11 h-11 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-200 transition-all border border-red-100"
                                            title="Delete Call Log"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CallsTab;
