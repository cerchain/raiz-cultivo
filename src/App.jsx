import { useState, useEffect, Component, useRef } from "react";
import { supabase } from './supabaseClient';
import Login from './Login';
import Signup from './Signup';
import Invitacion from './Invitacion';

const card = (x={}) => ({ background:"var(--c073)", border:"1px solid var(--c025)", borderRadius:"14px", padding:"18px", marginBottom:"16px", ...x });
const lbl  = (c="var(--c145)") => ({ fontSize:"11px", color:c, letterSpacing:"2.5px", display:"block", marginBottom:"8px", fontWeight:"600" });
const inp  = (x={}) => ({ background:"var(--c055)", border:"1px solid var(--c025)", borderRadius:"8px", color:"var(--c019)", fontSize:"14px", padding:"8px 12px", width:"100%", fontFamily:"'IBM Plex Mono',monospace", outline:"none", ...x });

const TIPO_LABEL = { indica:"Índica 🟣", sativa:"Sativa 🟢", hibrido:"Híbrido ⚖️" };
const TIPO_COLOR = { indica:"var(--c056)", sativa:"var(--c146)", hibrido:"var(--c100)" };

// Paleta atada al ciclo de la planta, no a colores sueltos por feature
// ═══════════════════════════════════════════════════════════════
// SISTEMA DE TEMAS
// Cada color es un token con dos valores: [ oscuro, claro ].
// El OSCURO es exactamente el de siempre (cero regresión).
// El CLARO se genera con tres reglas, verificadas, no a ojo:
//   · SUPERFICIES -> siempre se aclaran (nunca se preserva un fondo oscuro).
//   · TEXTOS      -> se oscurecen hasta cumplir contraste WCAG AA con margen.
//   · BOTONES con texto blanco -> únicos que conservan color saturado, con
//     contraste >=4.5:1 contra el blanco, para que la etiqueta siga legible.
// Cambiar de tema reescribe las CSS vars: no re-renderiza nada.
// ═══════════════════════════════════════════════════════════════
const PALETA = {
  c001:["#7ec850","#3e6f20"],
  c002:["#2a2a2a","#d9d9d9"],
  c003:["#c8a020","#755d10"],
  c004:["#1a1a1a","#f0f0f0"],
  c005:["#fff","#fff"],
  c006:["#2a2a5a","#cbcbd8"],
  c007:["#7a7a7a","#616161"],
  c008:["#2a1010","#f1ecec"],
  c009:["#4a2020","#dccfcf"],
  c010:["#c0392b","#c0392b"],
  c011:["#2a5a2a","#cbd8cb"],
  c012:["#aa5050","#693030"],
  c013:["#0a0e1a","#f0f1f4"],
  c014:["#dfe0f0","#2f336a"],
  c015:["#7a8af0","#0f208a"],
  c016:["#16a085","#0c6e5b"],
  c017:["#12162a","#ecedf0"],
  c018:["#5a6a9a","#374262"],
  c019:["#dff0cf","#41671e"],
  c020:["#1a2e1a","#ebeeeb"],
  c021:["#5aa090","#366359"],
  c022:["#8a7a40","#6a5d2f"],
  c023:["#5a8aaa","#335266"],
  c024:["#5a7a5a","#405940"],
  c025:["#2a4a2a","#cfd9cf"],
  c026:["#3a3a7a","#c3c3d2"],
  c027:["#5a8a5a","#3c5d3c"],
  c028:["#0e6a5a","#117e6b"],
  c029:["#e07070","#801919"],
  c030:["#1abc9c","#0d6e5b"],
  c031:["#3a2a4a","#d4cfd9"],
  c032:["#d08070","#753124"],
  c033:["#5a9a8a","#376257"],
  c034:["#3a9ad4","#195980"],
  c035:["#5a9a5a","#cfd6cf"],
  c036:["#3a8a5a","#2c6d46"],
  c037:["#5a8a7a","#3c5d52"],
  c038:["#7a7aba","#333366"],
  c039:["#c89090","#683131"],
  c040:["#7a5a9a","#4c3762"],
  c041:["#3a6a10","#e5ebdf"],
  c042:["#5a9a20","#c9d8bc"],
  c043:["#4a5a7a","#394660"],
  c044:["#102a18","#ecf1ee"],
  c045:["#205a2a","#cbdcce"],
  c046:["#1e0e0e","#f2efef"],
  c047:["#6a2020","#dbc7c7"],
  c048:["#c0a0a0","#5d3c3c"],
  c049:["#7a2020","#7a2020"],
  c050:["#aa3030","#d2b8b8"],
  c051:["#3a5a3a","#3b5e3b"],
  c052:["#a77dc2","#532f6a"],
  c053:["#1a3a2a","#d3dfd9"],
  c054:["#8a6a9a","#523d5c"],
  c055:["#111e11","#eff2ef"],
  c056:["#9b59b6","#5a2d6c"],
  c057:["#5a7a9a","#374c62"],
  c058:["#e0b850","#7c5f13"],
  c059:["#5a7a7a","#405959"],
  c060:["#dff0e8","#2f6a4e"],
  c061:["#5a5a9a","#373762"],
  c062:["#4a4ad0","#3232c2"],
  c063:["#0a0e1e","#eff0f3"],
  c064:["#3a8ad0","#1b507e"],
  c065:["#5a9ad0","#205079"],
  c066:["#7ab070","#3d6435"],
  c067:["#4a3a6a","#453564"],
  c068:["#5a9a90","#37625b"],
  c069:["#5aa098","#36635e"],
  c070:["#1a5a7a","#c3d3dc"],
  c071:["#6a3a8a","#cabfd1"],
  c072:["#c090e0","#561f7a"],
  c073:["#182818","#ecefec"],
  c074:["#0e160e","#f1f3f1"],
  c075:["#7a9a7a","#425742"],
  c076:["#0e1a18","#f0f3f2"],
  c077:["#6a9a8a","#3d5c52"],
  c078:["#2a2a10","#f1f1ec"],
  c079:["#4a4a20","#dcdccf"],
  c080:["#e74c3c","#8a1b0f"],
  c081:["#5a2020","#dccbcb"],
  c082:["#7a9af0","#b3bbcf"],
  c083:["#e05050","#851414"],
  c084:["#0e8a6a","#0d8264"],
  c085:["#8a8ad0","#bcbccb"],
  c086:["#d0a840","#755c1a"],
  c087:["#9aaa9a","#c5c8c5"],
  c088:["#7aa080","#3f5a43"],
  c089:["#0a2420","#eef3f2"],
  c090:["#0a1a14","#f0f4f2"],
  c091:["#cce0d0","#396041"],
  c092:["#1a3a5a","#cbd4de"],
  c093:["#9ab","#3c4c5d"],
  c094:["#2a2410","#f1f0ec"],
  c095:["#0e8a7a","#c1dcd9"],
  c096:["#6a7a30","#5a6827"],
  c097:["#a86ad0","#562376"],
  c098:["#8a70a0","#cfccd1"],
  c099:["#c8b070","#d0ccc1"],
  c100:["#2980b9","#ced7dd"],
  c101:["#0e2a1a","#edf1ef"],
  c102:["#10142a","#ecedf1"],
  c103:["#1a1a3a","#e8e8ed"],
  c104:["#e8e8f8","#222277"],
  c105:["#1a1a2e","#ebebee"],
  c106:["#6a8a6a","#425742"],
  c107:["#0e0e16","#f1f1f3"],
  c108:["#14142a","#ececf0"],
  c109:["#2a3a5a","#cbd0d8"],
  c110:["#0e0e22","#eeeef2"],
  c111:["#2a2010","#f1efec"],
  c112:["#8e44ad","#5b2a6f"],
  c113:["#3a5a2a","#436a2f"],
  c114:["#3a3010","#efeee9"],
  c115:["#3a1010","#efe9e9"],
  c116:["#1a1024","#f0eef1"],
  c117:["#5a3a7a","#cbc3d2"],
  c118:["#5a5a5a","#636363"],
  c119:["#5a4a20","#dcd7cb"],
  c120:["#7a9ad0","#264373"],
  c121:["#1e1a10","#f2f1ef"],
  c122:["#0a1814","#f1f4f3"],
  c123:["#141e14","#eff1ef"],
  c124:["#2a3a4a","#e4e6e8"],
  c125:["#5a4a7a","#463960"],
  c126:["#2a1a4a","#d4cfde"],
  c127:["#0e1a24","#eef0f2"],
  c128:["#1a0a2a","#f0edf2"],
  c129:["#0e1e2e","#eceef1"],
  c130:["#8aaac0","#345165"],
  c131:["#e0f0d0","#476e21"],
  c132:["#3a2a1a","#edebe8"],
  c133:["#4a6a4a","#3e5b3e"],
  c134:["#2a4a10","#e9eee6"],
  c135:["#8aaa20","#dde1d1"],
  c136:["#7a9a6a","#475c3d"],
  c137:["#8a5a4a","#654034"],
  c138:["#7a4040","#663333"],
  c139:["#0a1e1a","#eff3f3"],
  c140:["#3ac0a0","#1f705c"],
  c141:["#1a0e22","#f1eef2"],
  c142:["#a888c8","#c5bfcb"],
  c143:["#2a1a3a","#ebe8ed"],
  c144:["#e0c060","#715a13"],
  c145:["#5aaa5a","#ccd5cc"],
  c146:["#27ae60","#d0dfd6"],
  c147:["#7aaa9a","#3b5e52"],
  c148:["#a0c0b0","#3c5d4d"],
  c149:["#1a5a3a","#cbded4"],
  c150:["#4a8a7a","#346559"],
  c151:["#1a3a32","#d3dfdc"],
  c152:["#5a7a6a","#40594c"],
  c153:["#c0d8cc","#3a5f4d"],
  c154:["#4a7a4a","#396039"],
  c155:["#0e1226","#edeef2"],
  c156:["#0e1020","#efeff2"],
  c157:["#4a5372","#3b435e"],
  c158:["#23264a","#cfd0db"],
  c159:["#8ab88a","#396039"],
  c160:["#2a1608","#f3efed"],
  c161:["#5a4020","#dcd4cb"],
  c162:["#d0a860","#785921"],
  c163:["#e0e0f0","#313168"],
  c164:["#6a7aaa","#374262"],
  c165:["#0e1a10","#f0f3f1"],
  c166:["#4a4a7a","#393960"],
  c167:["#161630","#ebebef"],
  c168:["#0e1420","#eff0f2"],
  c169:["#dfe0f8","#191d80"],
  c170:["#12122a","#ececf0"],
  c171:["#4a3a20","#dcd7cf"],
  c172:["#c8c8e8","#2c2c6d"],
  c173:["#4aaa4a","#ced8ce"],
  c174:["#4a8a4a","#346534"],
  c175:["#1a3a1a","#e8ede8"],
  c176:["#3a6a3a","#c7d3c7"],
  c177:["#e8c43a99","#cdc5a799"],
  c178:["#241f10","#f1f0ee"],
  c179:["#e8c43a","#77610d"],
  c180:["#3a2f10","#efeee9"],
  c181:["#c8a0e0","#572475"],
  c182:["#b0d090","#476629"],
  c183:["#3d5a3d","#3d5c3d"],
  c184:["#2a2510","#f1f0ec"],
  c185:["#1a2030","#ebebee"],
  c186:["#1a2418","#eeefed"],
  c187:["#2a4a30","#cfd9d1"],
  c188:["#5a4a2044","#dcd7cb44"],
  c189:["#c0a868","#6e5c2b"],
  c190:["#3a2a10","#efede9"],
  c191:["#6a5020","#dbd4c7"],
  c192:["#162816","#edf0ed"],
  c193:["#0e241e","#eef2f1"],
  c194:["#16a08533","#bbd9d333"],
  c195:["#dfe8e0","#3f5a42"],
  c196:["#0e5a3a","#e3ede9"],
  c197:["#3a6a5a","#356454"],
  c198:["#7a6a9a","#473d5c"],
  c199:["#d8c8f0","#b3a9c2"],
  c200:["#e08080","#ceb8b8"],
  c201:["#5a9a7a","#37624d"],
  c202:["#3a2a5a","#d0cbd8"],
  c203:["#6a3a9a","#d8d2dd"],
  c204:["#cce0f0","#215178"],
  c205:["#4a6a8a","#344c65"],
  c206:["#0e2a3a","#e9edf0"],
  c207:["#0a1620","#eff1f3"],
  c208:["#1a2a3a","#e8ebed"],
  c209:["#8ab0d0","#2a4f6f"],
  c210:["#3a5a7a","#304c69"],
  c211:["#6a8aa0","#3b505e"],
  c212:["#0a1e1c","#eff3f3"],
  c213:["#2a5a4a","#cbd8d4"],
  c214:["#0e4a42","#e6eeed"],
  c215:["#0a201c","#eff3f2"],
  c216:["#3a6a62","#35645c"],
  c217:["#1abc9c33","#b5d6cf33"],
  c218:["#0e2422","#eef2f1"],
  c219:["#a0c0b8","#3c5d55"],
  c220:["#0e1e28","#edf0f2"],
  c221:["#0e3a5a","#e3e9ed"],
  c222:["#1a6a9a","#d5dee4"],
  c223:["#2a8aca","#b1c4d1"],
  c224:["#0e2030","#ebeef1"],
  c225:["#2a4a7a","#dadee3"],
  c226:["#6a8aaa","#caced2"],
  c227:["#3a6aaa","#cfd4db"],
  c228:["#3a3a1a","#edede8"],
  c229:["#141414","#f1f1f1"],
  c230:["#d0c060","#d2d0c1"],
  c231:["#8a8a6a","#d4d4d1"],
  c232:["#6a6a2a","#e5e5dd"],
  c233:["#162416","#edf0ed"],
  c234:["#0e180e","#f1f3f1"],
  c235:["#90b870","#496831"],
  c236:["#c0a860","#6f5e2a"],
  c237:["#8a7a30","#6c5f23"],
  c238:["#5a4a10","#e1dcca"],
  c239:["#1a1808","#f4f4f0"],
  c240:["#141e08","#f2f4ef"],
  c241:["#3a4a10","#dde2ce"],
  c242:["#2ecc71","#166e3c"],
  c243:["#141e10","#f0f2ef"],
  c244:["#1a2a10","#eef1ec"],
  c245:["#8aaa7a","#475e3b"],
  c246:["#aa6a5a","#663d33"],
  c247:["#5a3a2a","#6a432f"],
  c248:["#4a2a20","#dcd2cf"],
  c249:["#1a1212","#f2f0f0"],
  c250:["#4a2a2a","#d9cfcf"],
  c251:["#e0c0c0","#683131"],
  c252:["#9a6a6a","#5c3d3d"],
  c253:["#2a1414","#f0ecec"],
  c254:["#5a3030","#d6cbcb"],
  c255:["#8a5a5a","#5d3c3c"],
  c256:["#6a4a4a","#5b3e3e"],
  c257:["#0e5a4a","#cae1dd"],
  c258:["#08150f","#f1f5f3"],
  c259:["#4a7a6a","#396053"],
  c260:["#cff0e4","#a9c0b8"],
  c261:["#7a9a8a","#ccd0ce"],
  c262:["#0e2a20","#edf1f0"],
  c263:["#1a7a5a","#dbe7e3"],
  c264:["#08131a","#f0f3f4"],
  c265:["#4a6a7a","#395360"],
  c266:["#cfe4f0","#225877"],
  c267:["#0a1a24","#eef1f3"],
  c268:["#0e2838","#eaeef0"],
  c269:["#7a3aaa","#7b33b1"],
  c270:["#9a5aca","#bcabc8"],
  c271:["#140a1a","#f2f0f4"],
  c272:["#dcc8ec","#512574"],
  c273:["#8a6aaa","#4c3762"],
  c274:["#1a4a3a","#e5ece9"],
  c275:["#3a9a7a","#d2ddd9"],
  c276:["#9a7aba","#c9c4ce"],
  c277:["#2a7a5a","#dae3e0"],
  c278:["#8a6a1a","#dbd3bf"],
  c279:["#1e1808","#f4f3ef"],
  c280:["#140f04","#f6f5f2"],
  c281:["#e0d0a0","#756124"],
  c282:["#a08a50","#675932"],
  c283:["#7a6a40","#665833"],
  c284:["#1a3a10","#ebefe9"],
  c285:["#2a5a20","#cedccb"],
  c286:["#120c1a","#f1f0f3"],
  c287:["#140e1c","#f1f0f2"],
  c288:["#1a1428","#eeedf0"],
  c289:["#a070c0","#cbc4d0"],
  c290:["#c0a8d0","#513564"],
  c291:["#8a5aaa","#c0b6c7"],
  c292:["#aa7a40","#715028"],
  c293:["#5a7a8a","#3c525d"],
  c294:["#8a7a4a","#655934"],
  c295:["#1a1408","#f4f3f0"],
  c296:["#e07060","#832416"],
  c297:["#1a0808","#f4f0f0"],
  c298:["#0a1a1e","#eff3f3"],
  c299:["#8aaa9a","#40594d"],
  c300:["#bcd","#324c67"],
  c301:["#e8834a","#d5c6be"],
  c302:["#8a6a4a","#654d34"],
  c303:["#1e1610","#f2f0ef"],
  c304:["#4a3a2a","#d9d4cf"],
  c305:["#c0a080","#cdc7c2"],
  c306:["#b09070","#644c35"],
  c307:["#8a7a6a","#574c42"],
  c308:["#e8a860","#895010"],
  c309:["#6a4a2a","#d8cfc7"],
  c310:["#1e1414","#f1efef"],
  c311:["#aa8080","#5c3d3d"],
  c312:["#4a1a1a","#ece5e5"],
  c313:["#b09850","#6b5c2e"],
  c314:["#6a5510","#ebe8df"],
  c315:["#fff8e0","#775f0d"],
  c316:["#8a7020","#d9d2bf"],
  c317:["#0e4a3a","#e6eeec"],
  c318:["#8aaa8a","#405940"],
  c319:["#152015","#eef0ee"],
  c320:["#3a4a3a","#e3e5e3"],
  c321:["#1f2f1f","#d7ddd7"],
  c322:["#101c10","#f0f2f0"],
};

const CSS_TEMAS =
  ":root{" + Object.entries(PALETA).map(([k,v]) => "--" + k + ":" + v[0]).join(";") + "}" +
  "html[data-theme='claro']{" + Object.entries(PALETA).map(([k,v]) => "--" + k + ":" + v[1]).join(";") + "}" +
  "html[data-theme='claro']{color-scheme:light}html[data-theme='oscuro']{color-scheme:dark}";

// Los colores de fase NO pueden ser var(): se les concatena alfa ("...55"),
// y var(--x)55 es CSS inválido. Van en JS, leyendo el tema activo.
let TEMA_ACTIVO = "oscuro";
const FASE_COLORES_CLARO = ["#2f7d4f","#2f7d4f","#6b3f8f","#7e6514","#7e6514","#7e6514"];

const resolverTema = (pref) => {
  if (pref === "sistema") {
    return (typeof window !== "undefined" && window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: light)").matches) ? "claro" : "oscuro";
  }
  return pref === "claro" ? "claro" : "oscuro";
};

const FASE_COLORES = ["#3ea66e","#3ea66e","#a77dc2","#c8a020","#c8a020","#c8a020"]; // brote, brote, flor, curado...
const FASE_ICONOS = ["🌱","🪴","🌸","🟫","🟫","🟫"];
const colorDeFase = (orden) => {
  const arr = TEMA_ACTIVO === "claro" ? FASE_COLORES_CLARO : FASE_COLORES;
  return arr[(orden-1+arr.length) % arr.length];
};
const iconoDeFase = (orden) => FASE_ICONOS[(orden-1+FASE_ICONOS.length) % FASE_ICONOS.length];

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
const TAREA_PRIORIDAD_COLOR = { alta:"var(--c010)", media:"var(--c003)", baja:"var(--c036)" };
const TAREA_ESTADO_LABEL = { pendiente:"Pendiente", en_progreso:"En progreso", completada:"Completada", atrasada:"Atrasada" };
const TAREA_ESTADO_COLOR = { pendiente:"var(--c057)", en_progreso:"var(--c003)", completada:"var(--c036)", atrasada:"var(--c010)" };

const emptyTarea = (sectorId) => ({
  titulo:"", tipo_id:"", sector_id: sectorId||"", lote_id:"", descripcion:"",
  fecha_programada: new Date().toISOString().slice(0,10), prioridad:"media", asignado_a:""
});

const emptyLote = (sectorId) => ({
  sector_actual_id: sectorId || "", genetica_id: "", cantidad_plantas: "",
  fecha_inicio: new Date().toISOString().slice(0,10), estado: "activo", notas: ""
});

const emptySubsector = (sectorPadreId) => ({
  sector_padre_id: sectorPadreId || "", nombre: "", capacidad_unidades: "", tipo: ""
});

const emptyGenetica = () => ({
  nombre: "", tipo: "hibrido", fenotipo: false, color: "var(--c001)",
  semanas_floracion: "", dias_floracion_min: "", dias_floracion_max: "", banco: "", sabor: "", efecto: "", activa: true
});

const emptyUsuario = () => ({ nombre:"", email:"", rol:"ejecutor", salaNombre:"" });

// Etiqueta consistente para mostrar el número de lote: "Lote N° 001"
const loteLabel = (n, sufijo="") => `Lote N° ${String(n).padStart(3,"0")}${sufijo}`;

