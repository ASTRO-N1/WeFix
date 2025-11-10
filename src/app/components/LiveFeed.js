// src/components/LiveFeed.js
"use client";
// We no longer need useEffect or supabaseClient here
import { useComplaints } from "../context/ComplaintContext";

const LiveFeed = () => {
  // Get the publicFeed state directly from the context
  const { publicFeed } = useComplaints();

  // The component no longer needs its own useEffect or channel subscription.
  // The ComplaintProvider (which is always mounted) handles all of it.

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Live Feed</h2>
      <div className="space-y-4">
        {publicFeed.length > 0 ? (
          publicFeed.map((complaint) => (
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
