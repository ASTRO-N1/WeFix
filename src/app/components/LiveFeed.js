"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";

const LiveFeed = () => {
  const [newComplaints, setNewComplaints] = useState([]);

  useEffect(() => {
    console.log("🚀 Initializing Live Feed (STABLE)");
    // Unique channel name per instance
    const uniqueChannelName = `livefeed-${Math.random().toString(36).slice(2)}`;
    console.log("🔌 Creating channel:", uniqueChannelName);

    const channel = supabase
      .channel(uniqueChannelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "complaints" },
        async (payload) => {
          console.log("📩 LiveFeed received event:", payload);

          const { data: profile, error } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", payload.new.user_id)
            .single();

          if (error) console.error("❌ Profile fetch error:", error);
          else {
            const complaintWithProfile = { ...payload.new, profile };
            setNewComplaints((prev) => [complaintWithProfile, ...prev]);
          }
        }
      )
      .subscribe((status) => console.log("🧭 Subscription status:", status));

    window.supabase = supabase; // for debugging

    return () => {
      console.log("🧹 Cleaning up channel:", uniqueChannelName);
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
                  {complaint.profile?.full_name || "Unknown"}
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
