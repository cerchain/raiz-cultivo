import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Login({ onLogin, onIrASignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (authError || !authData?.user) {
        setError("Email o contraseña incorrectos");
        setLoading(false);
        return;
      }

      let { data, error: dbError } = await supabase
        .from("usuarios")
        .select("*")
        .eq("auth_id", authData.user.id)
        .eq("activo", true)
        .single();

      if (dbError || !data) {
        // Puede ser la primera vez que loguea tras confirmar el mail: signup de entidad nueva, o invitación aceptada.
        const meta = authData.user.user_metadata;
        if (meta?.nombre_entidad) {
          const { error: rpcError } = await supabase.rpc("signup_crear_entidad", {
            p_nombre_entidad: meta.nombre_entidad,
            p_nombre_usuario: meta.nombre_usuario
          });
          if (rpcError) {
            setError("Error creando tu espacio: " + rpcError.message);
            setLoading(false);
            return;
          }
          const retry = await supabase
            .from("usuarios")
            .select("*")
            .eq("auth_id", authData.user.id)
            .single();
          data = retry.data;
        } else if (meta?.invite_usuario_id) {
          const { error: rpcError } = await supabase.rpc("aceptar_invitacion", {
            p_usuario_id: meta.invite_usuario_id
          });
          if (rpcError) {
            setError("Error vinculando tu invitación: " + rpcError.message);
            setLoading(false);
            return;
          }
          const retry = await supabase
            .from("usuarios")
            .select("*")
            .eq("auth_id", authData.user.id)
            .single();
          data = retry.data;
        }

        if (!data) {
          await supabase.auth.signOut();
          setError("Usuario no encontrado o inactivo. Contactá a tu Master Grower.");
          setLoading(false);
          return;
        }
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

          <div style={{ marginBottom: "16px" }}>
            <label style={{
              fontSize: "11px",
              color: "#5aaa5a",
              letterSpacing: "2px",
              display: "block",
              marginBottom: "8px",
              fontWeight: "600"
            }}>CONTRASEÑA</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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

        {onIrASignup && (
          <div style={{ textAlign: "center", marginTop: "18px" }}>
            <button
              type="button"
              onClick={onIrASignup}
              style={{
                background: "transparent",
                border: "none",
                color: "#7ec850",
                fontSize: "13px",
                cursor: "pointer",
                textDecoration: "underline"
              }}
            >
              ¿No tenés cuenta? Creá una
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
