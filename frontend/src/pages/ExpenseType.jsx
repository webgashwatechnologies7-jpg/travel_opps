import MasterPage from '../components/MasterPage';
import { expenseTypesAPI } from '../services/api';

const ExpenseType = () => {
  return (
    <MasterPage
      title="Expense Type"
      api={expenseTypesAPI}
      searchPlaceholder="Search by name"
      fields={[
        { name: 'name', label: 'Name', type: 'text', required: true }
      ]}
      resourceKey="name"
    />
  );
};

export default ExpenseType;
