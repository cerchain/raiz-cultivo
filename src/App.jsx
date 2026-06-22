import { useState, useEffect } from "react";
import { supabase } from './supabaseClient';
import Login from './Login';

const card = (x={}) => ({ background:"#182818", border:"1px solid #2a4a2a", borderRadius:"14px", padding:"18px", marginBottom:"16px", ...x });
const lbl  = (c="#5aaa5a") => ({ fontSize:"11px", color:c, letterSpacing:"2.5px", display:"block", marginBottom:"8px", fontWeight:"600" });
const inp  = (x={}) => ({ background:"#111e11", border:"1px solid #2a4a2a", borderRadius:"8px", color:"#dff0cf", fontSize:"14px", padding:"8px 12px", width:"100%", fontFamily:"'IBM Plex Mono',monospace", outline:"none", ...x });

const TIPO_LABEL = { indica:"Índica 🟣", sativa:"Sativa 🟢", hibrido:"Híbrido ⚖️" };
const TIPO_COLOR = { indica:"#9b59b6", sativa:"#27ae60", hibrido:"#2980b9" };

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
  const [salaId, setSalaId]               = useState(null);

  const [editingCosecha, setEditingCosecha] = useState(null);
  const [savingCosecha, setSavingCosecha]   = useState(false);

  const [editingLote, setEditingLote] = useState(null);
  const [savingLote, setSavingLote]   = useState(false);

  const [movingLote, setMovingLote] = useState(null);
  const [destinoSub, setDestinoSub] = useState("");

  const [editingSub, setEditingSub] = useState(null);
  const [savingSub, setSavingSub]   = useState(false);

  const esEjecutor = usuario?.rol === "ejecutor";

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

      const [spR, sR, gR, lR] = await Promise.all([
        supabase.from("sectores_padre").select("*").eq("sala_id", sId).order("orden"),
        supabase.from("sectores").select("*").eq("sala_id", sId),
        supabase.from("geneticas").select("*").eq("sala_id", sId).order("nombre"),
        supabase.from("lotes").select("*").eq("sala_id", sId).order("fecha_inicio", { ascending:false })
      ]);

      setSectoresPadre(spR.data||[]);
      setSectores(sR.data||[]);
      setGeneticas(gR.data||[]);
      setLotes(lR.data||[]);

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
      else await supabase.from("lotes").insert(payload);
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

  // ── LOTES (alta de plantas en subsector) ──
  const saveLote = async () => {
    if(!editingLote) return;
    setSavingLote(true);
    try {
      const payload = {
        sala_id: salaId,
        genetica_id: editingLote.genetica_id || null,
        sector_actual_id: editingLote.sector_actual_id,
        cantidad_plantas: parseInt(editingLote.cantidad_plantas)||0,
        fecha_inicio: editingLote.fecha_inicio,
        estado: "activo",
        notas: editingLote.notas || ""
      };
      const ins = await supabase.from("lotes").insert(payload).select().single();
      if(ins.data){
        await supabase.from("movimientos_lote").insert({
          lote_id: ins.data.id,
          sector_origen_id: null,
          sector_destino_id: editingLote.sector_actual_id,
          cantidad_movida: payload.cantidad_plantas,
          usuario_id: usuario.id
        });
      }
      setEditingLote(null);
      setStatus("guardado"); setTimeout(()=>setStatus(""),1800);
      cargarTodo();
    } catch(e) { setStatus("error al guardar lote"); setTimeout(()=>setStatus(""),3000); }
    setSavingLote(false);
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
    try { await supabase.from("sectores").delete().eq("id", id); cargarTodo(); }
    catch(e) { setStatus("error al borrar subsector"); setTimeout(()=>setStatus(""),3000); }
  };

  if(!usuario) return <Login onLogin={handleLogin} />;
  if(!loaded)  return <div style={{background:"#0e160e",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'IBM Plex Mono',monospace",color:"#4a7a4a",fontSize:"14px"}}>Cargando...</div>;

  const tabsExtra = [
    {key:"_geneticas", label:"🧬 Genéticas", col:"#2980b9"},
    {key:"_cosechas",  label:"📦 Cosechas",  col:"#c8a020"}
  ];
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
                                <span style={{fontSize:"13px",color:g?.color||"#9aaa9a"}}>{g?.nombre||"Sin genética"}</span>
                                <span style={{fontSize:"13px",color:"#b0d090"}}>{l.cantidad_plantas} plantas</span>
                              </div>
                              <div style={{fontSize:"11px",color:"#4a6a4a",marginBottom:"6px"}}>Desde {l.fecha_inicio}</div>
                              {!esEjecutor && sigPadre && (
                                <button onClick={()=>{setMovingLote(l); setDestinoSub("");}} style={{width:"100%",padding:"7px",borderRadius:"7px",fontSize:"11px",background:"#1e3a1e",color:"#7ec850",border:"1px solid #2a5a2a"}}>→ Avanzar a {sigPadre.nombre}</button>
                              )}
                              {!sigPadre && <div style={{fontSize:"11px",color:"#c8a020",textAlign:"center"}}>Etapa final — registrar en 📦 Cosechas</div>}
                            </div>
                          );
                        })}
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

        {/* ══ GENÉTICAS ══ */}
        {tab==="_geneticas" && (
          <div className="fade">
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"22px",color:"#3a9ad4",marginBottom:"6px"}}>🧬 Genéticas y Fenotipos</div>
            <div style={{fontSize:"13px",color:"#5a8aaa",marginBottom:"18px"}}>{geneticas.length} ENTRADAS</div>
            <div style={{display:"flex",gap:"8px",marginBottom:"20px",flexWrap:"wrap"}}>
              {["all","indica","sativa","hibrido"].map(t=>(
                <button key={t} onClick={()=>setGFilter(t)} style={{padding:"8px 18px",borderRadius:"22px",fontSize:"13px",background:gFilter===t?(t==="all"?"#2a4a7a":TIPO_COLOR[t]):"#141e14",color:gFilter===t?"#fff":"#6a8aaa",border:`1px solid ${gFilter===t?(t==="all"?"#3a6aaa":TIPO_COLOR[t]):"#2a3a4a"}`,fontWeight:gFilter===t?"600":"400"}}>{t==="all"?"Todas":TIPO_LABEL[t]}</button>
              ))}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
              {geneticas.filter(g=>gFilter==="all"||g.tipo===gFilter).map(g=>(
                <div key={g.id} style={{background:"#162416",border:`1px solid ${g.color}55`,borderRadius:"14px",padding:"18px",borderLeft:`5px solid ${g.color}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"12px"}}>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"5px"}}>
                        <span style={{fontSize:"17px",fontWeight:"600",color:"#e0f0d0"}}>{g.nombre}</span>
                        {g.fenotipo && <span style={{fontSize:"10px",background:`${g.color}33`,color:g.color,padding:"2px 8px",borderRadius:"10px"}}>FENOTIPO</span>}
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
                  {g.efecto && <div style={{fontSize:"14px",color:"#c0a860",lineHeight:"1.6"}}>✨ {g.efecto}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ COSECHAS ══ */}
        {tab==="_cosechas" && (
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
                          {geneticas.map(g=><option key={g.id} value={g.id}>{g.nombre}</option>)}
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
                              <div style={{fontSize:"16px",fontWeight:"600",color:"#e0f0d0",marginBottom:"4px"}}>{g?.nombre||"—"}</div>
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

        {/* ══ MI SALA (admin de subsectores) ══ */}
        {tab==="_misala" && !esEjecutor && (
          <div className="fade">
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"22px",color:"#8e44ad",marginBottom:"6px"}}>⚙️ Mi Sala</div>
            <div style={{fontSize:"13px",color:"#8a6a9a",marginBottom:"20px"}}>ADMINISTRACIÓN DE SECTORES Y SUBSECTORES</div>

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

      {/* ══ MODAL: ALTA DE LOTE ══ */}
      {editingLote && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",zIndex:200}}>
          <div style={{background:"#182818",border:"1px solid #2a5a2a",borderRadius:"16px",padding:"22px",width:"100%",maxWidth:"380px"}}>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"19px",color:"#7ec850",marginBottom:"16px"}}>Nueva planta / lote</div>
            <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
              <div>
                <div style={{...lbl("#5a9a5a"),marginBottom:"6px"}}>GENÉTICA</div>
                <select value={editingLote.genetica_id} onChange={e=>setEditingLote({...editingLote,genetica_id:e.target.value})} style={inp()}>
                  <option value="">Seleccionar...</option>
                  {geneticas.map(g=><option key={g.id} value={g.id}>{g.nombre}</option>)}
                </select>
              </div>
              <div>
                <div style={{...lbl("#5a9a5a"),marginBottom:"6px"}}>CANTIDAD DE PLANTAS</div>
                <input type="number" min="1" value={editingLote.cantidad_plantas} onChange={e=>setEditingLote({...editingLote,cantidad_plantas:e.target.value})} style={inp()}/>
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
                <button disabled={savingLote || !editingLote.genetica_id || !editingLote.cantidad_plantas} onClick={saveLote} style={{flex:1,padding:"12px",borderRadius:"10px",fontSize:"14px",fontWeight:"600",background:savingLote?"#2a4a10":"#3a6a10",color:"#dff0cf",border:"1px solid #5a9a20"}}>{savingLote?"Guardando...":"✓ Crear lote"}</button>
                <button onClick={()=>setEditingLote(null)} style={{padding:"12px 18px",borderRadius:"10px",fontSize:"14px",background:"#1a1a1a",color:"#7a7a7a",border:"1px solid #2a2a2a"}}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

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
