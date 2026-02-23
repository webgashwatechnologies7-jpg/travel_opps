import MasterPage from '../components/MasterPage';
import { roomTypesAPI } from '../services/api';

const RoomType = () => {
  return (
    <MasterPage
      title="Room Type"
      api={roomTypesAPI}
      searchPlaceholder="Search by name"
      fields={[
        { name: 'name', label: 'Name', type: 'text', required: true }
      ]}
      resourceKey="name"
    />
  );
};

export default RoomType;
