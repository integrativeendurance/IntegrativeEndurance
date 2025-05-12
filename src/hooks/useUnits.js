import React, { useState, useCallback, useContext, createContext } from 'react';

export const UNIT_SYSTEMS = {
  METRIC: 'metric',
  IMPERIAL: 'imperial',
};

const UnitsContext = createContext();

export const UnitsProvider = ({ children }) => {
  // Placeholder state - defaults to metric
  const [unitSystem, setUnitSystem] = useState(UNIT_SYSTEMS.METRIC);

  // Placeholder toggle function
  const toggleUnitSystem = useCallback(() => {
    console.log('Placeholder: Toggling unit system');
    setUnitSystem((prev) => 
      prev === UNIT_SYSTEMS.METRIC ? UNIT_SYSTEMS.IMPERIAL : UNIT_SYSTEMS.METRIC
    );
  }, []);

  const isMetric = unitSystem === UNIT_SYSTEMS.METRIC;

  const value = {
    unitSystem,
    toggleUnitSystem,
    isMetric,
  };

  return <UnitsContext.Provider value={value}>{children}</UnitsContext.Provider>;
};

export const useUnits = () => {
  const context = useContext(UnitsContext);
  if (context === undefined) {
    throw new Error('useUnits must be used within a UnitsProvider');
  }
  return context;
}; 