import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

const PrivateRoute = ({ children }) => {
  const { email } = useContext(AuthContext);

  if (!email) {
    return <Navigate to="/" />;
  }

  return children;
};

export default PrivateRoute;