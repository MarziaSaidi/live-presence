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
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

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

      const createdAt = new Date(user.created_at);
      const now = new Date();
      const diffInSeconds = (now.getTime() - createdAt.getTime()) / 1000;
      const isNewUser = diffInSeconds < 60;

      setIsNew(isNewUser);
      setLoading(false);
    };

    getUser();
  }, []);

  useHeartbeat(userId);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from("presence")
        .select("*, profiles(username)")
        .order("status");

      setUsers(data || []);
    };

    fetchUsers();

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
          fetchUsers();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!userId || !email) return;

    const channel = supabase.channel("typing-indicator");
    const typingTimers: Record<string, NodeJS.Timeout> = {};

    channel.on("broadcast", { event: "typing" }, ({ payload }) => {
      if (payload.userId === userId) return;

      setTypingUsers((prev) => {
        if (!prev.includes(payload.username)) {
          return [...prev, payload.username];
        }
        return prev;
      });

      if (typingTimers[payload.username]) {
        clearTimeout(typingTimers[payload.username]);
      }

      typingTimers[payload.username] = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u !== payload.username));
      }, 3000);
    });

    channel.subscribe();

    return () => {
      Object.values(typingTimers).forEach(clearTimeout);
      supabase.removeChannel(channel);
    };
  }, [userId, email]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background:
            "linear-gradient(135deg, #e8f5e9 0%, #b9f6ca 50%, #69f0ae 100%)",
          fontFamily: '"Quicksand", system-ui, sans-serif',
        }}
      >
        <div
          style={{
            textAlign: "center",
            animation: "float 3s ease-in-out infinite",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🌱</div>
          <p style={{ fontSize: "18px", color: "#2e7d32", fontWeight: "600" }}>
            Waking up the forest spirits...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 50%, #fff9c4 100%)",
        fontFamily: '"Quicksand", system-ui, sans-serif',
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Floating elements background */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "none",
          opacity: 0.3,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "5%",
            fontSize: "32px",
            animation: "float 6s ease-in-out infinite",
          }}
        >
          🍃
        </div>
        <div
          style={{
            position: "absolute",
            top: "60%",
            right: "10%",
            fontSize: "28px",
            animation: "float 8s ease-in-out infinite 1s",
          }}
        >
          ✨
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "20%",
            left: "15%",
            fontSize: "24px",
            animation: "float 7s ease-in-out infinite 2s",
          }}
        >
          🌸
        </div>
        <div
          style={{
            position: "absolute",
            top: "30%",
            right: "20%",
            fontSize: "20px",
            animation: "float 5s ease-in-out infinite 1.5s",
          }}
        >
          🦋
        </div>
      </div>

      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "40px 20px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Navbar */}
        <div
          style={{
            marginBottom: "32px",
            padding: "24px 28px",
            background: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(10px)",
            borderRadius: "20px",
            boxShadow: "0 8px 32px rgba(76, 175, 80, 0.15)",
            border: "2px solid rgba(139, 195, 74, 0.2)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            transition: "transform 0.3s ease",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "28px",
                fontWeight: "700",
                background: "linear-gradient(135deg, #43a047 0%, #66bb6a 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "0.5px",
              }}
            >
              🌿 Spirit Garden
            </h1>
            <p
              style={{
                margin: "6px 0 0 0",
                color: "#558b2f",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              {isNew ? "✨ Welcome, new spirit!" : "🌸 Welcome back,"}{" "}
              <strong>{email.split("@")[0]}</strong>
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: "12px 24px",
              background: "linear-gradient(135deg, #ef5350 0%, #e57373 100%)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              boxShadow: "0 4px 15px rgba(239, 83, 80, 0.3)",
              transition: "all 0.3s ease",
              transform: "translateY(0)",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 6px 20px rgba(239, 83, 80, 0.4)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 4px 15px rgba(239, 83, 80, 0.3)";
            }}
          >
            Leave Garden
          </button>
        </div>

        {/* Users Section */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(10px)",
            borderRadius: "20px",
            padding: "28px",
            boxShadow: "0 8px 32px rgba(76, 175, 80, 0.15)",
            border: "2px solid rgba(139, 195, 74, 0.2)",
            marginBottom: "24px",
            transition: "transform 0.3s ease",
          }}
        >
          <h2
            style={{
              margin: "0 0 20px 0",
              fontSize: "20px",
              fontWeight: "700",
              color: "#388e3c",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "24px" }}>🌟</span>
            Garden Visitors ({
              users.filter((u) => u.status === "online").length
            }{" "}
            awake)
          </h2>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {users.length === 0 ? (
              <p
                style={{
                  color: "#7cb342",
                  fontSize: "14px",
                  textAlign: "center",
                  padding: "20px",
                  fontStyle: "italic",
                }}
              >
                The garden is quiet... waiting for spirits to arrive 🍃
              </p>
            ) : (
              users.map((user) => (
                <div
                  key={user.user_id}
                  style={{
                    padding: "16px 20px",
                    background:
                      user.status === "online"
                        ? "linear-gradient(135deg, rgba(200, 230, 201, 0.5) 0%, rgba(165, 214, 167, 0.5) 100%)"
                        : user.status === "idle"
                          ? "linear-gradient(135deg, rgba(255, 249, 196, 0.5) 0%, rgba(255, 241, 118, 0.5) 100%)"
                          : "linear-gradient(135deg, rgba(245, 245, 245, 0.5) 0%, rgba(224, 224, 224, 0.5) 100%)",
                    borderRadius: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    transition: "all 0.4s ease",
                    border: "2px solid",
                    borderColor:
                      user.status === "online"
                        ? "rgba(76, 175, 80, 0.3)"
                        : user.status === "idle"
                          ? "rgba(255, 235, 59, 0.3)"
                          : "rgba(189, 189, 189, 0.3)",
                    transform: "translateX(0)",
                    animation: "slideIn 0.5s ease-out",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateX(4px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 20px rgba(76, 175, 80, 0.2)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateX(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{ position: "relative" }}>
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        backgroundColor:
                          user.status === "online"
                            ? "#4caf50"
                            : user.status === "idle"
                              ? "#ffeb3b"
                              : "#bdbdbd",
                        transition: "all 0.4s ease",
                        boxShadow:
                          user.status === "online"
                            ? "0 0 16px rgba(76, 175, 80, 0.8), 0 0 8px rgba(76, 175, 80, 0.5)"
                            : user.status === "idle"
                              ? "0 0 16px rgba(255, 235, 59, 0.8)"
                              : "none",
                        animation:
                          user.status === "online"
                            ? "pulse 2s ease-in-out infinite"
                            : "none",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      flex: 1,
                      fontWeight: "600",
                      fontSize: "15px",
                      color: "#2e7d32",
                      letterSpacing: "0.3px",
                    }}
                  >
                    {user.status === "online"
                      ? "🌱"
                      : user.status === "idle"
                        ? "😴"
                        : "💤"}{" "}
                    {user.profiles?.username || "Unknown Spirit"}
                  </span>
                  <span
                    style={{
                      color: "#558b2f",
                      fontSize: "12px",
                      textTransform: "capitalize",
                      padding: "6px 14px",
                      background: "rgba(255, 255, 255, 0.7)",
                      borderRadius: "12px",
                      border: "1.5px solid rgba(139, 195, 74, 0.3)",
                      fontWeight: "600",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {user.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Section */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(10px)",
            borderRadius: "20px",
            padding: "28px",
            boxShadow: "0 8px 32px rgba(76, 175, 80, 0.15)",
            border: "2px solid rgba(139, 195, 74, 0.2)",
          }}
        >
          <h2
            style={{
              margin: "0 0 20px 0",
              fontSize: "20px",
              fontWeight: "700",
              color: "#388e3c",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "24px" }}>💬</span>
            Whispers in the Wind
          </h2>

          {typingUsers.length > 0 && (
            <div
              style={{
                fontSize: "14px",
                color: "#558b2f",
                fontStyle: "italic",
                marginBottom: "16px",
                padding: "12px 16px",
                background:
                  "linear-gradient(135deg, rgba(200, 230, 201, 0.4) 0%, rgba(165, 214, 167, 0.4) 100%)",
                borderRadius: "12px",
                border: "2px solid rgba(129, 199, 132, 0.3)",
                animation:
                  "fadeIn 0.4s ease-in-out, gentle-bounce 2s ease-in-out infinite",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "18px",
                  animation: "wiggle 1s ease-in-out infinite",
                }}
              >
                ✨
              </span>
              <span>
                {typingUsers.join(", ")}{" "}
                {typingUsers.length === 1 ? "is" : "are"} weaving words...
              </span>
            </div>
          )}

          <input
            type="text"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);

              supabase.channel("typing-indicator").send({
                type: "broadcast",
                event: "typing",
                payload: { userId, username: email },
              });
            }}
            placeholder="Share your thoughts with the garden... 🌸"
            style={{
              width: "100%",
              padding: "16px 20px",
              fontSize: "15px",
              borderRadius: "14px",
              border: "2px solid rgba(139, 195, 74, 0.3)",
              outline: "none",
              transition: "all 0.3s ease",
              fontFamily: "inherit",
              background: "rgba(255, 255, 255, 0.5)",
              color: "#2e7d32",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#66bb6a";
              e.currentTarget.style.boxShadow =
                "0 0 20px rgba(102, 187, 106, 0.3)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.9)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(139, 195, 74, 0.3)";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.5)";
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @import url("https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap");

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes gentle-bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }

        @keyframes wiggle {
          0%,
          100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(-10deg);
          }
          75% {
            transform: rotate(10deg);
          }
        }
      `}</style>
    </div>
  );
}
