// src/app/components/Sidebar.js
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// A helper function for conditional class names
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

// Main Sidebar Component
export function Sidebar({ children }) {
  return (
    <aside className="flex h-screen w-64 flex-col bg-[#faf1e0] text-[#343a40]">
      <div className="p-6">
        <h1 className="text-2xl font-bold">WeFix</h1>
      </div>
      <nav className="flex-1 px-4 py-2">
        <ul className="space-y-2">{children}</ul>
      </nav>
    </aside>
  );
}

// Sidebar Item Component
export function SidebarItem({ icon, text, href, onClick }) {
  const pathname = usePathname();
  const isActive = href && pathname === href;

  const itemClasses = cn(
    "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors",
    isActive ? "bg-[#343a40] text-white" : "hover:bg-black/5"
  );

  if (onClick) {
    return (
      <li>
        <button onClick={onClick} className={itemClasses}>
          {icon}
          <span>{text}</span>
        </button>
      </li>
    );
  }

  return (
    <li>
      <Link href={href} className={itemClasses}>
        {icon}
        <span>{text}</span>
      </Link>
    </li>
  );
}
