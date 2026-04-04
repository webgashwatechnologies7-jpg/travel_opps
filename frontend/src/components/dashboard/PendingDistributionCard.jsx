import React from "react";
import { AlertCircle, ArrowRight } from "lucide-react";

const PendingDistributionCard = ({ count, loading, onViewUnassigned }) => {
    if (count <= 0 || loading) return null;

    return (
        <div className="w-full bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl py-3 px-6 shadow-sm flex items-center justify-between mb-4 group hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-4">
                <div className="bg-orange-600 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                    <AlertCircle size={20} strokeWidth={2.5} />
                </div>
                <div>
                    <h3 className="text-orange-950 font-black text-[13px] uppercase tracking-wider leading-none mb-1">Lead Distribution Required</h3>
                    <p className="text-orange-800/80 text-[11px] font-bold uppercase tracking-tight">
                        There are <span className="text-orange-600 font-extrabold underline decoration-orange-300 decoration-2 underline-offset-4">{count} Unassigned Leads</span> waiting for team allocation.
                    </p>
                </div>
            </div>
            <button
                onClick={onViewUnassigned}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-sm hover:shadow-orange-200 transition-all active:scale-95"
            >
                Assign Now
                <ArrowRight size={14} strokeWidth={3} />
            </button>
        </div>
    );
};

export default PendingDistributionCard;
