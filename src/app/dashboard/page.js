// src/app/dashboard/page.js
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../utils/supabaseClient";
import { useComplaints } from "../context/ComplaintContext";

const DashboardHomePage = () => {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  
  // 1. Change 'complaints' to 'myComplaints'
  const { myComplaints, loading } = useComplaints();

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }
    };
    fetchProfile();
  }, []);

  if (loading || !profile) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading...</p>
      </div>
    );
  }

  // 2. Update stats logic to use 'myComplaints'
  const stats = {
    submitted: myComplaints.length,
    resolved: myComplaints.filter((c) => c.status === "Resolved").length,
    pending: myComplaints.filter((c) => c.status === "Pending").length,
  };
  
  // 3. Update recent complaints logic to use 'myComplaints'
  const recentComplaints = myComplaints.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center space-x-3">
        {/* ... */}
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Hello, {profile?.full_name || "User"}!
        </h1>
      </div>

      {/* Action Buttons */}
      {/* ... (no changes needed here) ... */}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-gray-800 rounded-lg">
          <p className="text-xl md:text-2xl font-bold">{stats.submitted}</p>
          <p className="text-gray-400 text-sm">Submitted</p>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg">
          <p className="text-xl md:text-2xl font-bold text-green-400">
            {stats.resolved}
          </p>
          <p className="text-gray-400 text-sm">Resolved</p>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg">
          <p className="text-xl md:text-2xl font-bold text-yellow-400">
            {stats.pending}
          </p>
          <p className="text-gray-400 text-sm">Pending</p>
        </div>
      </div>

      {/* Recent Activity (keep visible always) */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold mb-4">Recent Activity</h2>
        <div className="space-y-4 bg-gray-800 p-4 rounded-lg">
          {recentComplaints.length > 0 ? (
            recentComplaints.map((c) => (
              <div
                key={c.id}
                className="flex flex-col sm:flex-row justify-between sm:items-center"
              >
                {/* ... (rest of the JSX is correct) ... */}
              </div>
            ))
          ) : (
            <p className="text-gray-400">No recent activity.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHomePage;
