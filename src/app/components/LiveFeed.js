// src/app/components/LiveFeed.js
"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../utils/supabaseClient";

const LiveFeed = () => {
  const [feedComplaints, setFeedComplaints] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  // We use a ref to store the timestamp.
  // This prevents it from resetting on every render.
  const loadTimestamp = useRef(null);

  // 1. Get the current user's ID
  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        // SET THE TIMESTAMP: Only set it once when the user is first identified.
        if (!loadTimestamp.current) {
          loadTimestamp.current = new Date().toISOString();
        }
      }
    };
    getUserId();
  }, []);

  // 2. This is the polling effect
  useEffect(() => {
    // Wait until we have the user ID AND the timestamp
    if (!currentUserId || !loadTimestamp.current) return;

    // Function to fetch all complaints *except* our own
    // and *only* new ones since the page loaded.
    const fetchNewComplaints = async () => {
      
      const { data, error } = await supabase
        .from("complaints")
        .select("*, profiles(full_name)")
        .neq("user_id", currentUserId)           // Not from me
        .gt("created_at", loadTimestamp.current) // Newer than my login
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Live Feed fetch error:", error);
      } else {
        // Just set the new data. This list will only grow as new
        // complaints come in.
        setFeedComplaints(data || []);
      }
    };

    // Run it immediately on load
    fetchNewComplaints();

    // Set up the interval to run it every 5 seconds
    const interval = setInterval(fetchNewComplaints, 5000); // 5000ms = 5 seconds

    // Clean up the interval when the component unmounts
    return () => clearInterval(interval);

  }, [currentUserId]); // This effect runs once we get the currentUserId

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
