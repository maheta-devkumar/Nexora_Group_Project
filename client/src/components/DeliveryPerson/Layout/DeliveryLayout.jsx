import React from 'react';
import DeliveryHeader from './DeliveryHeader';
import DeliverySidebar from './DeliverySidebar';
import './DeliveryLayout.css';

const DeliveryLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // Increased breakpoint for better tablet experience
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="nd-layout">
      {/* Background decoration elements */}
      <div className="nd-bg-blob nd-bg-blob-1"></div>
      <div className="nd-bg-blob nd-bg-blob-2"></div>

      <DeliveryHeader
        toggleSidebar={toggleSidebar}
        sidebarOpen={sidebarOpen}
      />

      <div className="nd-layout-container">
        <DeliverySidebar
          isOpen={sidebarOpen}
          isMobile={isMobile}
          closeSidebar={() => setSidebarOpen(false)}
        />

        <main className={`nd-main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
          <div className="nd-content-wrapper">
            {children}
          </div>
        </main>
      </div>

      {isMobile && sidebarOpen && (
        <div
          className="nd-mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DeliveryLayout;