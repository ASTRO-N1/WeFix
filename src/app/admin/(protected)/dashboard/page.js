// src/app/admin/dashboard/page.js
"use client";
import { useState, useEffect, useCallback } from "react";
// import { useRouter } from "next/navigation"; // No longer needed
import { supabase } from "../../../../utils/supabaseClient";

const AdminDashboard = () => {
  // const router = useRouter(); // Removed
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Still used for initial load
  const statuses = [
    "Pending",
    "Under Scrutiny",
    "Accepted",
    "In Progress",
    "Resolved",
  ];

  // This function just fetches data.
  // We keep it in useCallback for stable dependency in useEffect.
  const fetchAllComplaints = useCallback(async () => {
    // We don't set isLoading(true) here, to prevent flashes on realtime updates
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
  }, []);

  // New, simplified useEffect for the *initial* data load
  useEffect(() => {
    const initialLoad = async () => {
      setIsLoading(true); // Set loading true at the start
      await fetchAllComplaints();
      setIsLoading(false); // Set loading false after initial fetch
    };
    initialLoad();
  }, [fetchAllComplaints]); // Dependency on fetchAllComplaints

  // Modified useEffect for *real-time updates* (auth logic removed)
  useEffect(() => {
    // --- REAL-TIME DATA LISTENER ---
    const channel = supabase
      .channel("admin-complaints-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "complaints" },
        (payload) => {
          // When a change is received, refetch the data
          fetchAllComplaints();
        }
      )
      .subscribe();

    // Cleanup listener when the component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAllComplaints]); // Dependency on fetchAllComplaints

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

  // Updated loading message
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
