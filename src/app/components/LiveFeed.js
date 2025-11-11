"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";

const LiveFeed = () => {
  const [newComplaints, setNewComplaints] = useState([]);

  useEffect(() => {
    console.log("🚀 Initializing Live Feed...");

    // Expose Supabase globally for console testing
    window.supabase = supabase;
    console.log("🪄 Supabase client exposed to window (try typing `supabase` in console)");

    // Remove any stale channels that may exist
    supabase.getChannels().forEach((ch) => {
      if (ch.topic.includes("public:complaints")) {
        console.log("🧹 Removing stale channel:", ch.topic);
        supabase.removeChannel(ch);
      }
    });

    console.log("🔌 Setting up realtime channel 'public-feed'...");

    // Create the realtime subscription
    const channel = supabase
      .channel("public-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "complaints" },
        async (payload) => {
          console.log("📩 Received realtime event:", payload);

          try {
            // Fetch the submitter’s name
            const { data, error } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", payload.new.user_id)
              .maybeSingle();

            if (error) console.error("❌ Error fetching profile:", error);

            const complaintWithProfile = {
              ...payload.new,
              profile: data || { full_name: "Unknown User" },
            };

            // Add new complaint to the top of feed
            setNewComplaints((prev) => [complaintWithProfile, ...prev]);
          } catch (err) {
            console.error("🔥 Live feed update error:", err);
          }
        }
      )
      .subscribe((status) => {
        console.log("🧭 Subscription status:", status);
      });

    // Cleanup on unmount
    return () => {
      console.log("🧹 Cleaning up 'public-feed' channel...");
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
