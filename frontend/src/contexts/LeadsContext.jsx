import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const LeadsContext = createContext();

export const LeadsProvider = ({ children }) => {
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: localStorage.getItem('leads_per_page') ? parseInt(localStorage.getItem('leads_per_page')) : 8,
    total: 0,
  });
  const [stats, setStats] = useState(null);
  const [lastParams, setLastParams] = useState(null);

  // Function to clear cache if needed
  const clearLeadsCache = useCallback(() => {
    setLeads([]);
    setStats(null);
    setLastParams(null);
  }, []);

  const value = useMemo(() => ({
    leads,
    setLeads,
    pagination,
    setPagination,
    stats,
    setStats,
    lastParams,
    setLastParams,
    clearLeadsCache
  }), [leads, pagination, stats, lastParams, clearLeadsCache]);

  return (
    <LeadsContext.Provider value={value}>
      {children}
    </LeadsContext.Provider>
  );
};

export const useLeads = () => {
  const context = useContext(LeadsContext);
  if (!context) {
    throw new Error('useLeads must be used within a LeadsProvider');
  }
  return context;
};
