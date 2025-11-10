// src/app/admin/(protected)/resolved/page.js
"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../../utils/supabaseClient"; // Adjusted path

const ResolvedComplaintsPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResolvedComplaints = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("complaints")
        .select("*, profiles(full_name)") // Fetch profile name
        .eq("status", "Resolved")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching resolved complaints:", error);
        setComplaints([]);
      } else {
        setComplaints(data || []);
      }
      setLoading(false);
    };

    fetchResolvedComplaints();
  }, []);

  if (loading) {
    return <p>Loading resolved complaints...</p>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Resolved Complaints</h1>
      <div className="space-y-4">
        {complaints.length === 0 ? (
          <p className="text-gray-400">No resolved complaints found.</p>
        ) : (
          // Using a card-based layout as requested
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {complaints.map((complaint) => (
              <div
                key={complaint.id}
                className="bg-gray-800 p-4 rounded-lg shadow-md flex flex-col"
              >
                {complaint.image_url && (
                  <img
                    src={complaint.image_url}
                    alt="complaint"
                    className="w-full h-48 object-cover rounded-md mb-4"
                  />
                )}
                <h3 className="font-bold text-lg">{complaint.title}</h3>

                <p className="text-sm text-gray-500 mt-1">
                  Submitted by:{" "}
                  <span className="font-medium text-gray-400">
                    {complaint.profiles?.full_name || "Unknown User"}
                  </span>
                </p>

                <p className="text-gray-300 text-sm mt-2 flex-1">
                  {complaint.description}
                </p>

                <div className="flex justify-between items-center mt-4">
                  <p className="text-xs text-gray-400">
                    Lat {complaint.latitude.toFixed(4)}, Lon{" "}
                    {complaint.longitude.toFixed(4)}
                  </p>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-500 text-black">
                    {complaint.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResolvedComplaintsPage;
