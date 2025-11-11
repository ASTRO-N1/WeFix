// src/app/components/LiveFeed.js
"use client";
import { useComplaints } from "../context/ComplaintContext"; // Import the hook
import { useState, useEffect } from "react"; // Import useState and useEffect
import { supabase } from "../../utils/supabaseClient"; // Import supabase

const LiveFeed = () => {
  // Get the live feed complaints from the context (this is what's not working)
  const { liveFeedComplaints } = useComplaints();

  // --- NEW DIAGNOSTIC CODE ---
  const [manualComplaints, setManualComplaints] = useState([]);
  const [testError, setTestError] = useState(null);

  useEffect(() => {
    // This function will manually fetch all complaints.
    // This BYPASSES Realtime and tests your RLS SELECT policy directly.
    const runRLSTest = async () => {
      console.log("LIVE FEED [TEST]: Manually fetching all complaints...");
      
      const { data, error } = await supabase
        .from("complaints")
        .select("*, profiles(full_name)")
        .order("created_at", { ascending: false })
        .limit(10); // Get the top 10

      if (error) {
        console.error("LIVE FEED [TEST ERROR]:", error.message);
        setTestError(error.message);
      } else {
        console.log("LIVE FEED [TEST SUCCESS]: Manually fetched data:", data);
        setManualComplaints(data);
      }
    };

    // Run the test immediately when the component loads
    runRLSTest();
    
    // And run it again every 10 seconds to simulate a "poll"
    const interval = setInterval(runRLSTest, 10000);

    // Clean up the interval
    return () => clearInterval(interval);

  }, []); // Empty array, runs once on mount
  // --- END DIAGNOSTIC CODE ---


  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Live Feed (Realtime)</h2>
      <div className="space-y-4 p-4 border border-dashed border-gray-600 rounded-lg min-h-[100px]">
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
          <p className="text-sm text-gray-400">
            {/* THIS IS THE FIX: ' replaced with &apos; */}
            Waiting for new complaints... (This is the one that&apos;s not working)
          </p>
        )}
      </div>

      {/* --- NEW DIAGNOSTIC UI --- */}
      <h2 className="text-xl font-bold mb-4 mt-8">Manual Fetch (Test)</h2>
      <p className="text-sm text-gray-400 mb-2">This list bypasses Realtime and fetches directly from the DB every 10s. We are using this to test your RLS policy.</p>
      
      {testError && (
        <p className="text-red-400">Test Error: {testError}</p>
      )}

      <div className="space-y-4 p-4 border border-dashed border-blue-500 rounded-lg min-h-[100px]">
        {manualComplaints.length > 0 ? (
          manualComplaints.map((complaint) => (
            <div key={complaint.id} className="bg-gray-600 p-3 rounded-lg">
              <p className="text-sm text-gray-300">
                <span className="font-semibold">
                  {complaint.profiles?.full_name || "Unknown"}
                </span>{" "}
                submitted:
              </p>
              <p className="font-semibold mt-1">{complaint.title}</p>
              <p className="text-xs text-gray-400">User ID: {complaint.user_id}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-400">Manually fetching complaints...</p>
        )}
      </div>
      {/* --- END DIAGNOSTIC UI --- */}
    </div>
  );
};

export default LiveFeed;
