// app/dashboard/layout.jsx (Example if dashboard had header/footer)
import React from 'react';

function DashboardLayout({ children }) {
  return (
    <div className="">
      
        <div > 
          
            
            <main className="flex-1">{children}</main> 
        </div>
        
    </div>
  );
}

export default DashboardLayout;