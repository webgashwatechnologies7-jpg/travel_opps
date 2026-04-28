import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle } from 'lucide-react';
import { documentsAPI } from '../services/api';
import { toast } from 'react-toastify';

const UploadDocumentModal = ({ isOpen, onClose, leadId, onSuccess }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [file, setFile] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        document_type: 'Passport',
        document_category: 'Identification',
        description: '',
        access_level: 'public',
        is_required: false
    });

    const docTypes = ['Passport', 'Visa', 'Ticket', 'Voucher', 'Invoice', 'ID Card', 'Other'];
    const categories = ['Identification', 'Travel Document', 'Financial', 'Personal', 'Other'];

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            if (!formData.title) {
                // Set default title to file name (without extension)
                const fileName = selectedFile.name.split('.').slice(0, -1).join('.');
                setFormData(prev => ({ ...prev, title: fileName }));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !formData.title) {
            toast.error("Please select a file.");
            return;
        }

        setIsUploading(true);
        try {
            const uploadData = {
                title: formData.title,
                document_type: 'Other',
                document_category: 'Other',
                access_level: 'public',
                is_required: 0,
                lead_id: leadId,
                file: file
            };

            await documentsAPI.upload(uploadData);
            toast.success("Document uploaded successfully!");
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error("Upload error:", error);
            const msg = error.response?.data?.message || "Failed to upload document.";
            toast.error(msg);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Upload className="h-5 w-5 text-blue-600" />
                        Quick Upload
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* File Drop/Input */}
                    <div className="relative">
                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="hidden"
                            id="doc-file-upload"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                        />
                        <label
                            htmlFor="doc-file-upload"
                            className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                                file ? 'border-green-400 bg-green-50 shadow-inner' : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                            }`}
                        >
                            {file ? (
                                <div className="flex flex-col items-center text-green-600 px-4 text-center">
                                    <div className="bg-green-100 p-3 rounded-full mb-3">
                                        <CheckCircle className="h-8 w-8" />
                                    </div>
                                    <span className="text-sm font-bold break-all">{file.name}</span>
                                    <span className="text-xs mt-1 opacity-70">Ready to upload</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-gray-500">
                                    <div className="bg-gray-50 p-4 rounded-full mb-3 group-hover:bg-blue-100 transition-colors">
                                        <Upload className="h-8 w-8" />
                                    </div>
                                    <span className="text-sm font-bold">Select Document</span>
                                    <span className="text-xs mt-1 text-gray-400">PDF, Word, or Images</span>
                                </div>
                            )}
                        </label>
                    </div>

                    {file && (
                        <div className="animate-in slide-in-from-top-2 duration-200">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Document Title</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                                placeholder="Enter document name"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={isUploading || !file}
                            className={`flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 ${
                                (isUploading || !file) ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            {isUploading ? (
                                <>
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Uploading...
                                </>
                            ) : (
                                'Start Upload'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UploadDocumentModal;
