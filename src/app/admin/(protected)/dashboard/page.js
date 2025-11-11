// src/app/admin/dashboard/page.js
"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../../utils/supabaseClient";

const AdminDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // For the *initial* load
  const statuses = [
    "Pending",
    "Under Scrutiny",
    "Accepted",
    "In Progress",
    "Resolved",
  ];

  // This function fetches all non-resolved complaints
  // We keep it in useCallback for stable dependency in useEffect
  const fetchAllComplaints = useCallback(async () => {
    // We DON'T set isLoading(true) here, to avoid screen flashes on polling
    const { data, error } = await supabase
      .from("complaints")
      .select(`*, profiles (full_name)`)
      .neq("status", "Resolved")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching complaints:", error);
    } else {
      setComplaints(data || []);
    }
  }, []); // Empty dependency, this function is stable

  // This useEffect runs ONCE for the initial page load
  useEffect(() => {
    const initialLoad = async () => {
      setIsLoading(true); // Set loading true at the start
      await fetchAllComplaints();
      setIsLoading(false); // Set loading false after initial fetch
    };
    initialLoad();
  }, [fetchAllComplaints]); // Dependency on fetchAllComplaints

  // --- THIS IS THE NEW POLLING LOGIC ---
  // This useEffect replaces the old Realtime subscription
  useEffect(() => {
    console.log("Admin Dashboard: Polling for complaints every 5 seconds...");
    
    // Set up the interval to run fetchAllComplaints every 5 seconds
    const interval = setInterval(() => {
      fetchAllComplaints();
    }, 5000); // 5000ms = 5 seconds

    // Clean up the interval when the component unmounts
    return () => clearInterval(interval);

  }, [fetchAllComplaints]); // Dependency on fetchAllComplaints

  // This function for updating status remains the same
  const handleStatusChange = async (complaintId, newStatus) => {
    const originalComplaints = [...complaints];
    const updatedComplaints = complaints.map((c) =>
      c.id === complaintId ? { ...c, status: newStatus } : c
    );

    if (newStatus === "Resolved") {
      setComplaints(updatedComplaints.filter((c) => c.id !== complaintId));
    } else {
      setComplaints(updatedComplaints);
    }

    const { error } = await supabase
      .from("complaints")
      .update({ status: newStatus })
      .eq("id", complaintId);

    if (error) {
      console.error("Error updating status:", error);
      setComplaints(originalComplaints);
      alert("Failed to update status. Please try again.");
    }
  };

  // This loading message is only for the initial load
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <p>Loading complaints...</p>
      </div>
    );
  }

  return (
    <div className="text-white">
      <h1 className="text-3xl font-bold">All User Complaints</h1>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full bg-gray-800 text-sm">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-4 py-2 text-left">User</th>
              <th className="px-4 py-2 text-left">Complaint Title</th>
              <th className="px-4 py-2 text-left">Description</th>
              <th className="px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {complaints.length > 0 ? (
              complaints.map((complaint) => (
                <tr
                  key={complaint.id}
                  className="border-b border-gray-700 hover:bg-gray-700"
                >
                  <td className="px-4 py-2">
                    {complaint.profiles?.full_name || "N/A"}
                  </td>
                  <td className="px-4 py-2">{complaint.title}</td>
                  <td className="px-4 py-2 max-w-sm truncate">
                    {complaint.description}
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={complaint.status}
                      onChange={(e) =>
                        handleStatusChange(complaint.id, e.target.value)
                      }
                      className="bg-gray-600 p-1 rounded"
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center py-4">
                  No active complaints found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
