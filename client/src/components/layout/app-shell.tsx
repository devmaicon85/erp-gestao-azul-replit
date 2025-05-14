import { useState, ReactNode } from "react";
import Sidebar from "./sidebar";
import MobileSidebar from "./mobile-sidebar";
import Header from "./header";
import { useLocation } from "wouter";

type AppShellProps = {
  children: ReactNode;
  currentModule: "dashboard" | "contacts" | "products" | "orders" | "finance" | "reports";
};

export default function AppShell({ children, currentModule }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, navigate] = useLocation();
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  return (
    <div className="h-full flex overflow-hidden bg-gray-50">
      {/* Desktop Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        currentModule={currentModule}
        onNavigate={(path) => navigate(path)}
      />
      
      {/* Mobile Sidebar */}
      <MobileSidebar 
        isOpen={mobileMenuOpen} 
        currentModule={currentModule}
        onClose={() => setMobileMenuOpen(false)}
        onNavigate={(path) => {
          navigate(path);
          setMobileMenuOpen(false);
        }}
      />
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header 
          toggleSidebar={toggleSidebar} 
          toggleMobileMenu={toggleMobileMenu}
          sidebarOpen={sidebarOpen}
        />
        
        {/* Content Area */}
        <div className="flex-1 relative overflow-y-auto focus:outline-none" tabIndex={0}>
          <main className="flex-1 relative z-0 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
