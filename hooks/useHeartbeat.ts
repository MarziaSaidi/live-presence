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

    // Heartbeat every 30 seconds
    const heartbeatInterval = setInterval(() => {
      updateStatus("online");
    }, 30000);

    // Idle detection
    let idleTimer: NodeJS.Timeout;

    const resetIdle = () => {
      clearTimeout(idleTimer);
      updateStatus("online");

      // If no activity for 60 seconds, mark as idle
      idleTimer = setTimeout(() => {
        updateStatus("idle");
      }, 60000);
    };

    // Listen for activity
    window.addEventListener("mousemove", resetIdle);
    window.addEventListener("keydown", resetIdle);
    window.addEventListener("click", resetIdle);

    // Start the idle timer
    resetIdle();

    // Cleanup
    return () => {
      clearInterval(heartbeatInterval);
      clearTimeout(idleTimer);
      window.removeEventListener("mousemove", resetIdle);
      window.removeEventListener("keydown", resetIdle);
      window.removeEventListener("click", resetIdle);
      updateStatus("offline");
    };
  }, [userId]);
}
