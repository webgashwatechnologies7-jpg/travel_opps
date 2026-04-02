import { Outlet } from 'react-router-dom';
import SuperAdminSidebar from './SuperAdminSidebar';

const SuperAdminLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <SuperAdminSidebar />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
};

export default SuperAdminLayout;

