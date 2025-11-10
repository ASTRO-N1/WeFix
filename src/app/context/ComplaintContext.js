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
  const [publicFeed, setPublicFeed] = useState([]); // <-- ADD THIS
  const [loading, setLoading] = useState(true);

  const fetchComplaints = useCallback(async () => {
    // ... (this function is unchanged)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setComplaints([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .eq("user_id", user.id)
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

    // This one channel will now handle BOTH user complaints AND the live feed.
    const channel = supabase
      .channel("realtime-complaints") // We use just this one channel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "complaints" },
        async (payload) => {
          // 1. Refetch the user's own complaints on any change
          fetchComplaints();

          // 2. If it's a new complaint, add it to the public feed
          if (payload.eventType === "INSERT") {
            // Fetch the profile for the new complaint
            const { data, error } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", payload.new.user_id)
              .single();

            if (data) {
              const complaintWithProfile = { ...payload.new, profile: data };
              // Add the new complaint to the start of the feed
              setPublicFeed((prev) => [complaintWithProfile, ...prev]);
            } else if (error) {
              console.error("Error fetching profile for live feed:", error);
            }
          }
        }
      )
      .subscribe();

    // Cleanup the subscription when the component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchComplaints]); // Dependency is correct

  return (
    <ComplaintContext.Provider
      value={{ complaints, loading, publicFeed, fetchComplaints }} // <-- PASS publicFeed
    >
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
