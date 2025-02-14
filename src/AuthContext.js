import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [email, setEmail] = useState('');
  const [timeout, setTimeOut] = useState('');
  const [username, setUsername] = useState('');
  const [profilePicture, setProfilePicture] = useState('');

  const logout = () => {
    setEmail('');
    localStorage.removeItem('user');
  };

  const updateTimeout = (newTimeout) => {
    setTimeOut(newTimeout); // Update timeout value in state
    const userData = JSON.parse(localStorage.getItem('user')) || {};
    userData.timeout = newTimeout;
    localStorage.setItem('user', JSON.stringify(userData));
  };

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    console.log(userData);
    if (userData) {
      setEmail(userData.email);
      setTimeOut(userData.timeout);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ email, setEmail, logout, timeout, updateTimeout }}>
      {children}
    </AuthContext.Provider>
  );
};
