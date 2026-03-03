import Layout from '../components/Layout';
import CompanyTelephonySetup from '../components/CompanyTelephonySetup';

/**
 * Company (tenant) admin page: Settings → Telephony Integration.
 */
const CompanyTelephonySettings = () => {
    return (
        <Layout>
            <CompanyTelephonySetup />
        </Layout>
    );
};

export default CompanyTelephonySettings;
