import React from "react";

export default function LatestQuery({ latestNotes = [] }) {
    return (
        <div className="bg-white rounded-xl shadow-sm p-4 h-full flex flex-col">
            <h2 className="text-base font-bold text-gray-900 mb-4">
                Latest Query <span className="text-blue-700">Notes</span>
            </h2>

            <div className="relative flex-1 overflow-y-auto custom-scroll pr-2 -mr-2">
                {latestNotes.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-xs text-gray-400">
                        No notes available
                    </div>
                ) : (
                    latestNotes.map((note, index) => (
                        <div key={index} className="flex gap-3 group">
                            {/* Timeline Column */}
                            <div className="relative flex flex-col items-center w-4 flex-none">
                                {/* Vertical Line */}
                                <div className="absolute top-0 bottom-0 w-[2px] bg-slate-200 left-1/2 -translate-x-1/2 group-last:bottom-auto group-last:h-6"></div>
                                {/* Dot */}
                                <div className="w-2 h-2 bg-orange-400 rounded-full z-10 mt-5 ring-2 ring-white"></div>
                            </div>

                            {/* Content Column */}
                            <div className="flex-1 py-3 border-b border-gray-100 group-last:border-0">
                                <p className="text-xs font-bold text-gray-900 truncate" title="Travbizz Travel IT Solutions">
                                    Travbizz Travel IT Solutions
                                </p>

                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                    {note.note || "No content"}
                                </p>

                                <p className="text-[10px] text-gray-400 mt-1">
                                    {new Date(note.created_at || Date.now()).toLocaleString("en-GB", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: true,
                                    })}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
