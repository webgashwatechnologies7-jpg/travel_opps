import React, { memo, useState, useEffect, useCallback } from 'react';
import { Upload, FileText, Download, Trash2, Eye, ExternalLink, Calendar, Shield, MoreVertical, RotateCcw, X } from 'lucide-react';
import { documentsAPI } from '../../services/api';
import { toast } from 'react-toastify';
import UploadDocumentModal from '../UploadDocumentModal';

const DocsTab = memo(({ leadId }) => {
    const [documents, setDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const fetchDocuments = useCallback(async (showToast = false) => {
        if (!leadId) return;
        setIsLoading(true);
        try {
            const res = await documentsAPI.list({ lead_id: leadId });
            setDocuments(res.data.data.documents || []);
            if (showToast) toast.success("List updated.");
        } catch (error) {
            console.error("Failed to fetch documents:", error);
            const msg = error.response?.data?.message || "Could not load documents.";
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    }, [leadId]);

    const handleUploadSuccess = () => {
        // Slight delay to ensure DB consistency on local dev
        setTimeout(() => {
            fetchDocuments();
        }, 500);
    };

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    const handleDownload = async (docId, fileName) => {
        try {
            const response = await documentsAPI.download(docId);
            const blob = new Blob([response.data], { type: response.headers['content-type'] });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName || 'document');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download error:", error);
            toast.error("Failed to download document.");
        }
    };

    const [previewDoc, setPreviewDoc] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const handlePreview = async (doc) => {
        try {
            const response = await documentsAPI.download(doc.id);
            const blob = new Blob([response.data], { type: response.headers['content-type'] });
            const url = window.URL.createObjectURL(blob);
            setPreviewUrl(url);
            setPreviewDoc(doc);
        } catch (error) {
            console.error("Preview error:", error);
            toast.error("Failed to open document.");
        }
    };

    const closePreview = () => {
        if (previewUrl) window.URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setPreviewDoc(null);
    };

    const handleDelete = async (docId) => {
        if (!window.confirm("Are you sure you want to delete this document?")) return;
        try {
            await documentsAPI.delete(docId);
            toast.success("Document deleted successfully");
            fetchDocuments();
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Failed to delete document.");
        }
    };

    const getFileIcon = (type) => {
        const t = String(type).toLowerCase();
        if (t.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />;
        if (t.includes('jpg') || t.includes('jpeg') || t.includes('png')) return <Eye className="h-8 w-8 text-blue-500" />;
        return <FileText className="h-8 w-8 text-gray-400" />;
    };

    useEffect(() => {
        fetchDocuments();
        return () => {
            if (previewUrl) window.URL.revokeObjectURL(previewUrl);
        };
    }, [fetchDocuments]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="bg-blue-50 p-3 rounded-xl">
                        <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Documents</p>
                        <h4 className="text-xl font-black text-gray-900">{documents.length}</h4>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="bg-green-50 p-3 rounded-xl">
                        <Shield className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Verified</p>
                        <h4 className="text-xl font-black text-gray-900">{documents.filter(d => d.status === 'verified').length}</h4>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="bg-orange-50 p-3 rounded-xl">
                        <Calendar className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Latest Upload</p>
                        <h4 className="text-sm font-bold text-gray-900">
                            {documents.length > 0 ? new Date(documents[0].created_at).toLocaleDateString() : 'N/A'}
                        </h4>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-white to-gray-50/30">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Document Vault</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Secure storage for lead documents and identifications</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => fetchDocuments(true)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            title="Refresh List"
                        >
                            <RotateCcw className="h-5 w-5" />
                        </button>
                        <button 
                            onClick={() => setIsUploadModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg font-semibold text-sm"
                        >
                            <Upload className="h-4 w-4" />
                            Upload Document
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="h-10 w-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                            <p className="text-gray-400 mt-4 font-medium italic">Scanning vault...</p>
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                            <div className="bg-white p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto shadow-sm mb-4">
                                <FileText className="h-8 w-8 text-gray-300" />
                            </div>
                            <h4 className="text-gray-900 font-bold text-lg">No documents yet</h4>
                            <p className="text-gray-500 mt-1 max-w-xs mx-auto">Upload passports, tickets, and other travel documents to keep everything in one place.</p>
                            <button 
                                onClick={() => setIsUploadModalOpen(true)}
                                className="mt-6 text-blue-600 font-bold hover:underline flex items-center gap-1 mx-auto"
                            >
                                <Upload className="h-4 w-4" />
                                Add your first document
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {documents.map((doc) => (
                                <div key={doc.id} className="group bg-white border border-gray-200 rounded-2xl p-4 hover:border-blue-200 hover:shadow-xl transition-all relative">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                                            {getFileIcon(doc.file_type)}
                                        </div>
                                        <div className="flex gap-1">
                                            <button 
                                                onClick={() => handlePreview(doc)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                title="Preview"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDownload(doc.id, doc.file_name)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                title="Download"
                                            >
                                                <Download className="h-4 w-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(doc.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-gray-900 truncate" title={doc.title}>{doc.title}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                                {doc.document_type}
                                            </span>
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                                {doc.access_level}
                                            </span>
                                        </div>
                                        
                                        <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400 font-medium">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(doc.created_at).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Shield className="h-3 w-3 text-green-500" />
                                                <span className="capitalize">{doc.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <UploadDocumentModal 
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                leadId={leadId}
                onSuccess={handleUploadSuccess}
            />

            {previewUrl && (
                <div 
                    className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={closePreview}
                >
                    <div 
                        className={`relative bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col h-fit max-h-[90vh] ${
                            previewDoc?.file_type?.toLowerCase().includes('pdf') ? 'w-full max-w-5xl h-[90vh]' : 'w-fit max-w-4xl'
                        }`}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <div>
                                <h3 className="text-xl font-black text-gray-900">{previewDoc?.title}</h3>
                                <p className="text-xs text-gray-500">{previewDoc?.file_name}</p>
                            </div>
                            <button onClick={closePreview} className="p-3 hover:bg-gray-100 rounded-full transition-all">
                                <X className="h-6 w-6 text-gray-500" />
                            </button>
                        </div>
                        <div className={`bg-gray-900 flex items-center justify-center overflow-auto ${
                            previewDoc?.file_type?.toLowerCase().includes('pdf') ? 'flex-1' : 'p-4'
                        }`}>
                            {previewDoc?.file_type?.toLowerCase().includes('pdf') ? (
                                <iframe src={previewUrl} className="w-full h-full" title="PDF Preview" />
                            ) : (
                                <img src={previewUrl} className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl shadow-black/50" alt="Document Preview" />
                            )}
                        </div>
                        <div className="px-6 py-4 border-t flex justify-end gap-3 bg-gray-50">
                            <button onClick={closePreview} className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-all">Close</button>
                            <button 
                                onClick={() => handleDownload(previewDoc.id, previewDoc.file_name)}
                                className="px-6 py-2.5 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200"
                            >
                                <Download className="h-4 w-4" />
                                Download
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

DocsTab.displayName = 'DocsTab';
export default DocsTab;
