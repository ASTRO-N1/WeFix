"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";

const LiveFeed = () => {
  const [newComplaints, setNewComplaints] = useState([]);

  useEffect(() => {
    console.log("🚀 Initializing Live Feed...");

    // Clean up any existing duplicate channels before making a new one
    supabase.getChannels().forEach((ch) => {
      if (ch.topic === "realtime:public:complaints") {
        console.log("🧹 Removing old complaints channel...");
        supabase.removeChannel(ch);
      }
    });

    useEffect(() => {
        window.supabase = supabase;
        console.log("🪄 Supabase client exposed to window");
    }, []);


    console.log("🔌 Setting up realtime channel 'public-feed'...");

    const channel = supabase
      .channel("public-feed", { config: { broadcast: { ack: true } } })
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "complaints" },
        async (payload) => {
          console.log("📩 Received realtime event:", payload);

          try {
            // Fetch user full name from profiles table
            const { data, error } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", payload.new.user_id)
              .maybeSingle();

            if (error) {
              console.error("❌ Error fetching profile:", error);
            }

            const complaintWithProfile = {
              ...payload.new,
              profile: data || { full_name: "Unknown User" },
            };

            // Prepend the new complaint to the feed
            setNewComplaints((prev) => [complaintWithProfile, ...prev]);
          } catch (err) {
            console.error("🔥 Live feed update error:", err);
          }
        }
      )
      .subscribe((status) => {
        console.log("🧭 Subscription status:", status);
      });

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
