import MasterPage from '../components/MasterPage';
import { destinationsAPI } from '../services/api';

const Destinations = () => {
  return (
    <MasterPage
      title="Destinations"
      api={destinationsAPI}
      searchPlaceholder="Search by name"
      fields={[
        { name: 'name', label: 'Name', type: 'text', required: true }
      ]}
      resourceKey="name"
      permissionPrefix="destinations"
    />
  );
};

export default Destinations;
