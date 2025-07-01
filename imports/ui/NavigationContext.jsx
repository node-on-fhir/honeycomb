import React, { createContext, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const NavigationContext = createContext(null);

export const NavigationProvider = ({ children }) => {
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);

  return (
    <NavigationContext.Provider value={navigateRef.current}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  return useContext(NavigationContext);
};