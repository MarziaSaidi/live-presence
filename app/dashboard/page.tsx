"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useHeartbeat } from "@/hooks/useHeartbeat";

export default function Dashboard() {
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [isNew, setIsNew] = useState(false);
  const [message, setMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setEmail(user.email || "");
      setUserId(user.id);

      // Check if user was created recently (within last 60 seconds = new user)
      const createdAt = new Date(user.created_at);
      const now = new Date();
      const diffInSeconds = (now.getTime() - createdAt.getTime()) / 1000;
      const isNewUser = diffInSeconds < 60;

      setIsNew(isNewUser);
    };

    getUser();
  }, []);

  useHeartbeat(userId);

  // Fetch all users and their presence with REALTIME
  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from("presence")
        .select("*, profiles(username)")
        .order("status");

      setUsers(data || []);
    };

    // Initial fetch
    fetchUsers();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("presence-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "presence",
        },
        () => {
          // Refetch when anything changes
          fetchUsers();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Typing indicator broadcast
  useEffect(() => {
    if (!userId || !email) return;

    const channel = supabase.channel("typing-indicator");
    const typingTimers: Record<string, NodeJS.Timeout> = {};

    // Listen for others typing
    channel.on("broadcast", { event: "typing" }, ({ payload }) => {
      if (payload.userId === userId) return; // Ignore yourself

      // Add to typing users
      setTypingUsers((prev) => {
        if (!prev.includes(payload.username)) {
          return [...prev, payload.username];
        }
        return prev;
      });

      // Clear existing timer for this user
      if (typingTimers[payload.username]) {
        clearTimeout(typingTimers[payload.username]);
      }

      // Remove after 3 seconds of no new typing signals
      typingTimers[payload.username] = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u !== payload.username));
      }, 60000);
    });

    channel.subscribe();

    return () => {
      Object.values(typingTimers).forEach(clearTimeout);
      supabase.removeChannel(channel);
    };
  }, [userId, email]);

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif" }}>
      <h1>Dashboard 🟢</h1>
      <p>
        {isNew ? "Welcome" : "Welcome back"}, <strong>{email}</strong>!
      </p>

      <h2>Who's Online</h2>
      <div style={{ marginTop: "20px" }}>
        {users.map((user) => (
          <div
            key={user.user_id}
            style={{
              padding: "10px",
              marginBottom: "8px",
              backgroundColor: "#f5f5f5",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor:
                  user.status === "online"
                    ? "#22c55e"
                    : user.status === "idle"
                      ? "#eab308"
                      : "#6b7280",
              }}
            />
            <span>{user.profiles?.username || "Unknown"}</span>
            <span style={{ color: "#6b7280", fontSize: "14px" }}>
              {user.status}
            </span>
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: "40px" }}>Chat</h2>

      {typingUsers.length > 0 && (
        <p style={{ fontSize: "14px", color: "#6b7280", fontStyle: "italic" }}>
          {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"}{" "}
          typing...
        </p>
      )}

      <input
        type="text"
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);

          // Broadcast typing
          supabase.channel("typing-indicator").send({
            type: "broadcast",
            event: "typing",
            payload: { userId, username: email },
          });
        }}
        placeholder="Type a message..."
        style={{
          width: "100%",
          padding: "12px",
          fontSize: "16px",
          borderRadius: "8px",
          border: "1px solid #ccc",
        }}
      />
    </div>
  );
}
