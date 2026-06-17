import { useState, useEffect } from "react";

// ─── CLAVE PERMANENTE — NUNCA CAMBIAR ───────────────────────────────────────
const STORAGE_KEY = "raiz-cultivo-MASTER";
const SCHEMA_VERSION = 5;

// ─── MIGRACIÓN DE DATOS ─────────────────────────────────────────────────────
// Cuando agregamos campos nuevos, los datos viejos se adaptan aquí.
// Nunca se borran — solo se extienden.
const migrate = (raw) => {
  if (!raw) return null;
  let data = typeof raw === "string" ? JSON.parse(raw) : raw;

  // v1→v2: asegurar que existan los sectores de vege y enraizado
  if (!data.enraizado) data.enraizado = { currentWeek:1, notes:{} };
  if (!data.v150)      data.v150      = { currentWeek:1, notes:{} };
  if (!data.v2l)       data.v2l       = { currentWeek:1, notes:{} };
  if (!data.v5l)       data.v5l       = { currentWeek:1, notes:{} };

  // v2→v3: asegurar que las carpas tienen campo `plantas`
  ["flora1","flora2","flora3"].forEach(k => {
    if (!data[k]) data[k] = { currentWeek:1, plantas:{}, notes:{} };
    if (!data[k].plantas) data[k].plantas = {};
    if (!data[k].notes)   data[k].notes   = {};
  });

  // v3→v4: asegurar array de cosechas
  if (!data.cosechas) data.cosechas = [];

  // v4→v5: sin cambios estructurales — solo se sumó Banana Blaze a GENETICAS (dato de código, no de storage)

  // v5→vN: agregar campos futuros aquí sin tocar lo anterior

  data.__version = SCHEMA_VERSION;
  return data;
};

const buildDefault = () => ({
  __version: SCHEMA_VERSION,
  flora1:    { currentWeek:1, plantas:{}, notes:{} },
  flora2:    { currentWeek:1, plantas:{}, notes:{} },
  flora3:    { currentWeek:1, plantas:{}, notes:{} },
  enraizado: { currentWeek:1, notes:{} },
  v150:      { currentWeek:1, notes:{} },
  v2l:       { currentWeek:1, notes:{} },
  v5l:       { currentWeek:1, notes:{} },
  cosechas:  []
});

// ─── DATOS FIJOS ─────────────────────────────────────────────────────────────
const GENETICAS = [
  { id:"critical",   nombre:"Critical Kush",   tipo:"indica",  semanas:8,  sabor:"Terroso · Pino · Cítrico",         efecto:"Sedante · Corporal · Sueño",      color:"#9b59b6" },
  { id:"cream",      nombre:"Cream Caramel",   tipo:"indica",  semanas:8,  sabor:"Caramelo · Vainilla · Tierra",     efecto:"Relajante muscular · Antiestrés", color:"#e67e22" },
  { id:"mandarin",   nombre:"Mandarín Afgana", tipo:"indica",  semanas:9,  sabor:"Mandarina · Especias · Afgano",    efecto:"Narcótico · Dolor · Insomnio",    color:"#c0392b" },
  { id:"jack",       nombre:"Jack la Mota",   tipo:"sativa",  semanas:10, sabor:"Dulce · Cítrico · Pino",           efecto:"Eufórico · Creativo · Energía",   color:"#27ae60" },
  { id:"bateku1",    nombre:"Batekú #1",      tipo:"sativa",  semanas:9,  sabor:"Cítrico · Tropical",               efecto:"Euforia · Inspirador · Mental",   color:"#2ecc71", fenotipo:true },
  { id:"bateku2",    nombre:"Batekú #2",      tipo:"sativa",  semanas:9,  sabor:"Cítrico · Tropical",               efecto:"Euforia · Inspirador · Mental",   color:"#58d68d", fenotipo:true },
  { id:"satellite1", nombre:"Satellite #1",   tipo:"sativa",  semanas:9,  sabor:"Limón cremoso · Mentol · Tierra",  efecto:"Cerebral potente → relajación",   color:"#1abc9c", fenotipo:true },
  { id:"satellite2", nombre:"Satellite #2",   tipo:"sativa",  semanas:9,  sabor:"Limón cremoso · Mentol · Tierra",  efecto:"Cerebral potente → relajación",   color:"#48c9b0", fenotipo:true },
  { id:"purple",     nombre:"Purple",         tipo:"hibrido", semanas:8,  sabor:"Uvas · Frutos del bosque",         efecto:"Alegría cerebral + relajación",   color:"#8e44ad" },
  { id:"blueberry",  nombre:"Blue Berry",     tipo:"hibrido", semanas:8,  sabor:"Arándanos · Frutos rojos",         efecto:"Calmante · Eufórico suave",       color:"#2980b9" },
  { id:"skunk",      nombre:"Skunk #1",       tipo:"hibrido", semanas:8,  sabor:"Dulce · Terroso · Skunk",           efecto:"Cerebral + corporal moderado",              color:"#7f8c00" },
  { id:"banana",     nombre:"Banana Blaze",   tipo:"hibrido", semanas:8,  sabor:"Banana madura · Vainilla · Cítricos", efecto:"Euforia inicial → relajación corporal profunda", color:"#f1c40f", origen:"Dutch Passion · 80% Índica / 20% Sativa" }
];

