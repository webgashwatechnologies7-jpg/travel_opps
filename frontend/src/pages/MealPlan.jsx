import MasterPage from '../components/MasterPage';
import { mealPlansAPI } from '../services/api';

const MealPlan = () => {
  return (
    <MasterPage
      title="Meal Plan"
      api={mealPlansAPI}
      searchPlaceholder="Search by name"
      fields={[
        { name: 'name', label: 'Name', type: 'text', required: true }
      ]}
      resourceKey="name"
    />
  );
};

export default MealPlan;
