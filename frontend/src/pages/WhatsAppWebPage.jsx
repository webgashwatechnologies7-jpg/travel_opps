import React from 'react';
import Layout from '../components/Layout';
import WhatsAppWebLayout from '../components/WhatsAppWeb/WhatsAppWebLayout';

const WhatsAppWebPage = () => {
    return (
        <Layout noPadding={true}>
            <div className="w-full h-[calc(100vh-64px)] overflow-hidden">
                <WhatsAppWebLayout />
            </div>
        </Layout>
    );
};

export default WhatsAppWebPage;
