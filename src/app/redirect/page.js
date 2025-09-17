// src/app/redirect/page.js
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../utils/supabaseClient";

const RedirectPage = () => {
  const router = useRouter();

  useEffect(() => {
    const checkRoleAndRedirect = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Explicitly fetch the latest user profile
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          // Fallback to the user dashboard if there's an error
          router.replace("/dashboard");
          return;
        }

        if (profile?.role === "admin") {
          router.replace("/admin/dashboard");
        } else {
          router.replace("/dashboard");
        }
      } else {
        // If no user is found, send back to login
        router.replace("/");
      }
    };

    checkRoleAndRedirect();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <p>Redirecting...</p>
    </div>
  );
};

export default RedirectPage;
