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

  // This function is still correct: it only fetches *this* user's complaints
  const fetchComplaints = useCallback(async () => {
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
      .eq("user_id", user.id) // This line keeps your "View My Complaints" private
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching complaints:", error);
      setComplaints([]);
    } else {
      setComplaints(data);
    }
    setLoading(false);
  }, []);


  // --- THIS useEffect IS NOW SMARTER ---
  useEffect(() => {
    // 1. Fetch the initial data
    fetchComplaints();

    // 2. We need a variable to hold our channel so we can clean it up
    let channel;

    // 3. Create an async function to get the user and set up the subscription
    const setupSubscription = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return; // Not logged in, so don't subscribe

      // 4. Create a UNIQUE channel name just for this user
      channel = supabase
        .channel(`realtime-user-complaints:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*", // Listen for INSERT, UPDATE, DELETE
            schema: "public",
            table: "complaints",
            // 5. THIS IS THE KEY: Only listen for messages where user_id matches
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            // When a change to *my* complaints happens, refetch
            fetchComplaints();
          }
        )
        .subscribe();
    };
    
    // Call the async function to set up the subscription
    setupSubscription();

    // 6. The cleanup function
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchComplaints]); // This dependency is still correct

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
