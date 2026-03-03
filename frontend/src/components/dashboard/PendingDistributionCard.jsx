import React from "react";
import { AlertCircle, ArrowRight } from "lucide-react";

const PendingDistributionCard = ({ count, loading, onViewUnassigned }) => {
    if (count === 0 && !loading) return null;

    return (
        <div className="w-full bg-orange-50 border border-orange-200 rounded-xl p-4 shadow-sm flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500 mb-6">
            <div className="flex items-center gap-4">
                <div className="bg-orange-500 p-2 rounded-full text-white shadow-md animate-pulse">
                    <AlertCircle size={24} />
                </div>
                <div>
                    <h3 className="text-orange-900 font-bold text-lg">Pending Lead Distribution</h3>
                    <p className="text-orange-700 text-sm">
                        You have <span className="font-bold underline">{count} unassigned leads</span> that need to be distributed to your team.
                    </p>
                </div>
            </div>
            <button
                onClick={onViewUnassigned}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 shadow-md active:scale-95"
            >
                Assign Now
                <ArrowRight size={18} />
            </button>
        </div>
    );
};

export default PendingDistributionCard;
