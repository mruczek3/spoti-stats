import { useEffect, useState } from "react";
import { exchangeCodeForToken } from "../services/auth";

export function Callback() {
  const [status, setStatus] = useState("Processing...");

  useEffect(() => {
    async function handleCallback() {
      try {
        // Get the authorization code from URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const error = params.get("error");

        if (error) {
          console.error("Auth error:", error);
          setStatus("Authentication failed");
          setTimeout(() => {
            window.location.replace(import.meta.env.BASE_URL || "/");
          }, 2000);
          return;
        }

        if (!code) {
          console.error("No code in callback URL");
          setStatus("Invalid callback");
          setTimeout(() => {
            window.location.replace(import.meta.env.BASE_URL || "/");
          }, 2000);
          return;
        }

        // Exchange code for access token
        await exchangeCodeForToken(code);
        setStatus("Success! Redirecting...");

        // Redirect to dashboard after short delay
        setTimeout(() => {
          window.location.replace(import.meta.env.BASE_URL || "/");
        }, 1000);
      } catch (error) {
        console.error("Token exchange failed:", error);
        setStatus("Token exchange failed");
        setTimeout(() => {
          window.location.replace(import.meta.env.BASE_URL || "/");
        }, 2000);
      }
    }

    handleCallback();
  }, []);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#0a0a0a",
        color: "#ffffff",
        fontFamily: "DM Sans",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: "50px",
            height: "50px",
            border: "3px solid #1db954",
            borderRadius: "50%",
            borderTopColor: "transparent",
            animation: "spin 1s linear infinite",
            margin: "0 auto 20px",
          }}
        />
        <p>{status}</p>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
