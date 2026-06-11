import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/navigation/Sidebar";
import { Topbar } from "../components/navigation/Topbar";
import { motion, AnimatePresence } from "motion/react";

export function MainLayout() {
  return (
    <div className="flex h-screen bg-brand-bg dark:bg-slate-950 overflow-hidden font-sans transition-colors duration-500">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Topbar />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="max-w-7xl mx-auto w-full h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Ambient background blur elements for Fintech look */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-accent/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-success/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
      </div>
    </div>
  );
}
