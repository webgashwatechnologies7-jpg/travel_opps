import SuperAdminSidebar from './SuperAdminSidebar';

const SuperAdminLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <SuperAdminSidebar />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};

export default SuperAdminLayout;

