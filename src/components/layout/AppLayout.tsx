import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const abrirSidebar = () => {
    setSidebarOpen(true);
  };

  const cerrarSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#FFF5F9]">
      <Sidebar open={sidebarOpen} onClose={cerrarSidebar} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={abrirSidebar} />

        <main
          className="
            flex-1 overflow-y-auto
            px-4 py-5
            sm:px-5 sm:py-6
            lg:p-6
          "
        >
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
