"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";

const LiveFeed = () => {
  const [newComplaints, setNewComplaints] = useState([]);

  useEffect(() => {
    console.log("🚀 Mounting LiveFeed...");

    // guard: only subscribe once per tab
    if (window.__livefeed_subscribed) {
      console.log("⚠️ LiveFeed already subscribed, skipping");
      return;
    }
    window.__livefeed_subscribed = true;

    const channel = supabase
      .channel("livefeed-fixed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "complaints" },
        async (payload) => {
          console.log("📩 Event reached LiveFeed:", payload);
          const { data } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", payload.new.user_id)
            .maybeSingle();
          setNewComplaints((prev) => [
            { ...payload.new, profile: data },
            ...prev,
          ]);
        }
      )
      .subscribe((status) => console.log("🧭 livefeed-fixed status:", status));

    return () => {
      console.log("🧹 LiveFeed cleanup");
      supabase.removeChannel(channel);
      window.__livefeed_subscribed = false;
    };
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Live Feed</h2>
      {newComplaints.length ? (
        newComplaints.map((c) => (
          <div key={c.id} className="bg-gray-700 p-3 rounded-lg">
            <p className="text-sm text-gray-300">
              <b>{c.profile?.full_name || "Someone"}</b> just submitted:
            </p>
            <p className="font-semibold mt-1">{c.title}</p>
          </div>
        ))
      ) : (
        <p className="text-sm text-gray-400">Waiting for new complaints…</p>
      )}
    </div>
  );
};

export default LiveFeed;
