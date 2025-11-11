// src/app/components/LiveFeed.js
"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";

const LiveFeed = () => {
  const [feedComplaints, setFeedComplaints] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  // First, get the current user's ID so we can filter them out
  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getUserId();
  }, []);

  // This is the polling effect
  useEffect(() => {
    // Don't start polling until we know who the user is
    if (!currentUserId) return;

    // Function to fetch all complaints *except* our own
    const fetchOtherComplaints = async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("*, profiles(full_name)")
        .neq("user_id", currentUserId) // <-- This filters out the current user
        .order("created_at", { ascending: false })
        .limit(20); // Get the 20 most recent

      if (error) {
        console.error("Live Feed fetch error:", error);
      } else {
        setFeedComplaints(data || []);
      }
    };

    // Run it immediately on load
    fetchOtherComplaints();

    // Set up the interval to run it every 5 seconds
    const interval = setInterval(fetchOtherComplaints, 5000); // 5000ms = 5 seconds

    // Clean up the interval when the component unmounts
    return () => clearInterval(interval);

  }, [currentUserId]); // This effect will re-run if the user ID ever changes

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Live Feed</h2>
      <div className="space-y-4">
        {feedComplaints.length > 0 ? (
          feedComplaints.map((complaint) => (
            <div key={complaint.id} className="bg-gray-700 p-3 rounded-lg">
              <p className="text-sm text-gray-300">
                <span className="font-semibold">
                  {complaint.profiles?.full_name || "Unknown"}
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
