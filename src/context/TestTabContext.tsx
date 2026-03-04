import React, { createContext, useContext, useState } from 'react';

interface TestTabContextType {
  activeTab: 'patient' | 'device' | 'demo';
  setActiveTab: (tab: 'patient' | 'device' | 'demo') => void;
}

const TestTabContext = createContext<TestTabContextType | undefined>(undefined);

export const TestTabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<'patient' | 'device' | 'demo'>('patient');

  return (
    <TestTabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TestTabContext.Provider>
  );
};

export const useTestTab = () => {
  const context = useContext(TestTabContext);
  if (!context) {
    throw new Error('useTestTab must be used within TestTabProvider');
  }
  return context;
};