class ErrorBoundary extends Component {
  constructor(props){ super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error){ return { error }; }
  render(){
    if(this.state.error){
      return (
        <div style={{background:"var(--c074)",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"16px",padding:"30px",fontFamily:"'IBM Plex Mono',monospace",color:"var(--c019)",textAlign:"center"}}>
          <div style={{fontSize:"40px"}}>🌱💥</div>
          <div style={{fontSize:"16px",color:"var(--c058)"}}>Algo se rompió en pantalla</div>
          <div style={{fontSize:"12px",color:"var(--c075)",maxWidth:"320px"}}>Tus datos en Supabase no se tocaron — esto es solo un error de la interfaz. Recargá la página.</div>
          <button onClick={()=>window.location.reload()} style={{padding:"12px 24px",borderRadius:"10px",fontSize:"14px",fontWeight:"600",background:"var(--c041)",color:"var(--c019)",border:"1px solid var(--c042)"}}>↺ Recargar</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function RaizApp() {
  const [usuario, setUsuario]   = useState(null);
  const [modoAuth, setModoAuth] = useState("login"); // 'login' | 'signup'
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
  const [tiposTarea, setTiposTarea]       = useState([]);
  const [editingTipoTarea, setEditingTipoTarea] = useState(null);
  const [savingTipoTarea, setSavingTipoTarea]   = useState(false);
  const [comentariosTareas, setComentariosTareas] = useState([]);
  const [editingTarea, setEditingTarea]   = useState(null);
  const [savingTarea, setSavingTarea]     = useState(false);
  const [tareaExpandida, setTareaExpandida] = useState(null);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [tFiltro, setTFiltro] = useState("todas"); // todas|pendiente|en_progreso|completada
  const [tFechaDesde, setTFechaDesde] = useState("");
  const [tFechaHasta, setTFechaHasta] = useState("");
  const [tFechaExacta, setTFechaExacta] = useState("");
  const [tModoFecha, setTModoFecha] = useState("ninguno"); // ninguno|exacta|rango

  const [calMes, setCalMes] = useState(()=>{ const d=new Date(); return {year:d.getFullYear(), month:d.getMonth()}; });
  const [calDia, setCalDia] = useState(new Date().toISOString().slice(0,10));

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
  const [movingMovida, setMovingMovida] = useState("");
  const [savingMovida, setSavingMovida] = useState(false);
  const [modoMover, setModoMover] = useState(false);
  const [modoRetroceso, setModoRetroceso] = useState(false);
  const [diaRelevamientoAbierto, setDiaRelevamientoAbierto] = useState("");
  const [sectorMiSalaAbierto, setSectorMiSalaAbierto] = useState(""); // true = mover libre (corrección), false = avanzar etapa normal
  const [tiposTareaAbierto, setTiposTareaAbierto] = useState(false);
  const [usuariosSalaAbierto, setUsuariosSalaAbierto] = useState(false);
  // Tema: "oscuro" | "claro" | "sistema". Persiste en usuarios.tema (viaja entre dispositivos).
  const [temaTick, setTemaTick] = useState(0);
  const [guardandoTema, setGuardandoTema] = useState(false);
  const [temaPref, setTemaPref] = useState(() => {
    try { return localStorage.getItem("raiz_tema") || "oscuro"; } catch(_) { return "oscuro"; }
  });
  const [estructuraAbierto, setEstructuraAbierto] = useState(true);
  const [datosMaestrosAbierto, setDatosMaestrosAbierto] = useState(false);
  const [geneticasBoxAbierto, setGeneticasBoxAbierto] = useState(false);

  // ── ASISTENTE IA ──
  const [chatMensajes, setChatMensajes] = useState([]); // {rol, texto, imagen?, timestamp}
  const [chatApiMsgs, setChatApiMsgs] = useState([]);   // formato Anthropic
  const [chatInput, setChatInput] = useState("");
  const [chatCargando, setChatCargando] = useState(false);
  const [chatImagen, setChatImagen] = useState(null);   // base64 para preview
  const [chatImagenMime, setChatImagenMime] = useState("image/jpeg");
  const chatBottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const [grupoTareasAbiertos, setGrupoTareasAbiertos] = useState({});
  const [grupoTareasCalAbiertos, setGrupoTareasCalAbiertos] = useState({});
  const [tareasEnSubAbierto, setTareasEnSubAbierto] = useState({});
  const [cosechaGrupoAbierto, setCosechaGrupoAbierto] = useState({});
  const [floracionDraft, setFloracionDraft] = useState({});
  const [savingFloracion, setSavingFloracion] = useState(false);
  const [reporteAbierto, setReporteAbierto] = useState("distribucion");
  const [statsLotes, setStatsLotes] = useState({});   // lote_id -> {dias_enraizado, dias_vegetativo, dias_floracion, dias_secado} vía RPC stats_lotes
  const [repLotesFiltro, setRepLotesFiltro] = useState({etapa:"", sub:"", estado:"todos", genetica:"", orden:"genetica"});
  const [destinoSub, setDestinoSub] = useState("");

  const [editingSub, setEditingSub] = useState(null);
  const [savingSub, setSavingSub]   = useState(false);

  const [editingGenetica, setEditingGenetica] = useState(null);
  const [savingGenetica, setSavingGenetica]   = useState(false);
  const [gActivaFilter, setGActivaFilter]     = useState("activas"); // activas | inactivas | todas

  const [editingUsuario, setEditingUsuario] = useState(null);
  const [savingUsuario, setSavingUsuario]   = useState(false);

  // ── Panel Administrador (rol sin sala_id propia) ──
  const [salasTodas, setSalasTodas]     = useState([]);
  const [usuariosTodos, setUsuariosTodos] = useState([]);
  const [adminLoaded, setAdminLoaded]   = useState(false);
  const [entidadesSinUso, setEntidadesSinUso] = useState([]);
  const [todasEntidades, setTodasEntidades] = useState([]);
  const [eliminandoEntidad, setEliminandoEntidad] = useState(null); // {entidad, confirmText}
  const [borrandoEntidad, setBorrandoEntidad] = useState(false);

  // ── ADMIN DE ENTIDAD ──
  const [adminEntidadModo, setAdminEntidadModo] = useState('entidad'); // 'entidad' | 'mg'
  const [entidadNombre, setEntidadNombre] = useState('');
  const [entidadSalas, setEntidadSalas] = useState([]);
  const [entidadUsuarios, setEntidadUsuarios] = useState([]);
  const [entidadSalaData, setEntidadSalaData] = useState({});
  const [entidadLoaded, setEntidadLoaded] = useState(false);
  const [editingMGAdmin, setEditingMGAdmin] = useState(null); // {salaId} nuevo MG para una sala
  const [savingMGAdmin, setSavingMGAdmin]   = useState(false);
  const [creandoSalaEntidad, setCreandoSalaEntidad] = useState(null); // {nombre, mgNombre, mgEmail}
  const [guardandoSalaEntidad, setGuardandoSalaEntidad] = useState(false);
  const [creandoEjecutorEntidad, setCreandoEjecutorEntidad] = useState(null); // {nombre, email, salaId}
  const [guardandoEjecutorEntidad, setGuardandoEjecutorEntidad] = useState(false);
  const [linkInvitacion, setLinkInvitacion] = useState(null); // {nombre, url}
  const [eliminandoUsuarioEntidad, setEliminandoUsuarioEntidad] = useState(null); // {usuario, confirmText}
  const [borrandoUsuarioEntidad, setBorrandoUsuarioEntidad] = useState(false);
  const [eliminandoSalaEntidad, setEliminandoSalaEntidad] = useState(null); // {sala, confirmText}
  const [borrandoSalaEntidad, setBorrandoSalaEntidad] = useState(false);
  const [salasEntidadAbierto, setSalasEntidadAbierto] = useState(true);
  const [agregandoMGSala, setAgregandoMGSala] = useState(null); // {salaId, salaNombre, nombre, email}
  const [guardandoMGSala, setGuardandoMGSala] = useState(false);
  const [editandoUsuarioEntidad, setEditandoUsuarioEntidad] = useState(null); // {id, nombre, email}
  const [guardandoUsuarioEntidad, setGuardandoUsuarioEntidad] = useState(false);
  const [asignandoComoMG, setAsignandoComoMG] = useState(false);
  const [eligiendoSalaMG, setEligiendoSalaMG] = useState(null); // array de salas cuando el admin es MG de más de una
  const [eliminandoSala, setEliminandoSala] = useState(null); // {sala, confirmText}
  const [borrandoSala, setBorrandoSala]     = useState(false);

  const [masAbierto, setMasAbierto] = useState(false);
  const [subsAbiertos, setSubsAbiertos] = useState({});
  const toggleSub = (id) => setSubsAbiertos(prev=>({...prev, [id]: !prev[id]}));

  const esEjecutor = usuario?.rol === "ejecutor";
  const puedeRelevar = !esEjecutor || usuario?.permisos?.relevamiento === true;

  // Inyecta las CSS vars de los temas en el <head>, una sola vez.
  useEffect(()=>{
    let el = document.getElementById("raiz-temas");
    if(!el){ el = document.createElement("style"); el.id = "raiz-temas"; document.head.appendChild(el); }
    el.textContent = CSS_TEMAS;
  }, []);

  // Aplica el tema al <html>. Cambiar data-theme reescribe todas las vars de una.
  useEffect(()=>{
    const aplicar = () => {
      const t = resolverTema(temaPref);
      TEMA_ACTIVO = t;
      document.documentElement.setAttribute("data-theme", t);
      setTemaTick(x=>x+1);   // re-render de lo que usa colorDeFase (no es CSS var)
    };
    aplicar();
    try { localStorage.setItem("raiz_tema", temaPref); } catch(_) {}
    if(temaPref === "sistema" && window.matchMedia){
      const mq = window.matchMedia("(prefers-color-scheme: light)");
      const h = () => aplicar();
      mq.addEventListener ? mq.addEventListener("change", h) : mq.addListener(h);
      return () => { mq.removeEventListener ? mq.removeEventListener("change", h) : mq.removeListener(h); };
    }
  }, [temaPref]);

  const cambiarTema = async (pref) => {
    setTemaPref(pref);                     // instantáneo, no espera a la red
    if(!usuario?.id) return;
    setGuardandoTema(true);
    const r = await supabase.from("usuarios").update({ tema: pref }).eq("id", usuario.id);
    if(r.error){ setStatus("no se pudo guardar el tema"); setTimeout(()=>setStatus(""),4000); }
    else setUsuario(u => u ? {...u, tema: pref} : u);
    setGuardandoTema(false);
  };

  useEffect(()=>{
    (async()=>{
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const authUser = sessionData?.session?.user;
        if(authUser){
          const r = await supabase.from("usuarios").select("*").eq("auth_id", authUser.id).single();
          if(r.data && r.data.activo!==false){
            setUsuario(r.data);
            if(r.data.tema) setTemaPref(r.data.tema);
          }
          else await supabase.auth.signOut();
        }
      } catch(e) {}
      setLoaded(true);
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if(event === "SIGNED_OUT") setUsuario(null);
    });
    return () => listener?.subscription?.unsubscribe();
  },[]);

  useEffect(()=>{
    if(!usuario) return;
    if(usuario.rol==="administrador" && !usuario.entidad_id) cargarPanelAdmin();         // Super Admin técnico
    else if(usuario.rol==="administrador" && usuario.entidad_id) cargarPanelEntidad();   // Admin de Entidad
    else cargarTodo();                                                                     // MG y Ejecutor
  },[usuario]);

  const cargarTodo = async (salaIdOverride) => {
    try {
      const sId = salaIdOverride || salaId || usuario.sala_id;
      if(!sId) return;
      setSalaId(sId);

      const [spR, sR, gR, lR, mR, uR, tR, ctR, rR, ttR] = await Promise.all([
        supabase.from("sectores_padre").select("*").eq("sala_id", sId).order("orden"),
        supabase.from("sectores").select("*").eq("sala_id", sId),
        supabase.from("geneticas").select("*").eq("sala_id", sId).order("nombre"),
        supabase.from("lotes").select("*").eq("sala_id", sId).order("fecha_inicio", { ascending:false }),
        supabase.from("movimientos_lote").select("*").order("fecha", { ascending:false }),
        supabase.from("usuarios").select("id,nombre,email,rol,permisos,activo,creado_por").eq("sala_id", sId),
        supabase.from("tareas").select("*").eq("sala_id", sId).order("fecha_programada"),
        supabase.from("comentarios_tareas").select("*").order("creado_en"),
        supabase.from("relevamientos").select("*").eq("sala_id", sId).order("fecha", { ascending:false }),
        supabase.from("tipos_tarea").select("*").eq("sala_id", sId).order("nombre")
      ]);

      setSectoresPadre(spR.data||[]);
      setSectores(sR.data||[]);
      setGeneticas(gR.data||[]);
      setLotes(lR.data||[]);
      const misLoteIds = new Set((lR.data||[]).map(l=>l.id));
      const misTareaIds = new Set((tR.data||[]).map(t=>t.id));
      setMovimientos((mR.data||[]).filter(m=>misLoteIds.has(m.lote_id)));
      // Acumulados de días por etapa, calculados en el server (RPC) — banca splits, retrocesos y 12/12 parcial
      const stR = await supabase.rpc("stats_lotes");
      if(stR.error) console.error("stats_lotes:", stR.error);
      const stMap = {}; (stR.data||[]).forEach(s=>{ if(misLoteIds.has(s.lote_id)) stMap[s.lote_id]=s; });
      setStatsLotes(stMap);
      const um = {}; (uR.data||[]).forEach(u=>{ um[u.id]=u.nombre; }); setUsuariosMap(um);
      setUsuariosLista(uR.data||[]);
      setTareas(tR.data||[]);
      setComentariosTareas((ctR.data||[]).filter(c=>misTareaIds.has(c.tarea_id)));
      setRelevamientos(rR.data||[]);
      setTiposTarea(ttR.data||[]);

      if(spR.data?.length && !tab) setTab(spR.data[0].id);
    } catch(e) {
      console.error("Error cargando datos:", e);
      setStatus("err: " + String(e).slice(0,60));
      setTimeout(()=>setStatus(""),4000);
    }
  };

  const handleLogin = (u) => {
    if(u.activo===false){
      window.alert("Este usuario está desactivado. Contactá a tu Master Grower.");
      return;
    }
    setUsuario(u);
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUsuario(null);
    setSalaId(null);
    setSectoresPadre([]);
    setSectores([]);
    setGeneticas([]);
    setLotes([]);
    setTareas([]);
    setRelevamientos([]);
    setEntidadSalas([]);
    setEntidadUsuarios([]);
    setSalasTodas([]);
    setUsuariosTodos([]);
    setEntidadesSinUso([]);
    setEntidadLoaded(false);
    setAdminLoaded(false);
    setAdminEntidadModo("entidad");
  };

  const subsectoresDe = (sectorPadreId) => sectores.filter(s => s.sector_padre_id === sectorPadreId);
  const lotesDeSector = (sectorId) => lotes.filter(l => l.sector_actual_id === sectorId);

  // El sufijo ahora es identidad permanente (columna en la base), no se deriva.
  const sufijoDeLote = (lote) => lote.sufijo || "";

  // Letra de sufijo libre para el próximo hermano de un mismo numero_lote+genética
  const proximoSufijo = (genId, numLote) => {
    const hermanos = lotes.filter(l=>l.genetica_id===genId && l.numero_lote===numLote);
    const usados = new Set(hermanos.map(l=>l.sufijo||"").filter(Boolean));
    // Si ninguno tiene sufijo todavía, el primer split convierte al original en -a y al nuevo en -b
    if(usados.size===0) return {paraOriginal:"-a", paraNuevo:"-b"};
    // Si ya hay sufijos, buscar la próxima letra libre desde -a
    for(let i=0;i<26;i++){
      const cand = "-"+String.fromCharCode(97+i);
      if(!usados.has(cand)) return {paraOriginal:null, paraNuevo:cand};
    }
    return {paraOriginal:null, paraNuevo:"-x"};
  };
  const sectorPadreDeSub = (subId) => {
    const sub = sectores.find(s=>s.id===subId);
    return sub ? sectoresPadre.find(sp=>sp.id===sub.sector_padre_id) : null;
  };

  // Rango de tamaño de maceta dentro de Vegetativo — no se puede mover de una maceta grande a una chica
  const rangoMaceta = (nombreSub) => {
    if(/5\s*l/i.test(nombreSub)) return 3;
    if(/2\s*l/i.test(nombreSub)) return 2;
    if(/150\s*cc/i.test(nombreSub)) return 1;
    return 0;
  };

  // Destinos válidos para "mover" lateralmente un lote — SOLO dentro de la misma etapa, nunca salto de etapas.
  // Esto ya resuelve solo la regla "nunca se vuelve a Enraizado": si es lateral, jamás se llega a Enraizado desde otra etapa.
  const destinosPermitidos = (subOrigenId) => {
    const subOrigen = sectores.find(s=>s.id===subOrigenId);
    const spOrigen = subOrigen ? sectoresPadre.find(x=>x.id===subOrigen.sector_padre_id) : null;
    if(!spOrigen) return [];
    return sectores.filter(s=>{
      if(s.id===subOrigenId) return false;
      if(s.sector_padre_id !== spOrigen.id) return false; // solo la misma etapa, nunca otra
      if(spOrigen.nombre==="Vegetativo" && rangoMaceta(s.nombre) < rangoMaceta(subOrigen.nombre)) return false; // no de grande a chica
      return true;
    });
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
  const guardarFechaFloracion = async (sub) => {
    const val = floracionDraft[sub.id];
    if(val===undefined) return;
    setSavingFloracion(true);
    try {
      await supabase.from("sectores").update({fecha_inicio_floracion: val || null}).eq("id", sub.id);
      setFloracionDraft(prev=>{ const n={...prev}; delete n[sub.id]; return n; });
      setStatus("guardado"); setTimeout(()=>setStatus(""),1800);
      cargarTodo();
    } catch(e) { setStatus("error al guardar fecha"); setTimeout(()=>setStatus(""),3000); }
    setSavingFloracion(false);
  };

  // Único retroceso permitido: de una carpa SIN 12/12 activo, de vuelta a Vege 5L (el paso inmediatamente anterior)
  // ── ASISTENTE IA — contexto + envío ──
  const buildContexto = () => {
    const partes = [];
    const gens = geneticas.filter(g=>g.activa!==false);
    if(gens.length) partes.push(`Genéticas (${gens.length}): ${gens.map(g=>`${g.nombre} (${g.tipo}${g.dias_floracion_min?`, flora ${g.dias_floracion_min}–${g.dias_floracion_max||g.dias_floracion_min}d`:""})`).join(", ")}`);
    sectoresPadre.forEach(sp=>{
      subsectoresDe(sp.id).forEach(sub=>{
        const ls = lotesDeSector(sub.id).filter(l=>["activo","maduracion"].includes(l.estado));
        if(ls.length){
          const det = ls.map(l=>{
            const g = geneticas.find(x=>x.id===l.genetica_id);
            const dias = l.fecha_inicio ? Math.round((new Date()-new Date(l.fecha_inicio))/86400000) : "?";
            return `${g?.nombre||"?"}(${l.cantidad_plantas}pl, ${dias}d${l.estado==="maduracion"?", maduración":""})`;
          }).join(" + ");
          partes.push(`${sp.nombre}›${sub.nombre}: ${det}`);
          if(sp.nombre==="Floración" && sub.fecha_inicio_floracion){
            const df = Math.round((new Date()-new Date(sub.fecha_inicio_floracion))/86400000);
            partes.push(`  ${sub.nombre} en 12/12 desde ${sub.fecha_inicio_floracion} (${df}d de floración activa)`);
          }
        }
      });
    });
    const ultimasCosechas = lotes.filter(l=>l.estado==="cosechado").sort((a,b)=>(b.fecha_inicio||"").localeCompare(a.fecha_inicio||"")).slice(0,5);
    if(ultimasCosechas.length){
      partes.push(`Últimas cosechas: ${ultimasCosechas.map(c=>{ const g=geneticas.find(x=>x.id===c.genetica_id); return `${g?.nombre||"?"}(${c.peso_cosechado_gramos||"?"}g/${c.cantidad_plantas}pl)`; }).join(", ")}`);
    }
    return partes.join("\n") || "Sin datos de cultivo todavía.";
  };

  const enviarMensaje = async () => {
    const texto = chatInput.trim();
    if(!texto && !chatImagen) return;
    setChatCargando(true);
    const ts = new Date().toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"});
    const msgDisplay = {rol:"usuario", texto, imagen:chatImagen, ts};
    setChatMensajes(prev=>[...prev, msgDisplay]);

    // Formato API Anthropic
    const contenido = [];
    if(chatImagen) contenido.push({type:"image",source:{type:"base64",media_type:chatImagenMime,data:chatImagen}});
    if(texto) contenido.push({type:"text",text:texto});
    const newApiMsg = {role:"user", content:contenido.length===1&&!chatImagen?texto:contenido};
    const nuevosApiMsgs = [...chatApiMsgs, newApiMsg];

    setChatInput("");
    setChatImagen(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      const res = await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+accessToken},body:JSON.stringify({messages:nuevosApiMsgs,contextoCultivo:buildContexto()})});
      const data = await res.json();
      if(!res.ok || data.error) throw new Error(data.error||"Error desconocido");
      const respuesta = data.content?.[0]?.text || "Sin respuesta";
      setChatMensajes(prev=>[...prev,{rol:"asistente",texto:respuesta,ts:new Date().toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"})}]);
      setChatApiMsgs([...nuevosApiMsgs,{role:"assistant",content:respuesta}]);
    } catch(e){
      setChatMensajes(prev=>[...prev,{rol:"error",texto:"Error: "+e.message,ts}]);
    }
    setChatCargando(false);
  };

  const seleccionarImagen = (e) => {
    const file = e.target.files?.[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const b64 = ev.target.result.split(",")[1];
      setChatImagen(b64);
      setChatImagenMime(file.type||"image/jpeg");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const iniciarRetroceso = (lote) => {
    const vege5L = sectores.find(s=>{
      const sp = sectoresPadre.find(x=>x.id===s.sector_padre_id);
      return sp?.nombre==="Vegetativo" && /5\s*l/i.test(s.nombre);
    });
    if(!vege5L){ setStatus("no encontré un subsector de Vege 5L para volver"); setTimeout(()=>setStatus(""),3500); return; }
    setMovingLote(lote);
    setDestinoSub(vege5L.id);
    setMovingMovida(String(lote.cantidad_plantas));
    setModoMover(false);
    setModoRetroceso(true);
  };

  // Agrupa una lista de tareas por sector padre › subsector, en el orden natural de la sala
  const agruparTareasPorSector = (lista) => {
    const grupos = {};
    lista.forEach(t=>{
      const key = t.sector_id || "_sin";
      grupos[key] = grupos[key] || [];
      grupos[key].push(t);
    });
    const ordenados = [];
    sectoresPadre.forEach(sp=>{
      subsectoresDe(sp.id).forEach(sub=>{
        if(grupos[sub.id]) ordenados.push({key:sub.id, label:`${sp.nombre} › ${sub.nombre}`, color:colorDeFase(sp.orden), tareas:grupos[sub.id]});
      });
    });
    if(grupos["_sin"]) ordenados.push({key:"_sin", label:"Sin sector asignado", color:"var(--c059)", tareas:grupos["_sin"]});
    return ordenados;
  };

  // Tarjeta de tarea completa — reusada en 📋 Tareas y en 📅 Calendario, para no triplicar el markup
  const TareaCard = ({t}) => {
    const sub = sectores.find(s=>s.id===t.sector_id);
    const sp = sub ? sectoresPadre.find(x=>x.id===sub.sector_padre_id) : null;
    const lote = t.lote_id ? lotes.find(l=>l.id===t.lote_id) : null;
    const g = lote ? geneticas.find(x=>x.id===lote.genetica_id) : null;
    const hoy = new Date().toISOString().slice(0,10);
    const atrasada = (t.estado==="pendiente"||t.estado==="en_progreso") && t.fecha_programada < hoy;
    const estadoMostrado = atrasada ? "atrasada" : t.estado;
    const esMia = t.asignado_a===usuario.id;
    const tipoObj = t.tipo_id ? tiposTarea.find(x=>x.id===t.tipo_id) : null;
    const comentarios = comentariosTareas.filter(c=>c.tarea_id===t.id);
    const expandida = tareaExpandida===t.id;
    return (
      <div style={{background:"var(--c076)",border:`1px solid ${TAREA_ESTADO_COLOR[estadoMostrado]}55`,borderRadius:"14px",padding:"16px",borderLeft:`4px solid ${TAREA_PRIORIDAD_COLOR[t.prioridad]||"var(--c057)"}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"8px"}}>
          <div>
            <div style={{fontSize:"15px",fontWeight:"600",color:"var(--c060)"}}>{t.titulo}</div>
            <div style={{fontSize:"12px",color:"var(--c077)",marginTop:"2px"}}>{tipoObj ? `${tipoObj.icono} ${tipoObj.nombre}` : (TAREA_TIPO_LABEL[t.tipo] || t.tipo || "Sin tipo")}</div>
          </div>
          <span style={{fontSize:"11px",padding:"3px 10px",borderRadius:"10px",background:`${TAREA_ESTADO_COLOR[estadoMostrado]}33`,color:TAREA_ESTADO_COLOR[estadoMostrado],whiteSpace:"nowrap"}}>{TAREA_ESTADO_LABEL[estadoMostrado]}</span>
        </div>
        {(sp||g) && <div style={{fontSize:"12px",color:"var(--c147)",marginBottom:"6px"}}>{sp && `${sp.nombre} › ${sub.nombre}`}{g && ` · ${g.nombre}`}</div>}
        {t.descripcion && <div style={{fontSize:"13px",color:"var(--c148)",marginBottom:"8px",lineHeight:"1.5"}}>{t.descripcion}</div>}
        <div style={{display:"flex",justifyContent:"space-between",fontSize:"11px",color:"var(--c037)",marginBottom:"10px"}}>
          <span>📅 {t.fecha_programada}{t.fecha_ejecucion_real?` → hecha ${t.fecha_ejecucion_real}`:""}</span>
          <span>{t.asignado_a ? `→ ${usuariosMap[t.asignado_a]||"—"}` : "sin asignar"}</span>
        </div>
        <div style={{display:"flex",gap:"6px",marginBottom:"10px"}}>
          {esMia && t.estado==="pendiente" && (
            <button onClick={()=>updateEstadoTarea(t,"en_progreso")} style={{flex:1,padding:"7px",borderRadius:"7px",fontSize:"11px",background:"var(--c078)",color:"var(--c003)",border:"1px solid var(--c079)"}}>▶ Iniciar</button>
          )}
          {esMia && (t.estado==="pendiente"||t.estado==="en_progreso") && (
            <button onClick={()=>updateEstadoTarea(t,"completada")} style={{flex:1,padding:"7px",borderRadius:"7px",fontSize:"11px",background:"var(--c101)",color:"var(--c036)",border:"1px solid var(--c149)"}}>✓ Completar</button>
          )}
          {!esEjecutor && (
            <button onClick={()=>setEditingTarea({...t, lote_id:t.lote_id||"", sector_id:t.sector_id||"", asignado_a:t.asignado_a||"", descripcion:t.descripcion||"", tipo_id:t.tipo_id||""})} style={{padding:"7px 10px",borderRadius:"7px",fontSize:"11px",background:"var(--c020)",color:"var(--c001)",border:"1px solid var(--c011)"}}>✏️</button>
          )}
          {!esEjecutor && (
            <button onClick={()=>delTarea(t)} style={{padding:"7px 10px",borderRadius:"7px",fontSize:"11px",background:"var(--c008)",color:"var(--c012)",border:"1px solid var(--c009)"}}>🗑</button>
          )}
        </div>
        <button onClick={()=>setTareaExpandida(expandida?null:t.id)} style={{fontSize:"11px",color:"var(--c150)",background:"none",border:"none",padding:0}}>{expandida?"▲ Ocultar":"▼"} 💬 {comentarios.length} comentario{comentarios.length!==1?"s":""}</button>
        {expandida && (
          <div style={{marginTop:"10px",paddingTop:"10px",borderTop:"1px solid var(--c151)"}}>
            {comentarios.map(c=>(
              <div key={c.id} style={{marginBottom:"8px",fontSize:"12px"}}>
                <span style={{color:"var(--c021)",fontWeight:"600"}}>{usuariosMap[c.usuario_id]||"—"}</span>
                <span style={{color:"var(--c152)",marginLeft:"6px",fontSize:"10px"}}>{(c.creado_en||"").slice(0,16).replace("T"," ")}</span>
                <div style={{color:"var(--c153)",marginTop:"2px"}}>{c.texto}</div>
              </div>
            ))}
            <div style={{display:"flex",gap:"6px",marginTop:"8px"}}>
              <input value={nuevoComentario} onChange={e=>setNuevoComentario(e.target.value)} placeholder="Agregar comentario..." style={{...inp(),flex:1,padding:"8px 10px",fontSize:"12px"}}/>
              <button onClick={()=>addComentario(t.id)} style={{padding:"8px 14px",borderRadius:"8px",fontSize:"12px",background:"var(--c028)",color:"var(--c005)",border:"none"}}>Enviar</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const confirmarMovimiento = async () => {
    if(!movingLote || !destinoSub) return;
    const cant = parseInt(movingMovida)||0;
    if(cant<=0 || cant>movingLote.cantidad_plantas) return;
    setSavingMovida(true);
    try {
      const subOrigen = sectores.find(s=>s.id===movingLote.sector_actual_id);
      const spOrigen = subOrigen ? sectoresPadre.find(x=>x.id===subOrigen.sector_padre_id) : null;
      const subDestino = sectores.find(s=>s.id===destinoSub);
      const spDestino = subDestino ? sectoresPadre.find(x=>x.id===subDestino.sector_padre_id) : null;
      const esCorteDeFloracion = spOrigen?.nombre==="Floración" && spDestino?.nombre==="Secado";
      const hoyStr = new Date().toISOString().slice(0,10);

      const esTotal = cant===movingLote.cantidad_plantas;
      let loteIdQueCorta = null; // el id del lote que efectivamente queda en Secado (para congelarle las fechas)

      if(esTotal){
        // Avanza el lote entero — se mueve tal cual
        await supabase.from("movimientos_lote").insert({
          lote_id: movingLote.id,
          sector_origen_id: movingLote.sector_actual_id,
          sector_destino_id: destinoSub,
          cantidad_movida: cant,
          usuario_id: usuario.id,
          tipo: "movimiento"
        });
        await supabase.from("lotes").update({
          sector_actual_id: destinoSub,
          fecha_ultima_movida: hoyStr
        }).eq("id", movingLote.id);
        loteIdQueCorta = movingLote.id;
      } else {
        // Avance parcial: el lote original se queda con el resto, nace un lote hermano en el destino
        const sufijos = proximoSufijo(movingLote.genetica_id, movingLote.numero_lote);
        // El lote madre raíz de esta cadena (si el original ya venía de un split, conservamos su raíz)
        const origenRaiz = movingLote.lote_origen_id || movingLote.id;

        const updOriginal = { cantidad_plantas: movingLote.cantidad_plantas - cant };
        if(sufijos.paraOriginal && !movingLote.sufijo) updOriginal.sufijo = sufijos.paraOriginal;
        await supabase.from("lotes").update(updOriginal).eq("id", movingLote.id);

        const ins = await supabase.from("lotes").insert({
          sala_id: salaId,
          genetica_id: movingLote.genetica_id,
          sector_actual_id: destinoSub,
          cantidad_plantas: cant,
          fecha_inicio: movingLote.fecha_inicio,
          fecha_ultima_movida: hoyStr,
          estado: "activo",
          numero_lote: movingLote.numero_lote, // mismo lote biológico, conserva su número
          sufijo: sufijos.paraNuevo,
          lote_origen_id: origenRaiz,
          notas: movingLote.notas || ""
        }).select().single();

        if(ins.data){
          loteIdQueCorta = ins.data.id;
          await supabase.from("movimientos_lote").insert({
            lote_id: ins.data.id,
            sector_origen_id: movingLote.sector_actual_id,
            sector_destino_id: destinoSub,
            cantidad_movida: cant,
            usuario_id: usuario.id,
            tipo: "movimiento",
            motivo: `Avance parcial de ${cant}/${movingLote.cantidad_plantas} del lote ${loteLabel(movingLote.numero_lote, sufijos.paraOriginal||movingLote.sufijo||"")}`
          });
        }
      }

      // Corte de floración: el lote que llega a Secado congela el 12/12 de la carpa + la fecha de hoy como fin
      if(esCorteDeFloracion && loteIdQueCorta){
        await supabase.from("lotes").update({
          fecha_inicio_floracion: subOrigen.fecha_inicio_floracion || null,
          fecha_fin_floracion: hoyStr
        }).eq("id", loteIdQueCorta);

        // Si la carpa quedó vacía de este ciclo, resetea su 12/12 para el próximo
        const restantes = await supabase.from("lotes").select("id").eq("sector_actual_id", subOrigen.id).in("estado",["activo","maduracion"]);
        if((restantes.data||[]).length===0){
          await supabase.from("sectores").update({fecha_inicio_floracion:null}).eq("id", subOrigen.id);
        }
      }

      setMovingLote(null);
      setDestinoSub("");
      setMovingMovida("");
      setModoMover(false);
      setModoRetroceso(false);
      setStatus("guardado"); setTimeout(()=>setStatus(""),1800);
      cargarTodo();
    } catch(e) { setStatus("error al mover: "+String(e).slice(0,50)); setTimeout(()=>setStatus(""),4000); }
    setSavingMovida(false);
  };

  // ── ADMIN DE SUBSECTORES (Mi Sala) ──
  const saveSub = async () => {
    if(!editingSub) return;
    setSavingSub(true);
    try {
      // El CHECK de sectores.tipo solo acepta: enraizado | vege | flora | secado | experimentacion
      const TIPO_POR_SECTOR = { "Enraizado":"enraizado", "Vegetativo":"vege", "Floración":"flora", "Secado":"secado" };
      const nombrePadre = sectoresPadre.find(sp=>sp.id===editingSub.sector_padre_id)?.nombre || "";
      const payload = {
        sala_id: salaId,
        sector_padre_id: editingSub.sector_padre_id,
        nombre: editingSub.nombre,
        capacidad_unidades: editingSub.capacidad_unidades ? parseInt(editingSub.capacidad_unidades) : null,
        tipo: TIPO_POR_SECTOR[nombrePadre] || "experimentacion",
        puede_avanzar_etapa: editingSub.puede_avanzar_etapa !== false
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
    const enUso = lotes.some(l=>l.sector_actual_id===id && (l.estado==="activo"||l.estado==="maduracion"||l.estado==="pendiente_aprobacion"));
    if(enUso){
      setStatus("no se puede borrar: tiene lotes activos, en maduración o pendientes de aprobación adentro");
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
        color: editingGenetica.color || "var(--c001)",
        semanas_floracion: editingGenetica.semanas_floracion ? parseInt(editingGenetica.semanas_floracion) : null,
        dias_floracion_min: editingGenetica.dias_floracion_min ? parseInt(editingGenetica.dias_floracion_min) : null,
        dias_floracion_max: editingGenetica.dias_floracion_max ? parseInt(editingGenetica.dias_floracion_max) : null,
        banco: editingGenetica.banco || "",
        sabor: editingGenetica.sabor || "",
        efecto: editingGenetica.efecto || "",
        activa: editingGenetica.activa!==false
      };
      if(editingGenetica.id) {
        const r = await supabase.from("geneticas").update(payload).eq("id", editingGenetica.id);
        if(r.error){ setStatus("error: "+r.error.message.slice(0,80)); setSavingGenetica(false); setTimeout(()=>setStatus(""),5000); return; }
      } else {
        const r = await supabase.from("geneticas").insert(payload);
        if(r.error){ setStatus("error: "+r.error.message.slice(0,80)); setSavingGenetica(false); setTimeout(()=>setStatus(""),5000); return; }
      }
      setEditingGenetica(null);
      setStatus("guardado"); setTimeout(()=>setStatus(""),1800);
      await cargarTodo();
    } catch(e) { setStatus("error: "+String(e).slice(0,50)); setTimeout(()=>setStatus(""),4000); }
    setSavingGenetica(false);
  };
  const toggleActivaGenetica = async (g) => {
    try { await supabase.from("geneticas").update({activa: !(g.activa!==false)}).eq("id", g.id); cargarTodo(); }
    catch(e) { setStatus("error al actualizar"); setTimeout(()=>setStatus(""),3000); }
  };

  // ── TIPOS DE TAREA (catálogo editable por sala, desde Mi Sala) ──
  const emptyTipoTarea = () => ({ nombre:"", icono:"📋", sectores_padre_ids:[], activo:true });

  const saveTipoTarea = async () => {
    if(!editingTipoTarea) return;
    setSavingTipoTarea(true);
    try {
      const payload = {
        sala_id: salaId,
        nombre: editingTipoTarea.nombre,
        icono: editingTipoTarea.icono || "📋",
        sectores_padre_ids: editingTipoTarea.sectores_padre_ids || [],
        sector_padre_id: null,
        activo: editingTipoTarea.activo!==false
      };
      if(editingTipoTarea.id) {
        const r = await supabase.from("tipos_tarea").update(payload).eq("id", editingTipoTarea.id);
        if(r.error){ setStatus("error: "+r.error.message.slice(0,80)); setSavingTipoTarea(false); setTimeout(()=>setStatus(""),5000); return; }
      } else {
        const r = await supabase.from("tipos_tarea").insert(payload);
        if(r.error){ setStatus("error: "+r.error.message.slice(0,80)); setSavingTipoTarea(false); setTimeout(()=>setStatus(""),5000); return; }
      }
      setEditingTipoTarea(null);
      setStatus("guardado"); setTimeout(()=>setStatus(""),1800);
      await cargarTodo();
    } catch(e) { setStatus("error: "+String(e).slice(0,60)); setTimeout(()=>setStatus(""),4000); }
    setSavingTipoTarea(false);
  };

  const toggleActivoTipoTarea = async (tt) => {
    try { await supabase.from("tipos_tarea").update({activo: !(tt.activo!==false)}).eq("id", tt.id); cargarTodo(); }
    catch(e) { setStatus("error al actualizar"); setTimeout(()=>setStatus(""),3000); }
  };

  const delTipoTarea = async (tt) => {
    const enUso = tareas.some(t=>t.tipo_id===tt.id);
    if(enUso){
      setStatus("no se puede borrar: hay tareas con este tipo — desactivalo en su lugar");
      setTimeout(()=>setStatus(""),4500);
      return;
    }
    if(!window.confirm(`¿Borrar el tipo "${tt.nombre}"? No se puede deshacer.`)) return;
    try { await supabase.from("tipos_tarea").delete().eq("id", tt.id); cargarTodo(); }
    catch(e) { setStatus("error al borrar tipo de tarea"); setTimeout(()=>setStatus(""),3000); }
  };

  // Tipos disponibles para un subsector dado: los generales (sin sectores asignados = todos) + los que incluyen su sector padre
  const tiposTareaParaSector = (sectorId) => {
    const sub = sectores.find(s=>s.id===sectorId);
    const spId = sub?.sector_padre_id;
    return tiposTarea.filter(tt => {
      if(tt.activo===false) return false;
      const ids = tt.sectores_padre_ids;
      // Compatibilidad: si todavía no migró, cae al campo viejo sector_padre_id
      if(!ids || ids.length===0) return !tt.sector_padre_id || tt.sector_padre_id===spId;
      return ids.includes(spId);
    });
  };
  const saveTarea = async () => {
    if(!editingTarea) return;
    setSavingTarea(true);
    try {
      const payload = {
        sala_id: salaId,
        titulo: editingTarea.titulo,
        tipo_id: editingTarea.tipo_id || null,
        sector_id: editingTarea.sector_id || null,
        lote_id: editingTarea.lote_id || null,
        descripcion: editingTarea.descripcion || "",
        fecha_programada: editingTarea.fecha_programada,
        prioridad: editingTarea.prioridad || "media",
        asignado_a: editingTarea.asignado_a || null,
        creado_por: usuario.id
      };
      if(editingTarea.id) {
        const r = await supabase.from("tareas").update(payload).eq("id", editingTarea.id);
        if(r.error){ setStatus("error: "+r.error.message.slice(0,80)); setSavingTarea(false); setTimeout(()=>setStatus(""),5000); return; }
      } else {
        const r = await supabase.from("tareas").insert(payload);
        if(r.error){ setStatus("error: "+r.error.message.slice(0,80)); setSavingTarea(false); setTimeout(()=>setStatus(""),5000); return; }
      }
      setEditingTarea(null);
      setStatus("guardado"); setTimeout(()=>setStatus(""),1800);
      await cargarTodo();
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

  // ── USUARIOS (Master Grower crea Ejecutores en su Sala, o Master Growers nuevos con Sala propia) ──
  const saveUsuario = async () => {
    if(!editingUsuario) return;
    setSavingUsuario(true);
    try {
      if(editingUsuario.id){
        // Edición: solo datos de contacto, nunca rol ni sala desde acá
        await supabase.from("usuarios").update({
          nombre: editingUsuario.nombre, email: editingUsuario.email
        }).eq("id", editingUsuario.id);
      } else {
        // Alta: siempre Ejecutor en tu misma Sala. Crear Master Grower es exclusivo del Administrador.
        await supabase.from("usuarios").insert({
          nombre: editingUsuario.nombre, email: editingUsuario.email,
          rol: "ejecutor", activo: true, sala_id: usuario.sala_id, creado_por: usuario.id
        });
      }
      setEditingUsuario(null);
      setStatus("guardado"); setTimeout(()=>setStatus(""),1800);
      cargarTodo();
    } catch(e) { setStatus("error: "+String(e).slice(0,60)); setTimeout(()=>setStatus(""),4000); }
    setSavingUsuario(false);
  };

  const toggleActivoUsuario = async (u) => {
    if(u.id===usuario.id) return; // no te desactivás a vos mismo
    try { await supabase.from("usuarios").update({activo: !(u.activo!==false)}).eq("id", u.id); cargarTodo(); }
    catch(e) { setStatus("error al actualizar usuario"); setTimeout(()=>setStatus(""),3000); }
  };

  // ══ PANEL ADMINISTRADOR GLOBAL — ve todas las salas, sin entidad_id ══
  const cargarPanelAdmin = async () => {
    try {
      const [sR, uR, eR, teR] = await Promise.all([
        supabase.from("salas").select("*").order("creado_en"),
        supabase.from("usuarios").select("*").order("nombre"),
        supabase.from("entidades_sin_uso").select("*"),
        supabase.from("entidades").select("id,nombre,fecha_expiracion,activa").order("nombre")
      ]);
      setSalasTodas(sR.data||[]);
      setUsuariosTodos(uR.data||[]);
      setEntidadesSinUso(eR.data||[]);
      setTodasEntidades(teR.data||[]);
      setAdminLoaded(true);
    } catch(e) { setStatus("error cargando panel: "+String(e).slice(0,60)); setTimeout(()=>setStatus(""),4000); }
  };

  const actualizarExpiracionEntidad = async (entidadId, fecha) => {
    try {
      const r = await supabase.from("entidades").update({fecha_expiracion: fecha || null}).eq("id", entidadId);
      if(r.error){ setStatus("error: "+r.error.message.slice(0,80)); setTimeout(()=>setStatus(""),5000); return; }
      setStatus(fecha ? "expiración fijada" : "expiración quitada"); setTimeout(()=>setStatus(""),2000);
      cargarPanelAdmin();
    } catch(e) { setStatus("error: "+String(e).slice(0,60)); setTimeout(()=>setStatus(""),5000); }
  };

  const confirmarEliminarEntidad = async () => {
    if(!eliminandoEntidad || eliminandoEntidad.confirmText !== eliminandoEntidad.entidad.nombre) return;
    setBorrandoEntidad(true);
    try {
      const entId = eliminandoEntidad.entidad.id;
      const delU = await supabase.from("usuarios").delete().eq("entidad_id", entId);
      if(delU.error){ setStatus("error borrando usuario: "+delU.error.message.slice(0,80)); setBorrandoEntidad(false); setTimeout(()=>setStatus(""),5000); return; }

      const delE = await supabase.from("entidades").delete().eq("id", entId);
      if(delE.error){ setStatus("error borrando entidad: "+delE.error.message.slice(0,80)); setBorrandoEntidad(false); setTimeout(()=>setStatus(""),5000); return; }

      setEliminandoEntidad(null);
      setStatus("entidad eliminada");
      cargarPanelAdmin();
    } catch(e) { setStatus("error: "+String(e).slice(0,60)); }
    setBorrandoEntidad(false);
    setTimeout(()=>setStatus(""),4000);
  };

  // ══ PANEL ADMIN DE ENTIDAD — ve sus propias salas con datos de cultivo ══
  const cargarPanelEntidad = async () => {
    setEntidadLoaded(false);
    try {
      const entId = usuario.entidad_id;
      const [entR, salasR, usersR] = await Promise.all([
        supabase.from("entidades").select("nombre").eq("id", entId).single(),
        supabase.from("salas").select("*").eq("entidad_id", entId).order("creado_en"),
        supabase.from("usuarios").select("*").eq("entidad_id", entId).order("nombre")
      ]);
      const salas = salasR.data||[];
      setEntidadNombre(entR.data?.nombre||"");
      setEntidadSalas(salas);
      setEntidadUsuarios(usersR.data||[]);

      // Resumen por sala: plantas activas, tareas, cosechas
      const dataObj = {};
      await Promise.all(salas.map(async sala=>{
        const hoy = new Date().toISOString().slice(0,10);
        const [lotesR, tareasR, cosechasR] = await Promise.all([
          supabase.from("lotes").select("cantidad_plantas").eq("sala_id", sala.id).in("estado",["activo","maduracion"]),
          supabase.from("tareas").select("estado, fecha_programada").eq("sala_id", sala.id).neq("estado","completada"),
          supabase.from("lotes").select("peso_cosechado_gramos, cantidad_plantas").eq("sala_id", sala.id).eq("estado","cosechado")
        ]);
        const lotes = lotesR.data||[];
        const tareas = tareasR.data||[];
        const cosechas = cosechasR.data||[];
        dataObj[sala.id] = {
          plantasActivas: lotes.reduce((a,l)=>a+(l.cantidad_plantas||0),0),
          tareasPendientes: tareas.length,
          tareasAtrasadas: tareas.filter(t=>t.fecha_programada<hoy).length,
          cosechasTotal: cosechas.length,
          gramosTotal: cosechas.reduce((a,c)=>a+(parseFloat(c.peso_cosechado_gramos)||0),0)
        };
      }));
      setEntidadSalaData(dataObj);
      setEntidadLoaded(true);
    } catch(e) { setStatus("error cargando entidad: "+String(e).slice(0,60)); setTimeout(()=>setStatus(""),4000); }
  };

  const entrarModoMG = async (salaIdElegida) => {
    const misSalas = entidadSalas.filter(s=>s.master_grower_id===usuario.id);
    if(!salaIdElegida && misSalas.length>1){
      setEligiendoSalaMG(misSalas);
      return;
    }
    const salaFinal = salaIdElegida || misSalas[0]?.id || usuario.sala_id;
    if(!salaFinal){ window.alert("No estás asignado como Master Grower de ninguna sala todavía."); return; }
    setEligiendoSalaMG(null);
    setAdminEntidadModo('mg');
    setTab(null); // fuerza reset de tab al cargar
    await cargarTodo(salaFinal);
  };

  const volverModoEntidad = () => {
    setAdminEntidadModo('entidad');
    cargarPanelEntidad();
  };

  const crearSalaEntidad = async () => {
    if(!creandoSalaEntidad || !creandoSalaEntidad.nombre) return;
    setGuardandoSalaEntidad(true);
    try {
      const insS = await supabase.from("salas").insert({
        nombre: creandoSalaEntidad.nombre,
        entidad_id: usuario.entidad_id
      }).select().single();
      if(insS.error){ setStatus("error creando sala: "+insS.error.message.slice(0,80)); setGuardandoSalaEntidad(false); setTimeout(()=>setStatus(""),5000); return; }

      const insSP = await supabase.from("sectores_padre").insert([
        {sala_id: insS.data.id, nombre:"Enraizado", orden:1},
        {sala_id: insS.data.id, nombre:"Vegetativo", orden:2},
        {sala_id: insS.data.id, nombre:"Floración", orden:3},
        {sala_id: insS.data.id, nombre:"Secado", orden:4}
      ]);
      if(insSP.error){ setStatus("sala creada, pero error en sectores: "+insSP.error.message.slice(0,70)); setGuardandoSalaEntidad(false); setTimeout(()=>setStatus(""),5000); return; }

      if(creandoSalaEntidad.mgNombre && creandoSalaEntidad.mgEmail){
        const insU = await supabase.from("usuarios").insert({
          nombre: creandoSalaEntidad.mgNombre, email: creandoSalaEntidad.mgEmail,
          rol:"master_grower", entidad_id: usuario.entidad_id, sala_id: insS.data.id,
          activo:true, es_master_grower:true
        }).select().single();
        if(insU.error){ setStatus("sala creada, pero MG falló: "+insU.error.message.slice(0,70)); setGuardandoSalaEntidad(false); setTimeout(()=>setStatus(""),5500); cargarPanelEntidad(); return; }

        const updS = await supabase.from("salas").update({master_grower_id: insU.data.id}).eq("id", insS.data.id);
        if(updS.error){ setStatus("MG creado, pero no se pudo asignar a la sala: "+updS.error.message.slice(0,60)); setGuardandoSalaEntidad(false); setTimeout(()=>setStatus(""),5500); cargarPanelEntidad(); return; }
        setLinkInvitacion({ nombre: creandoSalaEntidad.mgNombre, url: window.location.origin + "/?invite=" + insU.data.id });
      }
      setCreandoSalaEntidad(null);
      setStatus("guardado"); setTimeout(()=>setStatus(""),1800);
      cargarPanelEntidad();
    } catch(e) { setStatus("error: "+String(e).slice(0,60)); setTimeout(()=>setStatus(""),5000); }
    setGuardandoSalaEntidad(false);
  };

  const confirmarEliminarUsuarioEntidad = async () => {
    if(!eliminandoUsuarioEntidad || eliminandoUsuarioEntidad.confirmText !== eliminandoUsuarioEntidad.usuario.nombre) return;
    setBorrandoUsuarioEntidad(true);
    try {
      const uid = eliminandoUsuarioEntidad.usuario.id;
      const desv = await supabase.from("salas").update({master_grower_id:null}).eq("master_grower_id", uid);
      if(desv.error){ setStatus("error desvinculando salas: "+desv.error.message.slice(0,70)); setBorrandoUsuarioEntidad(false); setTimeout(()=>setStatus(""),5500); return; }

      const del = await supabase.from("usuarios").delete().eq("id", uid);
      if(del.error){ setStatus("error: "+del.error.message.slice(0,80)); setBorrandoUsuarioEntidad(false); setTimeout(()=>setStatus(""),5000); return; }
      setEliminandoUsuarioEntidad(null);
      setStatus("usuario eliminado"); setTimeout(()=>setStatus(""),2500);
      cargarPanelEntidad();
    } catch(e) { setStatus("error: "+String(e).slice(0,60)); setTimeout(()=>setStatus(""),5000); }
    setBorrandoUsuarioEntidad(false);
  };

  const confirmarEliminarSalaEntidad = async () => {
    if(!eliminandoSalaEntidad || eliminandoSalaEntidad.confirmText !== eliminandoSalaEntidad.sala.nombre) return;
    setBorrandoSalaEntidad(true);
    const salaIdBorrar = eliminandoSalaEntidad.sala.id;
    try {
      const loteRows = await supabase.from("lotes").select("id").eq("sala_id", salaIdBorrar);
      const tareaRows = await supabase.from("tareas").select("id").eq("sala_id", salaIdBorrar);
      const loteIds = (loteRows.data||[]).map(l=>l.id);
      const tareaIds = (tareaRows.data||[]).map(t=>t.id);

      if(loteIds.length){ const r = await supabase.from("movimientos_lote").delete().in("lote_id", loteIds); if(r.error){ setStatus("error borrando movimientos: "+r.error.message.slice(0,60)); setBorrandoSalaEntidad(false); setTimeout(()=>setStatus(""),5000); return; } }
      if(tareaIds.length){ const r = await supabase.from("comentarios_tareas").delete().in("tarea_id", tareaIds); if(r.error){ setStatus("error borrando comentarios: "+r.error.message.slice(0,60)); setBorrandoSalaEntidad(false); setTimeout(()=>setStatus(""),5000); return; } }

      for (const [tabla] of [["tareas"],["lotes"],["relevamientos"],["geneticas"],["sectores"],["sectores_padre"],["tipos_tarea"]]) {
        const r = await supabase.from(tabla).delete().eq("sala_id", salaIdBorrar);
        if(r.error){ setStatus("error borrando "+tabla+": "+r.error.message.slice(0,60)); setBorrandoSalaEntidad(false); setTimeout(()=>setStatus(""),5500); return; }
      }

      const updU = await supabase.from("usuarios").update({sala_id:null, es_master_grower:false}).eq("sala_id", salaIdBorrar);
      if(updU.error){ setStatus("error liberando usuarios: "+updU.error.message.slice(0,60)); setBorrandoSalaEntidad(false); setTimeout(()=>setStatus(""),5000); return; }

      const delS = await supabase.from("salas").delete().eq("id", salaIdBorrar);
      if(delS.error){ setStatus("error borrando sala: "+delS.error.message.slice(0,80)); setBorrandoSalaEntidad(false); setTimeout(()=>setStatus(""),5500); return; }

      setEliminandoSalaEntidad(null);
      setStatus("sala eliminada"); setTimeout(()=>setStatus(""),2500);
      cargarPanelEntidad();
    } catch(e) { setStatus("error: "+String(e).slice(0,60)); setTimeout(()=>setStatus(""),5000); }
    setBorrandoSalaEntidad(false);
  };

  // Crear un Master Grower nuevo para una sala existente que todavía no tiene
  const crearMGparaSala = async () => {
    if(!agregandoMGSala || !agregandoMGSala.nombre || !agregandoMGSala.email) return;
    setGuardandoMGSala(true);
    try {
      const insU = await supabase.from("usuarios").insert({
        nombre: agregandoMGSala.nombre, email: agregandoMGSala.email,
        rol:"master_grower", entidad_id: usuario.entidad_id, sala_id: agregandoMGSala.salaId,
        activo:true, es_master_grower:true
      }).select().single();
      if(insU.error){ setStatus("error creando MG: "+insU.error.message.slice(0,70)); setGuardandoMGSala(false); setTimeout(()=>setStatus(""),5000); return; }
      const updS = await supabase.from("salas").update({master_grower_id: insU.data.id}).eq("id", agregandoMGSala.salaId);
      if(updS.error){ setStatus("MG creado, pero no se pudo asignar a la sala: "+updS.error.message.slice(0,60)); setGuardandoMGSala(false); setTimeout(()=>setStatus(""),5500); cargarPanelEntidad(); return; }
      const inv = { nombre: agregandoMGSala.nombre, url: window.location.origin + "/?invite=" + insU.data.id };
      setAgregandoMGSala(null);
      setLinkInvitacion(inv);
      setStatus("guardado"); setTimeout(()=>setStatus(""),1800);
      cargarPanelEntidad();
    } catch(e) { setStatus("error: "+String(e).slice(0,60)); setTimeout(()=>setStatus(""),5000); }
    setGuardandoMGSala(false);
  };

  const guardarUsuarioEntidad = async () => {
    if(!editandoUsuarioEntidad || !editandoUsuarioEntidad.nombre) return;
    setGuardandoUsuarioEntidad(true);
    try {
      const orig = entidadUsuarios.find(u=>u.id===editandoUsuarioEntidad.id);
      const emailNuevo = (editandoUsuarioEntidad.email||"").trim();
      const emailCambio = emailNuevo !== (orig?.email||"");
      if(emailCambio && orig?.auth_id){
        // Cambio de email de un usuario con cuenta → tiene que tocar Supabase Auth,
        // y eso solo se puede del lado del servidor (service_role). Va por el endpoint.
        const { data:{ session } } = await supabase.auth.getSession();
        const resp = await fetch("/api/update-user-email", {
          method:"POST",
          headers:{ "Content-Type":"application/json", "Authorization":"Bearer "+(session?.access_token||"") },
          body: JSON.stringify({ userId: editandoUsuarioEntidad.id, nombre: editandoUsuarioEntidad.nombre, email: emailNuevo })
        });
        let out = {}, crudo = "";
        try { crudo = await resp.text(); out = JSON.parse(crudo); } catch(_) {}
        if(!resp.ok){
          // Diagnóstico explícito: sin esto, un 404 (función no deployada) y un 403
          // (permisos) se ven exactamente igual y no se puede saber cuál es.
          let msg;
          if(resp.status===404) msg = "404: el endpoint /api/update-user-email no existe. Revisá que el archivo esté en api/update-user-email.js (sin .txt) y que Vercel haya deployado.";
          else if(out.error) msg = "["+resp.status+"] "+out.error;
          else msg = "["+resp.status+"] respuesta inesperada: "+String(crudo||"(vacía)").slice(0,60);
          setStatus("error: "+msg.slice(0,140));
          setGuardandoUsuarioEntidad(false);
          setTimeout(()=>setStatus(""),9000);
          return;
        }
      } else {
        // Solo nombre, o usuario todavía sin cuenta Auth (invitación pendiente): update directo
        const r = await supabase.from("usuarios").update({ nombre: editandoUsuarioEntidad.nombre, email: emailNuevo }).eq("id", editandoUsuarioEntidad.id);
        if(r.error){ setStatus("error: "+r.error.message.slice(0,80)); setGuardandoUsuarioEntidad(false); setTimeout(()=>setStatus(""),5000); return; }
      }
      setEditandoUsuarioEntidad(null);
      setStatus("guardado"); setTimeout(()=>setStatus(""),1800);
      cargarPanelEntidad();
    } catch(e) { setStatus("error: "+String(e).slice(0,60)); setTimeout(()=>setStatus(""),4000); }
    setGuardandoUsuarioEntidad(false);
  };

  const asignarmeComoMG = async (sala) => {    setAsignandoComoMG(true);
    try {
      const updS = await supabase.from("salas").update({master_grower_id: usuario.id}).eq("id", sala.id);
      if(updS.error){ setStatus("error asignando sala: "+updS.error.message.slice(0,70)); setAsignandoComoMG(false); setTimeout(()=>setStatus(""),5000); return; }
      if(!usuario.es_master_grower){
        const updU = await supabase.from("usuarios").update({es_master_grower:true}).eq("id", usuario.id);
        if(updU.error){ setStatus("error: "+updU.error.message.slice(0,80)); setAsignandoComoMG(false); setTimeout(()=>setStatus(""),5000); return; }
        setUsuario({...usuario, es_master_grower:true});
      }
      setStatus("asignado como MG de "+sala.nombre); setTimeout(()=>setStatus(""),2500);
      cargarPanelEntidad();
    } catch(e) { setStatus("error: "+String(e).slice(0,60)); setTimeout(()=>setStatus(""),5000); }
    setAsignandoComoMG(false);
  };

  const crearEjecutorEntidad = async () => {
    if(!creandoEjecutorEntidad || !creandoEjecutorEntidad.salaId || !creandoEjecutorEntidad.nombre || !creandoEjecutorEntidad.email) return;
    setGuardandoEjecutorEntidad(true);
    try {
      const insU = await supabase.from("usuarios").insert({
        nombre: creandoEjecutorEntidad.nombre, email: creandoEjecutorEntidad.email,
        rol:"ejecutor", entidad_id: usuario.entidad_id, sala_id: creandoEjecutorEntidad.salaId,
        activo:true, es_master_grower:false
      }).select().single();
      if(insU.error){ setStatus("error: "+insU.error.message.slice(0,80)); setGuardandoEjecutorEntidad(false); setTimeout(()=>setStatus(""),5000); return; }
      setLinkInvitacion({ nombre: creandoEjecutorEntidad.nombre, url: window.location.origin + "/?invite=" + insU.data.id });
      setCreandoEjecutorEntidad(null);
      setStatus("guardado"); setTimeout(()=>setStatus(""),1800);
      cargarPanelEntidad();
    } catch(e) { setStatus("error: "+String(e).slice(0,60)); setTimeout(()=>setStatus(""),5000); }
    setGuardandoEjecutorEntidad(false);
  };

  const reactivarODesactivarUsuarioEntidad = async (u) => {
    try { await supabase.from("usuarios").update({activo: !(u.activo!==false)}).eq("id", u.id); cargarPanelEntidad(); }
    catch(e) { setStatus("error al actualizar"); setTimeout(()=>setStatus(""),3000); }
  };

  const crearMasterGrowerAdmin = async (salaIdExistente) => {
    if(!editingMGAdmin) return;
    setSavingMGAdmin(true);
    try {
      const insU = await supabase.from("usuarios").insert({
        nombre: editingMGAdmin.nombre, email: editingMGAdmin.email,
        rol: "master_grower", activo: true, creado_por: usuario.id,
        sala_id: salaIdExistente || null
      }).select().single();
      if(insU.data){
        if(salaIdExistente){
          // Asignar a una sala que estaba sin Master Grower
          await supabase.from("salas").update({master_grower_id: insU.data.id}).eq("id", salaIdExistente);
        } else {
          // Sala nueva desde cero, con sus 4 sectores semilla
          const insS = await supabase.from("salas").insert({
            nombre: editingMGAdmin.salaNombre || `Sala de ${editingMGAdmin.nombre}`,
            master_grower_id: insU.data.id
          }).select().single();
          if(insS.data){
            await supabase.from("usuarios").update({sala_id: insS.data.id}).eq("id", insU.data.id);
            await supabase.from("sectores_padre").insert([
              {sala_id: insS.data.id, nombre:"Enraizado", orden:1},
              {sala_id: insS.data.id, nombre:"Vegetativo", orden:2},
              {sala_id: insS.data.id, nombre:"Floración", orden:3},
              {sala_id: insS.data.id, nombre:"Secado", orden:4}
            ]);
          }
        }
      }
      setEditingMGAdmin(null);
      setStatus("guardado"); setTimeout(()=>setStatus(""),1800);
      cargarPanelAdmin();
    } catch(e) { setStatus("error: "+String(e).slice(0,60)); setTimeout(()=>setStatus(""),4000); }
    setSavingMGAdmin(false);
  };

  // "Eliminar" Master Grower: desactiva al usuario y deja la sala sin dueño — la sala y sus datos siguen intactos
  const eliminarMasterGrowerAdmin = async (u) => {
    if(!window.confirm(`¿Quitar a ${u.nombre} como Master Grower? La sala queda activa, sin dueño, hasta asignarle uno nuevo.`)) return;
    try {
      await supabase.from("usuarios").update({activo:false}).eq("id", u.id);
      await supabase.from("salas").update({master_grower_id:null}).eq("master_grower_id", u.id);
      cargarPanelAdmin();
    } catch(e) { setStatus("error al quitar Master Grower"); setTimeout(()=>setStatus(""),3000); }
  };

  // "Eliminar" Ejecutor desde el panel admin: desactiva, nunca borra — el historial sigue mostrando su nombre
  const eliminarEjecutorAdmin = async (u) => {
    if(!window.confirm(`¿Desactivar a ${u.nombre}? Su historial de tareas y movimientos queda intacto, solo no podrá loguearse más.`)) return;
    try { await supabase.from("usuarios").update({activo:false}).eq("id", u.id); cargarPanelAdmin(); }
    catch(e) { setStatus("error al desactivar"); setTimeout(()=>setStatus(""),3000); }
  };

  const reactivarUsuarioAdmin = async (u) => {
    try { await supabase.from("usuarios").update({activo:true}).eq("id", u.id); cargarPanelAdmin(); }
    catch(e) { setStatus("error al reactivar"); setTimeout(()=>setStatus(""),3000); }
  };

  // Borrado DEFINITIVO de una Sala completa y todo su contenido — solo Administrador, solo con confirmación escrita
  const confirmarEliminarSala = async () => {
    if(!eliminandoSala) return;
    if(eliminandoSala.confirmText !== eliminandoSala.sala.nombre) return;
    setBorrandoSala(true);
    try {
      const salaId = eliminandoSala.sala.id;
      const lR = await supabase.from("lotes").select("id").eq("sala_id", salaId);
      const loteIds = (lR.data||[]).map(l=>l.id);
      const tR = await supabase.from("tareas").select("id").eq("sala_id", salaId);
      const tareaIds = (tR.data||[]).map(t=>t.id);

      if(loteIds.length) await supabase.from("movimientos_lote").delete().in("lote_id", loteIds);
      if(tareaIds.length) await supabase.from("comentarios_tareas").delete().in("tarea_id", tareaIds);
      await supabase.from("relevamientos").delete().eq("sala_id", salaId);
      await supabase.from("tareas").delete().eq("sala_id", salaId);
      await supabase.from("lotes").delete().eq("sala_id", salaId);
      await supabase.from("geneticas").delete().eq("sala_id", salaId);
      await supabase.from("tipos_tarea").delete().eq("sala_id", salaId);
      await supabase.from("sectores").delete().eq("sala_id", salaId);
      await supabase.from("sectores_padre").delete().eq("sala_id", salaId);
      await supabase.from("usuarios").delete().eq("sala_id", salaId);
      await supabase.from("salas").delete().eq("id", salaId);

      setEliminandoSala(null);
      setStatus("sala eliminada"); setTimeout(()=>setStatus(""),2500);
      cargarPanelAdmin();
    } catch(e) { setStatus("error al eliminar sala: "+String(e).slice(0,60)); setTimeout(()=>setStatus(""),4500); }
    setBorrandoSala(false);
  };

  const inviteIdEnUrl = new URLSearchParams(window.location.search).get("invite");
  if(inviteIdEnUrl) return <Invitacion
    usuarioId={inviteIdEnUrl}
    sesionActiva={usuario}
    onCerrarSesion={async ()=>{ await supabase.auth.signOut(); setUsuario(null); }}
    onIrALogin={async ()=>{ window.history.replaceState({},"",window.location.pathname); if(usuario){ await supabase.auth.signOut(); setUsuario(null); } setModoAuth("login"); }}
  />;

  if(!usuario) {
    return modoAuth==="login"
      ? <Login onLogin={handleLogin} onIrASignup={()=>setModoAuth("signup")} />
      : <Signup onIrALogin={()=>setModoAuth("login")} />;
  }
  if(!loaded)  return <div style={{background:"var(--c074)",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'IBM Plex Mono',monospace",color:"var(--c154)",fontSize:"14px"}}>Cargando...</div>;

  // ── PANEL ADMIN DE ENTIDAD ──
  const esAdminEntidad = usuario.rol==="administrador" && !!usuario.entidad_id;
  if(esAdminEntidad && adminEntidadModo==="entidad"){
    if(!entidadLoaded) return <div style={{background:"var(--c013)",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'IBM Plex Mono',monospace",color:"var(--c018)",fontSize:"14px"}}>Cargando panel de entidad...</div>;
    const totalPlantas = Object.values(entidadSalaData).reduce((a,d)=>a+d.plantasActivas,0);
    const totalGramos  = Object.values(entidadSalaData).reduce((a,d)=>a+d.gramosTotal,0);
    const totalAtrasadas = Object.values(entidadSalaData).reduce((a,d)=>a+d.tareasAtrasadas,0);
    const misSalasComoMG = entidadSalas.filter(s=>s.master_grower_id===usuario.id);
    const salaDelMG = misSalasComoMG.length===1 ? misSalasComoMG[0] : null;
    return (
      <div style={{background:"var(--c013)",minHeight:"100vh",fontFamily:"'IBM Plex Mono',monospace",color:"var(--c014)"}}>
        <div style={{background:"var(--c102)",borderBottom:"2px solid var(--c006)",padding:"18px 20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"21px",color:"var(--c015)"}}>🏢 {entidadNombre}</div>
              <div style={{fontSize:"11px",color:"var(--c061)",letterSpacing:"2px",marginTop:"4px"}}>{usuario.nombre} · ADMINISTRADOR DE ENTIDAD</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"6px"}}>
              {status && <div style={{fontSize:"11px",color:status==="guardado"?"var(--c001)":"var(--c080)",background:"var(--c103)",padding:"4px 10px",borderRadius:"10px"}}>{status}</div>}
              <button onClick={handleLogout} style={{fontSize:"11px",color:"var(--c038)",background:"transparent",border:"1px solid var(--c006)",borderRadius:"14px",padding:"4px 12px"}}>salir</button>
            </div>
          </div>
          {usuario.es_master_grower && misSalasComoMG.length>0 && (
            <button onClick={()=>entrarModoMG()} style={{marginTop:"12px",width:"100%",padding:"11px",borderRadius:"10px",fontSize:"13px",fontWeight:"600",background:"var(--c020)",color:"var(--c001)",border:"1px solid var(--c011)"}}>
              🌱 Entrar como Master Grower — {salaDelMG ? salaDelMG.nombre : misSalasComoMG.length+" salas"}
            </button>
          )}
        </div>

        {eligiendoSalaMG && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",zIndex:200}}>
            <div style={{background:"var(--c017)",border:"1px solid var(--c011)",borderRadius:"16px",padding:"20px",width:"100%",maxWidth:"360px"}}>
              <div style={{fontSize:"13px",color:"var(--c001)",marginBottom:"14px"}}>¿A qué sala querés entrar?</div>
              <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"12px"}}>
                {eligiendoSalaMG.map(s=>(
                  <button key={s.id} onClick={()=>entrarModoMG(s.id)} style={{padding:"12px",borderRadius:"10px",fontSize:"13px",background:"var(--c020)",color:"var(--c001)",border:"1px solid var(--c011)",textAlign:"left"}}>{s.nombre}</button>
                ))}
              </div>
              <button onClick={()=>setEligiendoSalaMG(null)} style={{width:"100%",padding:"10px",borderRadius:"10px",fontSize:"12px",background:"var(--c004)",color:"var(--c007)",border:"1px solid var(--c002)"}}>Cancelar</button>
            </div>
          </div>
        )}

        <div style={{padding:"18px"}}>
          {totalAtrasadas>0 && <div style={{background:"var(--c008)",border:"1px solid var(--c081)",borderRadius:"10px",padding:"10px 14px",marginBottom:"16px",fontSize:"12px",color:"var(--c029)"}}>⚠ {totalAtrasadas} tarea{totalAtrasadas!==1?"s":""} atrasada{totalAtrasadas!==1?"s":""} en toda la entidad</div>}

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px",marginBottom:"20px"}}>
            <div style={{background:"var(--c017)",borderRadius:"12px",padding:"14px 10px",textAlign:"center",border:"1px solid var(--c006)"}}>
              <div style={{fontSize:"22px",fontWeight:"700",color:"var(--c015)"}}>{entidadSalas.length}</div>
              <div style={{fontSize:"9px",color:"var(--c018)",marginTop:"4px"}}>SALAS</div>
            </div>
            <div style={{background:"var(--c017)",borderRadius:"12px",padding:"14px 10px",textAlign:"center",border:"1px solid var(--c006)"}}>
              <div style={{fontSize:"22px",fontWeight:"700",color:"var(--c001)"}}>{totalPlantas}</div>
              <div style={{fontSize:"9px",color:"var(--c018)",marginTop:"4px"}}>PLANTAS ACTIVAS</div>
            </div>
            <div style={{background:"var(--c017)",borderRadius:"12px",padding:"14px 10px",textAlign:"center",border:"1px solid var(--c006)"}}>
              <div style={{fontSize:"22px",fontWeight:"700",color:"var(--c003)"}}>{totalGramos.toFixed(0)}g</div>
              <div style={{fontSize:"9px",color:"var(--c018)",marginTop:"4px"}}>PRODUCCIÓN</div>
            </div>
          </div>

          <div style={{marginBottom:"24px",border:"1px solid var(--c006)",borderRadius:"14px",background:"var(--c155)",overflow:"hidden"}}>
            <div onClick={()=>setSalasEntidadAbierto(!salasEntidadAbierto)} style={{cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",background:"var(--c102)"}}>
              <span style={{fontSize:"11px",color:"var(--c015)",letterSpacing:"2px",fontWeight:"600"}}>🚪 SALAS · {entidadSalas.length}</span>
              <span style={{fontSize:"13px",color:"var(--c015)",transform:salasEntidadAbierto?"rotate(180deg)":"none",transition:"transform .2s"}}>▾</span>
            </div>
            {salasEntidadAbierto && (<div style={{padding:"14px"}}>

          {creandoSalaEntidad ? (
            <div style={{background:"var(--c017)",border:"1px dashed var(--c026)",borderRadius:"12px",padding:"14px",marginBottom:"14px"}}>
              <div style={{fontSize:"10px",color:"var(--c015)",letterSpacing:"1px",marginBottom:"8px"}}>NUEVA SALA</div>
              <input value={creandoSalaEntidad.nombre||""} onChange={e=>setCreandoSalaEntidad({...creandoSalaEntidad,nombre:e.target.value})} placeholder="Nombre de la sala" style={{width:"100%",background:"var(--c013)",border:"1px solid var(--c006)",borderRadius:"8px",color:"var(--c014)",fontSize:"13px",padding:"9px 12px",marginBottom:"8px"}}/>
              <div style={{fontSize:"9px",color:"var(--c018)",marginBottom:"6px"}}>MASTER GROWER (opcional, podés asignarlo después)</div>
              <input value={creandoSalaEntidad.mgNombre||""} onChange={e=>setCreandoSalaEntidad({...creandoSalaEntidad,mgNombre:e.target.value})} placeholder="Nombre del MG" style={{width:"100%",background:"var(--c013)",border:"1px solid var(--c006)",borderRadius:"8px",color:"var(--c014)",fontSize:"13px",padding:"9px 12px",marginBottom:"8px"}}/>
              <input value={creandoSalaEntidad.mgEmail||""} onChange={e=>setCreandoSalaEntidad({...creandoSalaEntidad,mgEmail:e.target.value})} placeholder="Email del MG" style={{width:"100%",background:"var(--c013)",border:"1px solid var(--c006)",borderRadius:"8px",color:"var(--c014)",fontSize:"13px",padding:"9px 12px",marginBottom:"10px"}}/>
              <div style={{display:"flex",gap:"8px"}}>
                <button disabled={guardandoSalaEntidad || !creandoSalaEntidad.nombre} onClick={crearSalaEntidad} style={{flex:1,padding:"9px",borderRadius:"8px",fontSize:"12px",fontWeight:"600",background:"var(--c062)",color:"var(--c005)",border:"none"}}>{guardandoSalaEntidad?"Guardando...":"✓ Crear sala"}</button>
                <button onClick={()=>setCreandoSalaEntidad(null)} style={{padding:"9px 14px",borderRadius:"8px",fontSize:"12px",background:"var(--c004)",color:"var(--c007)",border:"1px solid var(--c002)"}}>Cancelar</button>
              </div>
            </div>
          ) : (
            <button onClick={()=>setCreandoSalaEntidad({nombre:"",mgNombre:"",mgEmail:""})} style={{width:"100%",padding:"12px",borderRadius:"10px",fontSize:"12px",fontWeight:"600",background:"var(--c017)",color:"var(--c015)",border:"2px dashed var(--c026)",marginBottom:"14px"}}>+ Nueva Sala</button>
          )}
          <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"24px"}}>
            {entidadSalas.map(sala=>{
              const mg = entidadUsuarios.find(u=>u.id===sala.master_grower_id);
              const d = entidadSalaData[sala.id]||{plantasActivas:0,tareasPendientes:0,tareasAtrasadas:0,cosechasTotal:0,gramosTotal:0};
              const mgLabel = mg ? "MG: "+mg.nombre+(mg.activo===false?" (inactivo)":"") : "⚠ Sin Master Grower";
              const mgColor = mg ? "var(--c082)" : "var(--c010)";
              return (
                <div key={sala.id} style={{background:"var(--c017)",border:"1px solid var(--c006)",borderRadius:"14px",padding:"16px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"12px"}}>
                    <div>
                      <div style={{fontSize:"15px",fontWeight:"600",color:"var(--c104)"}}>{sala.nombre}</div>
                      <div style={{fontSize:"12px",color:mgColor,marginTop:"3px"}}>{mgLabel}</div>
                    </div>
                    <button onClick={()=>setEliminandoSalaEntidad({sala, confirmText:""})} style={{padding:"4px 9px",borderRadius:"6px",fontSize:"10px",background:"var(--c008)",color:"var(--c012)",border:"1px solid var(--c009)",whiteSpace:"nowrap"}}>🗑 Eliminar sala</button>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"6px"}}>
                    <div style={{background:"var(--c063)",borderRadius:"8px",padding:"8px 4px",textAlign:"center"}}>
                      <div style={{fontSize:"16px",fontWeight:"700",color:"var(--c001)"}}>{d.plantasActivas}</div>
                      <div style={{fontSize:"8px",color:"var(--c043)",marginTop:"2px"}}>PLANTAS</div>
                    </div>
                    <div style={{background:"var(--c063)",borderRadius:"8px",padding:"8px 4px",textAlign:"center"}}>
                      <div style={{fontSize:"16px",fontWeight:"700",color:d.tareasAtrasadas>0?"var(--c010)":"var(--c003)"}}>{d.tareasPendientes}</div>
                      <div style={{fontSize:"8px",color:"var(--c043)",marginTop:"2px"}}>TAREAS</div>
                    </div>
                    <div style={{background:"var(--c063)",borderRadius:"8px",padding:"8px 4px",textAlign:"center"}}>
                      <div style={{fontSize:"16px",fontWeight:"700",color:"var(--c003)"}}>{d.cosechasTotal}</div>
                      <div style={{fontSize:"8px",color:"var(--c043)",marginTop:"2px"}}>COSECHAS</div>
                    </div>
                    <div style={{background:"var(--c063)",borderRadius:"8px",padding:"8px 4px",textAlign:"center"}}>
                      <div style={{fontSize:"16px",fontWeight:"700",color:"var(--c001)"}}>{d.gramosTotal.toFixed(0)}g</div>
                      <div style={{fontSize:"8px",color:"var(--c043)",marginTop:"2px"}}>GRAMOS</div>
                    </div>
                  </div>
                  {d.tareasAtrasadas>0 && <div style={{marginTop:"8px",fontSize:"10px",color:"var(--c010)"}}>⚠ {d.tareasAtrasadas} tarea{d.tareasAtrasadas!==1?"s":""} atrasada{d.tareasAtrasadas!==1?"s":""}</div>}
                  <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginTop:"10px"}}>
                    <button onClick={()=>setCreandoEjecutorEntidad({nombre:"",email:"",salaId:sala.id})} style={{padding:"6px 10px",borderRadius:"7px",fontSize:"10px",background:"var(--c044)",color:"var(--c001)",border:"1px solid var(--c045)"}}>+ Nuevo Ejecutor para esta sala</button>
                    {!sala.master_grower_id ? (
                      <>
                        <button onClick={()=>setAgregandoMGSala({salaId:sala.id, salaNombre:sala.nombre, nombre:"", email:""})} style={{padding:"6px 10px",borderRadius:"7px",fontSize:"10px",background:"var(--c105)",color:"var(--c015)",border:"1px solid var(--c026)"}}>🌱 Agregar Master Grower</button>
                        <button disabled={asignandoComoMG} onClick={()=>asignarmeComoMG(sala)} style={{padding:"6px 10px",borderRadius:"7px",fontSize:"10px",background:"var(--c017)",color:"var(--c018)",border:"1px solid var(--c006)"}}>{asignandoComoMG?"Asignando...":"Asignarme a mí"}</button>
                      </>
                    ) : (mg && mg.activo===false) ? (
                      <button onClick={()=>reactivarODesactivarUsuarioEntidad(mg)} style={{padding:"6px 10px",borderRadius:"7px",fontSize:"10px",background:"var(--c044)",color:"var(--c001)",border:"1px solid var(--c045)"}}>↺ Reactivar MG ({mg.nombre})</button>
                    ) : (
                      <button disabled style={{padding:"6px 10px",borderRadius:"7px",fontSize:"10px",background:"var(--c156)",color:"var(--c157)",border:"1px solid var(--c158)",cursor:"default"}}>✓ MG asignado{mg?": "+mg.nombre:""}</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
            </div>)}
          </div>

          {linkInvitacion && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",zIndex:200}}>
            <div style={{background:"var(--c017)",border:"1px solid var(--c011)",borderRadius:"16px",padding:"22px",width:"100%",maxWidth:"380px"}}>
              <div style={{fontSize:"13px",color:"var(--c001)",marginBottom:"10px"}}>✓ Cuenta creada para {linkInvitacion.nombre}</div>
              <div style={{fontSize:"11px",color:"var(--c159)",marginBottom:"12px",lineHeight:"1.6"}}>Todavía no puede loguearse. Mandale este link por WhatsApp o el medio que uses — al abrirlo va a poder poner su propia contraseña.</div>
              <div style={{background:"var(--c013)",border:"1px solid var(--c025)",borderRadius:"8px",padding:"10px 12px",fontSize:"11px",color:"var(--c014)",wordBreak:"break-all",marginBottom:"14px"}}>{linkInvitacion.url}</div>
              <div style={{display:"flex",gap:"8px"}}>
                <button onClick={()=>{navigator.clipboard.writeText(linkInvitacion.url); setStatus("link copiado"); setTimeout(()=>setStatus(""),1800);}} style={{flex:1,padding:"11px",borderRadius:"9px",fontSize:"12px",fontWeight:"600",background:"var(--c041)",color:"var(--c019)",border:"1px solid var(--c042)"}}>📋 Copiar link</button>
                <button onClick={()=>setLinkInvitacion(null)} style={{padding:"11px 16px",borderRadius:"9px",fontSize:"12px",background:"var(--c004)",color:"var(--c007)",border:"1px solid var(--c002)"}}>Cerrar</button>
              </div>
            </div>
          </div>
        )}

        {eliminandoSalaEntidad && (
            <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",zIndex:200}}>
              <div style={{background:"var(--c046)",border:"1px solid var(--c047)",borderRadius:"16px",padding:"22px",width:"100%",maxWidth:"380px"}}>
                <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"18px",color:"var(--c029)",marginBottom:"10px"}}>⚠ Eliminar "{eliminandoSalaEntidad.sala.nombre}"</div>
                {(() => {
                  const dd = entidadSalaData[eliminandoSalaEntidad.sala.id]||{plantasActivas:0,tareasPendientes:0,cosechasTotal:0};
                  const tieneDatos = dd.plantasActivas>0 || dd.tareasPendientes>0 || dd.cosechasTotal>0;
                  return tieneDatos ? (
                    <div style={{background:"var(--c160)",border:"1px solid var(--c161)",borderRadius:"10px",padding:"10px 12px",fontSize:"11px",color:"var(--c162)",marginBottom:"12px"}}>
                      Esta sala tiene {dd.plantasActivas} plantas, {dd.tareasPendientes} tareas y {dd.cosechasTotal} cosechas registradas. Se borra TODO — lotes, sectores, tareas, relevamientos, genéticas. No se puede deshacer.
                    </div>
                  ) : (
                    <div style={{fontSize:"12px",color:"var(--c048)",marginBottom:"14px",lineHeight:"1.6"}}>Esta sala está vacía. Se borra definitivamente.</div>
                  );
                })()}
                <div style={{fontSize:"10px",color:"var(--c039)",letterSpacing:"1px",marginBottom:"6px"}}>ESCRIBÍ "{eliminandoSalaEntidad.sala.nombre}" PARA CONFIRMAR</div>
                <input value={eliminandoSalaEntidad.confirmText} onChange={e=>setEliminandoSalaEntidad({...eliminandoSalaEntidad,confirmText:e.target.value})} style={{width:"100%",background:"var(--c013)",border:"1px solid var(--c009)",borderRadius:"8px",color:"var(--c014)",fontSize:"13px",padding:"9px 12px",marginBottom:"14px"}}/>
                <div style={{display:"flex",gap:"10px"}}>
                  <button disabled={borrandoSalaEntidad || eliminandoSalaEntidad.confirmText!==eliminandoSalaEntidad.sala.nombre} onClick={confirmarEliminarSalaEntidad} style={{flex:1,padding:"12px",borderRadius:"10px",fontSize:"14px",fontWeight:"600",background:"var(--c049)",color:"var(--c005)",border:"1px solid var(--c050)"}}>{borrandoSalaEntidad?"Eliminando...":"🗑 Eliminar definitivamente"}</button>
                  <button onClick={()=>setEliminandoSalaEntidad(null)} style={{padding:"12px 18px",borderRadius:"10px",fontSize:"14px",background:"var(--c004)",color:"var(--c007)",border:"1px solid var(--c002)"}}>Cancelar</button>
                </div>
              </div>
            </div>
          )}

          {creandoEjecutorEntidad && (
            <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",zIndex:200}}>
              <div style={{background:"var(--c017)",border:"1px solid var(--c026)",borderRadius:"16px",padding:"20px",width:"100%",maxWidth:"360px"}}>
                <div style={{fontSize:"11px",color:"var(--c015)",letterSpacing:"1px",marginBottom:"12px"}}>NUEVO EJECUTOR</div>
                <input value={creandoEjecutorEntidad.nombre} onChange={e=>setCreandoEjecutorEntidad({...creandoEjecutorEntidad,nombre:e.target.value})} placeholder="Nombre" style={{width:"100%",background:"var(--c013)",border:"1px solid var(--c006)",borderRadius:"8px",color:"var(--c014)",fontSize:"13px",padding:"9px 12px",marginBottom:"8px"}}/>
                <input value={creandoEjecutorEntidad.email} onChange={e=>setCreandoEjecutorEntidad({...creandoEjecutorEntidad,email:e.target.value})} placeholder="Email" style={{width:"100%",background:"var(--c013)",border:"1px solid var(--c006)",borderRadius:"8px",color:"var(--c014)",fontSize:"13px",padding:"9px 12px",marginBottom:"14px"}}/>
                <div style={{display:"flex",gap:"8px"}}>
                  <button disabled={guardandoEjecutorEntidad || !creandoEjecutorEntidad.nombre || !creandoEjecutorEntidad.email} onClick={crearEjecutorEntidad} style={{flex:1,padding:"10px",borderRadius:"8px",fontSize:"12px",fontWeight:"600",background:"var(--c062)",color:"var(--c005)",border:"none"}}>{guardandoEjecutorEntidad?"Guardando...":"✓ Crear"}</button>
                  <button onClick={()=>setCreandoEjecutorEntidad(null)} style={{padding:"10px 14px",borderRadius:"8px",fontSize:"12px",background:"var(--c004)",color:"var(--c007)",border:"1px solid var(--c002)"}}>Cancelar</button>
                </div>
              </div>
            </div>
          )}

          <div style={{fontSize:"10px",color:"var(--c018)",letterSpacing:"2px",marginBottom:"12px"}}>USUARIOS DE LA ENTIDAD ({entidadUsuarios.length})</div>
          <div style={{display:"flex",flexDirection:"column",gap:"8px",paddingBottom:"30px"}}>
            {entidadUsuarios.map(u=>{
              const rolLabel = u.rol==="administrador"?"ADMIN":u.rol==="master_grower"?"MASTER GROWER":"EJECUTOR";
              const btnBg = u.activo===false?"var(--c044)":"var(--c008)";
              const btnColor = u.activo===false?"var(--c001)":"var(--c012)";
              const btnBorder = u.activo===false?"var(--c045)":"var(--c009)";
              const salaU = u.sala_id ? entidadSalas.find(s=>s.id===u.sala_id) : null;
              const esMGde = entidadSalas.filter(s=>s.master_grower_id===u.id).map(s=>s.nombre);
              const ubicacion = esMGde.length ? "MG de "+esMGde.join(", ") : (salaU ? "En "+salaU.nombre : (u.rol==="administrador" ? "Entidad (sin sala)" : "Sin sala asignada"));
              return (
                <div key={u.id} style={{background:"var(--c017)",borderRadius:"10px",padding:"10px 14px",opacity:u.activo===false?0.5:1,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:"13px",color:"var(--c163)"}}>{u.nombre}</div>
                    <div style={{fontSize:"10px",color:"var(--c018)",marginTop:"2px"}}>{rolLabel}{u.es_master_grower?" + MG":""}{u.activo===false?" · INACTIVO":""}{!u.auth_id?" · SIN CUENTA CREADA":""}</div>
                    <div style={{fontSize:"10px",color:"var(--c164)",marginTop:"3px"}}>📍 {ubicacion}</div>
                    {u.email && <div style={{fontSize:"10px",color:"var(--c043)",marginTop:"2px"}}>{u.email}</div>}
                  </div>
                  {u.id!==usuario.id && (
                    <div style={{display:"flex",gap:"6px",flexWrap:"wrap",justifyContent:"flex-end"}}>
                      <button onClick={()=>setEditandoUsuarioEntidad({id:u.id, nombre:u.nombre||"", email:u.email||""})} style={{padding:"5px 10px",borderRadius:"6px",fontSize:"10px",background:"var(--c020)",color:"var(--c001)",border:"1px solid var(--c011)"}}>✏️</button>
                      {!u.auth_id && (
                        <button onClick={()=>{navigator.clipboard.writeText(window.location.origin+"/?invite="+u.id); setStatus("link copiado"); setTimeout(()=>setStatus(""),1800);}} style={{padding:"5px 10px",borderRadius:"6px",fontSize:"10px",background:"var(--c105)",color:"var(--c015)",border:"1px solid var(--c026)"}}>📋 Invitación</button>
                      )}
                      <button onClick={()=>reactivarODesactivarUsuarioEntidad(u)} style={{padding:"5px 10px",borderRadius:"6px",fontSize:"10px",background:btnBg,color:btnColor,border:"1px solid "+btnBorder}}>
                        {u.activo===false?"↺ Activar":"⏸ Desactivar"}
                      </button>
                      <button onClick={()=>setEliminandoUsuarioEntidad({usuario:u, confirmText:""})} style={{padding:"5px 10px",borderRadius:"6px",fontSize:"10px",background:"var(--c008)",color:"var(--c083)",border:"1px solid var(--c081)"}}>🗑</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {eliminandoUsuarioEntidad && (
            <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",zIndex:200}}>
              <div style={{background:"var(--c046)",border:"1px solid var(--c047)",borderRadius:"16px",padding:"22px",width:"100%",maxWidth:"380px"}}>
                <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"18px",color:"var(--c029)",marginBottom:"10px"}}>⚠ Eliminar a "{eliminandoUsuarioEntidad.usuario.nombre}"</div>
                <div style={{fontSize:"12px",color:"var(--c048)",marginBottom:"14px",lineHeight:"1.6"}}>Esto borra al usuario definitivamente (no solo lo desactiva). Su historial de tareas y movimientos queda, pero desvinculado. La cuenta de acceso (Auth) sigue existiendo del lado de Supabase — esto no la borra.</div>
                <div style={{fontSize:"10px",color:"var(--c039)",letterSpacing:"1px",marginBottom:"6px"}}>ESCRIBÍ "{eliminandoUsuarioEntidad.usuario.nombre}" PARA CONFIRMAR</div>
                <input value={eliminandoUsuarioEntidad.confirmText} onChange={e=>setEliminandoUsuarioEntidad({...eliminandoUsuarioEntidad,confirmText:e.target.value})} style={{width:"100%",background:"var(--c013)",border:"1px solid var(--c009)",borderRadius:"8px",color:"var(--c014)",fontSize:"13px",padding:"9px 12px",marginBottom:"14px"}}/>
                {status && status.startsWith("error") && <div style={{fontSize:"11px",color:"var(--c029)",marginBottom:"12px"}}>{status}</div>}
                <div style={{display:"flex",gap:"10px"}}>
                  <button disabled={borrandoUsuarioEntidad || eliminandoUsuarioEntidad.confirmText!==eliminandoUsuarioEntidad.usuario.nombre} onClick={confirmarEliminarUsuarioEntidad} style={{flex:1,padding:"12px",borderRadius:"10px",fontSize:"14px",fontWeight:"600",background:"var(--c049)",color:"var(--c005)",border:"1px solid var(--c050)"}}>{borrandoUsuarioEntidad?"Eliminando...":"🗑 Eliminar definitivamente"}</button>
                  <button onClick={()=>setEliminandoUsuarioEntidad(null)} style={{padding:"12px 18px",borderRadius:"10px",fontSize:"14px",background:"var(--c004)",color:"var(--c007)",border:"1px solid var(--c002)"}}>Cancelar</button>
                </div>
              </div>
            </div>
          )}

          {agregandoMGSala && (
            <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",zIndex:200}}>
              <div style={{background:"var(--c017)",border:"1px solid var(--c026)",borderRadius:"16px",padding:"20px",width:"100%",maxWidth:"360px"}}>
                <div style={{fontSize:"11px",color:"var(--c015)",letterSpacing:"1px",marginBottom:"4px"}}>NUEVO MASTER GROWER</div>
                <div style={{fontSize:"11px",color:"var(--c018)",marginBottom:"12px"}}>para la sala {agregandoMGSala.salaNombre}</div>
                <input value={agregandoMGSala.nombre} onChange={e=>setAgregandoMGSala({...agregandoMGSala,nombre:e.target.value})} placeholder="Nombre del MG" style={{width:"100%",background:"var(--c013)",border:"1px solid var(--c006)",borderRadius:"8px",color:"var(--c014)",fontSize:"13px",padding:"9px 12px",marginBottom:"8px"}}/>
                <input value={agregandoMGSala.email} onChange={e=>setAgregandoMGSala({...agregandoMGSala,email:e.target.value})} placeholder="Email del MG" style={{width:"100%",background:"var(--c013)",border:"1px solid var(--c006)",borderRadius:"8px",color:"var(--c014)",fontSize:"13px",padding:"9px 12px",marginBottom:"14px"}}/>
                <div style={{display:"flex",gap:"8px"}}>
                  <button disabled={guardandoMGSala || !agregandoMGSala.nombre || !agregandoMGSala.email} onClick={crearMGparaSala} style={{flex:1,padding:"10px",borderRadius:"8px",fontSize:"12px",fontWeight:"600",background:"var(--c062)",color:"var(--c005)",border:"none"}}>{guardandoMGSala?"Guardando...":"✓ Crear MG"}</button>
                  <button onClick={()=>setAgregandoMGSala(null)} style={{padding:"10px 14px",borderRadius:"8px",fontSize:"12px",background:"var(--c004)",color:"var(--c007)",border:"1px solid var(--c002)"}}>Cancelar</button>
                </div>
              </div>
            </div>
          )}

          {editandoUsuarioEntidad && (
            <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",zIndex:200}}>
              <div style={{background:"var(--c017)",border:"1px solid var(--c026)",borderRadius:"16px",padding:"20px",width:"100%",maxWidth:"360px"}}>
                <div style={{fontSize:"11px",color:"var(--c015)",letterSpacing:"1px",marginBottom:"12px"}}>EDITAR USUARIO</div>
                <div style={{fontSize:"9px",color:"var(--c018)",marginBottom:"4px"}}>NOMBRE</div>
                <input value={editandoUsuarioEntidad.nombre} onChange={e=>setEditandoUsuarioEntidad({...editandoUsuarioEntidad,nombre:e.target.value})} placeholder="Nombre" style={{width:"100%",background:"var(--c013)",border:"1px solid var(--c006)",borderRadius:"8px",color:"var(--c014)",fontSize:"13px",padding:"9px 12px",marginBottom:"10px"}}/>
                <div style={{fontSize:"9px",color:"var(--c018)",marginBottom:"4px"}}>EMAIL</div>
                <input value={editandoUsuarioEntidad.email} onChange={e=>setEditandoUsuarioEntidad({...editandoUsuarioEntidad,email:e.target.value})} placeholder="Email" style={{width:"100%",background:"var(--c013)",border:"1px solid var(--c006)",borderRadius:"8px",color:"var(--c014)",fontSize:"13px",padding:"9px 12px",marginBottom:"6px"}}/>
                <div style={{fontSize:"10px",color:"var(--c106)",background:"var(--c165)",borderRadius:"6px",padding:"7px 10px",marginBottom:"14px",lineHeight:"1.4"}}>Si el usuario ya tiene cuenta, cambiar el email acá <b>también cambia su correo de acceso</b> (login). Queda confirmado al instante, sin mail de verificación. Los que todavía no aceptaron la invitación no tienen cuenta, así que solo se actualiza su ficha.</div>
                {status && status.startsWith("error") && <div style={{fontSize:"11px",color:"var(--c029)",background:"var(--c008)",border:"1px solid var(--c081)",borderRadius:"6px",padding:"8px 10px",marginBottom:"12px",lineHeight:"1.4",wordBreak:"break-word"}}>{status}</div>}
                <div style={{display:"flex",gap:"8px"}}>
                  <button disabled={guardandoUsuarioEntidad || !editandoUsuarioEntidad.nombre} onClick={guardarUsuarioEntidad} style={{flex:1,padding:"10px",borderRadius:"8px",fontSize:"12px",fontWeight:"600",background:"var(--c084)",color:"var(--c005)",border:"none"}}>{guardandoUsuarioEntidad?"Guardando...":"✓ Guardar"}</button>
                  <button onClick={()=>setEditandoUsuarioEntidad(null)} style={{padding:"10px 14px",borderRadius:"8px",fontSize:"12px",background:"var(--c004)",color:"var(--c007)",border:"1px solid var(--c002)"}}>Cancelar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if(usuario.rol==="administrador" && !usuario.entidad_id){
    if(!adminLoaded) return <div style={{background:"var(--c107)",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'IBM Plex Mono',monospace",color:"var(--c166)",fontSize:"14px"}}>Cargando panel...</div>;
    return (
      <div style={{background:"var(--c107)",minHeight:"100vh",fontFamily:"'IBM Plex Mono',monospace",color:"var(--c014)"}}>
        <div style={{background:"var(--c108)",borderBottom:"2px solid var(--c006)",padding:"18px 20px",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"22px",color:"var(--c015)"}}>🛡 Panel Administrador</div>
            <div style={{fontSize:"11px",color:"var(--c061)",letterSpacing:"2px",marginTop:"4px"}}>{usuario.nombre}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"6px"}}>
            {status && <div style={{fontSize:"11px",color:status==="guardado"||status==="sala eliminada"?"var(--c001)":"var(--c080)",background:"var(--c103)",padding:"5px 10px",borderRadius:"10px"}}>{status}</div>}
            <button onClick={handleLogout} style={{fontSize:"11px",color:"var(--c038)",background:"transparent",border:"1px solid var(--c006)",borderRadius:"14px",padding:"4px 12px"}}>salir</button>
          </div>
        </div>

        <div style={{padding:"20px"}}>
          {editingMGAdmin ? (
            <div style={card({background:"var(--c167)",borderColor:"var(--c026)"})}>
              <span style={lbl("var(--c015)")}>{editingMGAdmin.salaIdExistente?"ASIGNAR MASTER GROWER A SALA SIN DUEÑO":"NUEVO MASTER GROWER + SALA NUEVA"}</span>
              <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                <div>
                  <div style={{...lbl("var(--c085)"),marginBottom:"6px"}}>NOMBRE</div>
                  <input value={editingMGAdmin.nombre} onChange={e=>setEditingMGAdmin({...editingMGAdmin,nombre:e.target.value})} style={inp()}/>
                </div>
                <div>
                  <div style={{...lbl("var(--c085)"),marginBottom:"6px"}}>EMAIL</div>
                  <input type="email" value={editingMGAdmin.email} onChange={e=>setEditingMGAdmin({...editingMGAdmin,email:e.target.value})} style={inp()}/>
                </div>
                {!editingMGAdmin.salaIdExistente && (
                  <div>
                    <div style={{...lbl("var(--c085)"),marginBottom:"6px"}}>NOMBRE DE LA SALA NUEVA</div>
                    <input value={editingMGAdmin.salaNombre} onChange={e=>setEditingMGAdmin({...editingMGAdmin,salaNombre:e.target.value})} placeholder={"Sala de "+(editingMGAdmin.nombre||"...")} style={inp()}/>
                  </div>
                )}
                <div style={{display:"flex",gap:"10px"}}>
                  <button disabled={savingMGAdmin || !editingMGAdmin.nombre || !editingMGAdmin.email} onClick={()=>crearMasterGrowerAdmin(editingMGAdmin.salaIdExistente)} style={{flex:1,padding:"10px",borderRadius:"8px",fontSize:"13px",fontWeight:"600",background:"var(--c062)",color:"var(--c005)",border:"none"}}>{savingMGAdmin?"Guardando...":"✓ Guardar"}</button>
                  <button onClick={()=>setEditingMGAdmin(null)} style={{padding:"10px 16px",borderRadius:"8px",fontSize:"13px",background:"var(--c004)",color:"var(--c007)",border:"1px solid var(--c002)"}}>Cancelar</button>
                </div>
              </div>
            </div>
          ) : (
            <button onClick={()=>setEditingMGAdmin({nombre:"",email:"",salaNombre:"",salaIdExistente:null})} style={{width:"100%",padding:"14px",borderRadius:"10px",fontSize:"13px",fontWeight:"600",background:"var(--c108)",color:"var(--c015)",border:"2px dashed var(--c026)",marginBottom:"20px"}}>+ Nuevo Master Grower (Sala nueva)</button>
          )}

          <div style={{fontSize:"13px",color:"var(--c038)",marginBottom:"14px"}}>{salasTodas.length} sala{salasTodas.length!==1?"s":""}</div>

          <div style={card({background:"var(--c168)",borderColor:"var(--c109)"})}>
            <span style={lbl("var(--c082)")}>🏢 ENTIDADES ({todasEntidades.length})</span>
            <div style={{display:"flex",flexDirection:"column",gap:"8px",marginTop:"6px"}}>
              {todasEntidades.map(ent=>{
                const salasDeEsta = salasTodas.filter(s=>s.entidad_id===ent.id).length;
                const usuariosDeEsta = usuariosTodos.filter(u=>u.entidad_id===ent.id).length;
                const puedeBorrar = salasDeEsta===0;
                return (
                  <div key={ent.id} style={{background:"var(--c110)",borderRadius:"10px",padding:"10px 12px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"}}>
                      <span style={{fontSize:"13px",color:"var(--c169)",fontWeight:"600"}}>{ent.nombre}</span>
                      {puedeBorrar ? (
                        <button onClick={()=>setEliminandoEntidad({entidad:ent, confirmText:""})} style={{padding:"5px 10px",borderRadius:"7px",fontSize:"10px",background:"var(--c008)",color:"var(--c012)",border:"1px solid var(--c009)"}}>🗑 Eliminar</button>
                      ) : (
                        <span style={{fontSize:"9px",color:"var(--c018)"}}>no se puede borrar con salas activas</span>
                      )}
                    </div>
                    <div style={{fontSize:"10px",color:"var(--c038)",marginBottom:"8px"}}>{salasDeEsta} sala{salasDeEsta!==1?"s":""} · {usuariosDeEsta} usuario{usuariosDeEsta!==1?"s":""}</div>
                    <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
                      <span style={{fontSize:"9px",color:"var(--c038)"}}>EXPIRA:</span>
                      <input type="date" value={ent.fecha_expiracion? ent.fecha_expiracion.slice(0,10):""} onChange={e=>actualizarExpiracionEntidad(ent.id, e.target.value)} style={{background:"var(--c017)",border:"1px solid var(--c006)",borderRadius:"6px",color:"var(--c014)",fontSize:"10px",padding:"4px 8px",colorScheme:"dark"}}/>
                      {ent.fecha_expiracion && <button onClick={()=>actualizarExpiracionEntidad(ent.id, null)} style={{fontSize:"9px",color:"var(--c038)",background:"transparent",border:"none"}}>quitar</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {salasTodas.map(sala=>{
            const mg = usuariosTodos.find(u=>u.id===sala.master_grower_id);
            const miembros = usuariosTodos.filter(u=>u.sala_id===sala.id);
            return (
              <div key={sala.id} style={card({background:"var(--c170)",borderColor:"var(--c006)"})}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"10px"}}>
                  <div>
                    <div style={{fontSize:"16px",fontWeight:"600",color:"var(--c104)"}}>{sala.nombre}</div>
                    <div style={{fontSize:"12px",color:mg?"var(--c082)":"var(--c010)",marginTop:"3px"}}>{mg?"Master Grower: "+mg.nombre+(mg.activo===false?" (desactivado)":""):"⚠ Sin Master Grower asignado"}</div>
                  </div>
                  <button onClick={()=>setEliminandoSala({sala, confirmText:""})} style={{padding:"6px 10px",borderRadius:"7px",fontSize:"10px",background:"var(--c008)",color:"var(--c012)",border:"1px solid var(--c009)"}}>🗑 Eliminar sala</button>
                </div>

                {mg && (
                  <button onClick={()=>eliminarMasterGrowerAdmin(mg)} style={{padding:"6px 10px",borderRadius:"7px",fontSize:"10px",background:"var(--c111)",color:"var(--c003)",border:"1px solid var(--c171)",marginBottom:"10px"}}>⏸ Quitar como Master Grower</button>
                )}
                {!mg && (
                  <button onClick={()=>setEditingMGAdmin({nombre:"",email:"",salaNombre:"",salaIdExistente:sala.id})} style={{padding:"6px 10px",borderRadius:"7px",fontSize:"10px",background:"var(--c044)",color:"var(--c001)",border:"1px solid var(--c045)",marginBottom:"10px"}}>+ Asignar Master Grower</button>
                )}

                <div style={{fontSize:"11px",color:"var(--c061)",marginBottom:"8px"}}>{miembros.length} usuario{miembros.length!==1?"s":""} en esta sala</div>
                <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                  {miembros.map(u=>(
                    <div key={u.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"var(--c110)",borderRadius:"8px",padding:"8px 12px",opacity:u.activo===false?0.5:1}}>
                      <span style={{fontSize:"12px",color:"var(--c172)"}}>{u.nombre} <span style={{color:"var(--c061)"}}>· {u.rol==="ejecutor"?"Ejecutor":"Master Grower"}{u.activo===false?" · desactivado":""}</span></span>
                      {u.activo===false ? (
                        <button onClick={()=>reactivarUsuarioAdmin(u)} style={{padding:"4px 9px",borderRadius:"6px",fontSize:"10px",background:"var(--c044)",color:"var(--c001)",border:"1px solid var(--c045)"}}>↺ Reactivar</button>
                      ) : (
                        <button onClick={()=>u.rol==="master_grower"?eliminarMasterGrowerAdmin(u):eliminarEjecutorAdmin(u)} style={{padding:"4px 9px",borderRadius:"6px",fontSize:"10px",background:"var(--c008)",color:"var(--c012)",border:"1px solid var(--c009)"}}>Desactivar</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* ══ MODAL: ELIMINAR ENTIDAD SIN USO — confirmación escrita, irreversible ══ */}
        {eliminandoEntidad && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",zIndex:200}}>
            <div style={{background:"var(--c046)",border:"1px solid var(--c047)",borderRadius:"16px",padding:"22px",width:"100%",maxWidth:"380px"}}>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"18px",color:"var(--c029)",marginBottom:"10px"}}>⚠ Eliminar "{eliminandoEntidad.entidad.nombre}"</div>
              <div style={{fontSize:"12px",color:"var(--c048)",marginBottom:"14px",lineHeight:"1.6"}}>Esto borra DEFINITIVAMENTE la entidad y su usuario administrador. No se puede deshacer.</div>
              <div style={{...lbl("var(--c039)"),marginBottom:"6px"}}>ESCRIBÍ "{eliminandoEntidad.entidad.nombre}" PARA CONFIRMAR</div>
              <input value={eliminandoEntidad.confirmText} onChange={e=>setEliminandoEntidad({...eliminandoEntidad,confirmText:e.target.value})} style={{...inp(),marginBottom:"14px"}}/>
              <div style={{display:"flex",gap:"10px"}}>
                <button disabled={borrandoEntidad || eliminandoEntidad.confirmText!==eliminandoEntidad.entidad.nombre} onClick={confirmarEliminarEntidad} style={{flex:1,padding:"12px",borderRadius:"10px",fontSize:"14px",fontWeight:"600",background:"var(--c049)",color:"var(--c005)",border:"1px solid var(--c050)"}}>{borrandoEntidad?"Eliminando...":"🗑 Eliminar definitivamente"}</button>
                <button onClick={()=>setEliminandoEntidad(null)} style={{padding:"12px 18px",borderRadius:"10px",fontSize:"14px",background:"var(--c004)",color:"var(--c007)",border:"1px solid var(--c002)"}}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {/* ══ MODAL: ELIMINAR SALA — confirmación escrita, irreversible ══ */}
        {eliminandoSala && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",zIndex:200}}>
            <div style={{background:"var(--c046)",border:"1px solid var(--c047)",borderRadius:"16px",padding:"22px",width:"100%",maxWidth:"380px"}}>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"18px",color:"var(--c029)",marginBottom:"10px"}}>⚠ Eliminar "{eliminandoSala.sala.nombre}"</div>
              <div style={{fontSize:"12px",color:"var(--c048)",marginBottom:"14px",lineHeight:"1.6"}}>Esto borra DEFINITIVAMENTE la sala y todo su contenido: sectores, lotes, genéticas, tareas, comentarios, relevamientos y los usuarios que pertenecen a ella. No se puede deshacer.</div>
              <div style={{...lbl("var(--c039)"),marginBottom:"6px"}}>ESCRIBÍ "{eliminandoSala.sala.nombre}" PARA CONFIRMAR</div>
              <input value={eliminandoSala.confirmText} onChange={e=>setEliminandoSala({...eliminandoSala,confirmText:e.target.value})} style={{...inp(),marginBottom:"14px"}}/>
              <div style={{display:"flex",gap:"10px"}}>
                <button disabled={borrandoSala || eliminandoSala.confirmText!==eliminandoSala.sala.nombre} onClick={confirmarEliminarSala} style={{flex:1,padding:"12px",borderRadius:"10px",fontSize:"14px",fontWeight:"600",background:"var(--c049)",color:"var(--c005)",border:"1px solid var(--c050)"}}>{borrandoSala?"Eliminando...":"🗑 Eliminar definitivamente"}</button>
                <button onClick={()=>setEliminandoSala(null)} style={{padding:"12px 18px",borderRadius:"10px",fontSize:"14px",background:"var(--c004)",color:"var(--c007)",border:"1px solid var(--c002)"}}>Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const tabsExtra = [
    {key:"_tareas",        label:"📋 Tareas",        col:"var(--c016)"},
    {key:"_calendario",    label:"📅 Calendario",    col:"var(--c064)"},
    {key:"_asistente",     label:"🤖 Asistente",     col:"var(--c056)"},
    {key:"_relevamientos", label:"🔍 Relevamientos", col:"var(--c030)"},
    {key:"_bajas",         label:"📉 Bajas",         col:"var(--c010)"}
  ];
  // Genéticas salió del menú Más: ahora se administra desde ⚙️ Mi Sala › Datos maestros.
  // Los ejecutores no tienen Mi Sala, así que para ellos se mantiene el acceso en Más.
  if(esEjecutor) tabsExtra.splice(3, 0, {key:"_geneticas", label:"🧬 Genéticas", col:"var(--c100)"});
  if(!esEjecutor) tabsExtra.push({key:"_cosechas", label:"📦 Cosechas", col:"var(--c003)"});
  if(!esEjecutor) tabsExtra.push({key:"_reportes", label:"📊 Reportes", col:"var(--c065)"});
  if(!esEjecutor) tabsExtra.push({key:"_misala", label:"⚙️ Mi Sala", col:"var(--c112)"});
  tabsExtra.push({key:"_apariencia", label:"🎨 Apariencia", col:"var(--c001)"});

  return (
    <div style={{fontFamily:"'IBM Plex Mono',monospace",background:"var(--c074)",minHeight:"100vh",color:"var(--c019)"}}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=DM+Serif+Display:ital@0;1&display=swap');"}</style>
      <style>{"*{box-sizing:border-box;margin:0;padding:0;}button{cursor:pointer;transition:all .15s ease;font-family:'IBM Plex Mono',monospace;}textarea,input,select{outline:none;font-family:'IBM Plex Mono',monospace;}textarea:focus,input:focus,select:focus{border-color:var(--c173)!important;}.fade{animation:fi .22s ease;}@keyframes fi{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:var(--c025);border-radius:2px}"}</style>

      <div style={{background:"var(--c055)",borderBottom:"2px solid var(--c025)",padding:"18px 20px 16px",position:"sticky",top:0,zIndex:100}}>
        {usuario.rol==="administrador" && adminEntidadModo==="mg" && (
          <button onClick={volverModoEntidad} style={{width:"100%",marginBottom:"12px",padding:"8px",borderRadius:"9px",fontSize:"12px",background:"var(--c013)",color:"var(--c015)",border:"1px solid var(--c006)",textAlign:"left"}}>← Volver al panel de {entidadNombre}</button>
        )}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"22px",color:"var(--c001)"}}>🌱 RAÍZ — Cuaderno de Cultivo</div>
            <div style={{fontSize:"11px",color:"var(--c174)",letterSpacing:"2px",marginTop:"4px"}}>
              {usuario.nombre} · {esEjecutor?"EJECUTOR":usuario.rol==="administrador"?"MASTER GROWER (modo MG)":"MASTER GROWER"}
              {usuario.rol==="administrador" && (() => {
                const nombreSalaActual = entidadSalas.find(s=>s.id===salaId)?.nombre;
                return nombreSalaActual ? " — "+nombreSalaActual : "";
              })()}
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"6px"}}>
            {status==="guardado" && <div style={{fontSize:"12px",color:"var(--c001)",background:"var(--c175)",padding:"5px 14px",borderRadius:"20px",border:"1px solid var(--c176)"}}>✓ guardado</div>}
            {status && status!=="guardado" && <div style={{fontSize:"11px",color:"var(--c080)",background:"var(--c008)",padding:"5px 10px",borderRadius:"10px",border:"1px solid var(--c047)"}}>⚠ {status}</div>}
            <button onClick={handleLogout} style={{fontSize:"11px",color:"var(--c027)",background:"transparent",border:"1px solid var(--c025)",borderRadius:"14px",padding:"4px 12px"}}>salir</button>
          </div>
        </div>
      </div>

      <div style={{padding:"20px 20px 110px"}}>

        {/* ══ SECTOR PADRE con subsectores y sus lotes ══ */}
        {sectoresPadre.find(sp=>sp.id===tab) && (()=>{
          const sp = sectoresPadre.find(x=>x.id===tab);
          const subs = subsectoresDe(sp.id);
          return (
            <div className="fade">
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"22px",color:colorDeFase(sp.orden),marginBottom:"6px"}}>{sp.nombre}</div>
              <div style={{fontSize:"12px",color:"var(--c027)",marginBottom:"18px"}}>{subs.length} subsector{subs.length!==1?"es":""}</div>

              {subs.length===0 && (
                <div style={{textAlign:"center",padding:"40px 20px",color:"var(--c113)",fontSize:"14px"}}>Sin subsectores configurados aún{!esEjecutor && " — creá uno en ⚙️ Mi Sala"}</div>
              )}

              {subs.map(sub=>{
                const lotesSub = lotesDeSector(sub.id).filter(l=>l.estado==="activo");
                const totalPlantas = lotesSub.reduce((a,l)=>a+(l.cantidad_plantas||0),0);
                const lotesMaduracion = lotesDeSector(sub.id).filter(l=>l.estado==="maduracion");
                const sigPadre = siguienteSectorPadre(sp);
                const subsDestino = sigPadre ? subsectoresDe(sigPadre.id) : [];
                const geneticasPresentes = [...new Set([...lotesSub,...lotesMaduracion].map(l=>l.genetica_id))]
                  .map(gid=>geneticas.find(g=>g.id===gid)).filter(Boolean);
                const abierta = !!subsAbiertos[sub.id];
                const hoySub = new Date().toISOString().slice(0,10);
                const tareasDelSub = (esEjecutor ? tareas.filter(t=>t.asignado_a===usuario.id) : tareas)
                  .filter(t=>t.sector_id===sub.id)
                  .filter(t=> t.estado!=="completada" || t.fecha_ejecucion_real===hoySub);
                const en1212 = sp.nombre==="Floración" && !!sub.fecha_inicio_floracion;
                let diasParaCorte = null;
                if(en1212 && lotesSub.length){
                  const fechasCorte = lotesSub.map(l=>{
                    const g2 = geneticas.find(x=>x.id===l.genetica_id);
                    const minD = g2?.dias_floracion_min || (g2?.semanas_floracion ? g2.semanas_floracion*7 : null);
                    if(!minD) return null;
                    const base = new Date(sub.fecha_inicio_floracion);
                    const f1 = new Date(base); f1.setDate(f1.getDate()+minD);
                    return f1;
                  }).filter(Boolean);
                  if(fechasCorte.length){
                    const masCercana = new Date(Math.min(...fechasCorte.map(f=>f.getTime())));
                    diasParaCorte = Math.round((masCercana - new Date())/86400000);
                  }
                }
                return (
                  <div key={sub.id} style={card(en1212 ? {borderColor:"var(--c177)", background:"var(--c178)"} : {borderColor:colorDeFase(sp.orden)+"55"})}>
                    <div onClick={()=>toggleSub(sub.id)} style={{cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}}>
                          <span style={{fontSize:"16px",fontWeight:"600",color:"var(--c019)"}}>{sub.nombre}</span>
                          {sub.capacidad_unidades && <span style={{fontSize:"11px",color:"var(--c027)"}}>cap. {sub.capacidad_unidades}</span>}
                          {en1212 && <span style={{fontSize:"10px",color:"var(--c179)",background:"var(--c114)",padding:"2px 8px",borderRadius:"9px",fontWeight:"600"}}>☀ 12/12</span>}
                          {diasParaCorte!==null && (
                            <span style={{fontSize:"10px",color:diasParaCorte<0?"var(--c083)":"var(--c003)",background:diasParaCorte<0?"var(--c115)":"var(--c180)",padding:"2px 8px",borderRadius:"9px",fontWeight:"600"}}>
                              {diasParaCorte<0 ? `🗓 corte atrasado ${Math.abs(diasParaCorte)}d` : diasParaCorte===0 ? "🗓 corte hoy" : `🗓 faltan ${diasParaCorte}d para el corte`}
                            </span>
                          )}
                        </div>
                        {geneticasPresentes.length>0 && (
                          <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginTop:"7px"}}>
                            {geneticasPresentes.map(g=>(
                              <span key={g.id} style={{fontSize:"10px",color:g.color,background:`${g.color}22`,padding:"3px 9px",borderRadius:"10px"}}>{g.nombre}</span>
                            ))}
                          </div>
                        )}
                        {lotesMaduracion.length>0 && <div style={{fontSize:"11px",color:"var(--c086)",marginTop:"6px"}}>🫙 {lotesMaduracion.length} en maduración</div>}
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:"10px",flexShrink:0,marginLeft:"10px"}}>
                        <span style={{fontSize:"22px",fontWeight:"700",color:totalPlantas>0?"var(--c001)":"var(--c051)"}}>{totalPlantas}</span>
                        <span style={{fontSize:"13px",color:"var(--c027)",display:"inline-block",transform:abierta?"rotate(180deg)":"none",transition:"transform .2s"}}>▾</span>
                      </div>
                    </div>

                    {abierta && (
                    <div style={{marginTop:"16px"}}>
                    {sp.nombre==="Floración" && !esEjecutor && (
                      <div style={{background:"var(--c116)",borderRadius:"9px",padding:"10px 12px",marginBottom:"14px",border:"1px solid var(--c031)"}}>
                        <div style={{fontSize:"10px",color:"var(--c052)",letterSpacing:"0.5px",marginBottom:"6px"}}>🌸 12/12 ACTIVADO EN ESTA CARPA DESDE</div>
                        <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
                          <input type="date" value={floracionDraft[sub.id]!==undefined?floracionDraft[sub.id]:(sub.fecha_inicio_floracion||"")} onChange={e=>setFloracionDraft({...floracionDraft,[sub.id]:e.target.value})} style={{...inp(),padding:"6px 8px",fontSize:"12px",flex:1}}/>
                          <button onClick={()=>guardarFechaFloracion(sub)} disabled={savingFloracion} style={{padding:"6px 12px",borderRadius:"6px",fontSize:"11px",background:"var(--c031)",color:"var(--c181)",border:"1px solid var(--c117)"}}>✓</button>
                        </div>
                        {!sub.fecha_inicio_floracion && <div style={{fontSize:"10px",color:"var(--c040)",marginTop:"6px"}}>Sin activar — cargá el día que esta carpa pasa a 12/12. Aplica a todos los lotes que tenga adentro.</div>}
                        {sub.fecha_inicio_floracion && <div style={{fontSize:"10px",color:"var(--c040)",marginTop:"6px"}}>Se congela en cada lote al cortar, y esta fecha se resetea sola cuando la carpa quede vacía para el próximo ciclo.</div>}
                      </div>
                    )}
                    {lotesSub.length>0 && (
                      <div style={{display:"flex",flexDirection:"column",gap:"8px",marginTop:"10px",marginBottom:"10px"}}>
                        {lotesSub.map(l=>{
                          const g = geneticas.find(x=>x.id===l.genetica_id);
                          return (
                            <div key={l.id} style={{background:"var(--c055)",borderRadius:"8px",padding:"10px 12px",border:`1px solid ${g?.color||"var(--c025)"}44`}}>
                              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"}}>
                                <span style={{fontSize:"13px",color:g?.color||"var(--c087)"}}>{g?.nombre||"Sin genética"}{l.numero_lote?` · ${loteLabel(l.numero_lote, sufijoDeLote(l))}`:""}</span>
                                <span style={{fontSize:"13px",color:"var(--c182)"}}>{l.cantidad_plantas} plantas</span>
                              </div>
                              {sp.nombre!=="Floración" && (
                                <div style={{display:"flex",alignItems:"baseline",gap:"7px",marginBottom:"6px",flexWrap:"wrap"}}>
                                  <span style={{fontSize:"12px",color:"var(--c066)",fontWeight:"600"}}>{Math.max(0,Math.round((new Date()-new Date(l.fecha_ultima_movida||l.fecha_inicio))/86400000))}d en {sp.nombre.toLowerCase()}</span>
                                  <span style={{fontSize:"9px",color:"var(--c183)"}}>desde {l.fecha_ultima_movida||l.fecha_inicio}</span>
                                </div>
                              )}
                              {sp.nombre==="Floración" && (()=>{
                                const st = statsLotes[l.id];
                                const gF = geneticas.find(x=>x.id===l.genetica_id);
                                const minDF = gF?.dias_floracion_min || (gF?.semanas_floracion ? gF.semanas_floracion*7 : null);
                                let corteTxt = null, corteAtrasado = false;
                                if(sub.fecha_inicio_floracion && minDF){
                                  const fCorte = new Date(sub.fecha_inicio_floracion); fCorte.setDate(fCorte.getDate()+minDF);
                                  const dc = Math.round((fCorte-new Date())/86400000);
                                  corteAtrasado = dc<0;
                                  corteTxt = dc<0 ? ("✂️ corte atrasado "+Math.abs(dc)+"d") : dc===0 ? "✂️ corte hoy" : ("✂️ "+dc+"d para el corte");
                                }
                                return (
                                  <div style={{display:"flex",alignItems:"baseline",gap:"9px",marginBottom:"6px",flexWrap:"wrap"}}>
                                    {corteTxt && <span style={{fontSize:"12px",color:corteAtrasado?"var(--c083)":"var(--c003)",fontWeight:"600"}}>{corteTxt}</span>}
                                    <span style={{fontSize:"11px",color:"var(--c066)"}}>🌱 {st?st.dias_vegetativo:"—"}d veg</span>
                                    {sub.fecha_inicio_floracion && <span style={{fontSize:"11px",color:"var(--c052)"}}>🌸 {st?st.dias_floracion:"—"}d flo</span>}
                                  </div>
                                );
                              })()}
                              {sp.nombre==="Floración" && sub.fecha_inicio_floracion && (
                                <div style={{fontSize:"11px",color:"var(--c052)",marginBottom:"6px"}}>🌸 En 12/12 desde {sub.fecha_inicio_floracion}</div>
                              )}
                              {sp.nombre==="Floración" && !sub.fecha_inicio_floracion && !esEjecutor && (
                                <div style={{fontSize:"11px",color:"var(--c040)",marginBottom:"6px"}}>🌸 Carpa todavía sin 12/12 activado — cargalo arriba, en el encabezado de {sub.nombre}.</div>
                              )}
                              <div style={{display:"flex",gap:"6px"}}>
                                {!esEjecutor && (
                                  <button onClick={()=>setEditingLote({...l, cantidad_plantas:String(l.cantidad_plantas)})} style={{padding:"7px 10px",borderRadius:"7px",fontSize:"11px",background:"var(--c020)",color:"var(--c001)",border:"1px solid var(--c011)"}}>✏️</button>
                                )}
                                {!esEjecutor && (
                                  <button onClick={()=>setBajaLote({lote:l, cantidad:"1", motivo:""})} style={{padding:"7px 10px",borderRadius:"7px",fontSize:"11px",background:"var(--c008)",color:"var(--c032)",border:"1px solid var(--c009)"}}>🥀</button>
                                )}
                                {!esEjecutor && sigPadre && (
                                  (sp.nombre==="Floración" && !sub.fecha_inicio_floracion) ? (
                                    <button disabled title="Activá el 12/12 de esta carpa antes de poder cortar" style={{flex:1,padding:"7px",borderRadius:"7px",fontSize:"11px",background:"var(--c004)",color:"var(--c118)",border:"1px solid var(--c002)",cursor:"not-allowed"}}>→ Avanzar a {sigPadre.nombre} (activá 12/12 primero)</button>
                                  ) : (sp.nombre==="Vegetativo" && sub.puede_avanzar_etapa===false) ? (
                                    <button disabled title="Este tamaño de maceta no está habilitado para pasar a Floración (lo configurás en Mi Sala)" style={{flex:1,padding:"7px",borderRadius:"7px",fontSize:"11px",background:"var(--c004)",color:"var(--c118)",border:"1px solid var(--c002)",cursor:"not-allowed"}}>→ Avanzar a {sigPadre.nombre} (maceta no habilitada)</button>
                                  ) : (
                                    <button onClick={()=>{setMovingLote(l); setDestinoSub(""); setMovingMovida(String(l.cantidad_plantas)); setModoMover(false); setModoRetroceso(false);}} style={{flex:1,padding:"7px",borderRadius:"7px",fontSize:"11px",background:`${colorDeFase(sigPadre.orden)}22`,color:colorDeFase(sigPadre.orden),border:`1px solid ${colorDeFase(sigPadre.orden)}66`}}>→ Avanzar a {sigPadre.nombre}</button>
                                  )
                                )}
                                {!esEjecutor && !sigPadre && (
                                  <button onClick={()=>pasarAMaduracion(l)} style={{flex:1,padding:"7px",borderRadius:"7px",fontSize:"11px",background:"var(--c184)",color:"var(--c086)",border:"1px solid var(--c119)"}}>🫙 Pasar a Maduración</button>
                                )}
                                {!esEjecutor && !(sp.nombre==="Floración" && sub.fecha_inicio_floracion) && (
                                  <button onClick={()=>{setMovingLote(l); setDestinoSub(""); setMovingMovida(String(l.cantidad_plantas)); setModoMover(true); setModoRetroceso(false);}} title="Mover a otro subsector (corrección)" style={{padding:"7px 10px",borderRadius:"7px",fontSize:"11px",background:"var(--c185)",color:"var(--c120)",border:"1px solid var(--c109)"}}>↔</button>
                                )}
                                {!esEjecutor && sp.nombre==="Floración" && !sub.fecha_inicio_floracion && (
                                  <button onClick={()=>iniciarRetroceso(l)} title="Todavía no entró en 12/12 — volver a Vegetativo (5L)" style={{padding:"7px 10px",borderRadius:"7px",fontSize:"11px",background:"var(--c186)",color:"var(--c088)",border:"1px solid var(--c187)"}}>↩ 5L</button>
                                )}
                              </div>
                              {sp.nombre==="Floración" && sub.fecha_inicio_floracion && (
                                <div style={{fontSize:"10px",color:"var(--c040)",marginTop:"6px"}}>🔒 En 12/12 — no se puede mover hasta el corte (avanzar a Secado).</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {lotesMaduracion.length>0 && (
                      <div style={{marginTop:"4px",marginBottom:"10px"}}>
                        <div style={{fontSize:"11px",color:"var(--c086)",marginBottom:"6px",letterSpacing:"0.5px"}}>🫙 EN MADURACIÓN</div>
                        <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                          {lotesMaduracion.map(l=>{
                            const g = geneticas.find(x=>x.id===l.genetica_id);
                            return (
                              <div key={l.id} style={{background:"var(--c121)",borderRadius:"8px",padding:"10px 12px",border:`1px solid var(--c188)`}}>
                                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
                                  <span style={{fontSize:"13px",color:g?.color||"var(--c087)"}}>{g?.nombre||"Sin genética"}{l.numero_lote?` · ${loteLabel(l.numero_lote, sufijoDeLote(l))}`:""}</span>
                                  <span style={{fontSize:"13px",color:"var(--c189)"}}>{l.cantidad_plantas} plantas</span>
                                </div>
                                <div style={{display:"flex",gap:"6px"}}>
                                  {!esEjecutor && (
                                    <button onClick={()=>setBajaLote({lote:l, cantidad:"1", motivo:""})} style={{padding:"7px 10px",borderRadius:"7px",fontSize:"11px",background:"var(--c008)",color:"var(--c032)",border:"1px solid var(--c009)"}}>🥀</button>
                                  )}
                                  {!esEjecutor && (
                                    <button onClick={()=>setFinalizandoLote({lote:l, peso:"", dias_secado:String(l.dias_secado||""), notas:l.notas||""})} style={{flex:1,padding:"7px",borderRadius:"7px",fontSize:"11px",background:"var(--c190)",color:"var(--c058)",border:"1px solid var(--c191)"}}>⚖️ Finalizar y pesar</button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {!esEjecutor && (
                      <div style={{display:"flex",gap:"8px"}}>
                        {(sp.nombre==="Enraizado" || sp.nombre==="Vegetativo") && (
                          <button onClick={()=>setEditingLote(emptyLote(sub.id))} style={{flex:1,padding:"10px",borderRadius:"8px",fontSize:"12px",fontWeight:"600",background:"var(--c192)",color:"var(--c001)",border:"1px dashed var(--c011)"}}>+ Planta/lote</button>
                        )}
                        <button onClick={()=>setEditingTarea(emptyTarea(sub.id))} style={{flex:1,padding:"10px",borderRadius:"8px",fontSize:"12px",fontWeight:"600",background:"var(--c089)",color:"var(--c016)",border:"1px dashed var(--c028)"}}>+ Tarea</button>
                      </div>
                    )}

                    {tareasDelSub.length>0 && (
                      <div style={{marginTop:"14px"}}>
                        <div onClick={()=>setTareasEnSubAbierto(prev=>({...prev,[sub.id]:!prev[sub.id]}))} style={{cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px",background:tareasEnSubAbierto[sub.id]?"var(--c193)":"var(--c122)",borderRadius:"9px",border:"1px solid var(--c194)"}}>
                          <span style={{fontSize:"12px",color:"var(--c016)"}}>📋 Tareas planificadas aquí <span style={{color:"var(--c033)"}}>· {tareasDelSub.length}</span></span>
                          <span style={{fontSize:"11px",color:"var(--c016)",transform:tareasEnSubAbierto[sub.id]?"rotate(180deg)":"none",transition:"transform .2s"}}>▾</span>
                        </div>
                        {tareasEnSubAbierto[sub.id] && (
                          <div style={{display:"flex",flexDirection:"column",gap:"6px",marginTop:"8px"}}>
                            {tareasDelSub.map(t=>{
                              const hoyT = new Date().toISOString().slice(0,10);
                              const atrasadaT = (t.estado==="pendiente"||t.estado==="en_progreso") && t.fecha_programada<hoyT;
                              const estadoT = atrasadaT?"atrasada":t.estado;
                              return (
                                <div key={t.id} style={{background:"var(--c076)",borderRadius:"8px",padding:"9px 11px",borderLeft:`3px solid ${TAREA_PRIORIDAD_COLOR[t.prioridad]||"var(--c057)"}`}}>
                                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                                    <span style={{fontSize:"12px",color:"var(--c195)"}}>{t.titulo}</span>
                                    <span style={{fontSize:"9px",padding:"2px 7px",borderRadius:"7px",background:`${TAREA_ESTADO_COLOR[estadoT]}33`,color:TAREA_ESTADO_COLOR[estadoT],whiteSpace:"nowrap"}}>{TAREA_ESTADO_LABEL[estadoT]}</span>
                                  </div>
                                  <div style={{fontSize:"10px",color:"var(--c037)",marginTop:"3px"}}>📅 {t.fecha_programada}{t.asignado_a?` · → ${usuariosMap[t.asignado_a]||"—"}`:""}</div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                    </div>
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
            .filter(t=> {
              if(tModoFecha==="exacta" && tFechaExacta) return t.fecha_programada===tFechaExacta;
              if(tModoFecha==="rango"){
                if(tFechaDesde && t.fecha_programada < tFechaDesde) return false;
                if(tFechaHasta && t.fecha_programada > tFechaHasta) return false;
              }
              return true;
            })
            .sort((a,b)=> a.fecha_programada < b.fecha_programada ? -1 : 1);

          return (
            <div className="fade">
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"22px",color:"var(--c016)",marginBottom:"6px"}}>📋 Tareas</div>
              <div style={{fontSize:"13px",color:"var(--c033)",marginBottom:"18px"}}>{esEjecutor?"TUS TAREAS ASIGNADAS":"TODAS LAS TAREAS"}</div>

              {!esEjecutor && (
                <button onClick={()=>setEditingTarea(emptyTarea())} style={{width:"100%",padding:"14px",borderRadius:"12px",fontSize:"14px",fontWeight:"600",background:"var(--c089)",color:"var(--c016)",border:"2px dashed var(--c028)",marginBottom:"20px"}}>+ Nueva tarea</button>
              )}

              <div style={{display:"flex",gap:"8px",marginBottom:"12px",flexWrap:"wrap"}}>
                {[["todas","Todas"],["pendiente","Pendientes"],["en_progreso","En progreso"],["completada","Completadas"],["atrasada","Atrasadas"]].map(([k,label])=>(
                  <button key={k} onClick={()=>setTFiltro(k)} style={{padding:"7px 14px",borderRadius:"18px",fontSize:"12px",background:tFiltro===k?"var(--c028)":"var(--c123)",color:tFiltro===k?"var(--c005)":"var(--c077)",border:`1px solid ${tFiltro===k?"var(--c016)":"var(--c124)"}`}}>{label}</button>
                ))}
              </div>

              <div style={{background:"var(--c090)",borderRadius:"12px",padding:"12px 14px",marginBottom:"18px",border:"1px solid var(--c053)"}}>
                <div style={{fontSize:"11px",color:"var(--c033)",letterSpacing:"1px",marginBottom:"10px"}}>FILTRAR POR FECHA</div>
                <div style={{display:"flex",gap:"8px",marginBottom:"10px"}}>
                  {[["ninguno","Sin filtro"],["exacta","Fecha exacta"],["rango","Rango"]].map(([m,l])=>(
                    <button key={m} onClick={()=>setTModoFecha(m)} style={{flex:1,padding:"7px 6px",borderRadius:"9px",fontSize:"11px",background:tModoFecha===m?"var(--c196)":"var(--c090)",color:tModoFecha===m?"var(--c005)":"var(--c037)",border:`1px solid ${tModoFecha===m?"var(--c016)":"var(--c053)"}`}}>{l}</button>
                  ))}
                </div>
                {tModoFecha==="exacta" && (
                  <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                    <input type="date" value={tFechaExacta} onChange={e=>setTFechaExacta(e.target.value)} style={{...inp(),flex:1}}/>
                    {tFechaExacta && <button onClick={()=>setTFechaExacta("")} style={{padding:"7px 10px",borderRadius:"8px",fontSize:"11px",background:"var(--c008)",color:"var(--c012)",border:"1px solid var(--c009)"}}>✕</button>}
                  </div>
                )}
                {tModoFecha==="rango" && (
                  <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                      <span style={{fontSize:"11px",color:"var(--c033)",width:"36px"}}>Desde</span>
                      <input type="date" value={tFechaDesde} onChange={e=>setTFechaDesde(e.target.value)} style={{...inp(),flex:1}}/>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                      <span style={{fontSize:"11px",color:"var(--c033)",width:"36px"}}>Hasta</span>
                      <input type="date" value={tFechaHasta} onChange={e=>setTFechaHasta(e.target.value)} style={{...inp(),flex:1}}/>
                    </div>
                    {(tFechaDesde||tFechaHasta) && <button onClick={()=>{setTFechaDesde("");setTFechaHasta("");}} style={{padding:"6px",borderRadius:"8px",fontSize:"11px",background:"var(--c008)",color:"var(--c012)",border:"1px solid var(--c009)"}}>✕ Limpiar fechas</button>}
                  </div>
                )}
              </div>

              {tareasFiltradas.length===0 ? (
                <div style={{textAlign:"center",padding:"40px 20px",color:"var(--c197)",fontSize:"14px"}}>Sin tareas{tFiltro!=="todas"?" en este filtro":""}</div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                  {agruparTareasPorSector(tareasFiltradas).map(grupo=>{
                    const abierto = !!grupoTareasAbiertos[grupo.key];
                    return (
                      <div key={grupo.key} style={{border:`1px solid ${grupo.color}44`,borderRadius:"14px",overflow:"hidden"}}>
                        <div onClick={()=>setGrupoTareasAbiertos(prev=>({...prev,[grupo.key]:!prev[grupo.key]}))} style={{cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",background:abierto?`${grupo.color}14`:"transparent"}}>
                          <span style={{fontSize:"13px",fontWeight:"600",color:grupo.color}}>{grupo.label} <span style={{fontSize:"11px",color:"var(--c077)",fontWeight:"400"}}>· {grupo.tareas.length}</span></span>
                          <span style={{fontSize:"13px",color:grupo.color,transform:abierto?"rotate(180deg)":"none",transition:"transform .2s"}}>▾</span>
                        </div>
                        {abierto && (
                          <div style={{padding:"4px 14px 14px",display:"flex",flexDirection:"column",gap:"10px"}}>
                            {grupo.tareas.map(t=><TareaCard key={t.id} t={t}/>)}
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

        {/* ══ ASISTENTE IA ══ */}
        {tab==="_asistente" && (()=>{
          // Auto-scroll al fondo al recibir mensajes
          // eslint-disable-next-line react-hooks/rules-of-hooks
          useEffect(()=>{ chatBottomRef.current?.scrollIntoView({behavior:"smooth"}); },[chatMensajes]);
          return (
            <div className="fade" style={{display:"flex",flexDirection:"column",height:"calc(100vh - 180px)"}}>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"22px",color:"var(--c056)",marginBottom:"4px"}}>🤖 Asistente IA</div>
              <div style={{fontSize:"12px",color:"var(--c198)",marginBottom:"14px"}}>Hacé preguntas o subí una foto para diagnóstico</div>

              <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:"10px",paddingBottom:"8px"}}>
                {chatMensajes.length===0 && (
                  <div style={{textAlign:"center",padding:"40px 20px",color:"var(--c125)",fontSize:"13px",lineHeight:"1.7"}}>
                    <div style={{fontSize:"40px",marginBottom:"12px"}}>🌿</div>
                    <div>Podés preguntarme sobre deficiencias, plagas, nutrición, tiempos de floración...</div>
                    <div style={{marginTop:"10px",color:"var(--c067)"}}>También podés adjuntar una foto para que la analice.</div>
                  </div>
                )}
                {chatMensajes.map((m,i)=>(
                  <div key={i} style={{display:"flex",flexDirection:"column",alignItems:m.rol==="usuario"?"flex-end":"flex-start"}}>
                    {m.imagen && (
                      <img src={`data:image/jpeg;base64,${m.imagen}`} alt="foto" style={{maxWidth:"70%",borderRadius:"12px",marginBottom:"4px",border:"1px solid var(--c031)"}}/>
                    )}
                    {m.texto && (
                      <div style={{
                        maxWidth:"85%",padding:"12px 14px",borderRadius:"14px",fontSize:"13px",lineHeight:"1.6",whiteSpace:"pre-wrap",
                        background:m.rol==="usuario"?"var(--c126)":m.rol==="error"?"var(--c115)":"var(--c127)",
                        color:m.rol==="usuario"?"var(--c199)":m.rol==="error"?"var(--c200)":"var(--c091)",
                        borderBottomRightRadius:m.rol==="usuario"?"4px":"14px",
                        borderBottomLeftRadius:m.rol==="usuario"?"14px":"4px",
                        border:m.rol==="asistente"?"1px solid var(--c053)":"none"
                      }}>{m.texto}</div>
                    )}
                    <div style={{fontSize:"10px",color:"var(--c125)",marginTop:"3px"}}>{m.ts}</div>
                  </div>
                ))}
                {chatCargando && (
                  <div style={{display:"flex",alignItems:"flex-start"}}>
                    <div style={{background:"var(--c127)",border:"1px solid var(--c053)",borderRadius:"14px",borderBottomLeftRadius:"4px",padding:"12px 16px",color:"var(--c201)",fontSize:"13px"}}>Analizando...</div>
                  </div>
                )}
                <div ref={chatBottomRef}/>
              </div>

              <div style={{borderTop:"1px solid var(--c126)",paddingTop:"12px",marginTop:"8px"}}>
                {chatImagen && (
                  <div style={{position:"relative",display:"inline-block",marginBottom:"8px"}}>
                    <img src={`data:image/jpeg;base64,${chatImagen}`} alt="preview" style={{height:"70px",borderRadius:"8px",border:"1px solid var(--c067)"}}/>
                    <button onClick={()=>setChatImagen(null)} style={{position:"absolute",top:"-6px",right:"-6px",width:"20px",height:"20px",borderRadius:"50%",background:"var(--c010)",color:"var(--c005)",border:"none",fontSize:"11px",lineHeight:"20px",textAlign:"center",padding:0}}>✕</button>
                  </div>
                )}
                <div style={{display:"flex",gap:"8px",alignItems:"flex-end"}}>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={seleccionarImagen} style={{display:"none"}}/>
                  <button onClick={()=>fileInputRef.current?.click()} style={{padding:"10px",borderRadius:"10px",background:"var(--c128)",color:"var(--c056)",border:"1px solid var(--c202)",fontSize:"18px",flexShrink:0}}>📷</button>
                  <textarea value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter" && !e.shiftKey){e.preventDefault();enviarMensaje();}}} placeholder="Preguntá sobre tu cultivo..." rows={2} style={{...inp(),flex:1,resize:"none",lineHeight:"1.5"}}/>
                  <button disabled={chatCargando||(!chatInput.trim()&&!chatImagen)} onClick={enviarMensaje} style={{padding:"10px 14px",borderRadius:"10px",background:chatCargando?"var(--c128)":"var(--c203)",color:"var(--c005)",border:"none",fontSize:"16px",flexShrink:0}}>➤</button>
                </div>
                <div style={{fontSize:"10px",color:"var(--c067)",marginTop:"6px",textAlign:"center"}}>Enter para enviar · Shift+Enter para nueva línea</div>
              </div>
            </div>
          );
        })()}

        {/* ══ CALENDARIO (Fase 3 de Tareas) ══ */}
        {tab==="_calendario" && (()=>{
          const hoy = new Date().toISOString().slice(0,10);
          const tareasVisibles = esEjecutor ? tareas.filter(t=>t.asignado_a===usuario.id) : tareas;

          const construirGrillaMes = (year, month) => {
            const primerDia = new Date(year, month, 1);
            const diasEnMes = new Date(year, month+1, 0).getDate();
            const offsetInicio = (primerDia.getDay()+6)%7; // semana arranca lunes
            const celdas = [];
            for(let i=0;i<offsetInicio;i++) celdas.push(null);
            for(let d=1; d<=diasEnMes; d++) celdas.push(`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`);
            while(celdas.length % 7 !== 0) celdas.push(null);
            return celdas;
          };

          const tareasPorDia = fecha => tareasVisibles.filter(t=>t.fecha_programada===fecha);
          const estadoDelDia = fecha => {
            const ts = tareasPorDia(fecha);
            if(ts.length===0) return null;
            if(ts.some(t=>(t.estado==="pendiente"||t.estado==="en_progreso") && fecha<hoy)) return "atrasada";
            if(ts.every(t=>t.estado==="completada")) return "completada";
            return "pendiente";
          };

          const nombreMes = new Date(calMes.year, calMes.month, 1).toLocaleDateString("es-AR",{month:"long",year:"numeric"});
          const celdas = construirGrillaMes(calMes.year, calMes.month);
          const tareasDelDia = tareasPorDia(calDia);

          return (
            <div className="fade">
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"22px",color:"var(--c064)",marginBottom:"6px"}}>📅 Calendario</div>
              <div style={{fontSize:"13px",color:"var(--c057)",marginBottom:"18px"}}>{esEjecutor?"TUS TAREAS POR FECHA":"TODAS LAS TAREAS POR FECHA"}</div>

              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
                <button onClick={()=>setCalMes(m=>{ const d=new Date(m.year,m.month-1,1); return {year:d.getFullYear(),month:d.getMonth()}; })} style={{padding:"8px 14px",borderRadius:"8px",background:"var(--c129)",color:"var(--c065)",border:"1px solid var(--c092)"}}>‹</button>
                <div style={{fontSize:"15px",color:"var(--c204)"}}>{nombreMes.charAt(0).toUpperCase()+nombreMes.slice(1)}</div>
                <button onClick={()=>setCalMes(m=>{ const d=new Date(m.year,m.month+1,1); return {year:d.getFullYear(),month:d.getMonth()}; })} style={{padding:"8px 14px",borderRadius:"8px",background:"var(--c129)",color:"var(--c065)",border:"1px solid var(--c092)"}}>›</button>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"4px",marginBottom:"6px"}}>
                {["L","M","X","J","V","S","D"].map(d=><div key={d} style={{textAlign:"center",fontSize:"11px",color:"var(--c205)"}}>{d}</div>)}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"4px",marginBottom:"18px"}}>
                {celdas.map((fecha,idx)=>{
                  if(!fecha) return <div key={idx}/>;
                  const estado = estadoDelDia(fecha);
                  const esHoy = fecha===hoy;
                  const esSeleccionado = fecha===calDia;
                  const dotColor = estado==="atrasada"?"var(--c010)":estado==="completada"?"var(--c036)":estado==="pendiente"?"var(--c003)":null;
                  return (
                    <button key={fecha} onClick={()=>setCalDia(fecha)} style={{
                      aspectRatio:"1",borderRadius:"8px",fontSize:"12px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"2px",
                      background:esSeleccionado?"var(--c092)":esHoy?"var(--c206)":"var(--c207)",
                      color:esHoy?"var(--c005)":"var(--c093)",
                      border:esSeleccionado?"1px solid var(--c064)":"1px solid var(--c208)"
                    }}>
                      <span>{parseInt(fecha.slice(8,10))}</span>
                      {dotColor && <span style={{width:"5px",height:"5px",borderRadius:"50%",background:dotColor}}/>}
                    </button>
                  );
                })}
              </div>

              <div style={{fontSize:"13px",color:"var(--c209)",marginBottom:"10px"}}>{calDia}{calDia===hoy?" · hoy":""}</div>
              {tareasDelDia.length===0 ? (
                <div style={{textAlign:"center",padding:"30px 20px",color:"var(--c210)",fontSize:"13px"}}>Sin tareas este día</div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                  {agruparTareasPorSector(tareasDelDia).map(grupo=>{
                    const abierto = !!grupoTareasCalAbiertos[grupo.key];
                    return (
                      <div key={grupo.key} style={{border:`1px solid ${grupo.color}44`,borderRadius:"14px",overflow:"hidden"}}>
                        <div onClick={()=>setGrupoTareasCalAbiertos(prev=>({...prev,[grupo.key]:!prev[grupo.key]}))} style={{cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",background:abierto?`${grupo.color}14`:"transparent"}}>
                          <span style={{fontSize:"13px",fontWeight:"600",color:grupo.color}}>{grupo.label} <span style={{fontSize:"11px",color:"var(--c211)",fontWeight:"400"}}>· {grupo.tareas.length}</span></span>
                          <span style={{fontSize:"13px",color:grupo.color,transform:abierto?"rotate(180deg)":"none",transition:"transform .2s"}}>▾</span>
                        </div>
                        {abierto && (
                          <div style={{padding:"4px 14px 14px",display:"flex",flexDirection:"column",gap:"10px"}}>
                            {grupo.tareas.map(t=><TareaCard key={t.id} t={t}/>)}
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
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"22px",color:"var(--c030)",marginBottom:"6px"}}>🔍 Relevamientos</div>
              <div style={{fontSize:"13px",color:"var(--c068)",marginBottom:"18px"}}>CONTEO REAL DE PLANTAS POR SUBSECTOR</div>

              {!puedeRelevar && <div style={{fontSize:"12px",color:"var(--c022)",background:"var(--c094)",borderRadius:"8px",padding:"10px 14px",marginBottom:"16px"}}>No tenés permiso de relevamiento — pedile al Master Grower que te lo active en ⚙️ Mi Sala. Podés ver el historial igual.</div>}

              {puedeRelevar && (
                editingRelevamiento ? (
                  <div style={card({borderColor:"var(--c095)",background:"var(--c212)"})}>
                    <span style={lbl("var(--c030)")}>NUEVO RELEVAMIENTO</span>
                    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                      <div>
                        <div style={{...lbl("var(--c069)"),marginBottom:"6px"}}>SUBSECTOR</div>
                        <select value={editingRelevamiento.sector_id} onChange={e=>setEditingRelevamiento({...editingRelevamiento,sector_id:e.target.value})} style={inp()}>
                          <option value="">Seleccionar...</option>
                          {sectoresPadre.map(sp=>subsectoresDe(sp.id).map(sub=>
                            <option key={sub.id} value={sub.id}>{sp.nombre} › {sub.nombre}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <div style={{...lbl("var(--c069)"),marginBottom:"6px"}}>GENÉTICAS CONTADAS</div>
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
                              <button onClick={()=>setEditingRelevamiento({...editingRelevamiento,lineas:editingRelevamiento.lineas.filter((_,i)=>i!==idx)})} style={{padding:"0 12px",borderRadius:"8px",background:"var(--c008)",color:"var(--c012)",border:"1px solid var(--c009)"}}>✕</button>
                            )}
                          </div>
                        ))}
                        <button onClick={()=>setEditingRelevamiento({...editingRelevamiento,lineas:[...editingRelevamiento.lineas,{genetica_id:"",cantidad:""}]})} style={{fontSize:"12px",color:"var(--c069)",background:"none",border:"1px dashed var(--c213)",borderRadius:"8px",padding:"7px 12px",width:"100%"}}>+ Agregar otra genética</button>
                        <div style={{fontSize:"11px",color:"var(--c037)",marginTop:"6px"}}>Solo genéticas ya cargadas — para sumar una genética nueva al catálogo, eso lo hace el Master Grower en 🧬 Genéticas. Si encontrás una que no está en este subsector, igual se crea el lote como "pendiente de aprobación".</div>
                      </div>
                      <div>
                        <div style={{...lbl("var(--c069)"),marginBottom:"6px"}}>NOTAS</div>
                        <textarea value={editingRelevamiento.notas} onChange={e=>setEditingRelevamiento({...editingRelevamiento,notas:e.target.value})} style={{...inp(),minHeight:"50px",resize:"vertical"}}/>
                      </div>
                      <div style={{display:"flex",gap:"10px"}}>
                        <button disabled={savingRelevamiento || !editingRelevamiento.sector_id || editingRelevamiento.lineas.every(l=>!l.genetica_id || l.cantidad==="")} onClick={guardarRelevamiento} style={{flex:1,padding:"12px",borderRadius:"10px",fontSize:"14px",fontWeight:"600",background:savingRelevamiento?"var(--c214)":"var(--c095)",color:"var(--c005)",border:"1px solid var(--c030)"}}>{savingRelevamiento?"Guardando...":"✓ Guardar"}</button>
                        <button onClick={()=>setEditingRelevamiento(null)} style={{padding:"12px 18px",borderRadius:"10px",fontSize:"14px",background:"var(--c004)",color:"var(--c007)",border:"1px solid var(--c002)"}}>Cancelar</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button onClick={()=>setEditingRelevamiento(emptyRelevamiento())} style={{width:"100%",padding:"14px",borderRadius:"12px",fontSize:"14px",fontWeight:"600",background:"var(--c215)",color:"var(--c030)",border:"2px dashed var(--c095)",marginBottom:"20px"}}>+ Nuevo relevamiento</button>
                )
              )}

              {relevamientos.length===0 ? (
                <div style={{textAlign:"center",padding:"40px 20px",color:"var(--c216)",fontSize:"14px"}}>Sin relevamientos registrados</div>
              ) : (()=>{
                const porDia = {};
                relevamientos.forEach(r=>{
                  const dia = (r.fecha||"").slice(0,10);
                  porDia[dia] = porDia[dia] || [];
                  porDia[dia].push(r);
                });
                const dias = Object.keys(porDia).sort((a,b)=>b.localeCompare(a)); // más reciente primero
                return (
                  <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                    {dias.map(dia=>{
                      const items = porDia[dia];
                      const conDiferencia = items.filter(r=>r.cantidad_contada - recuento(r) !== 0).length;
                      const abierto = diaRelevamientoAbierto===dia;
                      return (
                        <div key={dia} style={{border:"1px solid var(--c217)",borderRadius:"14px",overflow:"hidden"}}>
                          <div onClick={()=>setDiaRelevamientoAbierto(abierto?"":dia)} style={{cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",background:abierto?"var(--c218)":"transparent"}}>
                            <div>
                              <div style={{fontSize:"14px",color:"var(--c060)",fontWeight:"600"}}>{dia}</div>
                              <div style={{fontSize:"11px",color:"var(--c068)",marginTop:"3px"}}>{items.length} registro{items.length!==1?"s":""}{conDiferencia>0 && <span style={{color:"var(--c010)"}}> · {conDiferencia} con diferencia</span>}</div>
                            </div>
                            <span style={{fontSize:"13px",color:"var(--c030)",transform:abierto?"rotate(180deg)":"none",transition:"transform .2s"}}>▾</span>
                          </div>
                          {abierto && (
                            <div style={{padding:"4px 14px 14px",display:"flex",flexDirection:"column",gap:"10px"}}>
                              {items.map(r=>{
                                const sub = sectores.find(s=>s.id===r.sector_id);
                                const sp = sub ? sectoresPadre.find(x=>x.id===sub.sector_padre_id) : null;
                                const g = r.genetica_id ? geneticas.find(x=>x.id===r.genetica_id) : null;
                                const sistema = recuento(r);
                                const diff = r.cantidad_contada - sistema;
                                return (
                                  <div key={r.id} style={{background:"var(--c076)",borderRadius:"10px",padding:"12px 14px",borderLeft:`4px solid ${diff===0?"var(--c036)":"var(--c010)"}`}}>
                                    <div style={{fontSize:"13px",color:"var(--c060)",marginBottom:"6px"}}>{sp?.nombre||"—"}{sub?` › ${sub.nombre}`:""}{g?` · ${g.nombre}`:""}</div>
                                    <div style={{display:"flex",gap:"16px",marginBottom:"6px"}}>
                                      <div><span style={{fontSize:"11px",color:"var(--c068)"}}>Contado: </span><span style={{fontSize:"14px",fontWeight:"700",color:"var(--c030)"}}>{r.cantidad_contada}</span></div>
                                      <div><span style={{fontSize:"11px",color:"var(--c068)"}}>Sistema: </span><span style={{fontSize:"14px",color:"var(--c093)"}}>{sistema}</span></div>
                                      {diff!==0 && <div><span style={{fontSize:"11px",color:"var(--c010)"}}>Diferencia: </span><span style={{fontSize:"14px",fontWeight:"700",color:"var(--c010)"}}>{diff>0?"+":""}{diff}</span></div>}
                                    </div>
                                    {r.notas && <div style={{fontSize:"12px",color:"var(--c219)",marginBottom:"6px"}}>{r.notas}</div>}
                                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                                      <div style={{fontSize:"10px",color:"var(--c037)"}}>{usuariosMap[r.usuario_id]||"—"}</div>
                                      {!esEjecutor && (
                                        <button onClick={()=>delRelevamiento(r.id)} style={{padding:"4px 10px",borderRadius:"6px",fontSize:"10px",background:"var(--c008)",color:"var(--c012)",border:"1px solid var(--c009)"}}>🗑</button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          );
        })()}

        {/* ══ GENÉTICAS ══ */}
        {tab==="_geneticas" && (
          <div className="fade">
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"22px",color:"var(--c034)",marginBottom:"6px"}}>🧬 Genéticas y Fenotipos</div>
            <div style={{fontSize:"13px",color:"var(--c023)",marginBottom:"18px"}}>{geneticas.length} ENTRADAS</div>

            {!esEjecutor && (
              editingGenetica ? (
                <div style={card({borderColor:"var(--c070)",background:"var(--c220)"})}>
                  <span style={lbl("var(--c034)")}>{editingGenetica.id?"EDITAR GENÉTICA":"NUEVA GENÉTICA"}</span>
                  <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                    <div>
                      <div style={{...lbl("var(--c023)"),marginBottom:"6px"}}>NOMBRE</div>
                      <input value={editingGenetica.nombre} onChange={e=>setEditingGenetica({...editingGenetica,nombre:e.target.value})} placeholder="Ej: Critical Kush" style={inp()}/>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                      <div>
                        <div style={{...lbl("var(--c023)"),marginBottom:"6px"}}>TIPO</div>
                        <select value={editingGenetica.tipo} onChange={e=>setEditingGenetica({...editingGenetica,tipo:e.target.value})} style={inp()}>
                          <option value="indica">Índica</option>
                          <option value="sativa">Sativa</option>
                          <option value="hibrido">Híbrido</option>
                        </select>
                      </div>
                      <div>
                        <div style={{...lbl("var(--c023)"),marginBottom:"6px"}}>BANCO</div>
                        <input value={editingGenetica.banco} onChange={e=>setEditingGenetica({...editingGenetica,banco:e.target.value})} style={inp()}/>
                      </div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                      <div>
                        <div style={{...lbl("var(--c023)"),marginBottom:"6px"}}>DÍAS FLORACIÓN MÍN</div>
                        <input type="number" min="0" value={editingGenetica.dias_floracion_min} onChange={e=>setEditingGenetica({...editingGenetica,dias_floracion_min:e.target.value})} placeholder="Ej: 55" style={inp()}/>
                      </div>
                      <div>
                        <div style={{...lbl("var(--c023)"),marginBottom:"6px"}}>DÍAS FLORACIÓN MÁX</div>
                        <input type="number" min="0" value={editingGenetica.dias_floracion_max} onChange={e=>setEditingGenetica({...editingGenetica,dias_floracion_max:e.target.value})} placeholder="Ej: 60" style={inp()}/>
                      </div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr",gap:"12px"}}>
                      <div>
                        <div style={{...lbl("var(--c023)"),marginBottom:"6px"}}>COLOR</div>
                        <input type="color" value={editingGenetica.color} onChange={e=>setEditingGenetica({...editingGenetica,color:e.target.value})} style={{...inp(),padding:"4px",height:"38px"}}/>
                      </div>
                    </div>
                    <div>
                      <div style={{...lbl("var(--c023)"),marginBottom:"6px"}}>SABOR</div>
                      <input value={editingGenetica.sabor} onChange={e=>setEditingGenetica({...editingGenetica,sabor:e.target.value})} style={inp()}/>
                    </div>
                    <div>
                      <div style={{...lbl("var(--c023)"),marginBottom:"6px"}}>EFECTO</div>
                      <input value={editingGenetica.efecto} onChange={e=>setEditingGenetica({...editingGenetica,efecto:e.target.value})} style={inp()}/>
                    </div>
                    <label style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"13px",color:"var(--c130)"}}>
                      <input type="checkbox" checked={!!editingGenetica.fenotipo} onChange={e=>setEditingGenetica({...editingGenetica,fenotipo:e.target.checked})}/>
                      Es un fenotipo propio
                    </label>
                    <label style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"13px",color:"var(--c130)"}}>
                      <input type="checkbox" checked={editingGenetica.activa!==false} onChange={e=>setEditingGenetica({...editingGenetica,activa:e.target.checked})}/>
                      Activa (visible para dar de alta lotes nuevos)
                    </label>
                    <div style={{display:"flex",gap:"10px"}}>
                      <button disabled={savingGenetica || !editingGenetica.nombre} onClick={saveGenetica} style={{flex:1,padding:"12px",borderRadius:"10px",fontSize:"14px",fontWeight:"600",background:savingGenetica?"var(--c221)":"var(--c222)",color:"var(--c005)",border:"1px solid var(--c223)"}}>{savingGenetica?"Guardando...":"✓ Guardar"}</button>
                      <button onClick={()=>setEditingGenetica(null)} style={{padding:"12px 18px",borderRadius:"10px",fontSize:"14px",background:"var(--c004)",color:"var(--c007)",border:"1px solid var(--c002)"}}>Cancelar</button>
                    </div>
                  </div>
                </div>
              ) : (
                <button onClick={()=>setEditingGenetica(emptyGenetica())} style={{width:"100%",padding:"14px",borderRadius:"12px",fontSize:"14px",fontWeight:"600",background:"var(--c224)",color:"var(--c034)",border:"2px dashed var(--c070)",marginBottom:"20px"}}>+ Nueva genética</button>
              )
            )}

            <div style={{display:"flex",gap:"8px",marginBottom:"12px",flexWrap:"wrap"}}>
              {["all","indica","sativa","hibrido"].map(t=>(
                <button key={t} onClick={()=>setGFilter(t)} style={{padding:"8px 18px",borderRadius:"22px",fontSize:"13px",background:gFilter===t?(t==="all"?"var(--c225)":TIPO_COLOR[t]):"var(--c123)",color:gFilter===t?"var(--c005)":"var(--c226)",border:`1px solid ${gFilter===t?(t==="all"?"var(--c227)":TIPO_COLOR[t]):"var(--c124)"}`,fontWeight:gFilter===t?"600":"400"}}>{t==="all"?"Todas":TIPO_LABEL[t]}</button>
              ))}
            </div>
            {!esEjecutor && (
              <div style={{display:"flex",gap:"8px",marginBottom:"20px",flexWrap:"wrap"}}>
                {[["activas","Activas"],["inactivas","Inactivas"],["todas","Todas"]].map(([k,label])=>(
                  <button key={k} onClick={()=>setGActivaFilter(k)} style={{padding:"6px 14px",borderRadius:"18px",fontSize:"12px",background:gActivaFilter===k?"var(--c228)":"var(--c229)",color:gActivaFilter===k?"var(--c230)":"var(--c231)",border:`1px solid ${gActivaFilter===k?"var(--c232)":"var(--c002)"}`}}>{label}</button>
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
                <div key={g.id} style={{background:"var(--c233)",border:`1px solid ${g.color}55`,borderRadius:"14px",padding:"18px",borderLeft:`5px solid ${g.color}`,opacity:g.activa===false?0.55:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"12px"}}>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"5px",flexWrap:"wrap"}}>
                        <span style={{fontSize:"17px",fontWeight:"600",color:"var(--c131)"}}>{g.nombre}</span>
                        {g.fenotipo && <span style={{fontSize:"10px",background:`${g.color}33`,color:g.color,padding:"2px 8px",borderRadius:"10px"}}>FENOTIPO</span>}
                        {g.activa===false && <span style={{fontSize:"10px",background:"var(--c132)",color:"var(--c003)",padding:"2px 8px",borderRadius:"10px"}}>INACTIVA</span>}
                      </div>
                      <div style={{fontSize:"13px",color:TIPO_COLOR[g.tipo]}}>{TIPO_LABEL[g.tipo]}</div>
                    </div>
                    <div style={{background:"var(--c234)",border:`1px solid ${g.color}88`,borderRadius:"10px",padding:"8px 14px",textAlign:"center",minWidth:"72px"}}>
                      {g.dias_floracion_min ? (
                        <>
                          <div style={{fontSize:"15px",fontWeight:"700",color:g.color,lineHeight:1}}>{g.dias_floracion_min===g.dias_floracion_max?g.dias_floracion_min:`${g.dias_floracion_min}–${g.dias_floracion_max}`}</div>
                          <div style={{fontSize:"10px",color:"var(--c133)",marginTop:"3px"}}>días de flora</div>
                        </>
                      ) : g.semanas_floracion ? (
                        <>
                          <div style={{fontSize:"18px",fontWeight:"700",color:g.color,lineHeight:1}}>{g.semanas_floracion}</div>
                          <div style={{fontSize:"10px",color:"var(--c133)",marginTop:"3px"}}>semanas</div>
                        </>
                      ) : (
                        <div style={{fontSize:"11px",color:"var(--c051)"}}>—</div>
                      )}
                    </div>
                  </div>
                  {g.banco && <div style={{fontSize:"12px",color:"var(--c106)",marginBottom:"8px"}}>🏷 {g.banco}</div>}
                  {g.sabor && <div style={{fontSize:"14px",color:"var(--c235)",marginBottom:"6px",lineHeight:"1.6"}}>🍋 {g.sabor}</div>}
                  {g.efecto && <div style={{fontSize:"14px",color:"var(--c236)",lineHeight:"1.6",marginBottom:!esEjecutor?"12px":"0"}}>✨ {g.efecto}</div>}
                  {!esEjecutor && (
                    <div style={{display:"flex",gap:"6px",marginTop:"12px"}}>
                      <button onClick={()=>setEditingGenetica({...g, semanas_floracion:g.semanas_floracion||"", dias_floracion_min:g.dias_floracion_min||"", dias_floracion_max:g.dias_floracion_max||""})} style={{flex:1,padding:"8px",borderRadius:"8px",fontSize:"12px",background:"var(--c020)",color:"var(--c001)",border:"1px solid var(--c011)"}}>✏️ Editar</button>
                      <button onClick={()=>toggleActivaGenetica(g)} style={{flex:1,padding:"8px",borderRadius:"8px",fontSize:"12px",background:"var(--c078)",color:"var(--c003)",border:"1px solid var(--c079)"}}>{g.activa===false?"↺ Activar":"⏸ Desactivar"}</button>
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
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"22px",color:"var(--c003)",marginBottom:"6px"}}>📦 Registro de Cosechas</div>
            <div style={{fontSize:"13px",color:"var(--c237)",marginBottom:"20px"}}>POR GENÉTICA · FECHA · SECADO · PRODUCCIÓN</div>

            {!esEjecutor && (
              <div>
                {editingCosecha ? (
                  <div style={card({borderColor:"var(--c238)",background:"var(--c239)"})}>
                    <span style={lbl("var(--c003)")}>{editingCosecha.id?"EDITAR COSECHA":"NUEVA COSECHA"}</span>
                    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                      <div>
                        <div style={{...lbl("var(--c022)"),marginBottom:"6px"}}>SUBSECTOR</div>
                        <select value={editingCosecha.sector_actual_id} onChange={e=>setEditingCosecha({...editingCosecha,sector_actual_id:e.target.value})} style={inp()}>
                          <option value="">Seleccionar...</option>
                          {sectores.map(s=><option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{...lbl("var(--c022)"),marginBottom:"6px"}}>GENÉTICA</div>
                        <select value={editingCosecha.genetica_id} onChange={e=>setEditingCosecha({...editingCosecha,genetica_id:e.target.value})} style={inp()}>
                          <option value="">Seleccionar...</option>
                          {geneticasSelect(editingCosecha.genetica_id).map(g=><option key={g.id} value={g.id}>{g.nombre}</option>)}
                        </select>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                        <div>
                          <div style={{...lbl("var(--c022)"),marginBottom:"6px"}}>PLANTAS</div>
                          <input type="number" value={editingCosecha.cantidad_plantas} min="0" onChange={e=>setEditingCosecha({...editingCosecha,cantidad_plantas:e.target.value})} style={inp()}/>
                        </div>
                        <div>
                          <div style={{...lbl("var(--c022)"),marginBottom:"6px"}}>FECHA CORTE</div>
                          <input type="date" value={editingCosecha.fecha_inicio} onChange={e=>setEditingCosecha({...editingCosecha,fecha_inicio:e.target.value})} style={inp({colorScheme:"dark"})}/>
                        </div>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                        <div>
                          <div style={{...lbl("var(--c022)"),marginBottom:"6px"}}>DÍAS SECADO</div>
                          <input type="number" value={editingCosecha.dias_secado} min="0" placeholder="0" onChange={e=>setEditingCosecha({...editingCosecha,dias_secado:e.target.value})} style={inp()}/>
                        </div>
                        <div>
                          <div style={{...lbl("var(--c022)"),marginBottom:"6px"}}>GRAMOS</div>
                          <input type="number" value={editingCosecha.peso_cosechado_gramos} min="0" placeholder="0" onChange={e=>setEditingCosecha({...editingCosecha,peso_cosechado_gramos:e.target.value})} style={inp()}/>
                        </div>
                      </div>
                      <div>
                        <div style={{...lbl("var(--c022)"),marginBottom:"6px"}}>NOTAS</div>
                        <textarea value={editingCosecha.notas} onChange={e=>setEditingCosecha({...editingCosecha,notas:e.target.value})} placeholder="Observaciones..." style={{...inp(),minHeight:"70px",resize:"vertical",lineHeight:"1.6"}}/>
                      </div>
                      <div style={{display:"flex",gap:"10px"}}>
                        <button disabled={savingCosecha} onClick={saveCosecha} style={{flex:1,padding:"12px",borderRadius:"10px",fontSize:"14px",fontWeight:"600",background:savingCosecha?"var(--c134)":"var(--c041)",color:"var(--c019)",border:"1px solid var(--c042)"}}>{savingCosecha?"Guardando...":"✓ Guardar"}</button>
                        <button onClick={()=>setEditingCosecha(null)} style={{padding:"12px 18px",borderRadius:"10px",fontSize:"14px",background:"var(--c004)",color:"var(--c007)",border:"1px solid var(--c002)"}}>Cancelar</button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {(()=>{
              const cosechas = lotes.filter(l=>l.estado==="cosechado");
              if(cosechas.length===0 && !editingCosecha){
                return <div style={{textAlign:"center",padding:"40px 20px",color:"var(--c113)",fontSize:"14px"}}>Sin cosechas registradas aún</div>;
              }
              const porGenetica = {};
              cosechas.forEach(c=>{
                const key = c.genetica_id || "_sin";
                porGenetica[key] = porGenetica[key] || [];
                porGenetica[key].push(c);
              });
              const gruposCosecha = Object.entries(porGenetica).map(([gid,items])=>{
                const g = gid!=="_sin" ? geneticas.find(x=>x.id===gid) : null;
                const ordenados = [...items].sort((a,b)=>(b.fecha_inicio||"").localeCompare(a.fecha_inicio||""));
                const totalG = items.reduce((a,c)=>a+(parseFloat(c.peso_cosechado_gramos)||0),0);
                const totalPlantasG = items.reduce((a,c)=>a+(c.cantidad_plantas||0),0);
                const promedioG = totalPlantasG>0 ? totalG/totalPlantasG : 0;
                return { key:gid, g, nombre:g?.nombre||"Sin genética", items:ordenados, totalG, promedioG };
              }).sort((a,b)=>a.nombre.localeCompare(b.nombre));
              return (
                <>
                  {cosechas.length>0 && (
                    <div style={card({background:"var(--c240)",borderColor:"var(--c241)"})}>
                      <span style={lbl("var(--c135)")}>RESUMEN ACUMULADO</span>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"12px",textAlign:"center"}}>
                        <div><div style={{fontSize:"28px",fontWeight:"700",color:"var(--c003)"}}>{cosechas.length}</div><div style={{fontSize:"11px",color:"var(--c096)",marginTop:"3px"}}>cosechas</div></div>
                        <div><div style={{fontSize:"28px",fontWeight:"700",color:"var(--c001)"}}>{cosechas.reduce((a,c)=>a+(parseFloat(c.peso_cosechado_gramos)||0),0).toFixed(0)}g</div><div style={{fontSize:"11px",color:"var(--c096)",marginTop:"3px"}}>producción total</div></div>
                        <div><div style={{fontSize:"28px",fontWeight:"700",color:"var(--c242)"}}>{cosechas.reduce((a,c)=>a+(c.cantidad_plantas||0),0)}</div><div style={{fontSize:"11px",color:"var(--c096)",marginTop:"3px"}}>plantas totales</div></div>
                      </div>
                    </div>
                  )}
                  <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                    {gruposCosecha.map(grupo=>{
                      const color = grupo.g?.color || "var(--c135)";
                      const abierto = !!cosechaGrupoAbierto[grupo.key];
                      return (
                        <div key={grupo.key} style={{border:`1px solid ${color}44`,borderRadius:"14px",overflow:"hidden"}}>
                          <div onClick={()=>setCosechaGrupoAbierto(prev=>({...prev,[grupo.key]:!prev[grupo.key]}))} style={{cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",background:abierto?`${color}14`:"transparent"}}>
                            <span style={{fontSize:"14px",fontWeight:"600",color}}>{grupo.nombre} <span style={{fontSize:"11px",color:"var(--c136)",fontWeight:"400"}}>· {grupo.items.length} cosecha{grupo.items.length!==1?"s":""} · {grupo.totalG.toFixed(0)}g · {grupo.promedioG.toFixed(1)}g/planta</span></span>
                            <span style={{fontSize:"13px",color,transform:abierto?"rotate(180deg)":"none",transition:"transform .2s"}}>▾</span>
                          </div>
                          {abierto && (
                            <div style={{padding:"4px 14px 14px",display:"flex",flexDirection:"column",gap:"10px"}}>
                              {grupo.items.map(c=>{
                                const s = sectores.find(x=>x.id===c.sector_actual_id);
                                return (
                                  <div key={c.id} style={{background:"var(--c243)",border:`1px solid ${color}33`,borderRadius:"14px",padding:"16px",borderLeft:`4px solid ${color}`}}>
                                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"12px"}}>
                                      <div>
                                        <div style={{fontSize:"15px",fontWeight:"600",color:"var(--c131)",marginBottom:"4px"}}>{c.numero_lote?loteLabel(c.numero_lote, sufijoDeLote(c)):"—"}</div>
                                        <div style={{fontSize:"12px",color:"var(--c027)"}}>{s?.nombre||"—"} · {c.cantidad_plantas} plantas</div>
                                      </div>
                                      <div style={{textAlign:"right"}}>
                                        {c.fecha_inicio && <div style={{fontSize:"13px",color:"var(--c003)",marginBottom:"2px"}}>✂️ {c.fecha_inicio}</div>}
                                        {c.dias_secado && <div style={{fontSize:"12px",color:"var(--c075)"}}>💨 {c.dias_secado} días</div>}
                                      </div>
                                    </div>
                                    {c.peso_cosechado_gramos>0 && <div style={{background:"var(--c244)",borderRadius:"8px",padding:"10px 14px",marginBottom:"10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:"13px",color:"var(--c136)"}}>Producción</span><span style={{fontSize:"22px",fontWeight:"700",color:"var(--c001)"}}>{c.peso_cosechado_gramos} g</span></div>}
                                    {c.notas && <div style={{fontSize:"13px",color:"var(--c245)",lineHeight:"1.6",marginBottom:"10px"}}>{c.notas}</div>}
                                    {!esEjecutor && (
                                      <div style={{display:"flex",gap:"8px"}}>
                                        <button onClick={()=>setEditingCosecha({...c, peso_cosechado_gramos:c.peso_cosechado_gramos||"", dias_secado:c.dias_secado||""})} style={{flex:1,padding:"8px",borderRadius:"8px",fontSize:"12px",background:"var(--c020)",color:"var(--c001)",border:"1px solid var(--c011)"}}>✏️ Editar</button>
                                        <button onClick={()=>delCosecha(c.id)} style={{padding:"8px 14px",borderRadius:"8px",fontSize:"12px",background:"var(--c008)",color:"var(--c012)",border:"1px solid var(--c009)"}}>🗑</button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
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
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"22px",color:"var(--c010)",marginBottom:"6px"}}>📉 Bajas y Mortandad</div>
              <div style={{fontSize:"13px",color:"var(--c246)",marginBottom:"20px"}}>HISTORIAL · MOTIVO · ETAPA AL MOMENTO DE LA BAJA</div>

              {bajas.length===0 ? (
                <div style={{textAlign:"center",padding:"40px 20px",color:"var(--c247)",fontSize:"14px"}}>Sin bajas registradas — buena señal</div>
              ) : (
                <>
                  <div style={card({background:"var(--c046)",borderColor:"var(--c248)"})}>
                    <span style={lbl("var(--c010)")}>RESUMEN</span>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",textAlign:"center"}}>
                      <div><div style={{fontSize:"28px",fontWeight:"700",color:"var(--c032)"}}>{bajas.length}</div><div style={{fontSize:"11px",color:"var(--c137)",marginTop:"3px"}}>eventos de baja</div></div>
                      <div><div style={{fontSize:"28px",fontWeight:"700",color:"var(--c032)"}}>{totalPlantas}</div><div style={{fontSize:"11px",color:"var(--c137)",marginTop:"3px"}}>plantas perdidas</div></div>
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                    {bajas.map((m,idx)=>{
                      const lote = lotes.find(l=>l.id===m.lote_id);
                      const g = lote ? geneticas.find(x=>x.id===lote.genetica_id) : null;
                      const sub = sectores.find(s=>s.id===m.sector_origen_id);
                      const sp = sub ? sectoresPadre.find(x=>x.id===sub.sector_padre_id) : null;
                      return (
                        <div key={m.id||idx} style={{background:"var(--c249)",border:"1px solid var(--c250)",borderRadius:"14px",padding:"16px",borderLeft:`4px solid ${g?.color||"var(--c138)"}`}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"8px"}}>
                            <div>
                              <div style={{fontSize:"15px",fontWeight:"600",color:"var(--c251)"}}>{g?.nombre||"—"}</div>
                              <div style={{fontSize:"12px",color:"var(--c252)",marginTop:"2px"}}>{sp?.nombre||"—"}{sub?` › ${sub.nombre}`:""}</div>
                            </div>
                            <div style={{background:"var(--c253)",border:"1px solid var(--c254)",borderRadius:"8px",padding:"6px 12px",textAlign:"center"}}>
                              <div style={{fontSize:"18px",fontWeight:"700",color:"var(--c032)"}}>{m.cantidad_movida}</div>
                              <div style={{fontSize:"10px",color:"var(--c255)"}}>{m.tipo==="baja"?"lote completo":"plantas"}</div>
                            </div>
                          </div>
                          {m.motivo && <div style={{fontSize:"13px",color:"var(--c048)",lineHeight:"1.6",marginBottom:"6px"}}>📋 {m.motivo}</div>}
                          <div style={{fontSize:"11px",color:"var(--c256)"}}>{(m.fecha||"").slice(0,10)} · {usuariosMap[m.usuario_id]||"—"}</div>
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
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"22px",color:"var(--c112)",marginBottom:"6px"}}>⚙️ Mi Sala</div>
            <div style={{fontSize:"13px",color:"var(--c054)",marginBottom:"20px"}}>ADMINISTRACIÓN DE SECTORES Y SUBSECTORES</div>

            <div style={{marginBottom:"14px",border:"1px solid var(--c028)",borderRadius:"12px",background:"var(--c139)",overflow:"hidden"}}>
              <div onClick={()=>setDatosMaestrosAbierto(!datosMaestrosAbierto)} style={{cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px"}}>
                <span style={{...lbl("var(--c016)"),margin:0}}>🗂 DATOS MAESTROS</span>
                <span style={{fontSize:"13px",color:"var(--c016)",transform:datosMaestrosAbierto?"rotate(180deg)":"none",transition:"transform .2s"}}>▾</span>
              </div>
              {datosMaestrosAbierto && (
              <div style={{padding:"0 10px 12px"}}>

                {/* ── Tipos de tarea (hijo) ── */}
                <div style={{border:"1px solid var(--c257)",borderRadius:"10px",background:"var(--c258)",overflow:"hidden",marginBottom:"10px"}}>
                  <div onClick={()=>setTiposTareaAbierto(!tiposTareaAbierto)} style={{cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px"}}>
                    <span style={{fontSize:"14px",fontWeight:"600",color:"var(--c140)"}}>📋 Tipos de tarea <span style={{fontSize:"11px",color:"var(--c033)",fontWeight:"400"}}>· {tiposTarea.length}</span></span>
                    <span style={{fontSize:"12px",color:"var(--c140)",transform:tiposTareaAbierto?"rotate(180deg)":"none",transition:"transform .2s"}}>▾</span>
                  </div>
                  {tiposTareaAbierto && (
                  <div style={{padding:"0 12px 12px"}}>
                  {editingTipoTarea ? (
                    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                      <div style={{display:"flex",gap:"8px"}}>
                        <input value={editingTipoTarea.icono} onChange={e=>setEditingTipoTarea({...editingTipoTarea,icono:e.target.value})} placeholder="🍄" style={{...inp(),width:"60px",textAlign:"center"}}/>
                        <input value={editingTipoTarea.nombre} onChange={e=>setEditingTipoTarea({...editingTipoTarea,nombre:e.target.value})} placeholder="Nombre del tipo de tarea" style={{...inp(),flex:1}}/>
                      </div>
                      <div>
                        <div style={{...lbl("var(--c021)"),marginBottom:"6px"}}>SECTORES HABILITADOS <span style={{fontWeight:"400",color:"var(--c259)"}}>(ninguno = todos)</span></div>
                        <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                          {sectoresPadre.map(sp=>{
                            const ids = editingTipoTarea.sectores_padre_ids || [];
                            const marcado = ids.includes(sp.id);
                            return (
                              <label key={sp.id} style={{display:"flex",alignItems:"center",gap:"10px",fontSize:"13px",color:marcado?"var(--c260)":"var(--c261)",background:marcado?"var(--c262)":"var(--c090)",borderRadius:"8px",padding:"9px 12px",border:"1px solid "+(marcado?"var(--c263)":"var(--c053)"),cursor:"pointer"}}>
                                <input type="checkbox" checked={marcado} onChange={e=>{
                                  const cur = editingTipoTarea.sectores_padre_ids || [];
                                  const next = e.target.checked ? [...cur, sp.id] : cur.filter(x=>x!==sp.id);
                                  setEditingTipoTarea({...editingTipoTarea, sectores_padre_ids: next});
                                }}/>
                                {sp.nombre}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                      <div style={{display:"flex",gap:"10px"}}>
                        <button disabled={savingTipoTarea || !editingTipoTarea.nombre} onClick={saveTipoTarea} style={{flex:1,padding:"10px",borderRadius:"8px",fontSize:"13px",fontWeight:"600",background:"var(--c084)",color:"var(--c005)",border:"none"}}>{savingTipoTarea?"Guardando...":"✓ Guardar"}</button>
                        <button onClick={()=>setEditingTipoTarea(null)} style={{padding:"10px 16px",borderRadius:"8px",fontSize:"13px",background:"var(--c004)",color:"var(--c007)",border:"1px solid var(--c002)"}}>Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={()=>setEditingTipoTarea(emptyTipoTarea())} style={{width:"100%",padding:"10px",borderRadius:"8px",fontSize:"12px",fontWeight:"600",background:"var(--c089)",color:"var(--c016)",border:"1px dashed var(--c028)",marginBottom:"12px"}}>+ Nuevo tipo de tarea</button>
                  )}
                  {tiposTarea.length>0 && (
                    <div style={{display:"flex",flexDirection:"column",gap:"8px",marginTop:"12px"}}>
                      {tiposTarea.map(tt=>{
                        const ids = (tt.sectores_padre_ids && tt.sectores_padre_ids.length) ? tt.sectores_padre_ids : (tt.sector_padre_id ? [tt.sector_padre_id] : []);
                        const nombres = ids.length ? ids.map(id=>sectoresPadre.find(x=>x.id===id)?.nombre).filter(Boolean).join(", ") : "Todos los sectores";
                        return (
                          <div key={tt.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"var(--c122)",borderRadius:"10px",padding:"10px 14px",opacity:tt.activo===false?0.5:1}}>
                            <div>
                              <span style={{fontSize:"14px",color:"var(--c060)"}}>{tt.icono} {tt.nombre}</span>
                              <div style={{fontSize:"11px",color:"var(--c033)"}}>{nombres}</div>
                            </div>
                            <div style={{display:"flex",gap:"6px"}}>
                              <button onClick={()=>setEditingTipoTarea({...tt, sectores_padre_ids: (tt.sectores_padre_ids && tt.sectores_padre_ids.length) ? [...tt.sectores_padre_ids] : (tt.sector_padre_id ? [tt.sector_padre_id] : [])})} style={{padding:"6px 10px",borderRadius:"7px",fontSize:"11px",background:"var(--c020)",color:"var(--c001)",border:"1px solid var(--c011)"}}>✏️</button>
                              <button onClick={()=>toggleActivoTipoTarea(tt)} style={{padding:"6px 10px",borderRadius:"7px",fontSize:"11px",background:"var(--c078)",color:"var(--c003)",border:"1px solid var(--c079)"}}>{tt.activo===false?"↺":"⏸"}</button>
                              <button onClick={()=>delTipoTarea(tt)} style={{padding:"6px 10px",borderRadius:"7px",fontSize:"11px",background:"var(--c008)",color:"var(--c012)",border:"1px solid var(--c009)"}}>🗑</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  </div>
                  )}
                </div>

                {/* ── Genéticas (hijo) ── */}
                <div style={{border:"1px solid var(--c070)",borderRadius:"10px",background:"var(--c264)",overflow:"hidden"}}>
                  <div onClick={()=>setGeneticasBoxAbierto(!geneticasBoxAbierto)} style={{cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px"}}>
                    <span style={{fontSize:"14px",fontWeight:"600",color:"var(--c034)"}}>🧬 Genéticas <span style={{fontSize:"11px",color:"var(--c023)",fontWeight:"400"}}>· {geneticas.length}</span></span>
                    <span style={{fontSize:"12px",color:"var(--c034)",transform:geneticasBoxAbierto?"rotate(180deg)":"none",transition:"transform .2s"}}>▾</span>
                  </div>
                  {geneticasBoxAbierto && (
                  <div style={{padding:"0 12px 12px"}}>
                    <div style={{display:"flex",flexDirection:"column",gap:"6px",marginBottom:"10px"}}>
                      {geneticas.length===0 && <div style={{fontSize:"12px",color:"var(--c265)",fontStyle:"italic"}}>Sin genéticas cargadas todavía.</div>}
                      {[...geneticas].sort((a,b)=>(a.nombre||"").localeCompare(b.nombre||"")).map(g=>(
                        <div key={g.id} style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"13px",color:"var(--c266)",background:"var(--c267)",borderRadius:"8px",padding:"8px 12px"}}>
                          <span style={{width:"10px",height:"10px",borderRadius:"50%",background:g.color||"var(--c034)",flexShrink:0}}/>
                          {g.nombre}
                        </div>
                      ))}
                    </div>
                    <button onClick={()=>setTab("_geneticas")} style={{width:"100%",padding:"11px",borderRadius:"9px",fontSize:"13px",fontWeight:"600",background:"var(--c268)",color:"var(--c034)",border:"1px solid var(--c070)"}}>🧬 Administrar genéticas</button>
                  </div>
                  )}
                </div>

              </div>
              )}
            </div>

            <div style={card({borderColor:"var(--c071)",background:"var(--c141)"})}>
              <div onClick={()=>setUsuariosSalaAbierto(!usuariosSalaAbierto)} style={{cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:usuariosSalaAbierto?"12px":"0"}}>
                <span style={{...lbl("var(--c097)"),margin:0}}>🛠 ADMINISTRACIÓN <span style={{color:"var(--c040)",fontWeight:"400"}}>· Usuarios · {usuariosLista.length}</span></span>
                <span style={{fontSize:"13px",color:"var(--c097)",transform:usuariosSalaAbierto?"rotate(180deg)":"none",transition:"transform .2s"}}>▾</span>
              </div>

              {usuariosSalaAbierto && (<>
              {editingUsuario ? (
                <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                  <div>
                    <div style={{...lbl("var(--c142)"),marginBottom:"6px"}}>NOMBRE</div>
                    <input value={editingUsuario.nombre} onChange={e=>setEditingUsuario({...editingUsuario,nombre:e.target.value})} style={inp()}/>
                  </div>
                  <div>
                    <div style={{...lbl("var(--c142)"),marginBottom:"6px"}}>EMAIL</div>
                    <input type="email" value={editingUsuario.email} onChange={e=>setEditingUsuario({...editingUsuario,email:e.target.value})} style={inp()}/>
                  </div>
                  {!editingUsuario.id && (
                    <div style={{fontSize:"11px",color:"var(--c040)"}}>Se crea como Ejecutor en tu Sala. Solo el Administrador puede crear Master Growers nuevos.</div>
                  )}
                  <div style={{display:"flex",gap:"10px"}}>
                    <button disabled={savingUsuario || !editingUsuario.nombre || !editingUsuario.email} onClick={saveUsuario} style={{flex:1,padding:"10px",borderRadius:"8px",fontSize:"13px",fontWeight:"600",background:"var(--c269)",color:"var(--c005)",border:"1px solid var(--c270)"}}>{savingUsuario?"Guardando...":"✓ Guardar"}</button>
                    <button onClick={()=>setEditingUsuario(null)} style={{padding:"10px 16px",borderRadius:"8px",fontSize:"13px",background:"var(--c004)",color:"var(--c007)",border:"1px solid var(--c002)"}}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <button onClick={()=>setEditingUsuario(emptyUsuario())} style={{width:"100%",padding:"10px",borderRadius:"8px",fontSize:"13px",background:"var(--c141)",color:"var(--c097)",border:"2px dashed var(--c071)",marginBottom:"4px"}}>+ Nuevo usuario</button>
              )}

              <div style={{display:"flex",flexDirection:"column",gap:"10px",marginTop:"12px"}}>
                {usuariosLista.map(u=>(
                  <div key={u.id} style={{background:"var(--c271)",borderRadius:"10px",padding:"10px 14px",opacity:u.activo===false?0.5:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:u.rol==="ejecutor"?"8px":"0"}}>
                      <div>
                        <span style={{fontSize:"14px",color:"var(--c272)"}}>{u.nombre}</span>
                        <span style={{fontSize:"10px",color:"var(--c273)",marginLeft:"8px"}}>{u.rol==="ejecutor"?"EJECUTOR":"MASTER GROWER"}</span>
                        {u.activo===false && <span style={{fontSize:"10px",color:"var(--c012)",marginLeft:"8px"}}>DESACTIVADO</span>}
                      </div>
                      <div style={{display:"flex",gap:"6px"}}>
                        <button onClick={()=>setEditingUsuario({id:u.id, nombre:u.nombre, email:u.email, rol:u.rol})} style={{padding:"5px 9px",borderRadius:"6px",fontSize:"10px",background:"var(--c020)",color:"var(--c001)",border:"1px solid var(--c011)"}}>✏️</button>
                        {u.id!==usuario.id && (
                          <button onClick={()=>toggleActivoUsuario(u)} style={{padding:"5px 9px",borderRadius:"6px",fontSize:"10px",background:"var(--c008)",color:"var(--c012)",border:"1px solid var(--c009)"}}>{u.activo===false?"↺ Activar":"⏸ Desactivar"}</button>
                        )}
                      </div>
                    </div>
                    {u.rol==="ejecutor" && (
                      <button onClick={()=>togglePermisoRelevamiento(u)} style={{padding:"6px 10px",borderRadius:"6px",fontSize:"10px",background:u.permisos?.relevamiento?"var(--c274)":"var(--c143)",color:u.permisos?.relevamiento?"var(--c275)":"var(--c276)",border:`1px solid ${u.permisos?.relevamiento?"var(--c277)":"var(--c067)"}`}}>🔍 {u.permisos?.relevamiento?"Relevamiento: ON":"Relevamiento: OFF"}</button>
                    )}
                  </div>
                ))}
              </div>
              </>)}
            </div>

            {lotes.filter(l=>l.estado==="pendiente_aprobacion").length>0 && (
              <div style={card({borderColor:"var(--c278)",background:"var(--c279)"})}>
                <span style={lbl("var(--c058)")}>🆕 PENDIENTES DE APROBACIÓN (detectados por relevamiento)</span>
                <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                  {lotes.filter(l=>l.estado==="pendiente_aprobacion").map(l=>{
                    const g = geneticas.find(x=>x.id===l.genetica_id);
                    const sub = sectores.find(s=>s.id===l.sector_actual_id);
                    const sp = sub ? sectoresPadre.find(x=>x.id===sub.sector_padre_id) : null;
                    return (
                      <div key={l.id} style={{background:"var(--c280)",borderRadius:"10px",padding:"12px 14px"}}>
                        <div style={{fontSize:"14px",color:"var(--c281)",marginBottom:"4px"}}>{g?.nombre||"Sin genética"} · {l.cantidad_plantas} plantas</div>
                        <div style={{fontSize:"12px",color:"var(--c282)",marginBottom:"8px"}}>{sp?.nombre||"—"}{sub?` › ${sub.nombre}`:""}</div>
                        {l.notas && <div style={{fontSize:"11px",color:"var(--c283)",marginBottom:"8px"}}>{l.notas}</div>}
                        <div style={{display:"flex",gap:"6px"}}>
                          <button onClick={()=>aprobarLotePendiente(l)} style={{flex:1,padding:"7px",borderRadius:"7px",fontSize:"11px",background:"var(--c284)",color:"var(--c001)",border:"1px solid var(--c285)"}}>✓ Aprobar</button>
                          <button onClick={()=>setEditingLote({...l, cantidad_plantas:String(l.cantidad_plantas)})} style={{padding:"7px 10px",borderRadius:"7px",fontSize:"11px",background:"var(--c020)",color:"var(--c001)",border:"1px solid var(--c011)"}}>✏️ Editar y aprobar</button>
                          <button onClick={()=>delLote(l.id)} style={{padding:"7px 10px",borderRadius:"7px",fontSize:"11px",background:"var(--c008)",color:"var(--c012)",border:"1px solid var(--c009)"}}>🗑</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{marginBottom:"14px",border:"1px solid var(--c031)",borderRadius:"12px",background:"var(--c286)",overflow:"hidden"}}>
              <div onClick={()=>setEstructuraAbierto(!estructuraAbierto)} style={{cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",background:"var(--c287)"}}>
                <span style={{...lbl("var(--c072)"),margin:0}}>🧱 ESTRUCTURA <span style={{color:"var(--c054)",fontWeight:"400"}}>· Sectores y subsectores</span></span>
                <span style={{fontSize:"13px",color:"var(--c072)",transform:estructuraAbierto?"rotate(180deg)":"none",transition:"transform .2s"}}>▾</span>
              </div>
              {estructuraAbierto && (<div style={{padding:"10px"}}>
            {editingSub && (
              <div style={card({borderColor:"var(--c117)",background:"var(--c288)"})}>
                <span style={lbl("var(--c289)")}>{editingSub.id?"EDITAR SUBSECTOR":"NUEVO SUBSECTOR"}</span>
                <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                  <div>
                    <div style={{...lbl("var(--c098)"),marginBottom:"6px"}}>SECTOR PADRE</div>
                    <select value={editingSub.sector_padre_id} onChange={e=>setEditingSub({...editingSub,sector_padre_id:e.target.value})} style={inp()}>
                      <option value="">Seleccionar...</option>
                      {sectoresPadre.map(sp=><option key={sp.id} value={sp.id}>{sp.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{...lbl("var(--c098)"),marginBottom:"6px"}}>NOMBRE DEL SUBSECTOR</div>
                    <input value={editingSub.nombre} onChange={e=>setEditingSub({...editingSub,nombre:e.target.value})} placeholder="Ej: Carpa 4, Vege 3L..." style={inp()}/>
                  </div>
                  <div>
                    <div style={{...lbl("var(--c098)"),marginBottom:"6px"}}>CAPACIDAD (opcional)</div>
                    <input type="number" value={editingSub.capacidad_unidades} onChange={e=>setEditingSub({...editingSub,capacidad_unidades:e.target.value})} placeholder="Ej: 16 plantas, 35 esquejes" style={inp()}/>
                  </div>
                  {sectoresPadre.find(sp=>sp.id===editingSub.sector_padre_id)?.nombre==="Vegetativo" && (
                    <label style={{display:"flex",alignItems:"flex-start",gap:"10px",fontSize:"13px",color:"var(--c290)",background:"var(--c116)",borderRadius:"8px",padding:"10px 12px",border:"1px solid var(--c031)"}}>
                      <input type="checkbox" checked={editingSub.puede_avanzar_etapa!==false} onChange={e=>setEditingSub({...editingSub,puede_avanzar_etapa:e.target.checked})} style={{marginTop:"2px"}}/>
                      <span>Permite avanzar a Floración<br/><span style={{fontSize:"11px",color:"var(--c054)"}}>Si lo destildás, los lotes en este subsector no van a poder cortar directo a flora (ej: 150cc todavía muy chico).</span></span>
                    </label>
                  )}
                  <div style={{display:"flex",gap:"10px"}}>
                    <button disabled={savingSub || !editingSub.sector_padre_id || !editingSub.nombre} onClick={saveSub} style={{flex:1,padding:"12px",borderRadius:"10px",fontSize:"14px",fontWeight:"600",background:savingSub?"var(--c031)":"var(--c071)",color:"var(--c005)",border:"1px solid var(--c291)"}}>{savingSub?"Guardando...":"✓ Guardar"}</button>
                    <button onClick={()=>setEditingSub(null)} style={{padding:"12px 18px",borderRadius:"10px",fontSize:"14px",background:"var(--c004)",color:"var(--c007)",border:"1px solid var(--c002)"}}>Cancelar</button>
                  </div>
                </div>
              </div>
            )}

            {sectoresPadre.map(sp=>{
              const subsDeEste = subsectoresDe(sp.id);
              const abierto = sectorMiSalaAbierto===sp.id;
              return (
              <div key={sp.id} style={card({borderColor:"var(--c031)"})}>
                <div onClick={()=>setSectorMiSalaAbierto(abierto?"":sp.id)} style={{cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:abierto?"14px":"0"}}>
                  <span style={{fontSize:"17px",fontWeight:"600",color:"var(--c072)"}}>{sp.nombre} <span style={{fontSize:"11px",color:"var(--c054)",fontWeight:"400"}}>· {subsDeEste.length}</span></span>
                  <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                    {abierto && <button onClick={(e)=>{e.stopPropagation(); setEditingSub(emptySubsector(sp.id));}} style={{fontSize:"12px",padding:"6px 14px",borderRadius:"14px",background:"var(--c143)",color:"var(--c072)",border:"1px dashed var(--c071)"}}>+ Agregar</button>}
                    <span style={{fontSize:"13px",color:"var(--c054)",transform:abierto?"rotate(180deg)":"none",transition:"transform .2s"}}>▾</span>
                  </div>
                </div>
                {abierto && (
                <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                  {subsDeEste.map(sub=>(
                    <div key={sub.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"var(--c055)",borderRadius:"8px",padding:"10px 14px"}}>
                      <div>
                        <div style={{fontSize:"14px",color:"var(--c019)"}}>{sub.nombre}</div>
                        {sub.capacidad_unidades && <div style={{fontSize:"11px",color:"var(--c027)"}}>capacidad: {sub.capacidad_unidades}</div>}
                        {sp.nombre==="Vegetativo" && sub.puede_avanzar_etapa===false && <div style={{fontSize:"10px",color:"var(--c292)"}}>⏸ no habilitada para pasar a Floración</div>}
                      </div>
                      <div style={{display:"flex",gap:"6px"}}>
                        <button onClick={()=>setEditingSub({id:sub.id, sector_padre_id:sub.sector_padre_id, nombre:sub.nombre, capacidad_unidades:sub.capacidad_unidades||"", puede_avanzar_etapa:sub.puede_avanzar_etapa})} style={{fontSize:"11px",padding:"6px 10px",borderRadius:"6px",background:"var(--c020)",color:"var(--c001)",border:"1px solid var(--c011)"}}>✏️</button>
                        <button onClick={()=>delSub(sub.id)} style={{fontSize:"11px",padding:"6px 10px",borderRadius:"6px",background:"var(--c008)",color:"var(--c012)",border:"1px solid var(--c009)"}}>🗑</button>
                      </div>
                    </div>
                  ))}
                  {subsDeEste.length===0 && <div style={{fontSize:"12px",color:"var(--c051)",fontStyle:"italic"}}>Sin subsectores</div>}
                </div>
                )}
              </div>
              );
            })}
              </div>)}
            </div>
          </div>
        )}

        {/* ══ APARIENCIA (tema) ══ */}
        {tab==="_apariencia" && (
          <div style={{padding:"16px"}}>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"22px",color:"var(--c001)",marginBottom:"6px"}}>🎨 Apariencia</div>
            <div style={{fontSize:"12px",color:"var(--c024)",marginBottom:"18px"}}>Se guarda en tu cuenta: te sigue en el celular, la tablet y la compu.</div>
            <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
              {[
                {k:"oscuro",  t:"🌙 Oscuro",         d:"Ideal adentro de la sala, con las luces prendidas o en penumbra."},
                {k:"claro",   t:"☀️ Claro",          d:"Mejor con luz de día o pantallas muy brillantes."},
                {k:"sistema", t:"⚙️ El del sistema", d:"Sigue la configuración de tu teléfono o computadora."}
              ].map(o=>{
                const sel = temaPref===o.k;
                return (
                  <div key={o.k} onClick={()=>cambiarTema(o.k)} style={{cursor:"pointer",borderRadius:"12px",padding:"14px 16px",background:"var(--c020)",border:"2px solid "+(sel?"var(--c001)":"var(--c011)")}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:"15px",fontWeight:"600",color:sel?"var(--c001)":"var(--c019)"}}>{o.t}</span>
                      {sel && <span style={{fontSize:"15px",color:"var(--c001)",fontWeight:"700"}}>✓</span>}
                    </div>
                    <div style={{fontSize:"11px",color:"var(--c024)",marginTop:"5px",lineHeight:"1.4"}}>{o.d}</div>
                  </div>
                );
              })}
            </div>
            {guardandoTema && <div style={{fontSize:"11px",color:"var(--c024)",marginTop:"12px"}}>Guardando…</div>}
            <div style={{fontSize:"11px",color:"var(--c024)",marginTop:"18px",lineHeight:"1.5",background:"var(--c020)",border:"1px solid var(--c011)",borderRadius:"8px",padding:"11px 13px"}}>
              Los colores que elegiste para tus genéticas no cambian con el tema — son tuyos. Si alguno queda poco legible en modo claro, podés editarlo en Genéticas.
            </div>
          </div>
        )}

        {/* ══ REPORTES ══ */}
        {tab==="_reportes" && !esEjecutor && (()=>{
          // Promedio por genética, sobre stats_lotes (RPC). Regla estricta de "etapa terminada":
          // una etapa cuenta SOLO si el lote SALIÓ de ella con un movimiento real (un avance de
          // etapa o una cosecha). No alcanza con estar parado más adelante ni con el estado:
          // los lotes de carga inicial que nunca se movieron NO aportan duración a ninguna etapa.
          // Invariante biológico extra: Secado no cuenta si no hubo Floración (no se seca lo que no floreció).
          const promedioPorGenetica = () => {
            const acc = {}; // genId -> etapa -> {suma, n}
            const etapasNom = ["Enraizado","Vegetativo","Floración","Secado"];

            // Etapas de las que cada lote realmente salió (movimiento de avance o cosecha)
            const salidas = {}; // loteId -> Set(nombreEtapa)
            movimientos.forEach(m=>{
              if(!["movimiento","cosecha"].includes(m.tipo)) return;
              if(!m.sector_origen_id) return;
              const so = sectores.find(x=>x.id===m.sector_origen_id);
              const spN = so ? sectoresPadre.find(x=>x.id===so.sector_padre_id)?.nombre : null;
              if(!spN) return;
              (salidas[m.lote_id] = salidas[m.lote_id] || new Set()).add(spN);
            });

            lotes.forEach(l=>{
              if(!l.genetica_id) return;
              if(l.estado==="descartado") return;  // un descarte pudo cortar la etapa antes de tiempo → no ensucia el promedio
              const st = statsLotes[l.id];
              if(!st) return;
              const salioDe = salidas[l.id] || new Set();
              const dias = {
                "Enraizado": st.dias_enraizado,
                "Vegetativo": st.dias_vegetativo,
                "Floración": st.dias_floracion,
                "Secado": (l.dias_secado!=null ? l.dias_secado : st.dias_secado)
              };
              etapasNom.forEach(et=>{
                if(!salioDe.has(et)) return;              // no salió de la etapa → no está terminada
                if(!(dias[et]>0)) return;                 // sin duración registrada
                if(et==="Secado" && !(dias["Floración"]>0)) return; // secado sin floración = dato inválido
                acc[l.genetica_id] = acc[l.genetica_id]||{};
                acc[l.genetica_id][et] = acc[l.genetica_id][et]||{suma:0,n:0};
                acc[l.genetica_id][et].suma += dias[et];
                acc[l.genetica_id][et].n += 1;
              });
            });
            return acc;
          };

          const promedios = promedioPorGenetica();

          // Producción por genética — promedio de gramos por planta cosechada, no el total a secas
          const produccionGen = {}; // genId -> {gramos, plantas}
          lotes.filter(l=>l.estado==="cosechado").forEach(l=>{
            if(!l.genetica_id) return;
            produccionGen[l.genetica_id] = produccionGen[l.genetica_id] || {gramos:0, plantas:0};
            produccionGen[l.genetica_id].gramos += (l.peso_cosechado_gramos||0);
            produccionGen[l.genetica_id].plantas += (l.cantidad_plantas||0);
          });
          const produccionOrdenada = Object.entries(produccionGen)
            .map(([gid,d])=>({g:geneticas.find(x=>x.id===gid), gramos:d.gramos, plantas:d.plantas, porPlanta: d.plantas>0 ? d.gramos/d.plantas : 0}))
            .filter(x=>x.g).sort((a,b)=>b.porPlanta-a.porPlanta);
          const maxProd = Math.max(1, ...produccionOrdenada.map(x=>x.porPlanta));

          // Mortandad por genética (bajas de movimientos_lote)
          const bajasGen = {};
          movimientos.filter(m=>["baja","baja_parcial"].includes(m.tipo)).forEach(m=>{
            const lote = lotes.find(l=>l.id===m.lote_id);
            if(lote?.genetica_id) bajasGen[lote.genetica_id] = (bajasGen[lote.genetica_id]||0) + (m.cantidad_movida||0);
          });
          const bajasOrdenadas = Object.entries(bajasGen).map(([gid,b])=>({g:geneticas.find(x=>x.id===gid),bajas:b})).filter(x=>x.g).sort((a,b)=>b.bajas-a.bajas);
          const maxBaja = Math.max(1, ...bajasOrdenadas.map(x=>x.bajas));

          // Ocupación de subsectores (plantas activas vs capacidad)
          const ocupacion = sectores.map(s=>{
            const plantas = lotes.filter(l=>l.sector_actual_id===s.id && ["activo","maduracion"].includes(l.estado)).reduce((a,l)=>a+(l.cantidad_plantas||0),0);
            const sp = sectoresPadre.find(x=>x.id===s.sector_padre_id);
            return { nombre:s.nombre, sp:sp?.nombre||"", plantas, cap:s.capacidad_unidades||0 };
          }).filter(o=>o.cap>0 || o.plantas>0);

          // Genéticas activas por subsector (para torta de % por subsector)
          const subsConPlantas = sectores.map(s=>{
            const ls = lotes.filter(l=>l.sector_actual_id===s.id && ["activo","maduracion"].includes(l.estado));
            const porGen = {};
            ls.forEach(l=>{ if(l.genetica_id) porGen[l.genetica_id]=(porGen[l.genetica_id]||0)+(l.cantidad_plantas||0); });
            const total = Object.values(porGen).reduce((a,b)=>a+b,0);
            const sp = sectoresPadre.find(x=>x.id===s.sector_padre_id);
            return { nombre:s.nombre, sp:sp?.nombre||"", total, items: Object.entries(porGen).map(([gid,c])=>({g:geneticas.find(x=>x.id===gid), cant:c})).filter(x=>x.g).sort((a,b)=>b.cant-a.cant) };
          }).filter(s=>s.total>0);

          // Distribución global de genéticas (torta general)
          const globalGen = {};
          lotes.filter(l=>["activo","maduracion"].includes(l.estado)).forEach(l=>{ if(l.genetica_id) globalGen[l.genetica_id]=(globalGen[l.genetica_id]||0)+(l.cantidad_plantas||0); });
          const globalTotal = Object.values(globalGen).reduce((a,b)=>a+b,0);
          const globalItems = Object.entries(globalGen).map(([gid,c])=>({g:geneticas.find(x=>x.id===gid),cant:c})).filter(x=>x.g).sort((a,b)=>b.cant-a.cant);

          // Helper: barra de torta horizontal (stacked) — más legible en móvil que un pie chart real
          const BarraStacked = ({items, total}) => (
            <div>
              <div style={{display:"flex",height:"22px",borderRadius:"6px",overflow:"hidden",marginBottom:"8px"}}>
                {items.map((it,i)=><div key={i} style={{width:`${(it.cant/total*100).toFixed(1)}%`,background:it.g.color||"var(--c027)"}}/>)}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
                {items.map((it,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:"12px"}}>
                    <span style={{color:it.g.color||"var(--c087)"}}>● {it.g.nombre}</span>
                    <span style={{color:"var(--c093)"}}>{it.cant} · {(it.cant/total*100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          );

          // ── Reporte info. LOTES: filtros + filas + descarga TSV ──
          const subsFiltroRep = repLotesFiltro.etapa ? sectores.filter(s=>s.sector_padre_id===repLotesFiltro.etapa) : sectores;
          const lotesInfo = lotes.map(l=>{
            const s = sectores.find(x=>x.id===l.sector_actual_id);
            const spL = s ? sectoresPadre.find(x=>x.id===s.sector_padre_id) : null;
            return { l, s, spL, st: statsLotes[l.id]||{}, g: geneticas.find(x=>x.id===l.genetica_id) };
          }).filter(x=>{
            if(repLotesFiltro.etapa && x.spL?.id!==repLotesFiltro.etapa) return false;
            if(repLotesFiltro.sub && x.s?.id!==repLotesFiltro.sub) return false;
            if(repLotesFiltro.genetica && x.l.genetica_id!==repLotesFiltro.genetica) return false;
            if(repLotesFiltro.estado!=="todos" && x.l.estado!==repLotesFiltro.estado) return false;
            return true;
          }).sort((a,b)=>{
            if(repLotesFiltro.orden==="numero"){
              const na=a.l.numero_lote||0, nb=b.l.numero_lote||0;
              if(na!==nb) return na-nb;
              return sufijoDeLote(a.l).localeCompare(sufijoDeLote(b.l));
            }
            if(repLotesFiltro.orden==="floracion"){
              return (b.st.dias_floracion||0)-(a.st.dias_floracion||0);
            }
            // genética (A→Z), y dentro de cada genética por número de lote
            const ga=(a.g?.nombre||"~").toLowerCase(), gb=(b.g?.nombre||"~").toLowerCase();
            if(ga!==gb) return ga.localeCompare(gb);
            const na=a.l.numero_lote||0, nb=b.l.numero_lote||0;
            if(na!==nb) return na-nb;
            return sufijoDeLote(a.l).localeCompare(sufijoDeLote(b.l));
          });
          const descargarTSVLotes = () => {
            const cab = ["Lote","Genética","Estado","Etapa","Ubicación","Plantas","Fecha inicio","Días Enraizado","Días Vegetativo","Días Floración","Días Secado","Peso cosechado (g)","g/planta"];
            const filas = lotesInfo.map(({l,s,spL,st,g})=>[
              l.numero_lote ? loteLabel(l.numero_lote, sufijoDeLote(l)) : "—",
              g?.nombre||"—",
              l.estado,
              spL?.nombre||"—",
              s?.nombre||"—",
              l.cantidad_plantas,
              l.fecha_inicio||"",
              st.dias_enraizado!=null?st.dias_enraizado:"",
              st.dias_vegetativo!=null?st.dias_vegetativo:"",
              st.dias_floracion!=null?st.dias_floracion:"",
              (l.dias_secado!=null?l.dias_secado:(st.dias_secado!=null?st.dias_secado:"")),
              l.estado==="cosechado" ? (l.peso_cosechado_gramos||0) : "",
              l.estado==="cosechado" && l.cantidad_plantas>0 ? ((l.peso_cosechado_gramos||0)/l.cantidad_plantas).toFixed(1) : ""
            ]);
            const tsv = [cab.join("\t"), ...filas.map(f=>f.join("\t"))].join("\n");
            const blob = new Blob(["\ufeff"+tsv], {type:"text/tab-separated-values;charset=utf-8"});
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = "reporte_lotes.tsv";
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            setTimeout(()=>URL.revokeObjectURL(url), 3000);
          };

          const Reporte = ({id, titulo, color, vacio, children}) => {
            const abierto = reporteAbierto===id;
            return (
              <div style={{border:`1px solid ${color}44`,borderRadius:"12px",marginBottom:"10px",overflow:"hidden"}}>
                <div onClick={()=>setReporteAbierto(abierto?"":id)} style={{cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",background:abierto?`${color}14`:"transparent"}}>
                  <span style={{fontSize:"13px",fontWeight:"600",color,letterSpacing:"0.5px"}}>{titulo}</span>
                  <span style={{fontSize:"13px",color,transform:abierto?"rotate(180deg)":"none",transition:"transform .2s"}}>▾</span>
                </div>
                {abierto && <div style={{padding:"4px 16px 16px"}}>{vacio || children}</div>}
              </div>
            );
          };

          return (
            <div className="fade">
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"22px",color:"var(--c065)",marginBottom:"6px"}}>📊 Reportes</div>
              <div style={{fontSize:"12px",color:"var(--c293)",marginBottom:"16px"}}>Tocá cada reporte para abrirlo</div>

              <Reporte id="distribucion" titulo="🧬 Distribución de genéticas (total activo)" color="var(--c001)" vacio={globalItems.length===0 && <div style={{fontSize:"13px",color:"var(--c024)"}}>Sin plantas activas.</div>}>
                <BarraStacked items={globalItems} total={globalTotal}/>
              </Reporte>

              <Reporte id="subsector" titulo="📍 Genéticas por subsector" color="var(--c052)" vacio={subsConPlantas.length===0 && <div style={{fontSize:"13px",color:"var(--c024)"}}>Sin plantas en subsectores.</div>}>
                <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
                  {subsConPlantas.map((s,i)=>(
                    <div key={i}>
                      <div style={{fontSize:"13px",color:"var(--c019)",marginBottom:"6px"}}>{s.nombre} <span style={{fontSize:"11px",color:"var(--c075)"}}>· {s.sp} · {s.total} plantas</span></div>
                      <BarraStacked items={s.items} total={s.total}/>
                    </div>
                  ))}
                </div>
              </Reporte>

              <Reporte id="produccion" titulo="⚖️ Producción por genética (g/planta)" color="var(--c003)" vacio={produccionOrdenada.length===0 && <div style={{fontSize:"13px",color:"var(--c024)"}}>Sin cosechas registradas todavía.</div>}>
                {produccionOrdenada.map((x,i)=>(
                  <div key={i} style={{marginBottom:"10px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:"13px",marginBottom:"4px"}}>
                      <span style={{color:x.g.color||"var(--c003)"}}>{x.g.nombre}</span>
                      <span style={{color:"var(--c144)",fontWeight:"600"}}>{x.porPlanta.toFixed(1)} g/planta <span style={{fontSize:"10px",color:"var(--c294)",fontWeight:"400"}}>({x.gramos}g · {x.plantas} pl.)</span></span>
                    </div>
                    <div style={{height:"8px",background:"var(--c295)",borderRadius:"4px",overflow:"hidden"}}><div style={{width:`${(x.porPlanta/maxProd*100)}%`,height:"100%",background:"var(--c003)"}}/></div>
                  </div>
                ))}
              </Reporte>

              <Reporte id="mortandad" titulo="🥀 Mortandad por genética (bajas)" color="var(--c010)" vacio={bajasOrdenadas.length===0 && <div style={{fontSize:"13px",color:"var(--c024)"}}>Sin bajas registradas.</div>}>
                {bajasOrdenadas.map((x,i)=>(
                  <div key={i} style={{marginBottom:"10px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:"13px",marginBottom:"4px"}}>
                      <span style={{color:x.g.color||"var(--c032)"}}>{x.g.nombre}</span>
                      <span style={{color:"var(--c296)",fontWeight:"600"}}>{x.bajas} bajas</span>
                    </div>
                    <div style={{height:"8px",background:"var(--c297)",borderRadius:"4px",overflow:"hidden"}}><div style={{width:`${(x.bajas/maxBaja*100)}%`,height:"100%",background:"var(--c010)"}}/></div>
                  </div>
                ))}
              </Reporte>

              <Reporte id="ocupacion" titulo="📦 Ocupación de subsectores" color="var(--c064)" vacio={ocupacion.length===0 && <div style={{fontSize:"13px",color:"var(--c024)"}}>Sin subsectores con capacidad o plantas.</div>}>
                {ocupacion.map((o,i)=>{
                  const pct = o.cap>0 ? Math.min(100, o.plantas/o.cap*100) : 0;
                  const col = pct>=90?"var(--c010)":pct>=70?"var(--c003)":"var(--c036)";
                  return (
                    <div key={i} style={{marginBottom:"10px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:"13px",marginBottom:"4px"}}>
                        <span style={{color:"var(--c091)"}}>{o.nombre} <span style={{fontSize:"10px",color:"var(--c059)"}}>· {o.sp}</span></span>
                        <span style={{color:col}}>{o.plantas}{o.cap>0?` / ${o.cap}`:""}</span>
                      </div>
                      {o.cap>0 && <div style={{height:"8px",background:"var(--c298)",borderRadius:"4px",overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:col}}/></div>}
                    </div>
                  );
                })}
              </Reporte>

              <Reporte id="prom_genetica" titulo="⏱ Tiempo promedio por etapa (por genética)" color="var(--c016)" vacio={Object.keys(promedios).length===0 && <div style={{fontSize:"13px",color:"var(--c024)"}}>Todavía no hay etapas terminadas. Un promedio aparece recién cuando un lote sale de una etapa con un movimiento real (avance o cosecha) — los lotes de la carga inicial que no se movieron no cuentan.</div>}>
                <div style={{fontSize:"11px",color:"var(--c059)",marginBottom:"10px",lineHeight:"1.4"}}>Solo cuenta etapas que el lote <b>terminó</b> (salió de ellas con un movimiento). Los ciclos en curso y la carga inicial sin movimientos no se promedian.</div>
                <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                  {Object.entries(promedios).map(([gid,etapas])=>{
                    const g = geneticas.find(x=>x.id===gid);
                    if(!g) return null;
                    return (
                      <div key={gid}>
                        <div style={{fontSize:"13px",color:g.color||"var(--c016)",marginBottom:"6px"}}>{g.nombre}</div>
                        {sectoresPadre.map(sp=>{
                          const e = etapas[sp.nombre];
                          if(!e) return null;
                          return <div key={sp.id} style={{display:"flex",justifyContent:"space-between",fontSize:"12px",marginBottom:"3px"}}><span style={{color:"var(--c299)"}}>{sp.nombre}</span><span style={{color:"var(--c300)"}}>{Math.round(e.suma/e.n)} días <span style={{color:"var(--c059)"}}>(prom. {e.n})</span></span></div>;
                        })}
                      </div>
                    );
                  })}
                </div>
              </Reporte>

              <Reporte id="info_lotes" titulo="📋 Reporte info. LOTES" color="var(--c301)" vacio={lotes.length===0 && <div style={{fontSize:"13px",color:"var(--c024)"}}>Sin lotes cargados.</div>}>
                <div style={{display:"flex",gap:"6px",marginBottom:"8px",flexWrap:"wrap"}}>
                  <select value={repLotesFiltro.genetica} onChange={e=>setRepLotesFiltro({...repLotesFiltro, genetica:e.target.value})} style={{...inp(),padding:"7px 8px",fontSize:"12px",flex:1,minWidth:"140px"}}>
                    <option value="">Todas las genéticas</option>
                    {[...geneticas].sort((a,b)=>(a.nombre||"").localeCompare(b.nombre||"")).map(gO=><option key={gO.id} value={gO.id}>{gO.nombre}</option>)}
                  </select>
                  <select value={repLotesFiltro.orden} onChange={e=>setRepLotesFiltro({...repLotesFiltro, orden:e.target.value})} style={{...inp(),padding:"7px 8px",fontSize:"12px",flex:1,minWidth:"130px"}}>
                    <option value="genetica">Orden: genética</option>
                    <option value="numero">Orden: N° de lote</option>
                    <option value="floracion">Orden: días floración</option>
                  </select>
                </div>
                <div style={{display:"flex",gap:"6px",marginBottom:"10px",flexWrap:"wrap"}}>
                  <select value={repLotesFiltro.etapa} onChange={e=>setRepLotesFiltro({...repLotesFiltro, etapa:e.target.value, sub:""})} style={{...inp(),padding:"7px 8px",fontSize:"12px",flex:1,minWidth:"96px"}}>
                    <option value="">Todas las etapas</option>
                    {sectoresPadre.map(spO=><option key={spO.id} value={spO.id}>{spO.nombre}</option>)}
                  </select>
                  <select value={repLotesFiltro.sub} onChange={e=>setRepLotesFiltro({...repLotesFiltro, sub:e.target.value})} style={{...inp(),padding:"7px 8px",fontSize:"12px",flex:1,minWidth:"96px"}}>
                    <option value="">Todos los subsectores</option>
                    {subsFiltroRep.map(sO=><option key={sO.id} value={sO.id}>{sO.nombre}</option>)}
                  </select>
                  <select value={repLotesFiltro.estado} onChange={e=>setRepLotesFiltro({...repLotesFiltro, estado:e.target.value})} style={{...inp(),padding:"7px 8px",fontSize:"12px",flex:1,minWidth:"96px"}}>
                    <option value="todos">Todos los estados</option>
                    <option value="activo">Activo</option>
                    <option value="maduracion">Maduración</option>
                    <option value="cosechado">Cosechado</option>
                    <option value="descartado">Descartado</option>
                  </select>
                </div>
                <div style={{fontSize:"11px",color:"var(--c302)",marginBottom:"8px"}}>{lotesInfo.length} lote{lotesInfo.length!==1?"s":""}</div>
                <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"12px"}}>
                  {lotesInfo.map(({l,s,spL,st,g})=>(
                    <div key={l.id} style={{background:"var(--c303)",borderRadius:"8px",padding:"9px 11px",border:"1px solid var(--c304)"}}>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:"12px",marginBottom:"3px"}}>
                        <span style={{color:g?.color||"var(--c305)",fontWeight:"600"}}>{g?.nombre||"Sin genética"}{l.numero_lote?` · ${loteLabel(l.numero_lote, sufijoDeLote(l))}`:""}</span>
                        <span style={{color:"var(--c306)"}}>{l.cantidad_plantas} pl.</span>
                      </div>
                      <div style={{fontSize:"10px",color:"var(--c307)",marginBottom:"4px"}}>{l.estado} · {s?.nombre||"—"} ({spL?.nombre||"—"}) · inicio {l.fecha_inicio||"—"}</div>
                      <div style={{display:"flex",gap:"8px",flexWrap:"wrap",fontSize:"10px"}}>
                        <span style={{color:"var(--c066)"}}>Enr {st.dias_enraizado!=null?st.dias_enraizado:"—"}d</span>
                        <span style={{color:"var(--c066)"}}>Veg {st.dias_vegetativo!=null?st.dias_vegetativo:"—"}d</span>
                        <span style={{color:"var(--c052)"}}>Flo {st.dias_floracion!=null?st.dias_floracion:"—"}d</span>
                        <span style={{color:"var(--c003)"}}>Sec {(l.dias_secado!=null?l.dias_secado:(st.dias_secado!=null?st.dias_secado:"—"))}d</span>
                        {l.estado==="cosechado" && <span style={{color:"var(--c144)"}}>⚖ {l.peso_cosechado_gramos||0}g</span>}
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={descargarTSVLotes} disabled={lotesInfo.length===0} style={{width:"100%",padding:"11px",borderRadius:"9px",fontSize:"13px",background:"var(--c132)",color:"var(--c308)",border:"1px solid var(--c309)",fontWeight:"600"}}>⬇ Descargar TSV ({lotesInfo.length} lotes)</button>
              </Reporte>

              <div style={{height:"20px"}}/>
            </div>
          );
        })()}

      </div>

      {/* ══ MODAL: ALTA / EDICIÓN DE LOTE (corrección de datos — la baja real va por el botón 🥀) ══ */}
      {editingLote && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",zIndex:200}}>
          <div style={{background:"var(--c073)",border:"1px solid var(--c011)",borderRadius:"16px",padding:"22px",width:"100%",maxWidth:"380px"}}>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"19px",color:"var(--c001)",marginBottom:"16px"}}>{editingLote.id ? `Editar lote${editingLote.numero_lote?` · ${loteLabel(editingLote.numero_lote)}`:""}` : "Nueva planta / lote"}</div>
            <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
              <div>
                <div style={{...lbl("var(--c035)"),marginBottom:"6px"}}>GENÉTICA</div>
                <select value={editingLote.genetica_id} onChange={e=>setEditingLote({...editingLote,genetica_id:e.target.value})} style={inp()}>
                  <option value="">Seleccionar...</option>
                  {geneticasSelect(editingLote.genetica_id).map(g=><option key={g.id} value={g.id}>{g.nombre}{g.activa===false?" (inactiva)":""}</option>)}
                </select>
              </div>
              <div>
                <div style={{...lbl("var(--c035)"),marginBottom:"6px"}}>CANTIDAD DE PLANTAS</div>
                <input type="number" min="0" value={editingLote.cantidad_plantas} onChange={e=>setEditingLote({...editingLote,cantidad_plantas:e.target.value})} style={inp()}/>
                {editingLote.id && <div style={{fontSize:"11px",color:"var(--c024)",marginTop:"4px"}}>Esto es para corregir un error de carga. Para una baja real (muerte, descarte) usá el botón 🥀 en la tarjeta del lote — así queda registrada con motivo.</div>}
              </div>
              <div>
                <div style={{...lbl("var(--c035)"),marginBottom:"6px"}}>FECHA INICIO</div>
                <input type="date" value={editingLote.fecha_inicio} onChange={e=>setEditingLote({...editingLote,fecha_inicio:e.target.value})} style={inp({colorScheme:"dark"})}/>
              </div>
              <div>
                <div style={{...lbl("var(--c035)"),marginBottom:"6px"}}>NOTAS</div>
                <textarea value={editingLote.notas} onChange={e=>setEditingLote({...editingLote,notas:e.target.value})} style={{...inp(),minHeight:"60px",resize:"vertical"}}/>
              </div>
              <div style={{display:"flex",gap:"10px",marginTop:"4px"}}>
                <button disabled={savingLote || !editingLote.genetica_id || editingLote.cantidad_plantas===""} onClick={saveLote} style={{flex:1,padding:"12px",borderRadius:"10px",fontSize:"14px",fontWeight:"600",background:savingLote?"var(--c134)":"var(--c041)",color:"var(--c019)",border:"1px solid var(--c042)"}}>{savingLote?"Guardando...":(editingLote.id?"✓ Guardar cambios":"✓ Crear lote")}</button>
                <button onClick={()=>setEditingLote(null)} style={{padding:"12px 18px",borderRadius:"10px",fontSize:"14px",background:"var(--c004)",color:"var(--c007)",border:"1px solid var(--c002)"}}>Cancelar</button>
              </div>
              {editingLote.id && (
                <button onClick={()=>delLote(editingLote.id)} style={{padding:"10px",borderRadius:"10px",fontSize:"12px",background:"transparent",color:"var(--c138)",border:"1px solid var(--c009)"}}>🗑 Borrar lote por completo (solo errores de carga)</button>
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
            <div style={{background:"var(--c310)",border:"1px solid var(--c009)",borderRadius:"16px",padding:"22px",width:"100%",maxWidth:"380px"}}>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"19px",color:"var(--c032)",marginBottom:"6px"}}>🥀 Dar de baja</div>
              <div style={{fontSize:"13px",color:"var(--c311)",marginBottom:"16px"}}>{g?.nombre||"—"} · {bajaLote.lote.cantidad_plantas} plantas activas</div>
              <div style={{...lbl("var(--c039)"),marginBottom:"6px"}}>CANTIDAD A DAR DE BAJA</div>
              <input type="number" min="1" max={bajaLote.lote.cantidad_plantas} value={bajaLote.cantidad} onChange={e=>setBajaLote({...bajaLote,cantidad:e.target.value})} style={{...inp(),marginBottom:"10px"}}/>
              <div style={{...lbl("var(--c039)"),marginBottom:"6px"}}>MOTIVO</div>
              <input value={bajaLote.motivo} onChange={e=>setBajaLote({...bajaLote,motivo:e.target.value})} placeholder="Ej: plaga, hongo, estrés hídrico..." style={{...inp(),marginBottom:"14px"}}/>
              {esTotal && <div style={{fontSize:"12px",color:"var(--c003)",background:"var(--c111)",borderRadius:"8px",padding:"8px 12px",marginBottom:"14px"}}>⚠ Esto da de baja el lote completo — desaparece de "activos" y queda solo en el historial.</div>}
              <div style={{display:"flex",gap:"10px"}}>
                <button disabled={savingBaja || cant<=0 || cant>bajaLote.lote.cantidad_plantas} onClick={confirmBaja} style={{flex:1,padding:"12px",borderRadius:"10px",fontSize:"14px",fontWeight:"600",background:savingBaja?"var(--c312)":"var(--c049)",color:"var(--c005)",border:"1px solid var(--c050)"}}>{savingBaja?"Guardando...":(esTotal?"✓ Confirmar baja total":"✓ Confirmar baja parcial")}</button>
                <button onClick={()=>setBajaLote(null)} style={{padding:"12px 18px",borderRadius:"10px",fontSize:"14px",background:"var(--c004)",color:"var(--c007)",border:"1px solid var(--c002)"}}>Cancelar</button>
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
            <div style={{background:"var(--c121)",border:"1px solid var(--c119)",borderRadius:"16px",padding:"22px",width:"100%",maxWidth:"380px"}}>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"19px",color:"var(--c058)",marginBottom:"6px"}}>⚖️ Finalizar y pesar</div>
              <div style={{fontSize:"13px",color:"var(--c313)",marginBottom:"16px"}}>{g?.nombre||"—"} · {finalizandoLote.lote.cantidad_plantas} plantas</div>
              <div style={{...lbl("var(--c099)"),marginBottom:"6px"}}>PESO COSECHADO (GRAMOS)</div>
              <input type="number" min="0" step="0.1" value={finalizandoLote.peso} onChange={e=>setFinalizandoLote({...finalizandoLote,peso:e.target.value})} style={{...inp(),marginBottom:"12px"}}/>
              <div style={{...lbl("var(--c099)"),marginBottom:"6px"}}>DÍAS DE SECADO (OPCIONAL)</div>
              <input type="number" min="0" value={finalizandoLote.dias_secado} onChange={e=>setFinalizandoLote({...finalizandoLote,dias_secado:e.target.value})} style={{...inp(),marginBottom:"12px"}}/>
              <div style={{...lbl("var(--c099)"),marginBottom:"6px"}}>NOTAS</div>
              <textarea value={finalizandoLote.notas} onChange={e=>setFinalizandoLote({...finalizandoLote,notas:e.target.value})} style={{...inp(),minHeight:"60px",resize:"vertical",marginBottom:"14px"}}/>
              <div style={{fontSize:"12px",color:"var(--c022)",background:"var(--c094)",borderRadius:"8px",padding:"8px 12px",marginBottom:"14px"}}>Esto cierra el lote y lo manda a 📦 Cosechas — ya no aparece como activo en ningún subsector.</div>
              <div style={{display:"flex",gap:"10px"}}>
                <button disabled={savingFinal || !finalizandoLote.peso} onClick={confirmFinalizar} style={{flex:1,padding:"12px",borderRadius:"10px",fontSize:"14px",fontWeight:"600",background:savingFinal?"var(--c114)":"var(--c314)",color:"var(--c315)",border:"1px solid var(--c316)"}}>{savingFinal?"Guardando...":"✓ Confirmar"}</button>
                <button onClick={()=>setFinalizandoLote(null)} style={{padding:"12px 18px",borderRadius:"10px",fontSize:"14px",background:"var(--c004)",color:"var(--c007)",border:"1px solid var(--c002)"}}>Cancelar</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══ MODAL: TAREA (alta/edición — abrible desde 📋 Tareas o desde cualquier subsector) ══ */}
      {editingTarea && (()=>{
        const ejecutores = usuariosLista.filter(u=>u.rol==="ejecutor");
        const lotesDelSector = editingTarea.sector_id ? lotesDeSector(editingTarea.sector_id).filter(l=>l.estado==="activo") : [];
        const tiposDisponibles = tiposTareaParaSector(editingTarea.sector_id);
        return (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",zIndex:200,overflowY:"auto"}}>
            <div style={{background:"var(--c139)",border:"1px solid var(--c028)",borderRadius:"16px",padding:"22px",width:"100%",maxWidth:"380px",margin:"auto"}}>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"19px",color:"var(--c016)",marginBottom:"16px"}}>{editingTarea.id?"Editar tarea":"Nueva tarea"}</div>
              <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                <div>
                  <div style={{...lbl("var(--c021)"),marginBottom:"6px"}}>TÍTULO</div>
                  <input value={editingTarea.titulo} onChange={e=>setEditingTarea({...editingTarea,titulo:e.target.value})} placeholder="Ej: Riego carpa 1" style={inp()}/>
                </div>
                <div>
                  <div style={{...lbl("var(--c021)"),marginBottom:"6px"}}>SUBSECTOR</div>
                  <select value={editingTarea.sector_id} onChange={e=>setEditingTarea({...editingTarea,sector_id:e.target.value, lote_id:"", tipo_id:""})} style={inp()}>
                    <option value="">Sin asignar</option>
                    {sectoresPadre.map(sp=>subsectoresDe(sp.id).map(sub=>
                      <option key={sub.id} value={sub.id}>{sp.nombre} › {sub.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div style={{...lbl("var(--c021)"),marginBottom:"6px"}}>TIPO</div>
                  {tiposDisponibles.length===0 ? (
                    <div style={{fontSize:"12px",color:"var(--c022)",background:"var(--c094)",borderRadius:"8px",padding:"10px 12px"}}>No hay tipos de tarea para este subsector — agregalos en ⚙️ Mi Sala.</div>
                  ) : (
                    <select value={editingTarea.tipo_id} onChange={e=>setEditingTarea({...editingTarea,tipo_id:e.target.value})} style={inp()}>
                      <option value="">Seleccionar...</option>
                      {tiposDisponibles.map(tt=><option key={tt.id} value={tt.id}>{tt.icono} {tt.nombre}</option>)}
                    </select>
                  )}
                </div>
                {editingTarea.sector_id && lotesDelSector.length>0 && (
                  <div>
                    <div style={{...lbl("var(--c021)"),marginBottom:"6px"}}>LOTE (OPCIONAL)</div>
                    <select value={editingTarea.lote_id} onChange={e=>setEditingTarea({...editingTarea,lote_id:e.target.value})} style={inp()}>
                      <option value="">Todo el subsector</option>
                      {lotesDelSector.map(l=>{
                        const g = geneticas.find(x=>x.id===l.genetica_id);
                        return <option key={l.id} value={l.id}>{g?.nombre||"Sin genética"}{l.numero_lote?` · ${loteLabel(l.numero_lote, sufijoDeLote(l))}`:""} ({l.cantidad_plantas})</option>;
                      })}
                    </select>
                  </div>
                )}
                <div>
                  <div style={{...lbl("var(--c021)"),marginBottom:"6px"}}>DESCRIPCIÓN</div>
                  <textarea value={editingTarea.descripcion} onChange={e=>setEditingTarea({...editingTarea,descripcion:e.target.value})} style={{...inp(),minHeight:"60px",resize:"vertical"}}/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                  <div>
                    <div style={{...lbl("var(--c021)"),marginBottom:"6px"}}>FECHA PROGRAMADA</div>
                    <input type="date" value={editingTarea.fecha_programada} onChange={e=>setEditingTarea({...editingTarea,fecha_programada:e.target.value})} style={inp({colorScheme:"dark"})}/>
                  </div>
                  <div>
                    <div style={{...lbl("var(--c021)"),marginBottom:"6px"}}>PRIORIDAD</div>
                    <select value={editingTarea.prioridad} onChange={e=>setEditingTarea({...editingTarea,prioridad:e.target.value})} style={inp()}>
                      <option value="alta">Alta</option>
                      <option value="media">Media</option>
                      <option value="baja">Baja</option>
                    </select>
                  </div>
                </div>
                <div>
                  <div style={{...lbl("var(--c021)"),marginBottom:"6px"}}>ASIGNAR A</div>
                  <select value={editingTarea.asignado_a} onChange={e=>setEditingTarea({...editingTarea,asignado_a:e.target.value})} style={inp()}>
                    <option value="">Sin asignar</option>
                    {ejecutores.map(u=><option key={u.id} value={u.id}>{u.nombre}</option>)}
                    <option value={usuario.id}>{usuario.nombre} (yo)</option>
                  </select>
                </div>
                <div style={{display:"flex",gap:"10px"}}>
                  <button disabled={savingTarea || !editingTarea.titulo || !editingTarea.fecha_programada || !editingTarea.tipo_id} onClick={saveTarea} style={{flex:1,padding:"12px",borderRadius:"10px",fontSize:"14px",fontWeight:"600",background:savingTarea?"var(--c317)":"var(--c084)",color:"var(--c005)",border:"1px solid var(--c016)"}}>{savingTarea?"Guardando...":"✓ Guardar"}</button>
                  <button onClick={()=>setEditingTarea(null)} style={{padding:"12px 18px",borderRadius:"10px",fontSize:"14px",background:"var(--c004)",color:"var(--c007)",border:"1px solid var(--c002)"}}>Cancelar</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══ MODAL: MOVER LOTE (avanzar etapa normal, mover libre como corrección, o retroceso puntual a Vege 5L) ══ */}
      {movingLote && (()=>{
        const spOrigen = sectorPadreDeSub(movingLote.sector_actual_id);
        const spDestinoNatural = siguienteSectorPadre(spOrigen);
        const subsDestino = modoMover ? destinosPermitidos(movingLote.sector_actual_id) : (spDestinoNatural ? subsectoresDe(spDestinoNatural.id) : []);
        const subDestinoFijo = modoRetroceso ? sectores.find(s=>s.id===destinoSub) : null;
        const g = geneticas.find(x=>x.id===movingLote.genetica_id);
        const cerrar = () => { setMovingLote(null); setDestinoSub(""); setMovingMovida(""); setModoMover(false); setModoRetroceso(false); };
        return (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",zIndex:200}}>
            <div style={{background:"var(--c073)",border:"1px solid var(--c011)",borderRadius:"16px",padding:"22px",width:"100%",maxWidth:"380px"}}>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"19px",color:"var(--c001)",marginBottom:"6px"}}>{modoRetroceso ? "↩ Volver a Vegetativo" : modoMover ? "↔ Mover lote" : "Avanzar etapa"}</div>
              <div style={{fontSize:"13px",color:"var(--c318)",marginBottom:"16px"}}>{g?.nombre} · {movingLote.cantidad_plantas} plantas{modoRetroceso ? ` → ${subDestinoFijo?.nombre}` : !modoMover && ` → ${spDestinoNatural?.nombre}`}</div>
              {modoMover && <div style={{fontSize:"11px",color:"var(--c120)",marginBottom:"14px"}}>Para corregir un error de ubicación. No se puede volver a Enraizado, ni pasar a una maceta más chica dentro de Vegetativo.</div>}
              {modoRetroceso && <div style={{fontSize:"11px",color:"var(--c088)",marginBottom:"14px"}}>Todavía no entró en 12/12, así que no cuenta como floración real — vuelve a Vegetativo, a Vege 5L (el paso inmediatamente anterior). No se puede ir más atrás.</div>}
              <div style={{...lbl("var(--c035)"),marginBottom:"6px"}}>CANTIDAD A {modoRetroceso?"VOLVER":modoMover?"MOVER":"AVANZAR"}</div>
              <input type="number" min="1" max={movingLote.cantidad_plantas} value={movingMovida} onChange={e=>setMovingMovida(e.target.value)} style={{...inp(),marginBottom:"6px"}}/>
              <div style={{fontSize:"11px",color:"var(--c027)",marginBottom:"16px"}}>{(parseInt(movingMovida)||0) < movingLote.cantidad_plantas && (parseInt(movingMovida)||0)>0 ? `Quedan ${movingLote.cantidad_plantas-(parseInt(movingMovida)||0)} plantas en ${spOrigen?.nombre} — se crea un lote hermano en el destino` : `${modoRetroceso?"Vuelve":modoMover?"Mueve":"Avanza"} el lote completo`}</div>
              {modoRetroceso ? (
                <div style={{marginBottom:"16px"}}>
                  <div style={{...lbl("var(--c035)"),marginBottom:"6px"}}>SUBSECTOR DESTINO</div>
                  <div style={{...inp(),background:"var(--c101)",color:"var(--c088)"}}>{subDestinoFijo?.nombre||"—"}</div>
                </div>
              ) : (
                <>
                  <div style={{...lbl("var(--c035)"),marginBottom:"6px"}}>SUBSECTOR DESTINO</div>
                  <select value={destinoSub} onChange={e=>setDestinoSub(e.target.value)} style={{...inp(),marginBottom:"16px"}}>
                    <option value="">Seleccionar...</option>
                    {subsDestino.map(s=>{
                      const sp = sectoresPadre.find(x=>x.id===s.sector_padre_id);
                      return <option key={s.id} value={s.id}>{sp?.nombre} › {s.nombre}</option>;
                    })}
                  </select>
                </>
              )}
              <div style={{display:"flex",gap:"10px"}}>
                <button disabled={!destinoSub || savingMovida || (parseInt(movingMovida)||0)<=0 || (parseInt(movingMovida)||0)>movingLote.cantidad_plantas} onClick={confirmarMovimiento} style={{flex:1,padding:"12px",borderRadius:"10px",fontSize:"14px",fontWeight:"600",background:"var(--c041)",color:"var(--c019)",border:"1px solid var(--c042)"}}>{savingMovida?"Moviendo...":"✓ Confirmar"}</button>
                <button onClick={cerrar} style={{padding:"12px 18px",borderRadius:"10px",fontSize:"14px",background:"var(--c004)",color:"var(--c007)",border:"1px solid var(--c002)"}}>Cancelar</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══ BARRA INFERIOR + HOJA "MÁS" ══ */}
      {(()=>{
        const masActivo = !sectoresPadre.some(sp=>sp.id===tab);
        const grupoCultivo = tabsExtra.filter(t=>["_tareas","_calendario","_relevamientos","_asistente"].includes(t.key));
        const grupoRegistros = tabsExtra.filter(t=>["_geneticas","_bajas","_cosechas","_reportes"].includes(t.key));
        const grupoSistema = tabsExtra.filter(t=>["_misala","_apariencia"].includes(t.key));
        const irA = (key)=>{ setTab(key); setMasAbierto(false); };
        return (
          <>
            <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",opacity:masAbierto?1:0,pointerEvents:masAbierto?"auto":"none",transition:"opacity .2s",zIndex:150}} onClick={()=>setMasAbierto(false)}/>
            <div style={{position:"fixed",left:0,right:0,bottom:0,background:"var(--c319)",borderRadius:"18px 18px 0 0",borderTop:"1px solid var(--c025)",transform:masAbierto?"translateY(0)":"translateY(100%)",transition:"transform .25s ease",zIndex:160,padding:"10px 20px 28px",maxHeight:"70vh",overflow:"auto"}}>
              <div style={{width:"36px",height:"4px",background:"var(--c320)",borderRadius:"3px",margin:"6px auto 16px"}}/>
              {[["CULTIVO",grupoCultivo],["REGISTROS",grupoRegistros],["SISTEMA",grupoSistema]].filter(([,g])=>g.length>0).map(([label,grupo])=>(
                <div key={label}>
                  <div style={{fontSize:"10px",letterSpacing:"2px",color:"var(--c037)",margin:"14px 0 8px"}}>{label}</div>
                  {grupo.map(t=>(
                    <div key={t.key} onClick={()=>irA(t.key)} style={{display:"flex",alignItems:"center",gap:"10px",padding:"11px 6px",fontSize:"14px",color:tab===t.key?t.col:"var(--c091)",background:tab===t.key?`${t.col}1a`:"transparent",borderRadius:"8px",borderBottom:"1px solid var(--c321)"}}>{t.label}</div>
                  ))}
                </div>
              ))}
            </div>

            <div style={{position:"fixed",bottom:0,left:0,right:0,background:"var(--c322)",borderTop:"1px solid var(--c025)",display:"flex",padding:"6px 4px 10px",zIndex:140}}>
              {sectoresPadre.map(sp=>{
                const c = colorDeFase(sp.orden);
                const activo = tab===sp.id;
                return (
                  <button key={sp.id} onClick={()=>setTab(sp.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"3px",padding:"6px 2px",background:"none",border:"none",color:activo?c:"var(--c024)",fontSize:"10px"}}>
                    <span style={{fontSize:"15px"}}>{iconoDeFase(sp.orden)}</span>
                    <span>{sp.nombre}</span>
                    <span style={{width:activo?"7px":"5px",height:activo?"7px":"5px",borderRadius:"50%",background:activo?c:"var(--c051)",boxShadow:activo?`0 0 6px ${c}`:"none"}}/>
                  </button>
                );
              })}
              <button onClick={()=>setMasAbierto(true)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"3px",padding:"6px 2px",background:"none",border:"none",color:masActivo?"var(--c001)":"var(--c024)",fontSize:"10px"}}>
                <span style={{fontSize:"15px"}}>☰</span>
                <span>Más</span>
                <span style={{width:masActivo?"7px":"5px",height:masActivo?"7px":"5px",borderRadius:"50%",background:masActivo?"var(--c001)":"var(--c051)",boxShadow:masActivo?"0 0 6px var(--c001)":"none"}}/>
              </button>
            </div>
          </>
        );
      })()}

    </div>
  );
}

export default function App(){
  return <ErrorBoundary><RaizApp/></ErrorBoundary>;
}
