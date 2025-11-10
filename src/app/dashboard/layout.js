// src/app/dashboard/layout.js
"use client";
import React, { useState, useEffect } from "react"; // Import useEffect
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ComplaintProvider } from "../context/ComplaintContext";
import { supabase } from "../../utils/supabaseClient";
import LiveFeed from "../components/LiveFeed";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DashboardLayout = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  // Default to false (open) for desktop, we'll adjust for mobile in useEffect
  const [collapsed, setCollapsed] = useState(false);

  // --- ADDED THIS useEffect ---
  // This effect runs once on the client to check the screen width
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check if the screen width is "mobile" (e.g., less than 768px)
      const isMobile = window.innerWidth < 768;
      setCollapsed(isMobile);
    }
  }, []); // Empty dependency array means this runs only on mount

  const handleSignOut = async () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        sessionStorage.removeItem("complaints");
        router.push("/");
      } else {
        console.error("Error signing out:", error);
      }
    }
  };

  const menuItems = [
    { text: "Home", href: "/dashboard" },
    { text: "Add Complaint", href: "/dashboard/add-complaint" },
    { text: "View Complaints", href: "/dashboard/view-complaints" },
  ];

  return (
    <ComplaintProvider>
      <div className="flex h-screen bg-gray-900 text-gray-200 font-sans">
        {/* Sidebar */}
        <div
          className={`${
            collapsed ? "w-20" : "w-64"
          } flex-shrink-0 bg-gray-800 p-5 flex flex-col transition-all duration-300`}
        >
          <div className="flex items-center justify-between">
            {!collapsed && (
              <h1 className="text-2xl font-bold text-white">WeFix</h1>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-gray-400 hover:text-white"
            >
              {collapsed ? <ChevronRight /> : <ChevronLeft />}
            </button>
          </div>

          <nav className="mt-10 flex-1 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.text}
                href={item.href}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:bg-gray-700 hover:text-white"
                } ${collapsed ? "justify-center" : ""}`} // Center icons/text when collapsed
              >
                {/* You can add icons here later if you want */}
                {!collapsed && item.text}
              </Link>
            ))}
          </nav>

          <div className="mt-auto">
            <button
              onClick={handleSignOut}
              className={`w-full flex items-center px-4 py-2 rounded-md text-sm font-medium text-gray-400 hover:bg-gray-700 hover:text-white transition-colors ${
                collapsed ? "justify-center" : ""
              }`}
            >
              {/* You can add a sign-out icon here */}
              {!collapsed && "Sign Out"}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto">{children}</main>

        {/* Live Feed - hidden on mobile */}
        <aside className="hidden lg:block w-80 flex-shrink-0 bg-gray-800 p-5 border-l border-gray-700 overflow-y-auto">
          <LiveFeed />
        </aside>
      </div>
    </ComplaintProvider>
  );
};

export default DashboardLayout;
