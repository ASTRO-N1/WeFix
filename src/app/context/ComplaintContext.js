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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setComplaints([]);
      setLoading(false);
      return;
    }

    // Fetch complaints only for the logged-in user
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
    // Fetch initial complaints
    fetchComplaints();

    // Subscribe to realtime changes on complaints
    const channel = supabase
      .channel("realtime-complaints")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "complaints" },
        (payload) => {
          // Whenever a complaint changes, refresh the list
          fetchComplaints();
        }
      )
      .subscribe();

    // Clean up on unmount
    return () => {
      supabase.removeChannel(channel);
    };
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
