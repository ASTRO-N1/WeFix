// src/app/components/LiveFeed.js
"use client";
import { useComplaints } from "../context/ComplaintContext"; // Import the hook

const LiveFeed = () => {
  // 1. Get the live feed complaints directly from the context
  const { liveFeedComplaints } = useComplaints();

  // 2. The entire useEffect subscription is GONE.

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Live Feed</h2>
      <div className="space-y-4">
        {liveFeedComplaints.length > 0 ? (
          liveFeedComplaints.map((complaint) => (
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
