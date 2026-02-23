import MasterPage from '../components/MasterPage';
import { leadSourcesAPI } from '../services/api';

const LeadSource = () => {
  return (
    <MasterPage
      title="Lead Source"
      api={leadSourcesAPI}
      searchPlaceholder="Search by name"
      fields={[
        { name: 'name', label: 'Name', type: 'text', required: true }
      ]}
      resourceKey="name"
    />
  );
};

export default LeadSource;
