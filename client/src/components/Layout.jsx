// frontend/src/components/Layout.jsx (NEW FILE)

import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar/Navbar';

const Layout = () => {
  return (
    <>
      {/* Navbar will appear on every page wrapped by this component */}
      <Navbar />
      
      {/* Outlet renders the content of the current nested route */}
      <div className="main-content">
        <Outlet /> 
      </div>
      {/* Optional: Add Footer here */}
    </>
  );
};

export default Layout;