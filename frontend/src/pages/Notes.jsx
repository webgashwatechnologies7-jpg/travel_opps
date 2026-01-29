import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { dashboardAPI } from "../services/api";

const Notes = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await dashboardAPI.latestLeadNotes();
      setNotes(response.data.data || []);
    } catch (err) {
      setError("Failed to load notes");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-6" style={{ backgroundColor: "#D8DEF5", minHeight: "100vh" }}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Latest Query Notes</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-4">
            {notes.length === 0 ? (
              <div className="text-center text-sm text-gray-500 py-8">No notes available</div>
            ) : (
              <div className="space-y-3">
                {notes.map((note, index) => {
                  const leadId = note.lead_id || note.lead?.id;
                  const clientName =
                    note.lead?.client_name ||
                    note.lead?.name ||
                    note.client_name ||
                    note.client?.name ||
                    note.company_name ||
                    "Client";
                  const noteText = note.note || note.remark || note.message || "No content";
                  const createdAt = note.created_at
                    ? new Date(note.created_at).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })
                    : "";

                  return (
                    <div
                      key={note.id || index}
                      onClick={() => {
                        if (leadId) navigate(`/leads/${leadId}`);
                      }}
                      className={`
                        flex gap-3 p-3 rounded-lg border-b border-gray-100 last:border-0
                        ${leadId ? "cursor-pointer hover:bg-blue-50" : ""}
                      `}
                    >
                      <div className="w-2 h-2 bg-orange-400 rounded-full mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{clientName}</p>
                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{noteText}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{createdAt}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Notes;
