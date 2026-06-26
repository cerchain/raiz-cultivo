import { useState, useEffect } from "react";
import { supabase } from './supabaseClient';
import Login from './Login';

const card = (x={}) => ({ background:"#182818", border:"1px solid #2a4a2a", borderRadius:"14px", padding:"18px", marginBottom:"16px", ...x });
const lbl  = (c="#5aaa5a") => ({ fontSize:"11px", color:c, letterSpacing:"2.5px", display:"block", marginBottom:"8px", fontWeight:"600" });
const inp  = (x={}) => ({ background:"#111e11", border:"1px solid #2a4a2a", borderRadius:"8px", color:"#dff0cf", fontSize:"14px", padding:"8px 12px", width:"100%", fontFamily:"'IBM Plex Mono',monospace", outline:"none", ...x });

const TIPO_LABEL = { indica:"Índica 🟣", sativa:"Sativa 🟢", hibrido:"Híbrido ⚖️" };
const TIPO_COLOR = { indica:"#9b59b6", sativa:"#27ae60", hibrido:"#2980b9" };

const TAREA_TIPO_LABEL = {
  riego_vege: "💧 Riego (vegetativo)",
  riego_flora: "💧 Riego (floración)",
  trasplante: "🪴 Trasplante",
  poda_bajos: "✂️ Poda baja",
  poda_satelital: "✂️ Poda satelital",
  corte_esquejes: "🌱 Corte de esquejes",
  cosecha: "📦 Cosecha",
  preventivo_hongos: "🍄 Preventivo — Hongos",
  preventivo_cochinilla: "🐚 Preventivo — Cochinilla",
  preventivo_arana_roja: "🕷️ Preventivo — Araña roja",
  preventivo_orugas: "🐛 Preventivo — Orugas",
  preventivo_varios: "🛡️ Preventivo — Varios"
};
const TAREA_PRIORIDAD_COLOR = { alta:"#c0392b", media:"#c8a020", baja:"#3a8a5a" };
const TAREA_ESTADO_LABEL = { pendiente:"Pendiente", en_progreso:"En progreso", completada:"Completada", atrasada:"Atrasada" };
const TAREA_ESTADO_COLOR = { pendiente:"#5a7a9a", en_progreso:"#c8a020", completada:"#3a8a5a", atrasada:"#c0392b" };

const emptyTarea = (sectorId) => ({
  titulo:"", tipo:"riego_vege", sector_id: sectorId||"", lote_id:"", descripcion:"",
  fecha_programada: new Date().toISOString().slice(0,10), prioridad:"media", asignado_a:""
});

const emptyCosecha = () => ({
  sector_actual_id: "", genetica_id: "", cantidad_plantas: 0,
  fecha_inicio: new Date().toISOString().slice(0,10),
  dias_secado: "", peso_cosechado_gramos: "", estado: "cosechado", notas: ""
});

const emptyLote = (sectorId) => ({
  sector_actual_id: sectorId || "", genetica_id: "", cantidad_plantas: "",
  fecha_inicio: new Date().toISOString().slice(0,10), estado: "activo", notas: ""
});

const emptySubsector = (sectorPadreId) => ({
  sector_padre_id: sectorPadreId || "", nombre: "", capacidad_unidades: "", tipo: ""
});

const emptyGenetica = () => ({
  nombre: "", tipo: "hibrido", fenotipo: false, color: "#7ec850",
  semanas_floracion: "", banco: "", sabor: "", efecto: "", activa: true
});

