import Layout from '../components/Layout';
import CompanyWhatsAppSetup from '../components/CompanyWhatsAppSetup';

/**
 * Company (tenant) admin page: Settings → WhatsApp Integration.
 * Super Admin adds company → company admin logs in → configures WhatsApp here → ready to use.
 */
const CompanyWhatsAppSettings = () => {
  return (
    <Layout>
      <CompanyWhatsAppSetup />
    </Layout>
  );
};

export default CompanyWhatsAppSettings;
