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
  const [loading, setLoading] = useState(true);

  // This function just fetches the current user's complaints
  const fetchMyComplaints = useCallback(async () => {
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMyComplaints([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user's complaints:", error);
      setMyComplaints([]);
    } else {
      setMyComplaints(data || []);
    }
    setLoading(false);
  }, []);

  // Run once on initial load
  useEffect(() => {
    fetchMyComplaints();
  }, [fetchMyComplaints]);

  return (
    <ComplaintContext.Provider 
      value={{ 
        myComplaints, // The state for the user's own complaints
        loading,      // The loading state for the dashboard
        fetchMyComplaints // The function to refresh the user's complaints
      }}
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
