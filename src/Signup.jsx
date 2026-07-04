import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Signup({ onIrALogin }) {
  const [nombreEntidad, setNombreEntidad] = useState("");
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensajeConfirmacion, setMensajeConfirmacion] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { nombre_entidad: nombreEntidad.trim(), nombre_usuario: nombreUsuario.trim() }
        }
      });

      if (signUpError) {
        setError(signUpError.message.includes("already registered") ? "Ese email ya tiene una cuenta." : signUpError.message);
        setLoading(false);
        return;
      }

      // Con confirmación de mail activa, data.session viene null acá — el espacio
      // (entidad + usuario administrador) se crea recién en el primer login, en Login.jsx.
      if (data.session) {
        const { error: rpcError } = await supabase.rpc("signup_crear_entidad", {
          p_nombre_entidad: nombreEntidad.trim(),
          p_nombre_usuario: nombreUsuario.trim()
        });
        if (rpcError) {
          setError("Cuenta creada pero hubo un error armando tu espacio: " + rpcError.message);
          setLoading(false);
          return;
        }
        window.location.reload();
        return;
      }

      setMensajeConfirmacion(
        "Te enviamos un mail a " + email + ". Confirmá tu cuenta desde ahí y después iniciá sesión con tu email y contraseña."
      );
      setLoading(false);
    } catch (err) {
      setError("Error al conectar: " + err.message);
      setLoading(false);
    }
  };

  if (mensajeConfirmacion) {
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
        <div style={{
          background: "#182818",
          border: "1px solid #2a4a2a",
          borderRadius: "16px",
          padding: "32px 24px",
          width: "100%",
          maxWidth: "360px",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>📩</div>
          <div style={{ color: "#dff0cf", fontSize: "14px", lineHeight: "1.6" }}>{mensajeConfirmacion}</div>
          <button
            onClick={onIrALogin}
            style={{
              marginTop: "20px",
              padding: "12px 20px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: "600",
              background: "#3a6a10",
              color: "#dff0cf",
              border: "1px solid #5a9a20",
              cursor: "pointer"
            }}
          >
            Ir a iniciar sesión
          </button>
        </div>
      </div>
    );
  }

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
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "40px", marginBottom: "8px" }}>🌱</div>
          <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: "22px", color: "#7ec850" }}>
            Creá tu espacio en RAÍZ
          </div>
        </div>

        <form onSubmit={handleSignup}>
          {[
            ["NOMBRE DE TU CULTIVO / EMPRESA", nombreEntidad, setNombreEntidad, "text"],
            ["TU NOMBRE", nombreUsuario, setNombreUsuario, "text"],
            ["EMAIL", email, setEmail, "email"],
            ["CONTRASEÑA", password, setPassword, "password"]
          ].map(([label, value, setter, type]) => (
            <div key={label} style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: "11px", color: "#5aaa5a", letterSpacing: "1px", marginBottom: "6px", fontWeight: "600" }}>
                {label}
              </div>
              <input
                type={type}
                value={value}
                onChange={(e) => setter(e.target.value)}
                required
                minLength={type === "password" ? 6 : undefined}
                style={{
                  width: "100%",
                  background: "#111e11",
                  border: "1px solid #2a4a2a",
                  borderRadius: "10px",
                  color: "#dff0cf",
                  fontSize: "14px",
                  padding: "11px 14px"
                }}
              />
            </div>
          ))}

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
            {loading ? "Creando..." : "Crear cuenta"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "18px" }}>
          <button
            type="button"
            onClick={onIrALogin}
            style={{ background: "transparent", border: "none", color: "#7ec850", fontSize: "13px", cursor: "pointer", textDecoration: "underline" }}
          >
            Ya tengo cuenta
          </button>
        </div>
      </div>
    </div>
  );
}
