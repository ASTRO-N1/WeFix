// src/app/admin/dashboard/page.js
"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../utils/supabaseClient";

const AdminDashboard = () => {
  const router = useRouter();
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Add a loading state
  const statuses = [
    "Pending",
    "Under Scrutiny",
    "Accepted",
    "In Progress",
    "Resolved",
  ];

  const fetchAllComplaints = useCallback(async () => {
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

  useEffect(() => {
    // --- REAL-TIME AUTH LISTENER ---
    // This is the key to making the security check instant.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // If user logs out or session is lost, redirect immediately
        if (event === "SIGNED_OUT" || !session) {
          router.replace("/admin");
          return;
        }

        // Check the user's role from the database function
        const { data: role, error } = await supabase.rpc("get_user_role");

        if (error || role !== "admin") {
          // If they are not an admin, sign them out and redirect
          await supabase.auth.signOut();
          router.replace("/admin");
        } else {
          // If they are a confirmed admin, load the data
          setIsLoading(false);
          fetchAllComplaints();
        }
      }
    );

    // --- REAL-TIME DATA LISTENER ---
    // This remains the same to keep the complaints list updated
    const channel = supabase
      .channel("admin-complaints-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "complaints" },
        (payload) => {
          fetchAllComplaints();
        }
      )
      .subscribe();

    // Cleanup listeners when the component unmounts
    return () => {
      authListener.subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [router, fetchAllComplaints]);

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

  // Display a loading message until the admin check is complete
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <p>Verifying admin access...</p>
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
