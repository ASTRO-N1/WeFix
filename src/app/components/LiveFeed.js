// src/components/LiveFeed.js
"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";

const LiveFeed = () => {
  const [newComplaints, setNewComplaints] = useState([]);

  useEffect(() => {
    // Avoid duplicate channels (important in dev/hot reload)
    supabase.getChannels().forEach((ch) => {
      if (ch.topic === "realtime:public:complaints") {
        supabase.removeChannel(ch);
      }
    });

    const channel = supabase
      .channel("public-feed", { config: { broadcast: { ack: true } } })
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "complaints" },
        async (payload) => {
          try {
            // Try to join the user name directly via SQL (faster + reliable)
            const { data, error } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", payload.new.user_id)
              .maybeSingle();

            if (error) console.error(error);

            const complaintWithProfile = {
              ...payload.new,
              profile: data || { full_name: "Unknown User" },
            };

            setNewComplaints((prev) => [complaintWithProfile, ...prev]);
          } catch (err) {
            console.error("Live feed update error:", err);
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("✅ Live feed subscribed successfully");
        }
      });

    // Cleanup
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
