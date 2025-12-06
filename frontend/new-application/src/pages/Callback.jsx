import { useState, useEffect } from "react";

export default function Callback() {
  const [status, setStatus] = useState("Processing...");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const codeVerifier = sessionStorage.getItem("pkce_code_verifier");

    if (code) {
      setStatus("Authorization code received: " + code);
    } else {
      setStatus("No authorization code found in the URL.");
      return;
    }

    fetch("http://localhost:4000/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ code: code, code_verifier: codeVerifier }),
    })
      .then((res) => res.json())
      .then((data) => {
  console.log("Token response:", data);
  if (data.success) {
    sessionStorage.setItem("currentUser", JSON.stringify(data.user));
    setStatus("Login successful! Redirecting...");
    window.location.href = "/bases";
  } else {
    setStatus("Login failed: " + (data.error || "Unknown"));
  }
})
  }, []);
  return <div>{status}</div>;
}
