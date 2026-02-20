import React, { memo } from 'react';
import { Upload } from 'lucide-react';

const DocsTab = memo(({ handleUploadDocument }) => { // Assuming handleUploadDocument might be used later, but for now just rendering the placeholder
    return (
        <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Documents</h3>
                <div className="flex justify-end mb-4">
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <Upload className="h-4 w-4" />
                        Upload Document
                    </button>
                </div>
                <div className="text-center py-8 text-gray-500">
                    <p>No documents uploaded</p>
                    <p className="text-sm mt-2">Upload passports, tickets, confirmations and other documents here</p>
                </div>
            </div>
        </div>
    );
});

DocsTab.displayName = 'DocsTab';
export default DocsTab;
