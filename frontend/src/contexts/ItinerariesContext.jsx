import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const ItinerariesContext = createContext();

export const ItinerariesProvider = ({ children }) => {
  const [itineraries, setItineraries] = useState([]);
  const [counts, setCounts] = useState({ templates: 0, proposals: 0 });
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    from: 0,
    to: 0,
    total: 0,
    per_page: localStorage.getItem('itineraries_per_page') ? parseInt(localStorage.getItem('itineraries_per_page')) : 8
  });
  const [lastParams, setLastParams] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const clearCache = useCallback(() => {
    setItineraries([]);
    setCounts({ templates: 0, proposals: 0 });
    setPagination(prev => ({ ...prev, total: 0 }));
    setLastParams(null);
    setIsInitialLoad(true);
  }, []);

  const value = useMemo(() => ({
    itineraries,
    setItineraries,
    counts,
    setCounts,
    pagination,
    setPagination,
    lastParams,
    setLastParams,
    isInitialLoad,
    setIsInitialLoad,
    clearCache
  }), [itineraries, counts, pagination, lastParams, isInitialLoad, clearCache]);

  return (
    <ItinerariesContext.Provider value={value}>
      {children}
    </ItinerariesContext.Provider>
  );
};

export const useItineraries = () => {
  const context = useContext(ItinerariesContext);
  if (!context) {
    throw new Error('useItineraries must be used within an ItinerariesProvider');
  }
  return context;
};
