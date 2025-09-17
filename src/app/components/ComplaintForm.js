// src/components/ComplaintForm.js
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../utils/supabaseClient";
import { useComplaints } from "../context/ComplaintContext";

const ComplaintForm = () => {
  const router = useRouter();
  const { fetchComplaints } = useComplaints();
  const [complaintType, setComplaintType] = useState("Pothole");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState(
    "Click the button to get your location."
  );
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGetLocation = () => {
    /* ... (this function is unchanged) ... */
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation is not supported by your browser.");
      return;
    }
    setLocationStatus("Fetching location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationStatus("Location captured successfully!");
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        setLocationStatus(
          "Unable to retrieve your location. Please check your browser permissions."
        );
      }
    );
  };

  const handleImageChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setImageFile(event.target.files[0]);
    }
  };

  // --- THIS FUNCTION WAS MISSING ---
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!location) {
      alert("Please provide your location.");
      return;
    }
    setIsSubmitting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in.");
      setIsSubmitting(false);
      return;
    }

    let imageUrl = null;
    if (imageFile) {
      const filePath = `${user.id}/${Date.now()}_${imageFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("complaint-images")
        .upload(filePath, imageFile);

      if (uploadError) {
        console.error("Error uploading image:", uploadError);
        alert("There was a problem uploading your image.");
        setIsSubmitting(false);
        return;
      }
      const { data: urlData } = supabase.storage
        .from("complaint-images")
        .getPublicUrl(filePath);
      imageUrl = urlData.publicUrl;
    }

    const { error: insertError } = await supabase.from("complaints").insert([
      {
        title: `${complaintType} Complaint`,
        description: description,
        status: "Pending",
        latitude: location.latitude,
        longitude: location.longitude,
        user_id: user.id,
        image_url: imageUrl,
      },
    ]);

    if (insertError) {
      console.error("Error inserting data:", insertError);
      alert("There was a problem submitting your complaint.");
    } else {
      await fetchComplaints();
      router.push("/dashboard/view-complaints");
    }
    setIsSubmitting(false);
  };
  // ------------------------------------

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      <div>
        <label className="text-sm font-medium text-gray-300">
          Complaint Type
        </label>
        <select
          value={complaintType}
          onChange={(e) => setComplaintType(e.target.value)}
          className="w-full mt-2 p-2 bg-gray-700 border border-gray-600 rounded-md"
        >
          <option>Pothole</option>
          <option>Broken Streetlight</option>
          <option>Garbage Overflow</option>
          <option>Other</option>
        </select>
      </div>
      <div className="p-4 border border-gray-700 rounded-md">
        <label className="text-sm font-medium text-gray-300">Location</label>
        <button
          type="button"
          onClick={handleGetLocation}
          className="mt-2 px-4 py-2 text-sm bg-gray-600 rounded-md hover:bg-gray-500"
        >
          Get My Current Location
        </button>
        <p className="mt-2 text-xs text-gray-400">Status: {locationStatus}</p>
        {location && (
          <p className="text-xs text-green-400">
            Lat: {location.latitude.toFixed(5)}, Lon:{" "}
            {location.longitude.toFixed(5)}
          </p>
        )}
      </div>
      <div>
        <label className="text-sm font-medium text-gray-300">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows="4"
          className="w-full mt-2 p-2 bg-gray-700 border border-gray-600 rounded-md"
        ></textarea>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-300">
          Upload Photo (optional)
        </label>
        <input
          type="file"
          onChange={handleImageChange}
          accept="image/*"
          className="w-full mt-2 text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-500"
      >
        {isSubmitting ? "Submitting..." : "Submit Complaint"}
      </button>
    </form>
  );
};

export default ComplaintForm;
