// src/app/dashboard/page.js
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../utils/supabaseClient";
import { useComplaints } from "../context/ComplaintContext";

const DashboardHomePage = () => {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const { complaints, loading } = useComplaints();

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

  const stats = {
    submitted: complaints.length,
    resolved: complaints.filter((c) => c.status === "Resolved").length,
    pending: complaints.filter((c) => c.status === "Pending").length,
  };
  const recentComplaints = complaints.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 md:w-14 md:h-14 bg-gray-700 rounded-full flex-shrink-0"></div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Hello, {profile?.full_name || "User"}!
        </h1>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onClick={() => router.push("/dashboard/add-complaint")}
          className="p-5 bg-gray-800 rounded-lg shadow-lg cursor-pointer hover:bg-gray-700 transition-colors"
        >
          <h3 className="text-lg font-bold text-white">Add a Complaint</h3>
          <p className="text-gray-400 mt-1 text-sm">
            Submit a new civic issue.
          </p>
        </div>
        <div
          onClick={() => router.push("/dashboard/view-complaints")}
          className="p-5 bg-gray-800 rounded-lg shadow-lg cursor-pointer hover:bg-gray-700 transition-colors"
        >
          <h3 className="text-lg font-bold text-white">View My Complaints</h3>
          <p className="text-gray-400 mt-1 text-sm">
            Check the status of your submissions.
          </p>
        </div>
      </div>

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
                <div className="mb-2 sm:mb-0">
                  <p className="font-semibold">{c.title}</p>
                  <p className="text-sm text-gray-400">
                    {new Date(c.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full self-start sm:self-center ${
                    c.status === "Resolved"
                      ? "bg-green-500 text-black"
                      : "bg-yellow-500 text-black"
                  }`}
                >
                  {c.status}
                </span>
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
