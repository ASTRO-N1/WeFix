// src/components/LiveFeed.js
"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";

const LiveFeed = () => {
  const [newComplaints, setNewComplaints] = useState([]);

  useEffect(() => {
    const channel = supabase
      .channel("public-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "complaints" },
        async (payload) => {
          
          // --- DEBUGGING LOGS ADDED ---
          console.log("Live Feed: Received new complaint!", payload.new);

          const { data, error } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", payload.new.user_id)
            .single();
          
          if (error) {
            console.error("Live Feed Error fetching profile:", error);
          }

          if (data) {
            console.log("Live Feed: Successfully fetched profile data:", data);
            const complaintWithProfile = { ...payload.new, profile: data };
            setNewComplaints((prev) => [complaintWithProfile, ...prev]);
          } else {
            console.warn("Live Feed: No profile data returned. Check RLS on 'profiles' table.");
          }
          // --- END DEBUGGING LOGS ---
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Live Feed</h2>
      <div className="space-y-4">
        {newComplaints.length > 0 ? (
          newComplaints.map((complaint) => (
            <div key={complaint.id} className="bg-gray-700 p-3 rounded-lg">
              <p className="text-sm text-gray-300">
                <span className="font-semibold">
                  {complaint.profile.full_name}
                </span>{" "}
                just submitted:
              </p>
              <p className="font-semibold mt-1">{complaint.title}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-400">Waiting for new complaints...</p>
        )}
      </div>
    </div>
  );
};

export default LiveFeed;
