import React from 'react';
// Layout removed - handled by nested routing
import WhatsAppWebLayout from '../components/WhatsAppWeb/WhatsAppWebLayout';

const WhatsAppWebPage = () => {
    return (
        <div noPadding={true}>
            <div className="w-full h-[calc(100vh-64px)] overflow-hidden">
                <WhatsAppWebLayout />
            </div>
        </div>
    );
};

export default WhatsAppWebPage;
