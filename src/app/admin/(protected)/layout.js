// src/app/admin/(protected)/layout.js
"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../../../utils/supabaseClient"; // Adjusted path
import { ChevronLeft, ChevronRight } from "lucide-react";

const AdminDashboardLayout = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Effect to collapse sidebar on mobile by default
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isMobile = window.innerWidth < 768;
      setCollapsed(isMobile);
    }
  }, []);

  const handleSignOut = async () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        router.push("/admin"); // Go back to admin login
      } else {
        console.error("Error signing out:", error);
      }
    }
  };

  const menuItems = [
    { text: "Home", href: "/admin/dashboard" },
    { text: "Resolved", href: "/admin/resolved" },
  ];

  return (
    <div className="flex h-screen bg-gray-900 text-gray-200 font-sans">
      {/* Sidebar */}
      <div
        className={`${
          collapsed ? "w-20" : "w-64"
        } flex-shrink-0 bg-gray-800 p-5 flex flex-col transition-all duration-300`}
      >
        <div className="flex items-center justify-between">
          {!collapsed && (
            <h1 className="text-2xl font-bold text-white">Admin</h1>
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
              } ${collapsed ? "justify-center" : ""}`}
            >
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
            {!collapsed && "Sign Out"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">{children}</main>
    </div>
  );
};

export default AdminDashboardLayout;
