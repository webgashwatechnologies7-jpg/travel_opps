import React, { memo } from 'react';

const PostSalesTab = memo(() => {
    return (
        <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Post Sales</h3>
                <div className="text-center py-8 text-gray-500">
                    <p>Post sales management coming soon</p>
                    <p className="text-sm mt-2">Track and manage post-sale activities here</p>
                </div>
            </div>
        </div>
    );
});

PostSalesTab.displayName = 'PostSalesTab';
export default PostSalesTab;
