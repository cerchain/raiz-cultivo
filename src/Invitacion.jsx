import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

export default function Invitacion({ usuarioId, onIrALogin }) {
  const [invitacion, setInvitacion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensajeConfirmacion, setMensajeConfirmacion] = useState("");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("obtener_invitacion", { p_usuario_id: usuarioId });
      if (error || !data || !data.length) {
        setError("Este link de invitación no es válido o ya fue usado. Pedile a tu administrador que te mande uno nuevo.");
      } else {
        setInvitacion(data[0]);
      }
      setCargando(false);
    })();
  }, [usuarioId]);

  const handleAceptar = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: invitacion.email,
        password,
        options: { data: { invite_usuario_id: usuarioId } }
      });
      if (signUpError) {
        setError(signUpError.message.includes("already registered") ? "Ya existe una cuenta con ese email. Probá iniciar sesión directamente." : signUpError.message);
        setEnviando(false);
        return;
      }
      if (data.session) {
        const { error: rpcError } = await supabase.rpc("aceptar_invitacion", { p_usuario_id: usuarioId });
        if (rpcError) {
          setError("Cuenta creada pero hubo un error vinculándola: " + rpcError.message);
          setEnviando(false);
          return;
        }
        window.location.href = window.location.origin;
        return;
      }
      setMensajeConfirmacion("Te enviamos un mail a " + invitacion.email + ". Confirmá tu cuenta desde ahí y después iniciá sesión con tu email y esta contraseña.");
    } catch (err) {
      setError("Error al conectar: " + err.message);
    }
    setEnviando(false);
  };

  const shell = (children) => (
    <div style={{ fontFamily: "'IBM Plex Mono',monospace", background: "#0e160e", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#182818", border: "1px solid #2a4a2a", borderRadius: "16px", padding: "28px 24px", width: "100%", maxWidth: "360px", textAlign: "center" }}>
        {children}
      </div>
    </div>
  );

  if (cargando) return shell(<div style={{ color: "#7ec850" }}>Cargando invitación...</div>);

  if (error && !invitacion) return shell(
    <>
      <div style={{ fontSize: "36px", marginBottom: "10px" }}>⚠️</div>
      <div style={{ color: "#e07070", fontSize: "13px", marginBottom: "16px" }}>{error}</div>
      <button onClick={onIrALogin} style={{ padding: "10px 18px", borderRadius: "10px", fontSize: "13px", background: "#1a1a1a", color: "#7a7a7a", border: "1px solid #2a2a2a" }}>Ir a iniciar sesión</button>
    </>
  );

  if (mensajeConfirmacion) return shell(
    <>
      <div style={{ fontSize: "36px", marginBottom: "10px" }}>📩</div>
      <div style={{ color: "#dff0cf", fontSize: "13px", lineHeight: "1.6", marginBottom: "16px" }}>{mensajeConfirmacion}</div>
      <button onClick={onIrALogin} style={{ padding: "10px 18px", borderRadius: "10px", fontSize: "13px", background: "#3a6a10", color: "#dff0cf", border: "1px solid #5a9a20" }}>Ir a iniciar sesión</button>
    </>
  );

  return shell(
    <form onSubmit={handleAceptar}>
      <div style={{ fontSize: "40px", marginBottom: "8px" }}>🌱</div>
      <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: "20px", color: "#7ec850", marginBottom: "6px" }}>Te invitaron a RAÍZ</div>
      <div style={{ fontSize: "12px", color: "#8ab88a", marginBottom: "20px" }}>
        {invitacion.nombre} · {invitacion.rol==="master_grower"?"Master Grower":"Ejecutor"} en {invitacion.entidad_nombre}
      </div>

      <div style={{ textAlign: "left", marginBottom: "14px" }}>
        <div style={{ fontSize: "11px", color: "#5aaa5a", letterSpacing: "1px", marginBottom: "6px" }}>EMAIL</div>
        <input value={invitacion.email} disabled style={{ width: "100%", background: "#0a1a0a", border: "1px solid #2a4a2a", borderRadius: "8px", color: "#7a9a7a", fontSize: "13px", padding: "10px 12px" }} />
      </div>

      <div style={{ textAlign: "left", marginBottom: "16px" }}>
        <div style={{ fontSize: "11px", color: "#5aaa5a", letterSpacing: "1px", marginBottom: "6px" }}>ELEGÍ TU CONTRASEÑA</div>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} style={{ width: "100%", background: "#111e11", border: "1px solid #2a4a2a", borderRadius: "8px", color: "#dff0cf", fontSize: "13px", padding: "10px 12px" }} />
      </div>

      {error && <div style={{ background: "#2a1010", border: "1px solid #6a2020", borderRadius: "8px", padding: "8px 12px", fontSize: "12px", color: "#e74c3c", marginBottom: "14px" }}>{error}</div>}

      <button type="submit" disabled={enviando} style={{ width: "100%", padding: "12px", borderRadius: "10px", fontSize: "14px", fontWeight: "600", background: enviando?"#2a4a2a":"#3a6a10", color: "#dff0cf", border: "1px solid #5a9a20" }}>
        {enviando ? "Creando cuenta..." : "Aceptar invitación"}
      </button>
    </form>
  );
}
