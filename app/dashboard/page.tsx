"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useHeartbeat } from "@/hooks/useHeartbeat";

export default function Dashboard() {
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [users, setUsers] = useState<any[]>([]);
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
    };

    getUser();
  }, []);

  useHeartbeat(userId);

  // Fetch all users and their presence
  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from("presence")
        .select("*, profiles(username)")
        .order("status");

      setUsers(data || []);
    };

    fetchUsers();

    // Refresh every 5 seconds
    const interval = setInterval(fetchUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif" }}>
      <h1>Dashboard 🟢</h1>
      <p>
        Welcome back, <strong>{email}</strong>!
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
                  user.status === "online" ? "#22c55e" : "#6b7280",
              }}
            />
            <span>{user.profiles?.username || "Unknown"}</span>
            <span style={{ color: "#6b7280", fontSize: "14px" }}>
              {user.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
