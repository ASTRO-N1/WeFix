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
  const [myComplaints, setMyComplaints] = useState([]);
  const [liveFeedComplaints, setLiveFeedComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Fetches only the current user's complaints
  const fetchMyComplaints = useCallback(async (userId) => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user's complaints:", error);
      setMyComplaints([]);
    } else {
      setMyComplaints(data || []);
    }
  }, []);

  // Main useEffect to manage initial load and all realtime events
  useEffect(() => {
    let channel;

    const setup = async () => {
      setLoading(true);

      // 1. Get the user
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setCurrentUserId(user.id);
        
        // 2. Fetch initial data for "My Complaints"
        await fetchMyComplaints(user.id);

        // 3. --- SINGLE REALTIME SUBSCRIPTION ---
        // This one channel handles everything
        channel = supabase
          .channel("all-complaints-realtime")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "complaints" },
            async (payload) => {
              
              const record = payload.new || payload.old;
              
              // --- Handle INSERT (for Live Feed AND My Complaints) ---
              if (payload.eventType === "INSERT") {
                console.log("CONTEXT: Received INSERT", payload.new);
                
                // 1. Add to Live Feed
                const { data: profile, error } = await supabase
                  .from("profiles")
                  .select("full_name")
                  .eq("id", payload.new.user_id)
                  .single();
                
                if (error) console.error("Error fetching profile for live feed:", error);

                const newComplaint = { ...payload.new, profile: profile || {} };
                setLiveFeedComplaints((prev) => [newComplaint, ...prev.slice(0, 19)]); // Add to live feed (keep it at 20)

                // 2. Check if it's OUR new complaint
                if (record.user_id === user.id) {
                  console.log("CONTEXT: It's our own insert, adding to myComplaints");
                  setMyComplaints((prev) => [newComplaint, ...prev]); // Add to local state
                }
              }

              // --- Handle UPDATE or DELETE (for "My Complaints") ---
              if ((payload.eventType === "UPDATE" || payload.eventType === "DELETE")) {
                // If the changed record belongs to the current user, refetch their list
                if (record.user_id === user.id) {
                  console.log("CONTEXT: Received", payload.eventType, "for current user, refetching");
                  await fetchMyComplaints(user.id);
                }
              }
            }
          )
          .subscribe((status) => console.log("CONTEXT: Supabase subscription status:", status));

      } else {
        setMyComplaints([]);
      }
      setLoading(false);
    };

    setup();

    // Clean up on unmount
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchMyComplaints]); // Runs once on mount

  return (
    <ComplaintContext.Provider value={{ myComplaints, liveFeedComplaints, loading }}>
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
