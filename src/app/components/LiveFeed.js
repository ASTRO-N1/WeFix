// src/app/components/LiveFeed.js
"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../utils/supabaseClient";

const LiveFeed = () => {
  const [feedComplaints, setFeedComplaints] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const loadTimestamp = useRef(null);

  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        if (!loadTimestamp.current) {
          loadTimestamp.current = new Date().toISOString();
        }
      }
    };
    getUserId();
  }, []);

  useEffect(() => {
    if (!currentUserId || !loadTimestamp.current) return;

    const fetchNewComplaints = async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("*, profiles(full_name)")
        .neq("user_id", currentUserId)
        .gt("created_at", loadTimestamp.current)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Live Feed fetch error:", error);
      } else {
        setFeedComplaints(data || []);
      }
    };

    fetchNewComplaints();
    const interval = setInterval(fetchNewComplaints, 5000);
    return () => clearInterval(interval);

  }, [currentUserId]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Live Feed</h2>
      <div className="space-y-4">
        {feedComplaints.length > 0 ? (
          feedComplaints.map((complaint) => (
            
            // --- UPDATED CARD UI ---
            <div key={complaint.id} className="bg-gray-700 p-4 rounded-lg flex flex-col">
              {/* Submitter */}
              <p className="text-sm text-gray-300 mb-2">
                <span className="font-semibold">
                  {complaint.profiles?.full_name || "Unknown"}
                </span>{" "}
                just submitted:
              </p>

              {/* Image (if it exists) */}
              {complaint.image_url && (
                <img
                  src={complaint.image_url}
                  alt="complaint"
                  className="w-full h-32 object-cover rounded-md mb-3"
                />
              )}

              {/* Title */}
              <h3 className="font-semibold text-white">{complaint.title}</h3>

              {/* Description */}
              <p className="text-sm text-gray-300 mt-1 flex-1">
                {complaint.description}
              </p>

              {/* Location */}
              <p className="text-xs text-gray-400 mt-3">
                Lat: {complaint.latitude.toFixed(4)}, Lon: {complaint.longitude.toFixed(4)}
              </p>
            </div>
            // --- END OF UPDATED CARD ---

          ))
        ) : (
          <p className="text-sm text-gray-400">Waiting for new complaints...</p>
        )}
      </div>
    </div>
  );
};

export default LiveFeed;