const TIPO_LABEL  = { indica:"Índica 🟣", sativa:"Sativa 🟢", hibrido:"Híbrido ⚖️" };
const TIPO_COLOR  = { indica:"#9b59b6", sativa:"#27ae60", hibrido:"#2980b9" };
const CARPA_COLOR = { flora1:"#d4813a", flora2:"#c0392b", flora3:"#8e44ad" };
const CARPA_NAME  = { flora1:"Carpa 1", flora2:"Carpa 2", flora3:"Carpa 3" };

const FLORA_WEEKS = [
  { week:1, phase:"Stretch inicial",             anAB:"100%",    bloom:"—",                          silicio:true,    humus:true,  preventivo:"PhitonatPlus + Mamboreta (última oportunidad Oil85)", ph:"6.2–6.5", hr:"60–65%", tempMin:"19°C", alert:null },
  { week:2, phase:"Stretch / primeros pistilos", anAB:"100%",    bloom:"—",                          silicio:true,    humus:true,  preventivo:"PhitonatPlus (último)",                              ph:"6.2–6.5", hr:"60–65%", tempMin:"19°C", alert:"⚠️ Cortar Oil85 y Mamboreta al final de esta semana" },
  { week:3, phase:"Formación de cogollos",       anAB:"100%",    bloom:"Big Bud — dosis baja",       silicio:true,    humus:true,  preventivo:"Sin preventivos foliares",                           ph:"6.2–6.5", hr:"55–60%", tempMin:"19°C", alert:null },
  { week:4, phase:"Engorde activo",              anAB:"100%",    bloom:"Big Bud — dosis completa",   silicio:true,    humus:true,  preventivo:"Sin preventivos",                                    ph:"6.2–6.5", hr:"55–60%", tempMin:"19°C", alert:null },
  { week:5, phase:"Engorde máximo",              anAB:"100%",    bloom:"Big Bud — dosis completa",   silicio:"↓ 50%", humus:false, preventivo:"Azufre en polvo si hay presión fúngica",             ph:"6.2–6.5", hr:"50–55%", tempMin:"19°C", alert:"🔍 Iniciar monitoreo de tricomas con lupa" },
  { week:6, phase:"Pre-maduración",              anAB:"↓ 30%",   bloom:"Overdrive — inicio",         silicio:false,   humus:false, preventivo:"Sin preventivos",                                    ph:"6.2–6.5", hr:"45–50%", tempMin:"19°C", alert:"⚠️ Reducir AN A+B al 70% · Riesgo Botrytis — monitorear HR" },
  { week:7, phase:"Maduración",                  anAB:"↓ 30%",   bloom:"Overdrive — dosis completa", silicio:false,   humus:false, preventivo:"Sin preventivos",                                    ph:"6.2–6.5", hr:"40–45%", tempMin:"19°C", alert:"🌕 Consultar calendario lunar — luna menguante para corte" },
  { week:8, phase:"FLUSH",                       anAB:"❌ STOP", bloom:"❌ STOP",                    silicio:false,   humus:false, preventivo:"Solo agua declorada",                                ph:"6.2–6.5", hr:"40–45%", tempMin:"18°C", alert:"💧 Mínimo 10 días · Tricomas mayoría ámbar = corte" }
];

