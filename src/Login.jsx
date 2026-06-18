import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error: dbError } = await supabase
        .from("usuarios")
        .select("*")
        .eq("email", email.trim().toLowerCase())
        .eq("activo", true)
        .single();

      if (dbError || !data) {
        setError("Email no encontrado o usuario inactivo");
        setLoading(false);
        return;
      }

      onLogin(data);
    } catch (err) {
      setError("Error al conectar: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{
      fontFamily: "'IBM Plex Mono',monospace",
      background: "#0e160e",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=DM+Serif+Display:ital@0;1&display=swap');
        *{box-sizing:border-box;}
        input{outline:none;font-family:'IBM Plex Mono',monospace;}
        input:focus{border-color:#4aaa4a!important;}
      `}</style>

      <div style={{
        background: "#182818",
        border: "1px solid #2a4a2a",
        borderRadius: "16px",
        padding: "32px 24px",
        width: "100%",
        maxWidth: "360px"
      }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontSize: "40px", marginBottom: "8px" }}>🌱</div>
          <div style={{
            fontFamily: "'DM Serif Display',serif",
            fontSize: "24px",
            color: "#7ec850"
          }}>RAÍZ</div>
          <div style={{
            fontSize: "11px",
            color: "#4a8a4a",
            letterSpacing: "2px",
            marginTop: "4px"
          }}>CUADERNO DE CULTIVO</div>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{
              fontSize: "11px",
              color: "#5aaa5a",
              letterSpacing: "2px",
              display: "block",
              marginBottom: "8px",
              fontWeight: "600"
            }}>EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              style={{
                width: "100%",
                background: "#111e11",
                border: "1px solid #2a4a2a",
                borderRadius: "10px",
                color: "#dff0cf",
                fontSize: "15px",
                padding: "12px 14px"
              }}
            />
          </div>

          {error && (
            <div style={{
              background: "#2a1010",
              border: "1px solid #6a2020",
              borderRadius: "10px",
              padding: "10px 14px",
              fontSize: "13px",
              color: "#e74c3c",
              marginBottom: "16px"
            }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: "600",
              background: loading ? "#2a4a2a" : "#3a6a10",
              color: "#dff0cf",
              border: "1px solid #5a9a20",
              cursor: loading ? "default" : "pointer"
            }}
          >
            {loading ? "Verificando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
