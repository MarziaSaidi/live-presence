import { useEffect } from "react";
import { createClient } from "@/lib/supabase";

export function useHeartbeat(userId: string) {
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    const updateStatus = async (status: string) => {
      await supabase
        .from("presence")
        .upsert({
          user_id: userId,
          status,
          last_seen: new Date().toISOString(),
        });
    };

    // Set to online immediately
    updateStatus("online");

    // Keep sending "I'm still here" every 30 seconds
    const interval = setInterval(() => {
      updateStatus("online");
    }, 30000);

    // When user closes the tab, mark as offline
    return () => {
      clearInterval(interval);
      updateStatus("offline");
    };
  }, [userId]);
}