const VEGE_NUT = {
  v150:[
    {w:1,f:"Sin nutrición — solo agua",          si:false,hu:false,n:"Dejar que el suelo aporte"},
    {w:2,f:"Feeding Grow 25%",                   si:true, hu:false,n:""},
    {w:3,f:"Feeding Grow 50%",                   si:true, hu:true, n:"Primera aplicación de humus"},
    {w:4,f:"Feeding Grow 75%",                   si:true, hu:true, n:""},
    {w:5,f:"Feeding Grow 100%",                  si:true, hu:true, n:"Evaluar trasplante a 2L"},
    {w:6,f:"Feeding Grow 100%",                  si:true, hu:true, n:"Trasplantar si raíz toca el fondo"}
  ],
  v2l:[
    {w:1,f:"Feeding Grow 50% — post trasplante", si:true, hu:false,n:"Regar suave, no encharcar"},
    {w:2,f:"Feeding Grow 100%",                  si:true, hu:true, n:""},
    {w:3,f:"Feeding Grow 100% + PhitonatPlus",   si:true, hu:true, n:"Topping + LST — inicio formación arbusto"},
    {w:4,f:"Feeding Grow 100% + PhitonatPlus",   si:true, hu:true, n:"LST continuo"},
    {w:5,f:"Feeding Grow 100%",                  si:true, hu:true, n:"Evaluar canopy"},
    {w:6,f:"Feeding Grow 100%",                  si:true, hu:true, n:"Trasplantar a 5L cuando raíz toca fondo"}
  ],
  v5l:[
    {w:1,f:"Feeding Grow 75% — post trasplante", si:true, hu:true, n:"Adaptación a maceta final"},
    {w:2,f:"Feeding Grow 100%",                  si:true, hu:true, n:"Consolidar arbusto"},
    {w:3,f:"Feeding Grow 100% + PhitonatPlus",   si:true, hu:true, n:""},
    {w:4,f:"Feeding Grow 100%",                  si:true, hu:true, n:"Evaluar pase a flora"},
    {w:5,f:"Feeding Grow 100%",                  si:true, hu:true, n:"Lista para 12/12 cuando canopy esté uniforme"}
  ]
};

const emptyCosecha = () => ({ id:Date.now(), carpa:"flora1", geneticaId:"critical", plantas:0, fechaCorte:"", diasSecado:"", gramos:"", notas:"" });

// ─── ESTILOS BASE ─────────────────────────────────────────────────────────────
const card = (x={}) => ({ background:"#182818", border:"1px solid #2a4a2a", borderRadius:"14px", padding:"18px", marginBottom:"16px", ...x });
const lbl  = (c="#5aaa5a") => ({ fontSize:"11px", color:c, letterSpacing:"2.5px", display:"block", marginBottom:"8px", fontWeight:"600" });
const body = { fontSize:"15px", color:"#dff0cf", lineHeight:"1.75" };
const inp  = (x={}) => ({ background:"#111e11", border:"1px solid #2a4a2a", borderRadius:"8px", color:"#dff0cf", fontSize:"14px", padding:"8px 12px", width:"100%", fontFamily:"'IBM Plex Mono',monospace", outline:"none", ...x });