export default function App() {
  const [usuario, setUsuario]   = useState(null);
  const [loaded, setLoaded]     = useState(false);
  const [tab, setTab]           = useState(null);
  const [gFilter, setGFilter]   = useState("all");
  const [status, setStatus]     = useState("");

  const [sectoresPadre, setSectoresPadre] = useState([]);
  const [sectores, setSectores]           = useState([]);
  const [geneticas, setGeneticas]         = useState([]);
  const [lotes, setLotes]                 = useState([]);
  const [movimientos, setMovimientos]     = useState([]);
  const [usuariosMap, setUsuariosMap]     = useState({});
  const [usuariosLista, setUsuariosLista] = useState([]);
  const [tareas, setTareas]               = useState([]);
  const [comentariosTareas, setComentariosTareas] = useState([]);
  const [editingTarea, setEditingTarea]   = useState(null);
  const [savingTarea, setSavingTarea]     = useState(false);
  const [tareaExpandida, setTareaExpandida] = useState(null);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [tFiltro, setTFiltro] = useState("todas"); // todas|pendiente|en_progreso|completada

  const [relevamientos, setRelevamientos] = useState([]);
  const [editingRelevamiento, setEditingRelevamiento] = useState(null);
  const [savingRelevamiento, setSavingRelevamiento]   = useState(false);
  const [salaId, setSalaId]               = useState(null);

  const [editingCosecha, setEditingCosecha] = useState(null);
  const [savingCosecha, setSavingCosecha]   = useState(false);

  const [editingLote, setEditingLote] = useState(null);
  const [savingLote, setSavingLote]   = useState(false);

  const [bajaLote, setBajaLote]     = useState(null); // {lote, cantidad, motivo}
  const [savingBaja, setSavingBaja] = useState(false);

  const [finalizandoLote, setFinalizandoLote] = useState(null); // {lote, peso, dias_secado, notas}
  const [savingFinal, setSavingFinal]         = useState(false);

  const [movingLote, setMovingLote] = useState(null);
  const [destinoSub, setDestinoSub] = useState("");

  const [editingSub, setEditingSub] = useState(null);
  const [savingSub, setSavingSub]   = useState(false);

  const [editingGenetica, setEditingGenetica] = useState(null);
  const [savingGenetica, setSavingGenetica]   = useState(false);
  const [gActivaFilter, setGActivaFilter]     = useState("activas"); // activas | inactivas | todas

  const esEjecutor = usuario?.rol === "ejecutor";
  const puedeRelevar = !esEjecutor || usuario?.permisos?.relevamiento === true;

  useEffect(()=>{
    (async()=>{
      try {
        const email = localStorage.getItem("raiz_email");
        if(email){
          const r = await supabase.from("usuarios").select("*").eq("email", email).single();
          if(r.data) setUsuario(r.data);
        }
      } catch(e) {}
      setLoaded(true);
    })();
  },[]);

  useEffect(()=>{
    if(!usuario) return;
    cargarTodo();
  },[usuario]);

  const cargarTodo = async () => {
    try {
      const salaR = await supabase.from("salas").select("id").limit(1).single();
      const sId = salaR.data?.id;
      if(!sId) return;
      setSalaId(sId);

      const [spR, sR, gR, lR, mR, uR, tR, ctR, rR] = await Promise.all([
        supabase.from("sectores_padre").select("*").eq("sala_id", sId).order("orden"),
        supabase.from("sectores").select("*").eq("sala_id", sId),
        supabase.from("geneticas").select("*").eq("sala_id", sId).order("nombre"),
        supabase.from("lotes").select("*").eq("sala_id", sId).order("fecha_inicio", { ascending:false }),
        supabase.from("movimientos_lote").select("*").order("fecha", { ascending:false }),
        supabase.from("usuarios").select("id,nombre,rol,permisos"),
        supabase.from("tareas").select("*").eq("sala_id", sId).order("fecha_programada"),
        supabase.from("comentarios_tareas").select("*").order("creado_en"),
        supabase.from("relevamientos").select("*").eq("sala_id", sId).order("fecha", { ascending:false })
      ]);

      setSectoresPadre(spR.data||[]);
      setSectores(sR.data||[]);
      setGeneticas(gR.data||[]);
      setLotes(lR.data||[]);
      setMovimientos(mR.data||[]);
      const um = {}; (uR.data||[]).forEach(u=>{ um[u.id]=u.nombre; }); setUsuariosMap(um);
      setUsuariosLista(uR.data||[]);
      setTareas(tR.data||[]);
      setComentariosTareas(ctR.data||[]);
      setRelevamientos(rR.data||[]);

      if(spR.data?.length && !tab) setTab(spR.data[0].id);
    } catch(e) {
      console.error("Error cargando datos:", e);
      setStatus("err: " + String(e).slice(0,60));
      setTimeout(()=>setStatus(""),4000);
    }
  };

  const handleLogin = (u) => {
    localStorage.setItem("raiz_email", u.email);
    setUsuario(u);
  };
  const handleLogout = () => {
    localStorage.removeItem("raiz_email");
    setUsuario(null);
  };

  const subsectoresDe = (sectorPadreId) => sectores.filter(s => s.sector_padre_id === sectorPadreId);
  const lotesDeSector = (sectorId) => lotes.filter(l => l.sector_actual_id === sectorId);
  const sectorPadreDeSub = (subId) => {
    const sub = sectores.find(s=>s.id===subId);
    return sub ? sectoresPadre.find(sp=>sp.id===sub.sector_padre_id) : null;
  };
  const siguienteSectorPadre = (sectorPadreActual) => {
    if(!sectorPadreActual) return null;
    return sectoresPadre.find(sp=>sp.orden === sectorPadreActual.orden + 1) || null;
  };
  // Para selects: solo activas, salvo que el registro ya tenga seleccionada una inactiva (no la oculta)
  const geneticasSelect = (currentId) => {
    const activas = geneticas.filter(g=>g.activa!==false);
    if(currentId && !activas.find(g=>g.id===currentId)){
      const extra = geneticas.find(g=>g.id===currentId);
      if(extra) return [...activas, extra];
    }
    return activas;
  };

  // Número de lote secuencial por genética (ej: Critical Kush #1, #2, #3...). La unicidad real la garantiza el UNIQUE(genetica_id, numero_lote) en Supabase.
  const siguienteNumeroLote = (genId) => {
    const usados = lotes.filter(l=>l.genetica_id===genId).map(l=>l.numero_lote||0);
    return usados.length ? Math.max(...usados)+1 : 1;
  };

  // ── COSECHAS ──
  const saveCosecha = async () => {
    if(!editingCosecha) return;
    setSavingCosecha(true);
    try {
      const payload = {
        sala_id: salaId,
        genetica_id: editingCosecha.genetica_id || null,
        sector_actual_id: editingCosecha.sector_actual_id || null,
        cantidad_plantas: parseInt(editingCosecha.cantidad_plantas)||0,
        fecha_inicio: editingCosecha.fecha_inicio,
        peso_cosechado_gramos: parseFloat(editingCosecha.peso_cosechado_gramos)||0,
        dias_secado: parseInt(editingCosecha.dias_secado)||null,
        estado: editingCosecha.estado || "cosechado",
        notas: editingCosecha.notas || ""
      };
      if(editingCosecha.id) await supabase.from("lotes").update(payload).eq("id", editingCosecha.id);
      else await supabase.from("lotes").insert({...payload, numero_lote: siguienteNumeroLote(payload.genetica_id)});
      setEditingCosecha(null);
      setStatus("guardado"); setTimeout(()=>setStatus(""),1800);
      cargarTodo();
    } catch(e) { setStatus("error al guardar"); setTimeout(()=>setStatus(""),3000); }
    setSavingCosecha(false);
  };
  const delCosecha = async (id) => {
    try { await supabase.from("lotes").delete().eq("id", id); cargarTodo(); }
    catch(e) { setStatus("error al borrar"); setTimeout(()=>setStatus(""),3000); }
  };

  // ── LOTES (alta y corrección de datos — NO maneja bajas, eso es bajaLote/confirmBaja) ──
  const saveLote = async () => {
    if(!editingLote) return;
    setSavingLote(true);
    try {
      const nuevaCantidad = parseInt(editingLote.cantidad_plantas)||0;
      const payload = {
        sala_id: salaId,
        genetica_id: editingLote.genetica_id || null,
        sector_actual_id: editingLote.sector_actual_id,
        cantidad_plantas: nuevaCantidad,
        fecha_inicio: editingLote.fecha_inicio,
        estado: "activo",
        notas: editingLote.notas || ""
      };

      if(editingLote.id){
        // Corrección de datos de un lote existente (no registra movimiento: no es un evento biológico)
        // EXCEPCIÓN: si venía pendiente de aprobación, esto SÍ es el alta real — se registra como tal.
        const eraPendiente = editingLote.estado === "pendiente_aprobacion";
        await supabase.from("lotes").update(payload).eq("id", editingLote.id);
        if(eraPendiente){
          await supabase.from("movimientos_lote").insert({
            lote_id: editingLote.id,
            sector_origen_id: null,
            sector_destino_id: editingLote.sector_actual_id,
            cantidad_movida: nuevaCantidad,
            usuario_id: usuario.id,
            tipo: "alta",
            motivo: "Aprobado desde relevamiento"
          });
        }
      } else {
        // Alta de lote nuevo — número secuencial propio de esta genética
        const ins = await supabase.from("lotes").insert({
          ...payload,
          numero_lote: siguienteNumeroLote(editingLote.genetica_id)
        }).select().single();
        if(ins.data){
          await supabase.from("movimientos_lote").insert({
            lote_id: ins.data.id,
            sector_origen_id: null,
            sector_destino_id: editingLote.sector_actual_id,
            cantidad_movida: nuevaCantidad,
            usuario_id: usuario.id,
            tipo: "alta",
            motivo: null
          });
        }
      }

      setEditingLote(null);
      setStatus("guardado"); setTimeout(()=>setStatus(""),1800);
      cargarTodo();
    } catch(e) { setStatus("error al guardar lote"); setTimeout(()=>setStatus(""),3000); }
    setSavingLote(false);
  };

  // Borrado total de un lote (solo para errores de carga, no para bajas reales)
  const delLote = async (id) => {
    if(!window.confirm("¿Borrar este lote por completo? Es para errores de carga, no para bajas reales. Esta acción no se puede deshacer.")) return;
    try {
      await supabase.from("movimientos_lote").delete().eq("lote_id", id);
      await supabase.from("lotes").delete().eq("id", id);
      setEditingLote(null);
      cargarTodo();
    } catch(e) { setStatus("error al borrar lote"); setTimeout(()=>setStatus(""),3000); }
  };

  // ── BAJA (parcial o total) de plantas dentro de un lote, con motivo y trazabilidad ──
  const confirmBaja = async () => {
    if(!bajaLote) return;
    const cant = parseInt(bajaLote.cantidad)||0;
    if(cant<=0 || cant>bajaLote.lote.cantidad_plantas) return;
    setSavingBaja(true);
    try {
      const restante = bajaLote.lote.cantidad_plantas - cant;
      const esBajaTotal = restante<=0;
      await supabase.from("lotes").update({
        cantidad_plantas: restante,
        estado: esBajaTotal ? "descartado" : bajaLote.lote.estado
      }).eq("id", bajaLote.lote.id);

      await supabase.from("movimientos_lote").insert({
        lote_id: bajaLote.lote.id,
        sector_origen_id: bajaLote.lote.sector_actual_id,
        sector_destino_id: esBajaTotal ? null : bajaLote.lote.sector_actual_id,
        cantidad_movida: cant,
        usuario_id: usuario.id,
        tipo: esBajaTotal ? "baja" : "baja_parcial",
        motivo: bajaLote.motivo || null
      });

      setBajaLote(null);
      setStatus("guardado"); setTimeout(()=>setStatus(""),1800);
      cargarTodo();
    } catch(e) { setStatus("error al dar de baja"); setTimeout(()=>setStatus(""),3000); }
    setSavingBaja(false);
  };

  // ── MADURACIÓN → FINALIZADO (post-secado, sin sector físico propio) ──
  const pasarAMaduracion = async (l) => {
    try {
      await supabase.from("lotes").update({estado:"maduracion"}).eq("id", l.id);
      await supabase.from("movimientos_lote").insert({
        lote_id: l.id,
        sector_origen_id: l.sector_actual_id,
        sector_destino_id: l.sector_actual_id,
        cantidad_movida: l.cantidad_plantas,
        usuario_id: usuario.id,
        tipo: "cambio_estado",
        motivo: "Pasó a maduración"
      });
      setStatus("guardado"); setTimeout(()=>setStatus(""),1800);
      cargarTodo();
    } catch(e) { setStatus("error al pasar a maduración"); setTimeout(()=>setStatus(""),3000); }
  };

  const confirmFinalizar = async () => {
    if(!finalizandoLote) return;
    setSavingFinal(true);
    try {
      await supabase.from("lotes").update({
        estado: "cosechado",
        peso_cosechado_gramos: parseFloat(finalizandoLote.peso)||0,
        dias_secado: finalizandoLote.dias_secado ? parseInt(finalizandoLote.dias_secado) : null,
        notas: finalizandoLote.notas || ""
      }).eq("id", finalizandoLote.lote.id);
      await supabase.from("movimientos_lote").insert({
        lote_id: finalizandoLote.lote.id,
        sector_origen_id: finalizandoLote.lote.sector_actual_id,
        sector_destino_id: null,
        cantidad_movida: finalizandoLote.lote.cantidad_plantas,
        usuario_id: usuario.id,
        tipo: "cosecha",
        motivo: null
      });
      setFinalizandoLote(null);
      setStatus("guardado"); setTimeout(()=>setStatus(""),1800);
      cargarTodo();
    } catch(e) { setStatus("error al finalizar"); setTimeout(()=>setStatus(""),3000); }
    setSavingFinal(false);
  };

  // ── MOVER LOTE (avanzar etapa, solo hacia adelante) ──
  const confirmarMovimiento = async () => {
    if(!movingLote || !destinoSub) return;
    try {
      await supabase.from("movimientos_lote").insert({
        lote_id: movingLote.id,
        sector_origen_id: movingLote.sector_actual_id,
        sector_destino_id: destinoSub,
        cantidad_movida: movingLote.cantidad_plantas,
        usuario_id: usuario.id
      });
      await supabase.from("lotes").update({
        sector_actual_id: destinoSub,
        fecha_ultima_movida: new Date().toISOString().slice(0,10)
      }).eq("id", movingLote.id);
      setMovingLote(null);
      setDestinoSub("");
      setStatus("guardado"); setTimeout(()=>setStatus(""),1800);
      cargarTodo();
    } catch(e) { setStatus("error al mover"); setTimeout(()=>setStatus(""),3000); }
  };

  // ── ADMIN DE SUBSECTORES (Mi Sala) ──
  const saveSub = async () => {
    if(!editingSub) return;
    setSavingSub(true);
    try {
      const payload = {
        sala_id: salaId,
        sector_padre_id: editingSub.sector_padre_id,
        nombre: editingSub.nombre,
        capacidad_unidades: editingSub.capacidad_unidades ? parseInt(editingSub.capacidad_unidades) : null,
        tipo: sectoresPadre.find(sp=>sp.id===editingSub.sector_padre_id)?.nombre.toLowerCase().slice(0,6) || "otro"
      };
      if(editingSub.id) await supabase.from("sectores").update(payload).eq("id", editingSub.id);
      else await supabase.from("sectores").insert(payload);
      setEditingSub(null);
      setStatus("guardado"); setTimeout(()=>setStatus(""),1800);
      cargarTodo();
    } catch(e) { setStatus("error: "+String(e).slice(0,50)); setTimeout(()=>setStatus(""),4000); }
    setSavingSub(false);
  };
  const delSub = async (id) => {
    const enUso = lotes.some(l=>l.sector_actual_id===id && l.estado==="activo");
    if(enUso){
      setStatus("no se puede borrar: tiene lotes activos adentro — movelos o dalos de baja primero");
      setTimeout(()=>setStatus(""),4500);
      return;
    }
    if(!window.confirm("¿Borrar este subsector? Esta acción no se puede deshacer.")) return;
    try { await supabase.from("sectores").delete().eq("id", id); cargarTodo(); }
    catch(e) { setStatus("error al borrar subsector"); setTimeout(()=>setStatus(""),3000); }
  };

  // ── GENÉTICAS (catálogo) ──
  const saveGenetica = async () => {
    if(!editingGenetica) return;
    setSavingGenetica(true);
    try {
      const payload = {
        sala_id: salaId,
        nombre: editingGenetica.nombre,
        tipo: editingGenetica.tipo || "hibrido",
        fenotipo: !!editingGenetica.fenotipo,
        color: editingGenetica.color || "#7ec850",
        semanas_floracion: editingGenetica.semanas_floracion ? parseInt(editingGenetica.semanas_floracion) : null,
        banco: editingGenetica.banco || "",
        sabor: editingGenetica.sabor || "",
        efecto: editingGenetica.efecto || "",
        activa: editingGenetica.activa!==false
      };
      if(editingGenetica.id) await supabase.from("geneticas").update(payload).eq("id", editingGenetica.id);
      else await supabase.from("geneticas").insert(payload);
      setEditingGenetica(null);
      setStatus("guardado"); setTimeout(()=>setStatus(""),1800);
      cargarTodo();
    } catch(e) { setStatus("error: "+String(e).slice(0,50)); setTimeout(()=>setStatus(""),4000); }
    setSavingGenetica(false);
  };
  const toggleActivaGenetica = async (g) => {
    try { await supabase.from("geneticas").update({activa: !(g.activa!==false)}).eq("id", g.id); cargarTodo(); }
    catch(e) { setStatus("error al actualizar"); setTimeout(()=>setStatus(""),3000); }
  };

  // ── TAREAS (Fase B) — Master Grower crea, Ejecutor ejecuta ──
  const saveTarea = async () => {
    if(!editingTarea) return;
    setSavingTarea(true);
    try {
      const payload = {
        sala_id: salaId,
        titulo: editingTarea.titulo,
        tipo: editingTarea.tipo,
        sector_id: editingTarea.sector_id || null,
        lote_id: editingTarea.lote_id || null,
        descripcion: editingTarea.descripcion || "",
        fecha_programada: editingTarea.fecha_programada,
        prioridad: editingTarea.prioridad || "media",
        asignado_a: editingTarea.asignado_a || null,
        creado_por: usuario.id
      };
      if(editingTarea.id) await supabase.from("tareas").update(payload).eq("id", editingTarea.id);
      else await supabase.from("tareas").insert(payload);
      setEditingTarea(null);
      setStatus("guardado"); setTimeout(()=>setStatus(""),1800);
      cargarTodo();
    } catch(e) { setStatus("error: "+String(e).slice(0,60)); setTimeout(()=>setStatus(""),4000); }
    setSavingTarea(false);
  };

  const updateEstadoTarea = async (t, nuevoEstado) => {
    try {
      const payload = { estado: nuevoEstado, actualizado_en: new Date().toISOString() };
      if(nuevoEstado==="completada") payload.fecha_ejecucion_real = new Date().toISOString().slice(0,10);
      await supabase.from("tareas").update(payload).eq("id", t.id);
      cargarTodo();
    } catch(e) { setStatus("error al actualizar tarea"); setTimeout(()=>setStatus(""),3000); }
  };

  const delTarea = async (t) => {
    if(t.estado!=="pendiente"){
      setStatus("no se puede borrar: ya tiene avance — queda como historial");
      setTimeout(()=>setStatus(""),4000);
      return;
    }
    if(!window.confirm("¿Borrar esta tarea? No se puede deshacer.")) return;
    try {
      await supabase.from("comentarios_tareas").delete().eq("tarea_id", t.id);
      await supabase.from("tareas").delete().eq("id", t.id);
      cargarTodo();
    } catch(e) { setStatus("error al borrar tarea"); setTimeout(()=>setStatus(""),3000); }
  };

  const addComentario = async (tareaId) => {
    if(!nuevoComentario.trim()) return;
    try {
      await supabase.from("comentarios_tareas").insert({
        tarea_id: tareaId, usuario_id: usuario.id, texto: nuevoComentario.trim()
      });
      setNuevoComentario("");
      cargarTodo();
    } catch(e) { setStatus("error al comentar"); setTimeout(()=>setStatus(""),3000); }
  };

  // ── RELEVAMIENTOS (Fase C) — conteo real de plantas, con permiso del Master Grower ──
  const emptyRelevamiento = (sectorId) => ({ sector_id: sectorId||"", notas:"", lineas:[{genetica_id:"", cantidad:""}] });

  const guardarRelevamiento = async () => {
    if(!editingRelevamiento) return;
    const lineasValidas = editingRelevamiento.lineas.filter(l=>l.genetica_id && l.cantidad!=="");
    if(lineasValidas.length===0) return;
    setSavingRelevamiento(true);
    try {
      // Contador local por genética, por si el mismo envío trae dos líneas de la misma genética
      const contador = {};
      lotes.forEach(l=>{ if(l.genetica_id) contador[l.genetica_id] = Math.max(contador[l.genetica_id]||0, l.numero_lote||0); });

      for(const linea of lineasValidas){
        const cant = parseInt(linea.cantidad)||0;
        const loteExistente = lotes.find(l=>
          l.sector_actual_id===editingRelevamiento.sector_id &&
          l.genetica_id===linea.genetica_id &&
          l.estado==="activo"
        );

        await supabase.from("relevamientos").insert({
          sala_id: salaId,
          sector_id: editingRelevamiento.sector_id,
          lote_id: loteExistente?.id || null,
          genetica_id: linea.genetica_id,
          cantidad_contada: cant,
          usuario_id: usuario.id,
          notas: editingRelevamiento.notas || ""
        });

        // Si esa genética no tiene lote activo en este subsector, se crea pendiente de aprobación
        if(!loteExistente){
          contador[linea.genetica_id] = (contador[linea.genetica_id]||0) + 1;
          await supabase.from("lotes").insert({
            sala_id: salaId,
            genetica_id: linea.genetica_id,
            sector_actual_id: editingRelevamiento.sector_id,
            cantidad_plantas: cant,
            numero_lote: contador[linea.genetica_id],
            fecha_inicio: new Date().toISOString().slice(0,10),
            estado: "pendiente_aprobacion",
            notas: `Detectado por relevamiento de ${usuario.nombre}.${editingRelevamiento.notas?" "+editingRelevamiento.notas:""}`
          });
        }
      }
      setEditingRelevamiento(null);
      setStatus("guardado"); setTimeout(()=>setStatus(""),1800);
      cargarTodo();
    } catch(e) { setStatus("error: "+String(e).slice(0,60)); setTimeout(()=>setStatus(""),4000); }
    setSavingRelevamiento(false);
  };

  const delRelevamiento = async (id) => {
    if(!window.confirm("¿Borrar este relevamiento? No se puede deshacer.")) return;
    try { await supabase.from("relevamientos").delete().eq("id", id); cargarTodo(); }
    catch(e) { setStatus("error al borrar relevamiento"); setTimeout(()=>setStatus(""),3000); }
  };

  const aprobarLotePendiente = async (l) => {
    try {
      await supabase.from("lotes").update({estado:"activo"}).eq("id", l.id);
      await supabase.from("movimientos_lote").insert({
        lote_id: l.id,
        sector_origen_id: null,
        sector_destino_id: l.sector_actual_id,
        cantidad_movida: l.cantidad_plantas,
        usuario_id: usuario.id,
        tipo: "alta",
        motivo: "Aprobado desde relevamiento"
      });
      cargarTodo();
    } catch(e) { setStatus("error al aprobar"); setTimeout(()=>setStatus(""),3000); }
  };

  const togglePermisoRelevamiento = async (u) => {
    try {
      const nuevosPermisos = {...(u.permisos||{}), relevamiento: !(u.permisos?.relevamiento)};
      await supabase.from("usuarios").update({permisos: nuevosPermisos}).eq("id", u.id);
      cargarTodo();
    } catch(e) { setStatus("error al actualizar permisos"); setTimeout(()=>setStatus(""),3000); }
  };

  if(!usuario) return <Login onLogin={handleLogin} />;
  if(!loaded)  return <div style={{background:"#0e160e",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'IBM Plex Mono',monospace",color:"#4a7a4a",fontSize:"14px"}}>Cargando...</div>;

  const tabsExtra = [
    {key:"_tareas",        label:"📋 Tareas",        col:"#16a085"},
    {key:"_relevamientos", label:"🔍 Relevamientos", col:"#1abc9c"},
    {key:"_geneticas",     label:"🧬 Genéticas",     col:"#2980b9"},
    {key:"_bajas",         label:"📉 Bajas",         col:"#c0392b"}
  ];
  if(!esEjecutor) tabsExtra.push({key:"_cosechas", label:"📦 Cosechas", col:"#c8a020"});
  if(!esEjecutor) tabsExtra.push({key:"_misala", label:"⚙️ Mi Sala", col:"#8e44ad"});

  return (
    <div style={{fontFamily:"'IBM Plex Mono',monospace",background:"#0e160e",minHeight:"100vh",color:"#dff0cf"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=DM+Serif+Display:ital@0;1&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        button{cursor:pointer;transition:all .15s ease;font-family:'IBM Plex Mono',monospace;}
        textarea,input,select{outline:none;font-family:'IBM Plex Mono',monospace;}
        textarea:focus,input:focus,select:focus{border-color:#4aaa4a!important;}
        .fade{animation:fi .22s ease;}
        @keyframes fi{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:#2a4a2a;border-radius:2px}
      `}</style>

      <div style={{background:"#111e11",borderBottom:"2px solid #2a4a2a",padding:"18px 20px 14px",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"14px"}}>
          <div>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"22px",color:"#7ec850"}}>🌱 RAÍZ — Cuaderno de Cultivo</div>
            <div style={{fontSize:"11px",color:"#4a8a4a",letterSpacing:"2px",marginTop:"4px"}}>{usuario.nombre} · {esEjecutor?"EJECUTOR":"MASTER GROWER"}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"6px"}}>
            {status==="guardado" && <div style={{fontSize:"12px",color:"#7ec850",background:"#1a3a1a",padding:"5px 14px",borderRadius:"20px",border:"1px solid #3a6a3a"}}>✓ guardado</div>}
            {status && status!=="guardado" && <div style={{fontSize:"11px",color:"#e74c3c",background:"#2a1010",padding:"5px 10px",borderRadius:"10px",border:"1px solid #6a2020"}}>⚠ {status}</div>}
            <button onClick={handleLogout} style={{fontSize:"11px",color:"#5a8a5a",background:"transparent",border:"1px solid #2a4a2a",borderRadius:"14px",padding:"4px 12px"}}>salir</button>
          </div>
        </div>
        <div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>
          {sectoresPadre.map(sp=>(
            <button key={sp.id} onClick={()=>setTab(sp.id)} style={{padding:"8px 15px",borderRadius:"22px",fontSize:"12px",background:tab===sp.id?"#3a8a4a":"#192919",color:tab===sp.id?"#fff":"#7aaa7a",border:`1px solid ${tab===sp.id?"#3a8a4a":"#2e4e2e"}`,fontWeight:tab===sp.id?"600":"400"}}>{sp.nombre}</button>
          ))}
          {tabsExtra.map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)} style={{padding:"8px 15px",borderRadius:"22px",fontSize:"12px",background:tab===t.key?t.col:"#192919",color:tab===t.key?"#fff":"#7aaa7a",border:`1px solid ${tab===t.key?t.col:"#2e4e2e"}`,fontWeight:tab===t.key?"600":"400"}}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{padding:"20px 20px 48px"}}>

        {/* ══ SECTOR PADRE con subsectores y sus lotes ══ */}
        {sectoresPadre.find(sp=>sp.id===tab) && (()=>{
          const sp = sectoresPadre.find(x=>x.id===tab);
          const subs = subsectoresDe(sp.id);
          return (
            <div className="fade">
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"22px",color:"#7ec850",marginBottom:"6px"}}>{sp.nombre}</div>
              <div style={{fontSize:"12px",color:"#5a8a5a",marginBottom:"18px"}}>{subs.length} subsector{subs.length!==1?"es":""}</div>

              {subs.length===0 && (
                <div style={{textAlign:"center",padding:"40px 20px",color:"#3a5a2a",fontSize:"14px"}}>Sin subsectores configurados aún{!esEjecutor && " — creá uno en ⚙️ Mi Sala"}</div>
              )}

              {subs.map(sub=>{
                const lotesSub = lotesDeSector(sub.id).filter(l=>l.estado==="activo");
                const totalPlantas = lotesSub.reduce((a,l)=>a+(l.cantidad_plantas||0),0);
                const sigPadre = siguienteSectorPadre(sp);
                const subsDestino = sigPadre ? subsectoresDe(sigPadre.id) : [];
                return (
                  <div key={sub.id} style={card()}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
                      <span style={{fontSize:"16px",fontWeight:"600",color:"#dff0cf"}}>{sub.nombre}</span>
                      {sub.capacidad_unidades && <span style={{fontSize:"12px",color:"#5a8a5a"}}>capacidad: {sub.capacidad_unidades}</span>}
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
                      <span style={{fontSize:"13px",color:"#7a9a7a"}}>Plantas activas</span>
                      <span style={{fontSize:"22px",fontWeight:"700",color:totalPlantas>0?"#7ec850":"#3a5a3a"}}>{totalPlantas}</span>
                    </div>

                    {lotesSub.length>0 && (
                      <div style={{display:"flex",flexDirection:"column",gap:"8px",marginTop:"10px",marginBottom:"10px"}}>
                        {lotesSub.map(l=>{
                          const g = geneticas.find(x=>x.id===l.genetica_id);
                          return (
                            <div key={l.id} style={{background:"#111e11",borderRadius:"8px",padding:"10px 12px",border:`1px solid ${g?.color||"#2a4a2a"}44`}}>
                              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"}}>
                                <span style={{fontSize:"13px",color:g?.color||"#9aaa9a"}}>{g?.nombre||"Sin genética"}{l.numero_lote?` #${l.numero_lote}`:""}</span>
                                <span style={{fontSize:"13px",color:"#b0d090"}}>{l.cantidad_plantas} plantas</span>
                              </div>
                              <div style={{fontSize:"11px",color:"#4a6a4a",marginBottom:"6px"}}>Desde {l.fecha_inicio}</div>
                              <div style={{display:"flex",gap:"6px"}}>
                                {!esEjecutor && (
                                  <button onClick={()=>setEditingLote({...l, cantidad_plantas:String(l.cantidad_plantas)})} style={{padding:"7px 10px",borderRadius:"7px",fontSize:"11px",background:"#1a2e1a",color:"#7ec850",border:"1px solid #2a5a2a"}}>✏️</button>
                                )}
                                {!esEjecutor && (
                                  <button onClick={()=>setBajaLote({lote:l, cantidad:"1", motivo:""})} style={{padding:"7px 10px",borderRadius:"7px",fontSize:"11px",background:"#2a1010",color:"#d08070",border:"1px solid #4a2020"}}>🥀</button>
                                )}
                                {!esEjecutor && sigPadre && (
                                  <button onClick={()=>{setMovingLote(l); setDestinoSub("");}} style={{flex:1,padding:"7px",borderRadius:"7px",fontSize:"11px",background:"#1e3a1e",color:"#7ec850",border:"1px solid #2a5a2a"}}>→ Avanzar a {sigPadre.nombre}</button>
                                )}
                                {!esEjecutor && !sigPadre && (
                                  <button onClick={()=>pasarAMaduracion(l)} style={{flex:1,padding:"7px",borderRadius:"7px",fontSize:"11px",background:"#2a2510",color:"#d0a840",border:"1px solid #5a4a20"}}>🫙 Pasar a Maduración</button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {lotesDeSector(sub.id).filter(l=>l.estado==="maduracion").length>0 && (
                      <div style={{marginTop:"4px",marginBottom:"10px"}}>
                        <div style={{fontSize:"11px",color:"#d0a840",marginBottom:"6px",letterSpacing:"0.5px"}}>🫙 EN MADURACIÓN</div>
                        <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                          {lotesDeSector(sub.id).filter(l=>l.estado==="maduracion").map(l=>{
                            const g = geneticas.find(x=>x.id===l.genetica_id);
                            return (
                              <div key={l.id} style={{background:"#1e1a10",borderRadius:"8px",padding:"10px 12px",border:`1px solid #5a4a2044`}}>
                                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
                                  <span style={{fontSize:"13px",color:g?.color||"#9aaa9a"}}>{g?.nombre||"Sin genética"}{l.numero_lote?` #${l.numero_lote}`:""}</span>
                                  <span style={{fontSize:"13px",color:"#c0a868"}}>{l.cantidad_plantas} plantas</span>
                                </div>
                                <div style={{display:"flex",gap:"6px"}}>
                                  {!esEjecutor && (
                                    <button onClick={()=>setBajaLote({lote:l, cantidad:"1", motivo:""})} style={{padding:"7px 10px",borderRadius:"7px",fontSize:"11px",background:"#2a1010",color:"#d08070",border:"1px solid #4a2020"}}>🥀</button>
                                  )}
                                  {!esEjecutor && (
                                    <button onClick={()=>setFinalizandoLote({lote:l, peso:"", dias_secado:String(l.dias_secado||""), notas:l.notas||""})} style={{flex:1,padding:"7px",borderRadius:"7px",fontSize:"11px",background:"#3a2a10",color:"#e0b850",border:"1px solid #6a5020"}}>⚖️ Finalizar y pesar</button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {!esEjecutor && (
                      <button onClick={()=>setEditingLote(emptyLote(sub.id))} style={{width:"100%",padding:"10px",borderRadius:"8px",fontSize:"12px",fontWeight:"600",background:"#162816",color:"#7ec850",border:"1px dashed #2a5a2a"}}>+ Dar de alta planta/lote</button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* ══ TAREAS (Fase B) ══ */}
        {tab==="_tareas" && (()=>{
          const hoy = new Date().toISOString().slice(0,10);
          const tareasVisibles = esEjecutor ? tareas.filter(t=>t.asignado_a===usuario.id) : tareas;
          const conAtraso = t => (t.estado==="pendiente"||t.estado==="en_progreso") && t.fecha_programada < hoy;
          const tareasFiltradas = tareasVisibles
            .filter(t=> tFiltro==="todas" ? true : tFiltro==="atrasada" ? conAtraso(t) : t.estado===tFiltro)
            .sort((a,b)=> a.fecha_programada < b.fecha_programada ? -1 : 1);
          const ejecutores = usuariosLista.filter(u=>u.rol==="ejecutor");
          const lotesDelSector = (secId) => lotes.filter(l=>l.sector_actual_id===secId && l.estado==="activo");

          return (
            <div className="fade">
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"22px",color:"#16a085",marginBottom:"6px"}}>📋 Tareas</div>
              <div style={{fontSize:"13px",color:"#5a9a8a",marginBottom:"18px"}}>{esEjecutor?"TUS TAREAS ASIGNADAS":"TODAS LAS TAREAS"}</div>

              {!esEjecutor && (
                editingTarea ? (
                  <div style={card({borderColor:"#0e6a5a",background:"#0a1e1a"})}>
                    <span style={lbl("#16a085")}>{editingTarea.id?"EDITAR TAREA":"NUEVA TAREA"}</span>
                    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                      <div>
                        <div style={{...lbl("#5aa090"),marginBottom:"6px"}}>TÍTULO</div>
                        <input value={editingTarea.titulo} onChange={e=>setEditingTarea({...editingTarea,titulo:e.target.value})} placeholder="Ej: Riego carpa 1" style={inp()}/>
                      </div>
                      <div>
                        <div style={{...lbl("#5aa090"),marginBottom:"6px"}}>TIPO</div>
                        <select value={editingTarea.tipo} onChange={e=>setEditingTarea({...editingTarea,tipo:e.target.value})} style={inp()}>
                          {Object.entries(TAREA_TIPO_LABEL).map(([k,label])=><option key={k} value={k}>{label}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{...lbl("#5aa090"),marginBottom:"6px"}}>SUBSECTOR</div>
                        <select value={editingTarea.sector_id} onChange={e=>setEditingTarea({...editingTarea,sector_id:e.target.value, lote_id:""})} style={inp()}>
                          <option value="">Sin asignar</option>
                          {sectoresPadre.map(sp=>subsectoresDe(sp.id).map(sub=>
                            <option key={sub.id} value={sub.id}>{sp.nombre} › {sub.nombre}</option>
                          ))}
                        </select>
                      </div>
                      {editingTarea.sector_id && lotesDelSector(editingTarea.sector_id).length>0 && (
                        <div>
                          <div style={{...lbl("#5aa090"),marginBottom:"6px"}}>LOTE (OPCIONAL)</div>
                          <select value={editingTarea.lote_id} onChange={e=>setEditingTarea({...editingTarea,lote_id:e.target.value})} style={inp()}>
                            <option value="">Todo el subsector</option>
                            {lotesDelSector(editingTarea.sector_id).map(l=>{
                              const g = geneticas.find(x=>x.id===l.genetica_id);
                              return <option key={l.id} value={l.id}>{g?.nombre||"Sin genética"} ({l.cantidad_plantas})</option>;
                            })}
                          </select>
                        </div>
                      )}
                      <div>
                        <div style={{...lbl("#5aa090"),marginBottom:"6px"}}>DESCRIPCIÓN</div>
                        <textarea value={editingTarea.descripcion} onChange={e=>setEditingTarea({...editingTarea,descripcion:e.target.value})} style={{...inp(),minHeight:"60px",resize:"vertical"}}/>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                        <div>
                          <div style={{...lbl("#5aa090"),marginBottom:"6px"}}>FECHA PROGRAMADA</div>
                          <input type="date" value={editingTarea.fecha_programada} onChange={e=>setEditingTarea({...editingTarea,fecha_programada:e.target.value})} style={inp({colorScheme:"dark"})}/>
                        </div>
                        <div>
                          <div style={{...lbl("#5aa090"),marginBottom:"6px"}}>PRIORIDAD</div>
                          <select value={editingTarea.prioridad} onChange={e=>setEditingTarea({...editingTarea,prioridad:e.target.value})} style={inp()}>
                            <option value="alta">Alta</option>
                            <option value="media">Media</option>
                            <option value="baja">Baja</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <div style={{...lbl("#5aa090"),marginBottom:"6px"}}>ASIGNAR A</div>
                        <select value={editingTarea.asignado_a} onChange={e=>setEditingTarea({...editingTarea,asignado_a:e.target.value})} style={inp()}>
                          <option value="">Sin asignar</option>
                          {ejecutores.map(u=><option key={u.id} value={u.id}>{u.nombre}</option>)}
                          <option value={usuario.id}>{usuario.nombre} (yo)</option>
                        </select>
                      </div>
                      <div style={{display:"flex",gap:"10px"}}>
                        <button disabled={savingTarea || !editingTarea.titulo || !editingTarea.fecha_programada} onClick={saveTarea} style={{flex:1,padding:"12px",borderRadius:"10px",fontSize:"14px",fontWeight:"600",background:savingTarea?"#0e4a3a":"#0e8a6a",color:"#fff",border:"1px solid #16a085"}}>{savingTarea?"Guardando...":"✓ Guardar"}</button>
                        <button onClick={()=>setEditingTarea(null)} style={{padding:"12px 18px",borderRadius:"10px",fontSize:"14px",background:"#1a1a1a",color:"#7a7a7a",border:"1px solid #2a2a2a"}}>Cancelar</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button onClick={()=>setEditingTarea(emptyTarea())} style={{width:"100%",padding:"14px",borderRadius:"12px",fontSize:"14px",fontWeight:"600",background:"#0a2420",color:"#16a085",border:"2px dashed #0e6a5a",marginBottom:"20px"}}>+ Nueva tarea</button>
                )
              )}

              <div style={{display:"flex",gap:"8px",marginBottom:"18px",flexWrap:"wrap"}}>
                {[["todas","Todas"],["pendiente","Pendientes"],["en_progreso","En progreso"],["completada","Completadas"],["atrasada","Atrasadas"]].map(([k,label])=>(
                  <button key={k} onClick={()=>setTFiltro(k)} style={{padding:"7px 14px",borderRadius:"18px",fontSize:"12px",background:tFiltro===k?"#0e6a5a":"#141e14",color:tFiltro===k?"#fff":"#6a9a8a",border:`1px solid ${tFiltro===k?"#16a085":"#2a3a4a"}`}}>{label}</button>
                ))}
              </div>

              {tareasFiltradas.length===0 ? (
                <div style={{textAlign:"center",padding:"40px 20px",color:"#3a6a5a",fontSize:"14px"}}>Sin tareas{tFiltro!=="todas"?" en este filtro":""}</div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                  {tareasFiltradas.map(t=>{
                    const sub = sectores.find(s=>s.id===t.sector_id);
                    const sp = sub ? sectoresPadre.find(x=>x.id===sub.sector_padre_id) : null;
                    const lote = t.lote_id ? lotes.find(l=>l.id===t.lote_id) : null;
                    const g = lote ? geneticas.find(x=>x.id===lote.genetica_id) : null;
                    const atrasada = conAtraso(t);
                    const estadoMostrado = atrasada ? "atrasada" : t.estado;
                    const esMia = t.asignado_a===usuario.id;
                    const comentarios = comentariosTareas.filter(c=>c.tarea_id===t.id);
                    const expandida = tareaExpandida===t.id;
                    return (
                      <div key={t.id} style={{background:"#0e1a18",border:`1px solid ${TAREA_ESTADO_COLOR[estadoMostrado]}55`,borderRadius:"14px",padding:"16px",borderLeft:`4px solid ${TAREA_PRIORIDAD_COLOR[t.prioridad]||"#5a7a9a"}`}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"8px"}}>
                          <div>
                            <div style={{fontSize:"15px",fontWeight:"600",color:"#dff0e8"}}>{t.titulo}</div>
                            <div style={{fontSize:"12px",color:"#6a9a8a",marginTop:"2px"}}>{TAREA_TIPO_LABEL[t.tipo]}</div>
                          </div>
                          <span style={{fontSize:"11px",padding:"3px 10px",borderRadius:"10px",background:`${TAREA_ESTADO_COLOR[estadoMostrado]}33`,color:TAREA_ESTADO_COLOR[estadoMostrado],whiteSpace:"nowrap"}}>{TAREA_ESTADO_LABEL[estadoMostrado]}</span>
                        </div>
                        {(sp||g) && <div style={{fontSize:"12px",color:"#7aaa9a",marginBottom:"6px"}}>{sp && `${sp.nombre} › ${sub.nombre}`}{g && ` · ${g.nombre}`}</div>}
                        {t.descripcion && <div style={{fontSize:"13px",color:"#a0c0b0",marginBottom:"8px",lineHeight:"1.5"}}>{t.descripcion}</div>}
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:"11px",color:"#5a8a7a",marginBottom:"10px"}}>
                          <span>📅 {t.fecha_programada}{t.fecha_ejecucion_real?` → hecha ${t.fecha_ejecucion_real}`:""}</span>
                          <span>{t.asignado_a ? `→ ${usuariosMap[t.asignado_a]||"—"}` : "sin asignar"}</span>
                        </div>

                        <div style={{display:"flex",gap:"6px",marginBottom:"10px"}}>
                          {esMia && t.estado==="pendiente" && (
                            <button onClick={()=>updateEstadoTarea(t,"en_progreso")} style={{flex:1,padding:"7px",borderRadius:"7px",fontSize:"11px",background:"#2a2a10",color:"#c8a020",border:"1px solid #4a4a20"}}>▶ Iniciar</button>
                          )}
                          {esMia && (t.estado==="pendiente"||t.estado==="en_progreso") && (
                            <button onClick={()=>updateEstadoTarea(t,"completada")} style={{flex:1,padding:"7px",borderRadius:"7px",fontSize:"11px",background:"#0e2a1a",color:"#3a8a5a",border:"1px solid #1a5a3a"}}>✓ Completar</button>
                          )}
                          {!esEjecutor && (
                            <button onClick={()=>setEditingTarea({...t, lote_id:t.lote_id||"", sector_id:t.sector_id||"", asignado_a:t.asignado_a||"", descripcion:t.descripcion||""})} style={{padding:"7px 10px",borderRadius:"7px",fontSize:"11px",background:"#1a2e1a",color:"#7ec850",border:"1px solid #2a5a2a"}}>✏️</button>
                          )}
                          {!esEjecutor && (
                            <button onClick={()=>delTarea(t)} style={{padding:"7px 10px",borderRadius:"7px",fontSize:"11px",background:"#2a1010",color:"#aa5050",border:"1px solid #4a2020"}}>🗑</button>
                          )}
                        </div>

                        <button onClick={()=>setTareaExpandida(expandida?null:t.id)} style={{fontSize:"11px",color:"#4a8a7a",background:"none",border:"none",padding:0}}>{expandida?"▲ Ocultar":"▼"} 💬 {comentarios.length} comentario{comentarios.length!==1?"s":""}</button>

                        {expandida && (
                          <div style={{marginTop:"10px",paddingTop:"10px",borderTop:"1px solid #1a3a32"}}>
                            {comentarios.map(c=>(
                              <div key={c.id} style={{marginBottom:"8px",fontSize:"12px"}}>
                                <span style={{color:"#5aa090",fontWeight:"600"}}>{usuariosMap[c.usuario_id]||"—"}</span>
                                <span style={{color:"#5a7a6a",marginLeft:"6px",fontSize:"10px"}}>{(c.creado_en||"").slice(0,16).replace("T"," ")}</span>
                                <div style={{color:"#c0d8cc",marginTop:"2px"}}>{c.texto}</div>
                              </div>
                            ))}
                            <div style={{display:"flex",gap:"6px",marginTop:"8px"}}>
                              <input value={nuevoComentario} onChange={e=>setNuevoComentario(e.target.value)} placeholder="Agregar comentario..." style={{...inp(),flex:1,padding:"8px 10px",fontSize:"12px"}}/>
                              <button onClick={()=>addComentario(t.id)} style={{padding:"8px 14px",borderRadius:"8px",fontSize:"12px",background:"#0e6a5a",color:"#fff",border:"none"}}>Enviar</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* ══ RELEVAMIENTOS (Fase C) ══ */}
        {tab==="_relevamientos" && (()=>{
          const recuento = r => {
            if(!r.lote_id) return 0;
            const l = lotes.find(x=>x.id===r.lote_id);
            return l ? l.cantidad_plantas : 0;
          };
          return (
            <div className="fade">
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"22px",color:"#1abc9c",marginBottom:"6px"}}>🔍 Relevamientos</div>
              <div style={{fontSize:"13px",color:"#5a9a90",marginBottom:"18px"}}>CONTEO REAL DE PLANTAS POR SUBSECTOR</div>

              {!puedeRelevar && <div style={{fontSize:"12px",color:"#8a7a40",background:"#2a2410",borderRadius:"8px",padding:"10px 14px",marginBottom:"16px"}}>No tenés permiso de relevamiento — pedile al Master Grower que te lo active en ⚙️ Mi Sala. Podés ver el historial igual.</div>}

              {puedeRelevar && (
                editingRelevamiento ? (
                  <div style={card({borderColor:"#0e8a7a",background:"#0a1e1c"})}>
                    <span style={lbl("#1abc9c")}>NUEVO RELEVAMIENTO</span>
                    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                      <div>
                        <div style={{...lbl("#5aa098"),marginBottom:"6px"}}>SUBSECTOR</div>
                        <select value={editingRelevamiento.sector_id} onChange={e=>setEditingRelevamiento({...editingRelevamiento,sector_id:e.target.value})} style={inp()}>
                          <option value="">Seleccionar...</option>
                          {sectoresPadre.map(sp=>subsectoresDe(sp.id).map(sub=>
                            <option key={sub.id} value={sub.id}>{sp.nombre} › {sub.nombre}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <div style={{...lbl("#5aa098"),marginBottom:"6px"}}>GENÉTICAS CONTADAS</div>
                        {editingRelevamiento.lineas.map((linea,idx)=>(
                          <div key={idx} style={{display:"flex",gap:"6px",marginBottom:"8px"}}>
                            <select value={linea.genetica_id} onChange={e=>{
                              const nuevas=[...editingRelevamiento.lineas];
                              nuevas[idx]={...nuevas[idx], genetica_id:e.target.value};
                              setEditingRelevamiento({...editingRelevamiento,lineas:nuevas});
                            }} style={{...inp(),flex:2}}>
                              <option value="">Genética...</option>
                              {geneticasSelect().map(g=><option key={g.id} value={g.id}>{g.nombre}</option>)}
                            </select>
                            <input type="number" min="0" placeholder="Cant." value={linea.cantidad} onChange={e=>{
                              const nuevas=[...editingRelevamiento.lineas];
                              nuevas[idx]={...nuevas[idx], cantidad:e.target.value};
                              setEditingRelevamiento({...editingRelevamiento,lineas:nuevas});
                            }} style={{...inp(),flex:1}}/>
                            {editingRelevamiento.lineas.length>1 && (
                              <button onClick={()=>setEditingRelevamiento({...editingRelevamiento,lineas:editingRelevamiento.lineas.filter((_,i)=>i!==idx)})} style={{padding:"0 12px",borderRadius:"8px",background:"#2a1010",color:"#aa5050",border:"1px solid #4a2020"}}>✕</button>
                            )}
                          </div>
                        ))}
                        <button onClick={()=>setEditingRelevamiento({...editingRelevamiento,lineas:[...editingRelevamiento.lineas,{genetica_id:"",cantidad:""}]})} style={{fontSize:"12px",color:"#5aa098",background:"none",border:"1px dashed #2a5a4a",borderRadius:"8px",padding:"7px 12px",width:"100%"}}>+ Agregar otra genética</button>
                        <div style={{fontSize:"11px",color:"#5a8a7a",marginTop:"6px"}}>Solo genéticas ya cargadas — para sumar una genética nueva al catálogo, eso lo hace el Master Grower en 🧬 Genéticas. Si encontrás una que no está en este subsector, igual se crea el lote como "pendiente de aprobación".</div>
                      </div>
                      <div>
                        <div style={{...lbl("#5aa098"),marginBottom:"6px"}}>NOTAS</div>
                        <textarea value={editingRelevamiento.notas} onChange={e=>setEditingRelevamiento({...editingRelevamiento,notas:e.target.value})} style={{...inp(),minHeight:"50px",resize:"vertical"}}/>
                      </div>
                      <div style={{display:"flex",gap:"10px"}}>
                        <button disabled={savingRelevamiento || !editingRelevamiento.sector_id || editingRelevamiento.lineas.every(l=>!l.genetica_id || l.cantidad==="")} onClick={guardarRelevamiento} style={{flex:1,padding:"12px",borderRadius:"10px",fontSize:"14px",fontWeight:"600",background:savingRelevamiento?"#0e4a42":"#0e8a7a",color:"#fff",border:"1px solid #1abc9c"}}>{savingRelevamiento?"Guardando...":"✓ Guardar"}</button>
                        <button onClick={()=>setEditingRelevamiento(null)} style={{padding:"12px 18px",borderRadius:"10px",fontSize:"14px",background:"#1a1a1a",color:"#7a7a7a",border:"1px solid #2a2a2a"}}>Cancelar</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button onClick={()=>setEditingRelevamiento(emptyRelevamiento())} style={{width:"100%",padding:"14px",borderRadius:"12px",fontSize:"14px",fontWeight:"600",background:"#0a201c",color:"#1abc9c",border:"2px dashed #0e8a7a",marginBottom:"20px"}}>+ Nuevo relevamiento</button>
                )
              )}

              {relevamientos.length===0 ? (
                <div style={{textAlign:"center",padding:"40px 20px",color:"#3a6a62",fontSize:"14px"}}>Sin relevamientos registrados</div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                  {relevamientos.map(r=>{
                    const sub = sectores.find(s=>s.id===r.sector_id);
                    const sp = sub ? sectoresPadre.find(x=>x.id===sub.sector_padre_id) : null;
                    const g = r.genetica_id ? geneticas.find(x=>x.id===r.genetica_id) : null;
                    const sistema = recuento(r);
                    const diff = r.cantidad_contada - sistema;
                    return (
                      <div key={r.id} style={{background:"#0e1a18",border:"1px solid #1abc9c33",borderRadius:"14px",padding:"16px",borderLeft:`4px solid ${diff===0?"#3a8a5a":"#c0392b"}`}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}>
                          <div style={{fontSize:"14px",color:"#dff0e8"}}>{sp?.nombre||"—"}{sub?` › ${sub.nombre}`:""}{g?` · ${g.nombre}`:""}</div>
                        </div>
                        <div style={{display:"flex",gap:"16px",marginBottom:"6px"}}>
                          <div><span style={{fontSize:"11px",color:"#5a9a90"}}>Contado: </span><span style={{fontSize:"15px",fontWeight:"700",color:"#1abc9c"}}>{r.cantidad_contada}</span></div>
                          <div><span style={{fontSize:"11px",color:"#5a9a90"}}>Sistema: </span><span style={{fontSize:"15px",color:"#9ab"}}>{sistema}</span></div>
                          {diff!==0 && <div><span style={{fontSize:"11px",color:"#c0392b"}}>Diferencia: </span><span style={{fontSize:"15px",fontWeight:"700",color:"#c0392b"}}>{diff>0?"+":""}{diff}</span></div>}
                        </div>
                        {r.notas && <div style={{fontSize:"13px",color:"#a0c0b8",marginBottom:"6px"}}>{r.notas}</div>}
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div style={{fontSize:"11px",color:"#5a8a7a"}}>{(r.fecha||"").slice(0,10)} · {usuariosMap[r.usuario_id]||"—"}</div>
                          {!esEjecutor && (
                            <button onClick={()=>delRelevamiento(r.id)} style={{padding:"4px 10px",borderRadius:"6px",fontSize:"10px",background:"#2a1010",color:"#aa5050",border:"1px solid #4a2020"}}>🗑</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* ══ GENÉTICAS ══ */}
        {tab==="_geneticas" && (
          <div className="fade">
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"22px",color:"#3a9ad4",marginBottom:"6px"}}>🧬 Genéticas y Fenotipos</div>
            <div style={{fontSize:"13px",color:"#5a8aaa",marginBottom:"18px"}}>{geneticas.length} ENTRADAS</div>

            {!esEjecutor && (
              editingGenetica ? (
                <div style={card({borderColor:"#1a5a7a",background:"#0e1e28"})}>
                  <span style={lbl("#3a9ad4")}>{editingGenetica.id?"EDITAR GENÉTICA":"NUEVA GENÉTICA"}</span>
                  <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                    <div>
                      <div style={{...lbl("#5a8aaa"),marginBottom:"6px"}}>NOMBRE</div>
                      <input value={editingGenetica.nombre} onChange={e=>setEditingGenetica({...editingGenetica,nombre:e.target.value})} placeholder="Ej: Critical Kush" style={inp()}/>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                      <div>
                        <div style={{...lbl("#5a8aaa"),marginBottom:"6px"}}>TIPO</div>
                        <select value={editingGenetica.tipo} onChange={e=>setEditingGenetica({...editingGenetica,tipo:e.target.value})} style={inp()}>
                          <option value="indica">Índica</option>
                          <option value="sativa">Sativa</option>
                          <option value="hibrido">Híbrido</option>
                        </select>
                      </div>
                      <div>
                        <div style={{...lbl("#5a8aaa"),marginBottom:"6px"}}>SEMANAS FLORACIÓN</div>
                        <input type="number" min="0" value={editingGenetica.semanas_floracion} onChange={e=>setEditingGenetica({...editingGenetica,semanas_floracion:e.target.value})} style={inp()}/>
                      </div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                      <div>
                        <div style={{...lbl("#5a8aaa"),marginBottom:"6px"}}>BANCO</div>
                        <input value={editingGenetica.banco} onChange={e=>setEditingGenetica({...editingGenetica,banco:e.target.value})} style={inp()}/>
                      </div>
                      <div>
                        <div style={{...lbl("#5a8aaa"),marginBottom:"6px"}}>COLOR</div>
                        <input type="color" value={editingGenetica.color} onChange={e=>setEditingGenetica({...editingGenetica,color:e.target.value})} style={{...inp(),padding:"4px",height:"38px"}}/>
                      </div>
                    </div>
                    <div>
                      <div style={{...lbl("#5a8aaa"),marginBottom:"6px"}}>SABOR</div>
                      <input value={editingGenetica.sabor} onChange={e=>setEditingGenetica({...editingGenetica,sabor:e.target.value})} style={inp()}/>
                    </div>
                    <div>
                      <div style={{...lbl("#5a8aaa"),marginBottom:"6px"}}>EFECTO</div>
                      <input value={editingGenetica.efecto} onChange={e=>setEditingGenetica({...editingGenetica,efecto:e.target.value})} style={inp()}/>
                    </div>
                    <label style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"13px",color:"#8aaac0"}}>
                      <input type="checkbox" checked={!!editingGenetica.fenotipo} onChange={e=>setEditingGenetica({...editingGenetica,fenotipo:e.target.checked})}/>
                      Es un fenotipo propio
                    </label>
                    <label style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"13px",color:"#8aaac0"}}>
                      <input type="checkbox" checked={editingGenetica.activa!==false} onChange={e=>setEditingGenetica({...editingGenetica,activa:e.target.checked})}/>
                      Activa (visible para dar de alta lotes nuevos)
                    </label>
                    <div style={{display:"flex",gap:"10px"}}>
                      <button disabled={savingGenetica || !editingGenetica.nombre} onClick={saveGenetica} style={{flex:1,padding:"12px",borderRadius:"10px",fontSize:"14px",fontWeight:"600",background:savingGenetica?"#0e3a5a":"#1a6a9a",color:"#fff",border:"1px solid #2a8aca"}}>{savingGenetica?"Guardando...":"✓ Guardar"}</button>
                      <button onClick={()=>setEditingGenetica(null)} style={{padding:"12px 18px",borderRadius:"10px",fontSize:"14px",background:"#1a1a1a",color:"#7a7a7a",border:"1px solid #2a2a2a"}}>Cancelar</button>
                    </div>
                  </div>
                </div>
              ) : (
                <button onClick={()=>setEditingGenetica(emptyGenetica())} style={{width:"100%",padding:"14px",borderRadius:"12px",fontSize:"14px",fontWeight:"600",background:"#0e2030",color:"#3a9ad4",border:"2px dashed #1a5a7a",marginBottom:"20px"}}>+ Nueva genética</button>
              )
            )}

            <div style={{display:"flex",gap:"8px",marginBottom:"12px",flexWrap:"wrap"}}>
              {["all","indica","sativa","hibrido"].map(t=>(
                <button key={t} onClick={()=>setGFilter(t)} style={{padding:"8px 18px",borderRadius:"22px",fontSize:"13px",background:gFilter===t?(t==="all"?"#2a4a7a":TIPO_COLOR[t]):"#141e14",color:gFilter===t?"#fff":"#6a8aaa",border:`1px solid ${gFilter===t?(t==="all"?"#3a6aaa":TIPO_COLOR[t]):"#2a3a4a"}`,fontWeight:gFilter===t?"600":"400"}}>{t==="all"?"Todas":TIPO_LABEL[t]}</button>
              ))}
            </div>
            {!esEjecutor && (
              <div style={{display:"flex",gap:"8px",marginBottom:"20px",flexWrap:"wrap"}}>
                {[["activas","Activas"],["inactivas","Inactivas"],["todas","Todas"]].map(([k,label])=>(
                  <button key={k} onClick={()=>setGActivaFilter(k)} style={{padding:"6px 14px",borderRadius:"18px",fontSize:"12px",background:gActivaFilter===k?"#3a3a1a":"#141414",color:gActivaFilter===k?"#d0c060":"#8a8a6a",border:`1px solid ${gActivaFilter===k?"#6a6a2a":"#2a2a2a"}`}}>{label}</button>
                ))}
              </div>
            )}

            <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
              {geneticas
                .filter(g=>gFilter==="all"||g.tipo===gFilter)
                .filter(g=> esEjecutor ? g.activa!==false :
                  gActivaFilter==="todas" ? true :
                  gActivaFilter==="inactivas" ? g.activa===false : g.activa!==false
                )
                .map(g=>(
                <div key={g.id} style={{background:"#162416",border:`1px solid ${g.color}55`,borderRadius:"14px",padding:"18px",borderLeft:`5px solid ${g.color}`,opacity:g.activa===false?0.55:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"12px"}}>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"5px",flexWrap:"wrap"}}>
                        <span style={{fontSize:"17px",fontWeight:"600",color:"#e0f0d0"}}>{g.nombre}</span>
                        {g.fenotipo && <span style={{fontSize:"10px",background:`${g.color}33`,color:g.color,padding:"2px 8px",borderRadius:"10px"}}>FENOTIPO</span>}
                        {g.activa===false && <span style={{fontSize:"10px",background:"#3a2a1a",color:"#c8a020",padding:"2px 8px",borderRadius:"10px"}}>INACTIVA</span>}
                      </div>
                      <div style={{fontSize:"13px",color:TIPO_COLOR[g.tipo]}}>{TIPO_LABEL[g.tipo]}</div>
                    </div>
                    <div style={{background:"#0e180e",border:`1px solid ${g.color}88`,borderRadius:"10px",padding:"8px 14px",textAlign:"center",minWidth:"64px"}}>
                      <div style={{fontSize:"26px",fontWeight:"700",color:g.color,lineHeight:1}}>{g.semanas_floracion}</div>
                      <div style={{fontSize:"11px",color:"#4a6a4a",marginTop:"3px"}}>semanas</div>
                    </div>
                  </div>
                  {g.banco && <div style={{fontSize:"12px",color:"#6a8a6a",marginBottom:"8px"}}>🏷 {g.banco}</div>}
                  {g.sabor && <div style={{fontSize:"14px",color:"#90b870",marginBottom:"6px",lineHeight:"1.6"}}>🍋 {g.sabor}</div>}
                  {g.efecto && <div style={{fontSize:"14px",color:"#c0a860",lineHeight:"1.6",marginBottom:!esEjecutor?"12px":"0"}}>✨ {g.efecto}</div>}
                  {!esEjecutor && (
                    <div style={{display:"flex",gap:"6px",marginTop:"12px"}}>
                      <button onClick={()=>setEditingGenetica({...g, semanas_floracion:g.semanas_floracion||""})} style={{flex:1,padding:"8px",borderRadius:"8px",fontSize:"12px",background:"#1a2e1a",color:"#7ec850",border:"1px solid #2a5a2a"}}>✏️ Editar</button>
                      <button onClick={()=>toggleActivaGenetica(g)} style={{flex:1,padding:"8px",borderRadius:"8px",fontSize:"12px",background:"#2a2a10",color:"#c8a020",border:"1px solid #4a4a20"}}>{g.activa===false?"↺ Activar":"⏸ Desactivar"}</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ COSECHAS ══ */}
        {tab==="_cosechas" && !esEjecutor && (
          <div className="fade">
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"22px",color:"#c8a020",marginBottom:"6px"}}>📦 Registro de Cosechas</div>
            <div style={{fontSize:"13px",color:"#8a7a30",marginBottom:"20px"}}>POR GENÉTICA · FECHA · SECADO · PRODUCCIÓN</div>

            {!esEjecutor && (
              <div>
                {editingCosecha ? (
                  <div style={card({borderColor:"#5a4a10",background:"#1a1808"})}>
                    <span style={lbl("#c8a020")}>{editingCosecha.id?"EDITAR COSECHA":"NUEVA COSECHA"}</span>
                    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                      <div>
                        <div style={{...lbl("#8a7a40"),marginBottom:"6px"}}>SUBSECTOR</div>
                        <select value={editingCosecha.sector_actual_id} onChange={e=>setEditingCosecha({...editingCosecha,sector_actual_id:e.target.value})} style={inp()}>
                          <option value="">Seleccionar...</option>
                          {sectores.map(s=><option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{...lbl("#8a7a40"),marginBottom:"6px"}}>GENÉTICA</div>
                        <select value={editingCosecha.genetica_id} onChange={e=>setEditingCosecha({...editingCosecha,genetica_id:e.target.value})} style={inp()}>
                          <option value="">Seleccionar...</option>
                          {geneticasSelect(editingCosecha.genetica_id).map(g=><option key={g.id} value={g.id}>{g.nombre}</option>)}
                        </select>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                        <div>
                          <div style={{...lbl("#8a7a40"),marginBottom:"6px"}}>PLANTAS</div>
                          <input type="number" value={editingCosecha.cantidad_plantas} min="0" onChange={e=>setEditingCosecha({...editingCosecha,cantidad_plantas:e.target.value})} style={inp()}/>
                        </div>
                        <div>
                          <div style={{...lbl("#8a7a40"),marginBottom:"6px"}}>FECHA CORTE</div>
                          <input type="date" value={editingCosecha.fecha_inicio} onChange={e=>setEditingCosecha({...editingCosecha,fecha_inicio:e.target.value})} style={inp({colorScheme:"dark"})}/>
                        </div>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                        <div>
                          <div style={{...lbl("#8a7a40"),marginBottom:"6px"}}>DÍAS SECADO</div>
                          <input type="number" value={editingCosecha.dias_secado} min="0" placeholder="0" onChange={e=>setEditingCosecha({...editingCosecha,dias_secado:e.target.value})} style={inp()}/>
                        </div>
                        <div>
                          <div style={{...lbl("#8a7a40"),marginBottom:"6px"}}>GRAMOS</div>
                          <input type="number" value={editingCosecha.peso_cosechado_gramos} min="0" placeholder="0" onChange={e=>setEditingCosecha({...editingCosecha,peso_cosechado_gramos:e.target.value})} style={inp()}/>
                        </div>
                      </div>
                      <div>
                        <div style={{...lbl("#8a7a40"),marginBottom:"6px"}}>NOTAS</div>
                        <textarea value={editingCosecha.notas} onChange={e=>setEditingCosecha({...editingCosecha,notas:e.target.value})} placeholder="Observaciones..." style={{...inp(),minHeight:"70px",resize:"vertical",lineHeight:"1.6"}}/>
                      </div>
                      <div style={{display:"flex",gap:"10px"}}>
                        <button disabled={savingCosecha} onClick={saveCosecha} style={{flex:1,padding:"12px",borderRadius:"10px",fontSize:"14px",fontWeight:"600",background:savingCosecha?"#2a4a10":"#3a6a10",color:"#dff0cf",border:"1px solid #5a9a20"}}>{savingCosecha?"Guardando...":"✓ Guardar"}</button>
                        <button onClick={()=>setEditingCosecha(null)} style={{padding:"12px 18px",borderRadius:"10px",fontSize:"14px",background:"#1a1a1a",color:"#7a7a7a",border:"1px solid #2a2a2a"}}>Cancelar</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button onClick={()=>setEditingCosecha(emptyCosecha())} style={{width:"100%",padding:"14px",borderRadius:"12px",fontSize:"14px",fontWeight:"600",background:"#1e2808",color:"#c8a020",border:"2px dashed #5a4a10",marginBottom:"20px"}}>+ Registrar nueva cosecha</button>
                )}
              </div>
            )}

            {(()=>{
              const cosechas = lotes.filter(l=>l.estado==="cosechado");
              if(cosechas.length===0 && !editingCosecha){
                return <div style={{textAlign:"center",padding:"40px 20px",color:"#3a5a2a",fontSize:"14px"}}>Sin cosechas registradas aún</div>;
              }
              return (
                <>
                  {cosechas.length>0 && (
                    <div style={card({background:"#141e08",borderColor:"#3a4a10"})}>
                      <span style={lbl("#8aaa20")}>RESUMEN ACUMULADO</span>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"12px",textAlign:"center"}}>
                        <div><div style={{fontSize:"28px",fontWeight:"700",color:"#c8a020"}}>{cosechas.length}</div><div style={{fontSize:"11px",color:"#6a7a30",marginTop:"3px"}}>cosechas</div></div>
                        <div><div style={{fontSize:"28px",fontWeight:"700",color:"#7ec850"}}>{cosechas.reduce((a,c)=>a+(parseFloat(c.peso_cosechado_gramos)||0),0).toFixed(0)}g</div><div style={{fontSize:"11px",color:"#6a7a30",marginTop:"3px"}}>producción total</div></div>
                        <div><div style={{fontSize:"28px",fontWeight:"700",color:"#2ecc71"}}>{cosechas.reduce((a,c)=>a+(c.cantidad_plantas||0),0)}</div><div style={{fontSize:"11px",color:"#6a7a30",marginTop:"3px"}}>plantas totales</div></div>
                      </div>
                    </div>
                  )}
                  <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                    {cosechas.map(c=>{
                      const g = geneticas.find(x=>x.id===c.genetica_id);
                      const s = sectores.find(x=>x.id===c.sector_actual_id);
                      return (
                        <div key={c.id} style={{background:"#141e10",border:`1px solid ${g?.color||"#2a4a2a"}44`,borderRadius:"14px",padding:"16px",borderLeft:`4px solid ${g?.color||"#4a6a4a"}`}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"12px"}}>
                            <div>
                              <div style={{fontSize:"16px",fontWeight:"600",color:"#e0f0d0",marginBottom:"4px"}}>{g?.nombre||"—"}{c.numero_lote?` #${c.numero_lote}`:""}</div>
                              <div style={{fontSize:"12px",color:"#5a8a5a"}}>{s?.nombre||"—"} · {c.cantidad_plantas} plantas</div>
                            </div>
                            <div style={{textAlign:"right"}}>
                              {c.fecha_inicio && <div style={{fontSize:"13px",color:"#c8a020",marginBottom:"2px"}}>✂️ {c.fecha_inicio}</div>}
                              {c.dias_secado && <div style={{fontSize:"12px",color:"#7a9a7a"}}>💨 {c.dias_secado} días</div>}
                            </div>
                          </div>
                          {c.peso_cosechado_gramos>0 && <div style={{background:"#1a2a10",borderRadius:"8px",padding:"10px 14px",marginBottom:"10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:"13px",color:"#7a9a6a"}}>Producción</span><span style={{fontSize:"22px",fontWeight:"700",color:"#7ec850"}}>{c.peso_cosechado_gramos} g</span></div>}
                          {c.notas && <div style={{fontSize:"13px",color:"#8aaa7a",lineHeight:"1.6",marginBottom:"10px"}}>{c.notas}</div>}
                          {!esEjecutor && (
                            <div style={{display:"flex",gap:"8px"}}>
                              <button onClick={()=>setEditingCosecha({...c, peso_cosechado_gramos:c.peso_cosechado_gramos||"", dias_secado:c.dias_secado||""})} style={{flex:1,padding:"8px",borderRadius:"8px",fontSize:"12px",background:"#1a2e1a",color:"#7ec850",border:"1px solid #2a5a2a"}}>✏️ Editar</button>
                              <button onClick={()=>delCosecha(c.id)} style={{padding:"8px 14px",borderRadius:"8px",fontSize:"12px",background:"#2a1010",color:"#aa5050",border:"1px solid #4a2020"}}>🗑</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* ══ BAJAS (historial de mortandad / descartes) ══ */}
        {tab==="_bajas" && (()=>{
          const bajas = movimientos
            .filter(m=>m.tipo==="baja"||m.tipo==="baja_parcial")
            .sort((a,b)=> new Date(b.fecha) - new Date(a.fecha));
          const totalPlantas = bajas.reduce((a,m)=>a+(m.cantidad_movida||0),0);
          return (
            <div className="fade">
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"22px",color:"#c0392b",marginBottom:"6px"}}>📉 Bajas y Mortandad</div>
              <div style={{fontSize:"13px",color:"#aa6a5a",marginBottom:"20px"}}>HISTORIAL · MOTIVO · ETAPA AL MOMENTO DE LA BAJA</div>

              {bajas.length===0 ? (
                <div style={{textAlign:"center",padding:"40px 20px",color:"#5a3a2a",fontSize:"14px"}}>Sin bajas registradas — buena señal</div>
              ) : (
                <>
                  <div style={card({background:"#1e0e0e",borderColor:"#4a2a20"})}>
                    <span style={lbl("#c0392b")}>RESUMEN</span>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",textAlign:"center"}}>
                      <div><div style={{fontSize:"28px",fontWeight:"700",color:"#d08070"}}>{bajas.length}</div><div style={{fontSize:"11px",color:"#8a5a4a",marginTop:"3px"}}>eventos de baja</div></div>
                      <div><div style={{fontSize:"28px",fontWeight:"700",color:"#d08070"}}>{totalPlantas}</div><div style={{fontSize:"11px",color:"#8a5a4a",marginTop:"3px"}}>plantas perdidas</div></div>
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                    {bajas.map((m,idx)=>{
                      const lote = lotes.find(l=>l.id===m.lote_id);
                      const g = lote ? geneticas.find(x=>x.id===lote.genetica_id) : null;
                      const sub = sectores.find(s=>s.id===m.sector_origen_id);
                      const sp = sub ? sectoresPadre.find(x=>x.id===sub.sector_padre_id) : null;
                      return (
                        <div key={m.id||idx} style={{background:"#1a1212",border:"1px solid #4a2a2a",borderRadius:"14px",padding:"16px",borderLeft:`4px solid ${g?.color||"#7a4040"}`}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"8px"}}>
                            <div>
                              <div style={{fontSize:"15px",fontWeight:"600",color:"#e0c0c0"}}>{g?.nombre||"—"}</div>
                              <div style={{fontSize:"12px",color:"#9a6a6a",marginTop:"2px"}}>{sp?.nombre||"—"}{sub?` › ${sub.nombre}`:""}</div>
                            </div>
                            <div style={{background:"#2a1414",border:"1px solid #5a3030",borderRadius:"8px",padding:"6px 12px",textAlign:"center"}}>
                              <div style={{fontSize:"18px",fontWeight:"700",color:"#d08070"}}>{m.cantidad_movida}</div>
                              <div style={{fontSize:"10px",color:"#8a5a5a"}}>{m.tipo==="baja"?"lote completo":"plantas"}</div>
                            </div>
                          </div>
                          {m.motivo && <div style={{fontSize:"13px",color:"#c0a0a0",lineHeight:"1.6",marginBottom:"6px"}}>📋 {m.motivo}</div>}
                          <div style={{fontSize:"11px",color:"#6a4a4a"}}>{(m.fecha||"").slice(0,10)} · {usuariosMap[m.usuario_id]||"—"}</div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {/* ══ MI SALA (admin de subsectores) ══ */}
        {tab==="_misala" && !esEjecutor && (
          <div className="fade">
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"22px",color:"#8e44ad",marginBottom:"6px"}}>⚙️ Mi Sala</div>
            <div style={{fontSize:"13px",color:"#8a6a9a",marginBottom:"20px"}}>ADMINISTRACIÓN DE SECTORES Y SUBSECTORES</div>

            <div style={card({borderColor:"#6a3a8a",background:"#1a0e22"})}>
              <span style={lbl("#a86ad0")}>PERMISOS DE EJECUTORES</span>
              {usuariosLista.filter(u=>u.rol==="ejecutor").length===0 ? (
                <div style={{fontSize:"13px",color:"#7a5a9a"}}>No hay usuarios con rol Ejecutor todavía.</div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                  {usuariosLista.filter(u=>u.rol==="ejecutor").map(u=>(
                    <div key={u.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#140a1a",borderRadius:"10px",padding:"10px 14px"}}>
                      <span style={{fontSize:"14px",color:"#dcc8ec"}}>{u.nombre}</span>
                      <button onClick={()=>togglePermisoRelevamiento(u)} style={{padding:"7px 12px",borderRadius:"7px",fontSize:"11px",background:u.permisos?.relevamiento?"#1a4a3a":"#2a1a3a",color:u.permisos?.relevamiento?"#3a9a7a":"#9a7aba",border:`1px solid ${u.permisos?.relevamiento?"#2a7a5a":"#4a3a6a"}`}}>🔍 {u.permisos?.relevamiento?"Relevamiento: ON":"Relevamiento: OFF"}</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {lotes.filter(l=>l.estado==="pendiente_aprobacion").length>0 && (
              <div style={card({borderColor:"#8a6a1a",background:"#1e1808"})}>
                <span style={lbl("#e0b850")}>🆕 PENDIENTES DE APROBACIÓN (detectados por relevamiento)</span>
                <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                  {lotes.filter(l=>l.estado==="pendiente_aprobacion").map(l=>{
                    const g = geneticas.find(x=>x.id===l.genetica_id);
                    const sub = sectores.find(s=>s.id===l.sector_actual_id);
                    const sp = sub ? sectoresPadre.find(x=>x.id===sub.sector_padre_id) : null;
                    return (
                      <div key={l.id} style={{background:"#140f04",borderRadius:"10px",padding:"12px 14px"}}>
                        <div style={{fontSize:"14px",color:"#e0d0a0",marginBottom:"4px"}}>{g?.nombre||"Sin genética"} · {l.cantidad_plantas} plantas</div>
                        <div style={{fontSize:"12px",color:"#a08a50",marginBottom:"8px"}}>{sp?.nombre||"—"}{sub?` › ${sub.nombre}`:""}</div>
                        {l.notas && <div style={{fontSize:"11px",color:"#7a6a40",marginBottom:"8px"}}>{l.notas}</div>}
                        <div style={{display:"flex",gap:"6px"}}>
                          <button onClick={()=>aprobarLotePendiente(l)} style={{flex:1,padding:"7px",borderRadius:"7px",fontSize:"11px",background:"#1a3a10",color:"#7ec850",border:"1px solid #2a5a20"}}>✓ Aprobar</button>
                          <button onClick={()=>setEditingLote({...l, cantidad_plantas:String(l.cantidad_plantas)})} style={{padding:"7px 10px",borderRadius:"7px",fontSize:"11px",background:"#1a2e1a",color:"#7ec850",border:"1px solid #2a5a2a"}}>✏️ Editar y aprobar</button>
                          <button onClick={()=>delLote(l.id)} style={{padding:"7px 10px",borderRadius:"7px",fontSize:"11px",background:"#2a1010",color:"#aa5050",border:"1px solid #4a2020"}}>🗑</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {editingSub && (
              <div style={card({borderColor:"#5a3a7a",background:"#1a1428"})}>
                <span style={lbl("#a070c0")}>{editingSub.id?"EDITAR SUBSECTOR":"NUEVO SUBSECTOR"}</span>
                <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                  <div>
                    <div style={{...lbl("#8a70a0"),marginBottom:"6px"}}>SECTOR PADRE</div>
                    <select value={editingSub.sector_padre_id} onChange={e=>setEditingSub({...editingSub,sector_padre_id:e.target.value})} style={inp()}>
                      <option value="">Seleccionar...</option>
                      {sectoresPadre.map(sp=><option key={sp.id} value={sp.id}>{sp.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{...lbl("#8a70a0"),marginBottom:"6px"}}>NOMBRE DEL SUBSECTOR</div>
                    <input value={editingSub.nombre} onChange={e=>setEditingSub({...editingSub,nombre:e.target.value})} placeholder="Ej: Carpa 4, Vege 3L..." style={inp()}/>
                  </div>
                  <div>
                    <div style={{...lbl("#8a70a0"),marginBottom:"6px"}}>CAPACIDAD (opcional)</div>
                    <input type="number" value={editingSub.capacidad_unidades} onChange={e=>setEditingSub({...editingSub,capacidad_unidades:e.target.value})} placeholder="Ej: 16 plantas, 35 esquejes" style={inp()}/>
                  </div>
                  <div style={{display:"flex",gap:"10px"}}>
                    <button disabled={savingSub || !editingSub.sector_padre_id || !editingSub.nombre} onClick={saveSub} style={{flex:1,padding:"12px",borderRadius:"10px",fontSize:"14px",fontWeight:"600",background:savingSub?"#3a2a4a":"#6a3a8a",color:"#fff",border:"1px solid #8a5aaa"}}>{savingSub?"Guardando...":"✓ Guardar"}</button>
                    <button onClick={()=>setEditingSub(null)} style={{padding:"12px 18px",borderRadius:"10px",fontSize:"14px",background:"#1a1a1a",color:"#7a7a7a",border:"1px solid #2a2a2a"}}>Cancelar</button>
                  </div>
                </div>
              </div>
            )}

            {sectoresPadre.map(sp=>(
              <div key={sp.id} style={card({borderColor:"#3a2a4a"})}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
                  <span style={{fontSize:"17px",fontWeight:"600",color:"#c090e0"}}>{sp.nombre}</span>
                  <button onClick={()=>setEditingSub(emptySubsector(sp.id))} style={{fontSize:"12px",padding:"6px 14px",borderRadius:"14px",background:"#2a1a3a",color:"#c090e0",border:"1px dashed #6a3a8a"}}>+ Agregar</button>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                  {subsectoresDe(sp.id).map(sub=>(
                    <div key={sub.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#111e11",borderRadius:"8px",padding:"10px 14px"}}>
                      <div>
                        <div style={{fontSize:"14px",color:"#dff0cf"}}>{sub.nombre}</div>
                        {sub.capacidad_unidades && <div style={{fontSize:"11px",color:"#5a8a5a"}}>capacidad: {sub.capacidad_unidades}</div>}
                      </div>
                      <div style={{display:"flex",gap:"6px"}}>
                        <button onClick={()=>setEditingSub({id:sub.id, sector_padre_id:sub.sector_padre_id, nombre:sub.nombre, capacidad_unidades:sub.capacidad_unidades||""})} style={{fontSize:"11px",padding:"6px 10px",borderRadius:"6px",background:"#1a2e1a",color:"#7ec850",border:"1px solid #2a5a2a"}}>✏️</button>
                        <button onClick={()=>delSub(sub.id)} style={{fontSize:"11px",padding:"6px 10px",borderRadius:"6px",background:"#2a1010",color:"#aa5050",border:"1px solid #4a2020"}}>🗑</button>
                      </div>
                    </div>
                  ))}
                  {subsectoresDe(sp.id).length===0 && <div style={{fontSize:"12px",color:"#3a5a3a",fontStyle:"italic"}}>Sin subsectores</div>}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ══ MODAL: ALTA / EDICIÓN DE LOTE (corrección de datos — la baja real va por el botón 🥀) ══ */}
      {editingLote && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",zIndex:200}}>
          <div style={{background:"#182818",border:"1px solid #2a5a2a",borderRadius:"16px",padding:"22px",width:"100%",maxWidth:"380px"}}>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"19px",color:"#7ec850",marginBottom:"16px"}}>{editingLote.id ? `Editar lote${editingLote.numero_lote?` #${editingLote.numero_lote}`:""}` : "Nueva planta / lote"}</div>
            <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
              <div>
                <div style={{...lbl("#5a9a5a"),marginBottom:"6px"}}>GENÉTICA</div>
                <select value={editingLote.genetica_id} onChange={e=>setEditingLote({...editingLote,genetica_id:e.target.value})} style={inp()}>
                  <option value="">Seleccionar...</option>
                  {geneticasSelect(editingLote.genetica_id).map(g=><option key={g.id} value={g.id}>{g.nombre}{g.activa===false?" (inactiva)":""}</option>)}
                </select>
              </div>
              <div>
                <div style={{...lbl("#5a9a5a"),marginBottom:"6px"}}>CANTIDAD DE PLANTAS</div>
                <input type="number" min="0" value={editingLote.cantidad_plantas} onChange={e=>setEditingLote({...editingLote,cantidad_plantas:e.target.value})} style={inp()}/>
                {editingLote.id && <div style={{fontSize:"11px",color:"#5a7a5a",marginTop:"4px"}}>Esto es para corregir un error de carga. Para una baja real (muerte, descarte) usá el botón 🥀 en la tarjeta del lote — así queda registrada con motivo.</div>}
              </div>
              <div>
                <div style={{...lbl("#5a9a5a"),marginBottom:"6px"}}>FECHA INICIO</div>
                <input type="date" value={editingLote.fecha_inicio} onChange={e=>setEditingLote({...editingLote,fecha_inicio:e.target.value})} style={inp({colorScheme:"dark"})}/>
              </div>
              <div>
                <div style={{...lbl("#5a9a5a"),marginBottom:"6px"}}>NOTAS</div>
                <textarea value={editingLote.notas} onChange={e=>setEditingLote({...editingLote,notas:e.target.value})} style={{...inp(),minHeight:"60px",resize:"vertical"}}/>
              </div>
              <div style={{display:"flex",gap:"10px",marginTop:"4px"}}>
                <button disabled={savingLote || !editingLote.genetica_id || editingLote.cantidad_plantas===""} onClick={saveLote} style={{flex:1,padding:"12px",borderRadius:"10px",fontSize:"14px",fontWeight:"600",background:savingLote?"#2a4a10":"#3a6a10",color:"#dff0cf",border:"1px solid #5a9a20"}}>{savingLote?"Guardando...":(editingLote.id?"✓ Guardar cambios":"✓ Crear lote")}</button>
                <button onClick={()=>setEditingLote(null)} style={{padding:"12px 18px",borderRadius:"10px",fontSize:"14px",background:"#1a1a1a",color:"#7a7a7a",border:"1px solid #2a2a2a"}}>Cancelar</button>
              </div>
              {editingLote.id && (
                <button onClick={()=>delLote(editingLote.id)} style={{padding:"10px",borderRadius:"10px",fontSize:"12px",background:"transparent",color:"#7a4040",border:"1px solid #4a2020"}}>🗑 Borrar lote por completo (solo errores de carga)</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: DAR DE BAJA (parcial o total) ══ */}
      {bajaLote && (()=>{
        const g = geneticas.find(x=>x.id===bajaLote.lote.genetica_id);
        const cant = parseInt(bajaLote.cantidad)||0;
        const esTotal = cant>=bajaLote.lote.cantidad_plantas && cant>0;
        return (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",zIndex:200}}>
            <div style={{background:"#1e1414",border:"1px solid #4a2020",borderRadius:"16px",padding:"22px",width:"100%",maxWidth:"380px"}}>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"19px",color:"#d08070",marginBottom:"6px"}}>🥀 Dar de baja</div>
              <div style={{fontSize:"13px",color:"#aa8080",marginBottom:"16px"}}>{g?.nombre||"—"} · {bajaLote.lote.cantidad_plantas} plantas activas</div>
              <div style={{...lbl("#c89090"),marginBottom:"6px"}}>CANTIDAD A DAR DE BAJA</div>
              <input type="number" min="1" max={bajaLote.lote.cantidad_plantas} value={bajaLote.cantidad} onChange={e=>setBajaLote({...bajaLote,cantidad:e.target.value})} style={{...inp(),marginBottom:"10px"}}/>
              <div style={{...lbl("#c89090"),marginBottom:"6px"}}>MOTIVO</div>
              <input value={bajaLote.motivo} onChange={e=>setBajaLote({...bajaLote,motivo:e.target.value})} placeholder="Ej: plaga, hongo, estrés hídrico..." style={{...inp(),marginBottom:"14px"}}/>
              {esTotal && <div style={{fontSize:"12px",color:"#c8a020",background:"#2a2010",borderRadius:"8px",padding:"8px 12px",marginBottom:"14px"}}>⚠ Esto da de baja el lote completo — desaparece de "activos" y queda solo en el historial.</div>}
              <div style={{display:"flex",gap:"10px"}}>
                <button disabled={savingBaja || cant<=0 || cant>bajaLote.lote.cantidad_plantas} onClick={confirmBaja} style={{flex:1,padding:"12px",borderRadius:"10px",fontSize:"14px",fontWeight:"600",background:savingBaja?"#4a1a1a":"#7a2020",color:"#fff",border:"1px solid #aa3030"}}>{savingBaja?"Guardando...":(esTotal?"✓ Confirmar baja total":"✓ Confirmar baja parcial")}</button>
                <button onClick={()=>setBajaLote(null)} style={{padding:"12px 18px",borderRadius:"10px",fontSize:"14px",background:"#1a1a1a",color:"#7a7a7a",border:"1px solid #2a2a2a"}}>Cancelar</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══ MODAL: FINALIZAR Y PESAR ══ */}
      {finalizandoLote && (()=>{
        const g = geneticas.find(x=>x.id===finalizandoLote.lote.genetica_id);
        return (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",zIndex:200}}>
            <div style={{background:"#1e1a10",border:"1px solid #5a4a20",borderRadius:"16px",padding:"22px",width:"100%",maxWidth:"380px"}}>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"19px",color:"#e0b850",marginBottom:"6px"}}>⚖️ Finalizar y pesar</div>
              <div style={{fontSize:"13px",color:"#b09850",marginBottom:"16px"}}>{g?.nombre||"—"} · {finalizandoLote.lote.cantidad_plantas} plantas</div>
              <div style={{...lbl("#c8b070"),marginBottom:"6px"}}>PESO COSECHADO (GRAMOS)</div>
              <input type="number" min="0" step="0.1" value={finalizandoLote.peso} onChange={e=>setFinalizandoLote({...finalizandoLote,peso:e.target.value})} style={{...inp(),marginBottom:"12px"}}/>
              <div style={{...lbl("#c8b070"),marginBottom:"6px"}}>DÍAS DE SECADO (OPCIONAL)</div>
              <input type="number" min="0" value={finalizandoLote.dias_secado} onChange={e=>setFinalizandoLote({...finalizandoLote,dias_secado:e.target.value})} style={{...inp(),marginBottom:"12px"}}/>
              <div style={{...lbl("#c8b070"),marginBottom:"6px"}}>NOTAS</div>
              <textarea value={finalizandoLote.notas} onChange={e=>setFinalizandoLote({...finalizandoLote,notas:e.target.value})} style={{...inp(),minHeight:"60px",resize:"vertical",marginBottom:"14px"}}/>
              <div style={{fontSize:"12px",color:"#8a7a40",background:"#2a2410",borderRadius:"8px",padding:"8px 12px",marginBottom:"14px"}}>Esto cierra el lote y lo manda a 📦 Cosechas — ya no aparece como activo en ningún subsector.</div>
              <div style={{display:"flex",gap:"10px"}}>
                <button disabled={savingFinal || !finalizandoLote.peso} onClick={confirmFinalizar} style={{flex:1,padding:"12px",borderRadius:"10px",fontSize:"14px",fontWeight:"600",background:savingFinal?"#3a3010":"#6a5510",color:"#fff8e0",border:"1px solid #8a7020"}}>{savingFinal?"Guardando...":"✓ Confirmar"}</button>
                <button onClick={()=>setFinalizandoLote(null)} style={{padding:"12px 18px",borderRadius:"10px",fontSize:"14px",background:"#1a1a1a",color:"#7a7a7a",border:"1px solid #2a2a2a"}}>Cancelar</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══ MODAL: MOVER LOTE ══ */}
      {movingLote && (()=>{
        const spOrigen = sectorPadreDeSub(movingLote.sector_actual_id);
        const spDestino = siguienteSectorPadre(spOrigen);
        const subsDestino = spDestino ? subsectoresDe(spDestino.id) : [];
        const g = geneticas.find(x=>x.id===movingLote.genetica_id);
        return (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",zIndex:200}}>
            <div style={{background:"#182818",border:"1px solid #2a5a2a",borderRadius:"16px",padding:"22px",width:"100%",maxWidth:"380px"}}>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"19px",color:"#7ec850",marginBottom:"6px"}}>Avanzar etapa</div>
              <div style={{fontSize:"13px",color:"#8aaa8a",marginBottom:"16px"}}>{g?.nombre} · {movingLote.cantidad_plantas} plantas → {spDestino?.nombre}</div>
              <div style={{...lbl("#5a9a5a"),marginBottom:"6px"}}>SUBSECTOR DESTINO</div>
              <select value={destinoSub} onChange={e=>setDestinoSub(e.target.value)} style={{...inp(),marginBottom:"16px"}}>
                <option value="">Seleccionar...</option>
                {subsDestino.map(s=><option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
              <div style={{display:"flex",gap:"10px"}}>
                <button disabled={!destinoSub} onClick={confirmarMovimiento} style={{flex:1,padding:"12px",borderRadius:"10px",fontSize:"14px",fontWeight:"600",background:"#3a6a10",color:"#dff0cf",border:"1px solid #5a9a20"}}>✓ Confirmar</button>
                <button onClick={()=>{setMovingLote(null);setDestinoSub("");}} style={{padding:"12px 18px",borderRadius:"10px",fontSize:"14px",background:"#1a1a1a",color:"#7a7a7a",border:"1px solid #2a2a2a"}}>Cancelar</button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
