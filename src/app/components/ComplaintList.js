// src/components/ComplaintList.js
"use client";
import { useComplaints } from "../context/ComplaintContext";

const ComplaintList = () => {
  // 1. Change 'complaints' to 'myComplaints'
  const { myComplaints } = useComplaints();

  return (
    <div className="space-y-4">
      {/* 2. Update 'complaints.length' */}
      {myComplaints.length === 0 ? (
        <p className="text-gray-400">
          You have not submitted any complaints yet.
        </p>
      ) : (
        // 3. Update 'complaints.map'
        myComplaints.map((complaint) => (
          <div
            key={complaint.id}
            className="bg-gray-800 p-4 rounded-lg shadow-md"
          >
            {complaint.image_url && (
              <img
                src={complaint.image_url}
                alt="complaint"
                className="w-full h-48 object-cover rounded-md mb-4"
              />
            )}
            <h3 className="font-bold text-lg">{complaint.title}</h3>
            <p className="text-gray-300 text-sm mt-2">
              {complaint.description}
            </p>
            <div className="flex justify-between items-center mt-4">
              <p className="text-xs text-gray-400">
                Location: Lat {complaint.latitude.toFixed(4)}, Lon{" "}
                {complaint.longitude.toFixed(4)}
              </p>
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  complaint.status === "Resolved"
                    ? "bg-green-500 text-black"
                    : "bg-yellow-500 text-black"
                }`}
              >
                {complaint.status}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
export default ComplaintList;
