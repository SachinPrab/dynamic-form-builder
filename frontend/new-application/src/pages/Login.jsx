import { generateCodeVerifier, generateCodeChallenge, generateState } from "../pkce.js";
import React from "react";
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const REDIRECT_URI = "http://localhost:5173/callback";
const SCOPES = [
  "data.records:read",
  "data.records:write",
  "schema.bases:read",
  "webhook:manage"
].join(" ");

function LoginWithAirtable() {
  const login = async () => {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateState();

    // Store codeVerifier and state for later verification in callback
    sessionStorage.setItem("pkce_code_verifier", codeVerifier);
    sessionStorage.setItem("oauth_state", state);

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: "code",
      scope: SCOPES,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    window.location.href = `https://airtable.com/oauth2/v1/authorize?${params.toString()}`;
  };

  return (
    <button onClick={login}>
      Login with Airtable
    </button>
  );
}

export default LoginWithAirtable;
