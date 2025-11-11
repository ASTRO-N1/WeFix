// src/app/context/ComplaintContext.js
"use client";
import {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { supabase } from "../../utils/supabaseClient";

const ComplaintContext = createContext(null);

export const ComplaintProvider = ({ children }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchComplaints = useCallback(async () => {
    // We don't need to set loading to true here on every refetch
    // to prevent the loading spinner from flashing on every update.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setComplaints([]);
      setLoading(false);
      return;
    }

    // --- THIS IS THE FIX ---
    // We now filter by the logged-in user's ID.
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .eq("user_id", user.id) // This line was added
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching complaints:", error);
      setComplaints([]);
    } else {
      setComplaints(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Fetch initial data
    fetchComplaints();

    // Set up the real-time subscription
    // This channel name is fine, it will refetch this user's complaints
// Comment out this entire block ⬇️
/*
const channel = supabase
  .channel("realtime-complaints")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "complaints" },
    (payload) => {
      fetchComplaints();
    }
  )
  .subscribe();

return () => {
  supabase.removeChannel(channel);
};
*/

  }, [fetchComplaints]);

  return (
    <ComplaintContext.Provider value={{ complaints, loading, fetchComplaints }}>
      {children}
    </ComplaintContext.Provider>
  );
};

export const useComplaints = () => {
  const context = useContext(ComplaintContext);
  if (context === null) {
    throw new Error("useComplaints must be used within a ComplaintProvider");
  }
  return context;
};
