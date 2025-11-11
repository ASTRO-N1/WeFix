"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";

const LiveFeed = () => {
  const [newComplaints, setNewComplaints] = useState([]);

  useEffect(() => {
    console.log("🚀 Initializing Live Feed (FINAL VERSION)...");

    // Expose Supabase for console debugging
    window.supabase = supabase;

    // Clean up any old channels before creating new one
    supabase.getChannels().forEach((ch) => {
      if (ch.topic.includes("public:complaints")) {
        console.log("🧹 Removing stale channel:", ch.topic);
        supabase.removeChannel(ch);
      }
    });

    console.log("🔌 Subscribing to realtime changes on complaints...");

    const channel = supabase
      .channel("debug-feed") // using same verified channel name
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "complaints" },
        async (payload) => {
          console.log("📩 LiveFeed received event:", payload);

          try {
            const { data, error } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", payload.new.user_id)
              .maybeSingle();

            if (error) console.error("❌ Profile fetch error:", error);

            const complaintWithProfile = {
              ...payload.new,
              profile: data || { full_name: "Unknown User" },
            };

            setNewComplaints((prev) => [complaintWithProfile, ...prev]);
          } catch (err) {
            console.error("🔥 LiveFeed state update error:", err);
          }
        }
      )
      .subscribe((status) => {
        console.log("🧭 Subscription status:", status);
      });

    return () => {
      console.log("🧹 Cleaning up debug-feed channel...");
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