export default function App() {
  const [tab,    setTab]    = useState("flora1");
  const [vStage, setVStage] = useState("v150");
  const [db,     setDb]     = useState(buildDefault);
  const [status, setStatus] = useState("");
  const [gFilter,setGFilter]= useState("all");
  const [newC,   setNewC]   = useState(null);
  const [loaded, setLoaded] = useState(false);

  // ── Cargar y migrar al iniciar ──
  useEffect(()=>{
    (async()=>{
      try{
        if(typeof window === "undefined" || typeof window.storage === "undefined"){
          console.warn("window.storage no disponible");
          setLoaded(true); return;
        }
        const r = await window.storage.get(STORAGE_KEY);
        if(r?.value){
          const migrated = migrate(r.value);
          if(migrated) setDb(migrated);
        }
      } catch(e){
        const msg = String(e);
        if(!msg.includes("not found") && !msg.includes("does not exist") && !msg.includes("Key"))
          console.warn("Storage load error:", e);
      }
      setLoaded(true);
    })();
  },[]);

  // ── Persistir ──
  const persist = async d => {
    try{
      if(typeof window === "undefined" || typeof window.storage === "undefined"){
        setStatus("sin_storage"); setTimeout(()=>setStatus(""),3000); return;
      }
      const payload = JSON.stringify(d);
      const r = await window.storage.set(STORAGE_KEY, payload);
      if(r !== null && r !== undefined){
        setStatus("guardado"); setTimeout(()=>setStatus(""),1800);
      } else {
        setStatus("error"); setTimeout(()=>setStatus(""),3000);
      }
    } catch(e){
      console.error("Storage write:", e);
      const msg = String(e).slice(0,50);
      setStatus("err:" + msg); setTimeout(()=>setStatus(""),5000);
    }
  };
  const upd = d => { setDb(d); persist(d); };

  const setWeek  = (k,w)   => upd({...db,[k]:{...db[k],currentWeek:w}});
  const setNote  = (k,w,t) => upd({...db,[k]:{...db[k],notes:{...db[k].notes,[w]:t}}});
  const setPlant = (c,g,q) => {
    const p={...db[c].plantas}; if(q<=0) delete p[g]; else p[g]=q;
    upd({...db,[c]:{...db[c],plantas:p}});
  };
  const totalP   = c => Object.values(db[c]?.plantas||{}).reduce((a,b)=>a+b,0);
  const saveCosecha = c => {
    const list=[...(db.cosechas||[])];
    const idx=list.findIndex(x=>x.id===c.id);
    if(idx>=0) list[idx]={...c}; else list.unshift({...c});
    upd({...db,cosechas:list}); setNewC(null);
  };
  const delCosecha = id => upd({...db,cosechas:(db.cosechas||[]).filter(x=>x.id!==id)});

  const isFlora = tab.startsWith("flora");
  const fd      = isFlora ? db[tab] : null;
  const curFW   = fd?.currentWeek||1;
  const curVW   = db[vStage]?.currentWeek||1;
  const curEW   = db.enraizado?.currentWeek||1;

  const TABS = [
    {key:"enraizado",label:"✂️ Enraizado",col:"#27ae60"},
    {key:"vege",     label:"🌿 Vege",     col:"#2ecc71"},
    {key:"flora1",   label:"🌸 Carpa 1",  col:"#d4813a"},
    {key:"flora2",   label:"🌸 Carpa 2",  col:"#c0392b"},
    {key:"flora3",   label:"🌸 Carpa 3",  col:"#8e44ad"},
    {key:"geneticas",label:"🧬 Genéticas",col:"#2980b9"},
    {key:"cosechas", label:"📦 Cosechas", col:"#c8a020"}
  ];

  if(!loaded) return(
    <div style={{background:"#0e160e",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'IBM Plex Mono',monospace",color:"#4a7a4a",fontSize:"14px"}}>
      Cargando datos...
    </div>
  );

  return (
    <div style={{fontFamily:"'IBM Plex Mono',monospace",background:"#0e160e",minHeight:"100vh",color:"#dff0cf"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=DM+Serif+Display:ital@0;1&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        button{cursor:pointer;transition:all .15s ease;font-family:'IBM Plex Mono',monospace;}
        button:hover{filter:brightness(1.18);}
        textarea,input,select{outline:none;font-family:'IBM Plex Mono',monospace;}
        textarea:focus,input:focus,select:focus{border-color:#4aaa4a!important;}
        .fade{animation:fi .22s ease;}
        @keyframes fi{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:#2a4a2a;border-radius:2px}
      `}</style>

      {/* HEADER */}
      <div style={{background:"#111e11",borderBottom:"2px solid #2a4a2a",padding:"18px 20px 14px",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"14px"}}>
          <div>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"22px",color:"#7ec850"}}>🌱 RAÍZ — Cuaderno de Cultivo</div>
            <div style={{fontSize:"11px",color:"#4a8a4a",letterSpacing:"2px",marginTop:"4px"}}>12 GENÉTICAS / FENOTIPOS · SISTEMA ESCALONADO</div>
          </div>
          <div style={{textAlign:"right",maxWidth:"200px"}}>
            {status==="guardado"&&<div style={{fontSize:"12px",color:"#7ec850",background:"#1a3a1a",padding:"5px 14px",borderRadius:"20px",border:"1px solid #3a6a3a"}}>✓ guardado</div>}
            {status&&status!=="guardado"&&<div style={{fontSize:"11px",color:"#e74c3c",background:"#2a1010",padding:"5px 10px",borderRadius:"10px",border:"1px solid #6a2020",wordBreak:"break-all",lineHeight:"1.4"}}>⚠ {status}</div>}
          </div>
        </div>
        <div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>
          {TABS.map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)} style={{
              padding:"8px 15px",borderRadius:"22px",fontSize:"12px",
              background:tab===t.key?t.col:"#192919",
              color:tab===t.key?"#fff":"#7aaa7a",
              border:`1px solid ${tab===t.key?t.col:"#2e4e2e"}`,
              fontWeight:tab===t.key?"600":"400"
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{padding:"20px 20px 48px"}}>

        {/* ══ FLORA ══════════════════════════════════════════════════════════ */}
        {isFlora&&(
          <div className="fade">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"18px"}}>
              <div>
                <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"22px",color:CARPA_COLOR[tab]}}>{CARPA_NAME[tab]}</div>
                <div style={{fontSize:"12px",color:"#6a8a6a",marginTop:"4px"}}>SOG · suelo vivo · 12/12</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:"12px",color:"#5a8a5a"}}>semana actual</div>
                <div style={{fontSize:"42px",fontWeight:"700",color:CARPA_COLOR[tab],lineHeight:1}}>S{curFW}</div>
              </div>
            </div>

            {/* Plantas */}
            <div style={card()}>
              <span style={lbl()}>PLANTAS EN ESTA CARPA</span>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
                <span style={{fontSize:"14px",color:"#b0d090"}}>Total registradas</span>
                <span style={{fontSize:"26px",fontWeight:"700",color:totalP(tab)===0?"#4a6a4a":totalP(tab)>20?"#e74c3c":CARPA_COLOR[tab]}}>{totalP(tab)}</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:"9px"}}>
                {GENETICAS.map(g=>{
                  const qty=fd?.plantas?.[g.id]||0;
                  return(
                    <div key={g.id} style={{display:"flex",alignItems:"center",gap:"12px",background:qty>0?"#1e321e":"#141e14",border:`1px solid ${qty>0?g.color+"66":"#1e3a1e"}`,borderRadius:"10px",padding:"10px 14px"}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:"14px",color:qty>0?"#e0f0d0":"#7a9a7a",fontWeight:qty>0?"500":"400"}}>
                          {g.nombre}{g.fenotipo&&<span style={{fontSize:"10px",color:g.color,marginLeft:"6px",letterSpacing:"1px"}}>FENOTIPO</span>}
                        </div>
                        <div style={{fontSize:"11px",color:TIPO_COLOR[g.tipo],marginTop:"2px"}}>{TIPO_LABEL[g.tipo]}</div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                        <button onClick={()=>setPlant(tab,g.id,qty-1)} style={{width:"34px",height:"34px",borderRadius:"8px",fontSize:"18px",fontWeight:"700",background:"#1a2e1a",color:qty>0?"#e0f0d0":"#3a5a3a",border:`1px solid ${qty>0?"#3a6a3a":"#1a3a1a"}`}}>−</button>
                        <span style={{fontSize:"20px",fontWeight:"700",minWidth:"28px",textAlign:"center",color:qty>0?g.color:"#3a5a3a"}}>{qty}</span>
                        <button onClick={()=>setPlant(tab,g.id,qty+1)} style={{width:"34px",height:"34px",borderRadius:"8px",fontSize:"18px",fontWeight:"700",background:"#1a2e1a",color:"#7ec850",border:"1px solid #2a5a2a"}}>+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {totalP(tab)>0&&(
                <div style={{marginTop:"14px",padding:"14px",background:"#111a11",borderRadius:"10px",border:"1px solid #2a4a2a"}}>
                  <div style={lbl()}>MIX ACTUAL</div>
                  {Object.entries(fd?.plantas||{}).filter(([,q])=>q>0).map(([gid,qty])=>{
                    const g=GENETICAS.find(x=>x.id===gid); if(!g) return null;
                    const pct=Math.round((qty/totalP(tab))*100);
                    return(
                      <div key={gid} style={{marginBottom:"10px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
                          <span style={{fontSize:"13px",color:"#b0d090"}}>{g.nombre}</span>
                          <span style={{fontSize:"13px",color:g.color,fontWeight:"600"}}>{qty} plantas ({pct}%)</span>
                        </div>
                        <div style={{height:"6px",background:"#1a2e1a",borderRadius:"3px",overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${pct}%`,background:g.color,borderRadius:"3px",transition:"width .3s"}}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Semana */}
            <div style={card()}>
              <span style={lbl()}>SEMANA DE FLORA</span>
              <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
                {[1,2,3,4,5,6,7,8].map(w=>(
                  <button key={w} onClick={()=>setWeek(tab,w)} style={{
   
