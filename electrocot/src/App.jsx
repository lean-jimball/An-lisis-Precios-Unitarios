import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

// Inject styles
if (typeof document !== "undefined") {
  const fl = document.createElement("link");
  fl.rel = "stylesheet";
  fl.href = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;600;700;900&family=JetBrains+Mono:wght@300;400;600&family=Barlow:wght@300;400;500;600&display=swap";
  document.head.appendChild(fl);
  const st = document.createElement("style");
  st.textContent = `*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html,body,#root{height:100%}body{background:#0a0e14;color:#e2e8f0;font-family:'Barlow',sans-serif}input,select,textarea,button{font-family:'Barlow',sans-serif}input:focus,select:focus,textarea:focus{outline:none;border-color:#FFD600!important;box-shadow:0 0 0 2px rgba(255,214,0,.1)}::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-track{background:#0d1117}::-webkit-scrollbar-thumb{background:#1e2936;border-radius:3px}input[type=range]{-webkit-appearance:none;appearance:none;height:4px;background:#1e2936;border-radius:2px;border:none;padding:0;cursor:pointer}input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:#FFD600;cursor:pointer}`;
  document.head.appendChild(st);
}

const SALARIOS_BASE={maestro:{label:"Maestro Electricista",dia:850},oficial:{label:"Oficial Electricista",dia:650},ayudante:{label:"Ayudante General",dia:400},ingeniero:{label:"Ingeniero Residente",dia:1800}};
const FACTOR_ZONA={CDMX:1.0,Norte:.95,Occidente:.92,Sur:.88};
const FACTOR_CONDICION={Normal:1.0,Altura:1.2,"Temp. Extrema":1.15,"Esp. Confinado":1.35};
const CAT_COLORS={Canalizaciones:"#3b82f6",Conductores:"#f59e0b",Tableros:"#8b5cf6",Salidas:"#10b981",Iluminación:"#06b6d4",Tierras:"#ef4444",Acometida:"#FFD600"};

const BIB_INICIAL=[
  {clave:"CAN-001",desc:"Tubería conduit PVC 13mm (1/2\")",u:"ml",cat:"Canalizaciones",mats:[{d:"Tubería conduit PVC 13mm",u:"ml",c:1,p:14.5,desp:5},{d:"Unión conduit PVC 13mm",u:"pza",c:.33,p:3.2,desp:3},{d:"Curva conduit PVC 90°",u:"pza",c:.15,p:4.8,desp:2},{d:"Grapa conduit 1/2\"",u:"pza",c:1,p:1.2,desp:5},{d:"Tornillo autorroscante 1\"",u:"pza",c:1,p:.35,desp:5}],mo:[{cat:"oficial",hh:.12},{cat:"ayudante",hh:.05}]},
  {clave:"CAN-002",desc:"Tubería conduit PVC 19mm (3/4\")",u:"ml",cat:"Canalizaciones",mats:[{d:"Tubería conduit PVC 19mm",u:"ml",c:1,p:19.8,desp:5},{d:"Unión conduit PVC 19mm",u:"pza",c:.33,p:4.5,desp:3},{d:"Curva conduit 19mm 90°",u:"pza",c:.12,p:6.2,desp:2},{d:"Grapa conduit 3/4\"",u:"pza",c:1,p:1.5,desp:5}],mo:[{cat:"oficial",hh:.15},{cat:"ayudante",hh:.06}]},
  {clave:"CAN-003",desc:"Tubería conduit PVC 25mm (1\")",u:"ml",cat:"Canalizaciones",mats:[{d:"Tubería conduit PVC 25mm",u:"ml",c:1,p:28.5,desp:5},{d:"Unión conduit 25mm",u:"pza",c:.33,p:6,desp:3},{d:"Curva conduit 25mm 90°",u:"pza",c:.1,p:8.5,desp:2},{d:"Grapa conduit 1\"",u:"pza",c:1,p:1.8,desp:5}],mo:[{cat:"oficial",hh:.18},{cat:"ayudante",hh:.08}]},
  {clave:"CAN-004",desc:"Tubería EMT 3/4\" c/accesorios",u:"ml",cat:"Canalizaciones",mats:[{d:"Tubería EMT 3/4\"",u:"ml",c:1,p:55,desp:3},{d:"Conector EMT 3/4\"",u:"pza",c:.2,p:8.5,desp:2},{d:"Unión EMT 3/4\"",u:"pza",c:.2,p:6.8,desp:2},{d:"Grapa EMT 3/4\"",u:"pza",c:1,p:2.2,desp:5}],mo:[{cat:"oficial",hh:.18},{cat:"ayudante",hh:.08}]},
  {clave:"CAN-005",desc:"Charola portacable galv. 100mm",u:"ml",cat:"Canalizaciones",mats:[{d:"Charola portacable 100×60mm",u:"ml",c:1,p:78,desp:3},{d:"Unión de charola 100mm",u:"pza",c:.42,p:22,desp:2},{d:"Soporte varilla roscada 3/8\"",u:"pza",c:.5,p:38,desp:2},{d:"Varilla roscada 3/8\"×1m",u:"pza",c:.5,p:28,desp:3}],mo:[{cat:"oficial",hh:.25},{cat:"ayudante",hh:.15}]},
  {clave:"CON-001",desc:"Conductor THW-LS Cal. 12 AWG (3h)",u:"ml",cat:"Conductores",mats:[{d:"Conductor THW-LS 12 AWG negro",u:"ml",c:1,p:9.8,desp:8},{d:"Conductor THW-LS 12 AWG blanco",u:"ml",c:1,p:9.8,desp:8},{d:"Conductor THW-LS 12 AWG verde",u:"ml",c:1,p:9.8,desp:8},{d:"Cinta aislante 3M 600V",u:"pza",c:.02,p:28,desp:0}],mo:[{cat:"oficial",hh:.06},{cat:"ayudante",hh:.04}]},
  {clave:"CON-002",desc:"Conductor THW-LS Cal. 10 AWG (3h)",u:"ml",cat:"Conductores",mats:[{d:"Conductor THW-LS 10 AWG negro",u:"ml",c:1,p:14.5,desp:8},{d:"Conductor THW-LS 10 AWG blanco",u:"ml",c:1,p:14.5,desp:8},{d:"Conductor THW-LS 10 AWG verde",u:"ml",c:1,p:14.5,desp:8},{d:"Cinta aislante 3M 600V",u:"pza",c:.02,p:28,desp:0}],mo:[{cat:"oficial",hh:.07},{cat:"ayudante",hh:.04}]},
  {clave:"CON-003",desc:"Conductor THW-LS Cal. 8 AWG (3h)",u:"ml",cat:"Conductores",mats:[{d:"Conductor THW-LS 8 AWG negro",u:"ml",c:1,p:22.5,desp:5},{d:"Conductor THW-LS 8 AWG blanco",u:"ml",c:1,p:22.5,desp:5},{d:"Conductor THW-LS 8 AWG verde",u:"ml",c:1,p:22.5,desp:5}],mo:[{cat:"oficial",hh:.09},{cat:"ayudante",hh:.05}]},
  {clave:"CON-004",desc:"Conductor THW-LS Cal. 6 AWG (3h)",u:"ml",cat:"Conductores",mats:[{d:"Conductor THW-LS 6 AWG negro",u:"ml",c:1,p:34,desp:5},{d:"Conductor THW-LS 6 AWG blanco",u:"ml",c:1,p:34,desp:5},{d:"Conductor THW-LS 6 AWG verde",u:"ml",c:1,p:34,desp:5}],mo:[{cat:"oficial",hh:.11},{cat:"ayudante",hh:.06}]},
  {clave:"CON-005",desc:"Conductor THW-LS Cal. 4 AWG (3h)",u:"ml",cat:"Conductores",mats:[{d:"Conductor THW-LS 4 AWG negro",u:"ml",c:1,p:52,desp:5},{d:"Conductor THW-LS 4 AWG blanco",u:"ml",c:1,p:52,desp:5},{d:"Conductor THW-LS 4 AWG verde",u:"ml",c:1,p:52,desp:5}],mo:[{cat:"oficial",hh:.13},{cat:"ayudante",hh:.07}]},
  {clave:"TAB-001",desc:"Tablero residencial 12 circ. c/main",u:"pza",cat:"Tableros",mats:[{d:"Tablero resid. 12 circ. 120/240V",u:"pza",c:1,p:1950,desp:0},{d:"Interruptor principal 2P 100A",u:"pza",c:1,p:480,desp:0},{d:"Caja derivación 4x4\"",u:"pza",c:1,p:85,desp:0},{d:"Conector flexible 3/4\"",u:"pza",c:4,p:28,desp:2},{d:"Tornillo para tablero 1/4\"",u:"pza",c:12,p:2.5,desp:5}],mo:[{cat:"maestro",hh:2.5},{cat:"oficial",hh:2.5},{cat:"ayudante",hh:1}]},
  {clave:"TAB-002",desc:"Tablero residencial 16 circ. c/main",u:"pza",cat:"Tableros",mats:[{d:"Tablero resid. 16 circ. 120/240V",u:"pza",c:1,p:2650,desp:0},{d:"Interruptor principal 2P 100A",u:"pza",c:1,p:580,desp:0},{d:"Caja derivación 4x4\"",u:"pza",c:1,p:85,desp:0},{d:"Conector flexible 3/4\"",u:"pza",c:4,p:28,desp:2}],mo:[{cat:"maestro",hh:3},{cat:"oficial",hh:3},{cat:"ayudante",hh:1.5}]},
  {clave:"TAB-003",desc:"Tablero comercial 24 esp. 120/240V",u:"pza",cat:"Tableros",mats:[{d:"Tablero comercial 24 esp.",u:"pza",c:1,p:4800,desp:0},{d:"Interruptor principal 2P 200A",u:"pza",c:1,p:980,desp:0},{d:"Barra de tierra",u:"pza",c:1,p:185,desp:0},{d:"Conector flexible 1\"",u:"pza",c:4,p:45,desp:2}],mo:[{cat:"maestro",hh:3},{cat:"oficial",hh:4},{cat:"ayudante",hh:2}]},
  {clave:"TAB-004",desc:"Interruptor termomagnético 1P 20A",u:"pza",cat:"Tableros",mats:[{d:"Interruptor 1P 20A 120V",u:"pza",c:1,p:145,desp:0},{d:"Peine distribución monofásico",u:"pza",c:.08,p:85,desp:0}],mo:[{cat:"oficial",hh:.4},{cat:"ayudante",hh:.15}]},
  {clave:"TAB-005",desc:"Interruptor termomagnético 2P 30A",u:"pza",cat:"Tableros",mats:[{d:"Interruptor 2P 30A 240V",u:"pza",c:1,p:295,desp:0},{d:"Peine distribución bifásico",u:"pza",c:.08,p:120,desp:0}],mo:[{cat:"oficial",hh:.5},{cat:"ayudante",hh:.2}]},
  {clave:"SAL-001",desc:"Salida contacto sencillo NEMA 5-15R",u:"pza",cat:"Salidas",mats:[{d:"Contacto sencillo NEMA 5-15R",u:"pza",c:1,p:58,desp:0},{d:"Placa contacto sencillo",u:"pza",c:1,p:22,desp:0},{d:"Caja metálica 2x4\"",u:"pza",c:1,p:32,desp:0},{d:"Conductor THW-LS 12 AWG negro",u:"ml",c:3,p:9.8,desp:8},{d:"Conductor THW-LS 12 AWG blanco",u:"ml",c:3,p:9.8,desp:8},{d:"Conductor THW-LS 12 AWG verde",u:"ml",c:3,p:9.8,desp:8},{d:"Conector flexible 1/2\"",u:"pza",c:1,p:12,desp:2}],mo:[{cat:"oficial",hh:1},{cat:"ayudante",hh:.5}]},
  {clave:"SAL-002",desc:"Salida GFCI baño/cocina 15A",u:"pza",cat:"Salidas",mats:[{d:"Contacto GFCI 15A 120V",u:"pza",c:1,p:285,desp:0},{d:"Placa GFCI",u:"pza",c:1,p:28,desp:0},{d:"Caja metálica 2x4\" imperm.",u:"pza",c:1,p:55,desp:0},{d:"Conductor THW-LS 12 AWG negro",u:"ml",c:3,p:9.8,desp:8},{d:"Conductor THW-LS 12 AWG blanco",u:"ml",c:3,p:9.8,desp:8},{d:"Conductor THW-LS 12 AWG verde",u:"ml",c:3,p:9.8,desp:8},{d:"Conector flexible imperm. 1/2\"",u:"pza",c:1,p:22,desp:2}],mo:[{cat:"oficial",hh:1.2},{cat:"ayudante",hh:.5}]},
  {clave:"SAL-003",desc:"Salida interruptor sencillo 15A",u:"pza",cat:"Salidas",mats:[{d:"Interruptor sencillo 15A 120V",u:"pza",c:1,p:45,desp:0},{d:"Placa interruptor sencillo",u:"pza",c:1,p:18,desp:0},{d:"Caja metálica 2x4\"",u:"pza",c:1,p:32,desp:0},{d:"Conductor THW-LS 12 AWG negro",u:"ml",c:3,p:9.8,desp:8},{d:"Conductor THW-LS 12 AWG blanco",u:"ml",c:3,p:9.8,desp:8},{d:"Conector flexible 1/2\"",u:"pza",c:1,p:12,desp:2}],mo:[{cat:"oficial",hh:.9},{cat:"ayudante",hh:.4}]},
  {clave:"SAL-004",desc:"Salida para luminaria en plafón",u:"pza",cat:"Salidas",mats:[{d:"Caja octagonal 4\" c/orejas",u:"pza",c:1,p:38,desp:0},{d:"Conductor THW-LS 12 AWG negro",u:"ml",c:2,p:9.8,desp:8},{d:"Conductor THW-LS 12 AWG blanco",u:"ml",c:2,p:9.8,desp:8},{d:"Conductor THW-LS 12 AWG verde",u:"ml",c:2,p:9.8,desp:8},{d:"Conector flexible 1/2\"",u:"pza",c:1,p:12,desp:2}],mo:[{cat:"oficial",hh:.8},{cat:"ayudante",hh:.35}]},
  {clave:"SAL-005",desc:"Salida A/C mini-split 220V",u:"pza",cat:"Salidas",mats:[{d:"Caja metálica 2x4\"",u:"pza",c:1,p:32,desp:0},{d:"Contacto 240V 20A NEMA 6-20R",u:"pza",c:1,p:185,desp:0},{d:"Placa contacto especial",u:"pza",c:1,p:28,desp:0},{d:"Conductor THW-LS 12 AWG negro",u:"ml",c:3,p:9.8,desp:8},{d:"Conductor THW-LS 12 AWG rojo",u:"ml",c:3,p:9.8,desp:8},{d:"Conductor THW-LS 12 AWG verde",u:"ml",c:3,p:9.8,desp:8},{d:"Conector flexible 3/4\"",u:"pza",c:1,p:18,desp:2}],mo:[{cat:"oficial",hh:1.5},{cat:"ayudante",hh:.6}]},
  {clave:"ILU-001",desc:"Luminaria LED panel 60×60cm 40W",u:"pza",cat:"Iluminación",mats:[{d:"Luminaria LED panel 60×60 40W 4000K",u:"pza",c:1,p:680,desp:0},{d:"Driver LED regulable 40W",u:"pza",c:1,p:120,desp:0},{d:"Marco empotrar panel 60×60",u:"pza",c:1,p:95,desp:0},{d:"Conductor THW-LS 14 AWG negro",u:"ml",c:2,p:7.5,desp:8},{d:"Conductor THW-LS 14 AWG blanco",u:"ml",c:2,p:7.5,desp:8},{d:"Conector flexible 3/8\"",u:"pza",c:1,p:10,desp:2}],mo:[{cat:"oficial",hh:1.2},{cat:"ayudante",hh:.6}]},
  {clave:"ILU-002",desc:"Luminaria LED campana industrial 100W",u:"pza",cat:"Iluminación",mats:[{d:"Campana LED 100W 5700K IP65",u:"pza",c:1,p:1480,desp:0},{d:"Soporte suspensión 1m c/gancho",u:"pza",c:1,p:185,desp:0},{d:"Caja metálica 4\" con tapa",u:"pza",c:1,p:65,desp:0},{d:"Conductor THHW-LS 12 AWG negro",u:"ml",c:3,p:10.5,desp:8},{d:"Conductor THHW-LS 12 AWG blanco",u:"ml",c:3,p:10.5,desp:8},{d:"Conector flexible líquido 3/4\"",u:"pza",c:1,p:28,desp:2}],mo:[{cat:"oficial",hh:1.8},{cat:"ayudante",hh:.8}]},
  {clave:"ILU-003",desc:"Poste alumbrado h=4m c/luminaria LED",u:"pza",cat:"Iluminación",mats:[{d:"Poste octagonal galvanizado h=4m",u:"pza",c:1,p:3800,desp:0},{d:"Luminaria LED vial 60W IP66",u:"pza",c:1,p:1850,desp:0},{d:"Ancla de concreto para poste",u:"pza",c:1,p:320,desp:0},{d:"Conductor THW-LS 10 AWG negro",u:"ml",c:8,p:14.5,desp:8},{d:"Conductor THW-LS 10 AWG blanco",u:"ml",c:8,p:14.5,desp:8},{d:"Conductor THW-LS 10 AWG verde",u:"ml",c:8,p:14.5,desp:8},{d:"Concreto premezclado f'c=200",u:"m3",c:.08,p:1800,desp:5}],mo:[{cat:"maestro",hh:2},{cat:"oficial",hh:4},{cat:"ayudante",hh:4}]},
  {clave:"TIE-001",desc:"Sistema tierra varilla copperweld 5/8\"",u:"pza",cat:"Tierras",mats:[{d:"Varilla copperweld 5/8\"x2.4m",u:"pza",c:1,p:380,desp:0},{d:"Conector varilla a cable",u:"pza",c:1,p:85,desp:0},{d:"Conductor desnudo cobre 6 AWG",u:"ml",c:3,p:38,desp:5},{d:"Soldadura exotermica 65g",u:"pza",c:1,p:95,desp:0},{d:"Caja revision 30x30 c/tapa",u:"pza",c:1,p:320,desp:0}],mo:[{cat:"maestro",hh:1.5},{cat:"oficial",hh:1.5},{cat:"ayudante",hh:2}]},
  {clave:"TIE-002",desc:"Supresor de transientes SPD Clase II",u:"pza",cat:"Tierras",mats:[{d:"Supresor SPD Clase II 3P+N 40kA",u:"pza",c:1,p:1580,desp:0},{d:"Conductor THW-LS 6 AWG verde",u:"ml",c:2,p:34,desp:5},{d:"Terminal presion 6 AWG",u:"pza",c:2,p:18,desp:2}],mo:[{cat:"maestro",hh:1},{cat:"oficial",hh:.8}]},
  {clave:"ACO-001",desc:"Acometida aerea triplex 2x4+1x6 AWG",u:"lote",cat:"Acometida",mats:[{d:"Cable triplex 2x4+1x6 AWG aluminio",u:"ml",c:12,p:68,desp:5},{d:"Caja registro 30x30 c/tapa",u:"pza",c:1,p:220,desp:0},{d:"Poliducto galv. 1-1/2\" bajada",u:"ml",c:3,p:95,desp:3},{d:"Abrazadera poliducto 1-1/2\"",u:"pza",c:4,p:18,desp:3},{d:"Terminal compresion aluminio 4 AWG",u:"pza",c:4,p:55,desp:2},{d:"Cinta autofundente 3M 600V",u:"pza",c:1,p:85,desp:0}],mo:[{cat:"maestro",hh:3},{cat:"oficial",hh:3},{cat:"ayudante",hh:3}]},
  {clave:"ACO-002",desc:"Caja de medidor base tipo intemperie",u:"pza",cat:"Acometida",mats:[{d:"Caja medidor base intemperie monofasica",u:"pza",c:1,p:850,desp:0},{d:"Interruptor principal 1P-2P 60A",u:"pza",c:1,p:320,desp:0},{d:"Sello silicon intemperie",u:"pza",c:1,p:45,desp:0},{d:"Tornillo autoperforante 1/2\"",u:"pza",c:6,p:2.5,desp:5},{d:"Mastil EMT 1-1/4\" 1m",u:"ml",c:1,p:95,desp:0}],mo:[{cat:"maestro",hh:2},{cat:"oficial",hh:2},{cat:"ayudante",hh:1}]},
];

function calcAPU(c,cfg){
  const fz=FACTOR_ZONA[cfg.zona]||1,fc=FACTOR_CONDICION[cfg.cond]||1;
  let tM=0;
  const dM=(c.mats||[]).map(m=>{const b=m.c*m.p,w=b*(1+(m.desp||0)/100);tM+=w;return{...m,base:b,withDesp:w};});
  let tMO=0;
  const dMO=(c.mo||[]).map(m=>{const sd=(SALARIOS_BASE[m.cat]?.dia||0)*fz*fc,sh=sd/8,cost=m.hh*sh;tMO+=cost;return{...m,salDia:sd,salH:sh,cost};});
  const herr=tMO*(cfg.herr/100),dir=tM+tMO+herr;
  const cI=dir*(1+cfg.ind/100),cF=cI*(1+cfg.fin/100),pu=cF*(1+cfg.util/100);
  return{dM,tM,dMO,tMO,herr,dir,cI,cF,pu};
}

const mxn=n=>new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",minimumFractionDigits:2}).format(n||0);
const n2=n=>new Intl.NumberFormat("es-MX",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n||0);
const fi=e=>{e.target.style.borderColor="#FFD600"};
const fb=e=>{e.target.style.borderColor="#1e2936"};

const S={
  app:{fontFamily:"'Barlow',sans-serif",background:"#0a0e14",minHeight:"100vh",color:"#e2e8f0"},
  hdr:{background:"#0d1117",borderBottom:"2px solid #FFD600",padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",height:64,position:"sticky",top:0,zIndex:100},
  logo:{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:20,color:"#FFD600",letterSpacing:2},
  tabs:{display:"flex",gap:2,padding:"0 20px",background:"#0d1117",borderBottom:"1px solid #1e2936",overflowX:"auto"},
  tab:a=>({fontFamily:"'Barlow Condensed',sans-serif",fontWeight:a?700:400,fontSize:12,letterSpacing:1,padding:"12px 18px",cursor:"pointer",border:"none",background:"transparent",color:a?"#FFD600":"#6b7280",borderBottom:a?"3px solid #FFD600":"3px solid transparent",whiteSpace:"nowrap",textTransform:"uppercase"}),
  wrap:{padding:"20px",maxWidth:1400,margin:"0 auto"},
  card:{background:"#111827",border:"1px solid #1e2936",borderRadius:8,padding:20,marginBottom:16},
  ct:{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:14,letterSpacing:1.5,color:"#FFD600",textTransform:"uppercase",marginBottom:14,display:"flex",alignItems:"center",gap:8},
  lbl:{display:"block",fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"#6b7280",marginBottom:4,letterSpacing:1,textTransform:"uppercase"},
  inp:{width:"100%",background:"#0d1117",border:"1px solid #1e2936",borderRadius:4,padding:"8px 10px",color:"#e2e8f0",fontFamily:"'JetBrains Mono',monospace",fontSize:12,outline:"none",boxSizing:"border-box"},
  sel:{width:"100%",background:"#0d1117",border:"1px solid #1e2936",borderRadius:4,padding:"8px 10px",color:"#e2e8f0",fontFamily:"'JetBrains Mono',monospace",fontSize:12,outline:"none",boxSizing:"border-box"},
  btn:v=>({fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:12,letterSpacing:1,textTransform:"uppercase",padding:"9px 16px",borderRadius:4,border:"none",cursor:"pointer",background:v==="pri"?"#FFD600":v==="danger"?"#ef4444":v==="green"?"#10b981":v==="ghost"?"transparent":"#1e2936",color:v==="pri"?"#0a0e14":v==="ghost"?"#6b7280":"#e2e8f0",border:v==="ghost"?"1px solid #1e2936":"none"}),
  th:{background:"#0d1117",padding:"8px 12px",textAlign:"left",color:"#6b7280",fontSize:10,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1,textTransform:"uppercase",borderBottom:"1px solid #1e2936",whiteSpace:"nowrap"},
  td:i=>({padding:"8px 12px",borderBottom:"1px solid #0d1117",background:i%2===0?"#111827":"#0f1620",verticalAlign:"middle"}),
  bdg:c=>({display:"inline-block",padding:"2px 8px",borderRadius:20,fontSize:10,fontFamily:"'JetBrains Mono',monospace",fontWeight:600,background:c+"22",color:c,border:`1px solid ${c}44`}),
  div:{border:"none",borderTop:"1px solid #1e2936",margin:"12px 0"},
  kpi:{background:"#0d1117",border:"1px solid #1e2936",borderRadius:8,padding:"12px 16px",textAlign:"center"},
  kpiV:{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:20,color:"#FFD600",display:"block"},
  kpiL:{fontSize:10,color:"#6b7280",marginTop:2,textTransform:"uppercase",letterSpacing:1},
  ov:{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:500,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:20,overflowY:"auto"},
  modal:{background:"#111827",border:"1px solid #1e2936",borderRadius:10,maxWidth:780,width:"100%",padding:24,marginTop:20},
};

function IF({label,value,onChange,type="text"}){return <div><label style={S.lbl}>{label}</label><input style={S.inp} type={type} value={value} onChange={e=>onChange(e.target.value)} onFocus={fi} onBlur={fb}/></div>;}
function SF({label,value,onChange,options}){return <div><label style={S.lbl}>{label}</label><select style={S.sel} value={value} onChange={e=>onChange(e.target.value)}>{options.map(o=><option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}</select></div>;}

function ModalAPU({item,cfg,onClose}){
  const apu=calcAPU(item,cfg);
  const col=CAT_COLORS[item.cat]||"#888";
  return(<div style={S.ov} onClick={onClose}><div style={S.modal} onClick={e=>e.stopPropagation()}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}>
      <div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:20,color:"#FFD600"}}>Desglose APU — {item.clave}</div>
        <div style={{fontSize:13,color:"#9ca3af",marginTop:3}}>{item.desc}</div>
        <div style={{marginTop:8,display:"flex",gap:6,flexWrap:"wrap"}}>
          <span style={S.bdg(col)}>{item.cat}</span>
          <span style={S.bdg("#6b7280")}>Zona {cfg.zona} x{FACTOR_ZONA[cfg.zona]}</span>
          <span style={S.bdg("#8b5cf6")}>Cond x{FACTOR_CONDICION[cfg.cond]}</span>
          <span style={S.bdg("#f59e0b")}>{item.u}</span>
        </div>
      </div>
      <button style={S.btn("ghost")} onClick={onClose}>Cerrar</button>
    </div>
    <div style={{...S.ct,color:"#3b82f6",fontSize:12}}>A. Materiales e insumos</div>
    <div style={{overflowX:"auto",marginBottom:4}}><table style={{width:"100%",borderCollapse:"collapse",fontFamily:"'JetBrains Mono',monospace",fontSize:12}}>
      <thead><tr>{["Insumo","U","Cant.","P.U.","Desp%","Subtotal"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
      <tbody>{apu.dM.map((m,i)=><tr key={i}>
        <td style={{...S.td(i),fontFamily:"'Barlow',sans-serif",fontSize:13}}>{m.d}</td>
        <td style={S.td(i)}>{m.u}</td><td style={S.td(i)}>{n2(m.c)}</td><td style={S.td(i)}>{mxn(m.p)}</td>
        <td style={{...S.td(i),color:"#f59e0b"}}>{m.desp}%</td>
        <td style={{...S.td(i),color:"#3b82f6",fontWeight:600}}>{mxn(m.withDesp)}</td>
      </tr>)}</tbody>
    </table></div>
    <div style={{textAlign:"right",padding:"8px 12px",background:"#0d1117",borderRadius:4,marginBottom:16,color:"#3b82f6",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700}}>Total materiales: {mxn(apu.tM)}</div>
    <div style={{...S.ct,color:"#10b981",fontSize:12}}>B. Mano de obra</div>
    <div style={{overflowX:"auto",marginBottom:4}}><table style={{width:"100%",borderCollapse:"collapse",fontFamily:"'JetBrains Mono',monospace",fontSize:12}}>
      <thead><tr>{["Categoria","Sal./dia","Sal./hora","H-H","Costo MO"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
      <tbody>{apu.dMO.map((m,i)=><tr key={i}>
        <td style={{...S.td(i),fontFamily:"'Barlow',sans-serif"}}>{SALARIOS_BASE[m.cat]?.label}</td>
        <td style={S.td(i)}>{mxn(m.salDia)}</td><td style={S.td(i)}>{mxn(m.salH)}</td>
        <td style={{...S.td(i),color:"#f59e0b"}}>{n2(m.hh)}</td>
        <td style={{...S.td(i),color:"#10b981",fontWeight:600}}>{mxn(m.cost)}</td>
      </tr>)}</tbody>
    </table></div>
    <div style={{textAlign:"right",padding:"8px 12px",background:"#0d1117",borderRadius:4,marginBottom:16,color:"#10b981",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700}}>Total mano de obra: {mxn(apu.tMO)}</div>
    <div style={{...S.ct,color:"#8b5cf6",fontSize:12}}>C. Integracion al P.U.</div>
    <div style={{background:"#0d1117",borderRadius:6,padding:16}}>
      {[{l:"(A) Materiales con desperdicio",v:apu.tM,c:"#3b82f6"},{l:"(B) Mano de obra",v:apu.tMO,c:"#10b981"},{l:`(C) Herramienta/equipo (${cfg.herr}% MO)`,v:apu.herr,c:"#f59e0b"}].map(r=><div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #1e2936"}}><span style={{color:"#9ca3af",fontSize:13}}>{r.l}</span><span style={{color:r.c,fontFamily:"'JetBrains Mono',monospace",fontSize:13}}>{mxn(r.v)}</span></div>)}
      <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"2px solid #374151",margin:"4px 0"}}><span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:15}}>Costo directo (A+B+C)</span><span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:15}}>{mxn(apu.dir)}</span></div>
      {[{l:`+ Indirectos (${cfg.ind}%)`,v:apu.cI-apu.dir},{l:`+ Financiamiento (${cfg.fin}%)`,v:apu.cF-apu.cI},{l:`+ Utilidad (${cfg.util}%)`,v:apu.pu-apu.cF}].map(r=><div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #1e2936"}}><span style={{color:"#9ca3af",fontSize:13}}>{r.l}</span><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13}}>{mxn(r.v)}</span></div>)}
      <div style={{display:"flex",justifyContent:"space-between",padding:"14px 0 0"}}><span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:20,color:"#FFD600"}}>P.U. final</span><span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:24,color:"#FFD600"}}>{mxn(apu.pu)} / {item.u}</span></div>
    </div>
  </div></div>);
}

function ModalEditar({item,onSave,onClose}){
  const [mats,setMats]=useState(JSON.parse(JSON.stringify(item.mats)));
  const [mos,setMos]=useState(JSON.parse(JSON.stringify(item.mo)));
  const UNITS=["ml","m2","m3","pza","kg","lote","jgo","rollo","caja","tramo"];
  const uM=(i,k,v)=>setMats(ms=>ms.map((m,j)=>j===i?{...m,[k]:["d","u"].includes(k)?v:parseFloat(v)||0}:m));
  const uMO=(i,k,v)=>setMos(ms=>ms.map((m,j)=>j===i?{...m,[k]:k==="cat"?v:parseFloat(v)||0}:m));
  return(<div style={S.ov} onClick={onClose}><div style={{...S.modal,border:"1px solid #3b82f6"}} onClick={e=>e.stopPropagation()}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}>
      <div><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:20,color:"#3b82f6"}}>Editar APU — {item.clave}</div><div style={{fontSize:13,color:"#9ca3af",marginTop:3}}>{item.desc}</div></div>
      <button style={S.btn("ghost")} onClick={onClose}>Cerrar</button>
    </div>
    <div style={{...S.ct,color:"#3b82f6",fontSize:12}}>Materiales e insumos</div>
    <div style={{overflowX:"auto",marginBottom:8}}><table style={{width:"100%",borderCollapse:"collapse",fontFamily:"'JetBrains Mono',monospace",fontSize:12}}>
      <thead><tr>{["Descripcion del insumo","U","Cantidad","P.U. (MXN)","Desp%",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
      <tbody>{mats.map((m,i)=><tr key={i}>
        <td style={S.td(i)}><input style={{...S.inp,minWidth:180}} value={m.d} onChange={e=>uM(i,"d",e.target.value)} onFocus={fi} onBlur={fb}/></td>
        <td style={S.td(i)}><select style={{...S.sel,width:70}} value={m.u} onChange={e=>uM(i,"u",e.target.value)}>{UNITS.map(u=><option key={u}>{u}</option>)}</select></td>
        <td style={S.td(i)}><input style={{...S.inp,width:90}} type="number" step="0.01" value={m.c} onChange={e=>uM(i,"c",e.target.value)} onFocus={fi} onBlur={fb}/></td>
        <td style={S.td(i)}><input style={{...S.inp,width:110}} type="number" step="0.01" value={m.p} onChange={e=>uM(i,"p",e.target.value)} onFocus={fi} onBlur={fb}/></td>
        <td style={S.td(i)}><input style={{...S.inp,width:65}} type="number" value={m.desp} onChange={e=>uM(i,"desp",e.target.value)} onFocus={fi} onBlur={fb}/></td>
        <td style={S.td(i)}><button style={{...S.btn("danger"),padding:"4px 10px",fontSize:11}} onClick={()=>setMats(ms=>ms.filter((_,j)=>j!==i))}>X</button></td>
      </tr>)}</tbody>
    </table></div>
    <button style={{...S.btn("ghost"),fontSize:11,marginBottom:20}} onClick={()=>setMats(ms=>[...ms,{d:"Nuevo insumo",u:"pza",c:1,p:0,desp:0}])}>+ Agregar insumo</button>
    <div style={{...S.ct,color:"#10b981",fontSize:12}}>Mano de obra</div>
    <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"'JetBrains Mono',monospace",fontSize:12,marginBottom:8}}>
      <thead><tr>{["Categoria","Horas-hombre (HH)",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
      <tbody>{mos.map((m,i)=><tr key={i}>
        <td style={S.td(i)}><select style={S.sel} value={m.cat} onChange={e=>uMO(i,"cat",e.target.value)}>{Object.entries(SALARIOS_BASE).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></td>
        <td style={S.td(i)}><input style={{...S.inp,width:140}} type="number" step="0.01" value={m.hh} onChange={e=>uMO(i,"hh",e.target.value)} onFocus={fi} onBlur={fb}/></td>
        <td style={S.td(i)}><button style={{...S.btn("danger"),padding:"4px 10px",fontSize:11}} onClick={()=>setMos(ms=>ms.filter((_,j)=>j!==i))}>X</button></td>
      </tr>)}</tbody>
    </table>
    <button style={{...S.btn("ghost"),fontSize:11,marginBottom:20}} onClick={()=>setMos(ms=>[...ms,{cat:"oficial",hh:1}])}>+ Agregar MO</button>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
      <button style={S.btn("ghost")} onClick={onClose}>Cancelar</button>
      <button style={S.btn("pri")} onClick={()=>onSave(mats,mos)}>Guardar cambios</button>
    </div>
  </div></div>);
}

function ModProyecto({proy,setProy,cfg,setCfg}){
  const sp=k=>v=>setProy(p=>({...p,[k]:v}));
  const sc=k=>v=>setCfg(c=>({...c,[k]:isNaN(v)?v:parseFloat(v)||0}));
  const g4={display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:14};
  const fz=FACTOR_ZONA[cfg.zona]||1,fc=FACTOR_CONDICION[cfg.cond]||1;
  return(<div>
    <div style={S.card}><div style={S.ct}>Datos del proyecto</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14}}>
        <IF label="Nombre del proyecto" value={proy.nombre} onChange={sp("nombre")}/>
        <IF label="Cliente / empresa" value={proy.cliente} onChange={sp("cliente")}/>
        <IF label="No. de cotizacion" value={proy.folio} onChange={sp("folio")}/>
      </div>
      <div style={g4}>
        <IF label="Fecha" value={proy.fecha} onChange={sp("fecha")} type="date"/>
        <IF label="Vigencia (dias)" value={proy.vigencia} onChange={sp("vigencia")} type="number"/>
        <IF label="Area del proyecto (m2)" value={proy.area} onChange={sp("area")} type="number"/>
        <SF label="Moneda" value={proy.moneda} onChange={sp("moneda")} options={["MXN","USD"]}/>
      </div>
    </div>
    <div style={S.card}><div style={S.ct}>Configuracion APU</div>
      <div style={{...g4,marginBottom:14}}>
        <SF label="Zona geografica" value={cfg.zona} onChange={sc("zona")} options={Object.keys(FACTOR_ZONA)}/>
        <SF label="Tipo de instalacion" value={cfg.tipo} onChange={sc("tipo")} options={["Residencial","Comercial","Industrial"]}/>
        <SF label="Tension del sistema" value={cfg.tension} onChange={sc("tension")} options={["127/220V","127V","220V","440V trifasico"]}/>
        <SF label="Condicion de trabajo" value={cfg.cond} onChange={sc("cond")} options={Object.keys(FACTOR_CONDICION)}/>
      </div>
      <div style={g4}>
        <SF label="Norma aplicable" value={cfg.norma} onChange={sc("norma")} options={["NOM-001-SEDE","NEC 2023","IEC 60364"]}/>
        <div><label style={S.lbl}>Indirectos (%)</label><input style={S.inp} type="number" value={cfg.ind} onChange={e=>sc("ind")(e.target.value)} onFocus={fi} onBlur={fb}/></div>
        <div><label style={S.lbl}>Financiamiento (%)</label><input style={S.inp} type="number" value={cfg.fin} onChange={e=>sc("fin")(e.target.value)} onFocus={fi} onBlur={fb}/></div>
        <div><label style={S.lbl}>Utilidad (%)</label><input style={S.inp} type="number" value={cfg.util} onChange={e=>sc("util")(e.target.value)} onFocus={fi} onBlur={fb}/></div>
      </div>
    </div>
    <div style={S.card}><div style={S.ct}>Financiero y salarios efectivos</div>
      <div style={{...g4,marginBottom:14}}>
        <div><label style={S.lbl}>IVA (%)</label><input style={S.inp} type="number" value={cfg.iva} onChange={e=>sc("iva")(e.target.value)} onFocus={fi} onBlur={fb}/></div>
        <div><label style={S.lbl}>Herramienta (% MO)</label><input style={S.inp} type="number" value={cfg.herr} onChange={e=>sc("herr")(e.target.value)} onFocus={fi} onBlur={fb}/></div>
        <IF label="Tipo cambio USD-MXN" value={cfg.tc} onChange={sc("tc")} type="number"/>
        <div style={{display:"flex",gap:8,alignItems:"center",paddingTop:18}}>
          <span style={S.bdg("#10b981")}>Zona x{fz}</span>
          <span style={S.bdg("#8b5cf6")}>Cond x{fc}</span>
        </div>
      </div>
      <div style={g4}>{Object.entries(SALARIOS_BASE).map(([k,v])=>{
        const ef=v.dia*fz*fc;
        return(<div key={k} style={{background:"#0d1117",border:"1px solid #1e2936",borderRadius:6,padding:12}}>
          <div style={{fontSize:10,color:"#6b7280",fontFamily:"'JetBrains Mono',monospace",marginBottom:3}}>{v.label}</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:18,color:"#FFD600"}}>{mxn(ef)}<span style={{fontSize:10,color:"#6b7280",fontWeight:300}}>/dia</span></div>
          <div style={{fontSize:10,color:"#4b5563",fontFamily:"'JetBrains Mono',monospace"}}>{mxn(ef/8)}/hr</div>
        </div>);
      })}</div>
    </div>
  </div>);
}

function ModBiblioteca({cfg,bib,setBib}){
  const [q,setQ]=useState("");
  const [cat,setCat]=useState("Todas");
  const [mV,setMV]=useState(null);
  const [mE,setME]=useState(null);
  const cats=["Todas",...new Set(bib.map(b=>b.cat))];
  const list=bib.filter(b=>(cat==="Todas"||b.cat===cat)&&(b.desc.toLowerCase().includes(q.toLowerCase())||b.clave.toLowerCase().includes(q.toLowerCase())));
  const saveEdit=(clave,mats,mo)=>{setBib(b=>b.map(x=>x.clave===clave?{...x,mats,mo}:x));setME(null);};
  const nuevo=()=>{
    const clave=`USR-${String(bib.filter(b=>b.clave.startsWith("USR")).length+1).padStart(3,"0")}`;
    const n={clave,desc:"Nuevo concepto",u:"pza",cat:"Canalizaciones",mats:[{d:"Material principal",u:"pza",c:1,p:100,desp:0}],mo:[{cat:"oficial",hh:1}]};
    setBib(b=>[...b,n]);setME(n);
  };
  return(<div>
    {mV&&<ModalAPU item={mV} cfg={cfg} onClose={()=>setMV(null)}/>}
    {mE&&<ModalEditar item={mE} onSave={(m,mo)=>saveEdit(mE.clave,m,mo)} onClose={()=>setME(null)}/>}
    <div style={S.card}>
      <div style={{...S.ct,justifyContent:"space-between"}}><span>Biblioteca APU — {bib.length} conceptos</span><button style={S.btn("green")} onClick={nuevo}>+ Nuevo concepto</button></div>
      <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <input style={{...S.inp,maxWidth:280}} placeholder="Buscar clave o descripcion..." value={q} onChange={e=>setQ(e.target.value)} onFocus={fi} onBlur={fb}/>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{cats.map(c=><button key={c} style={{...S.btn(c===cat?"pri":"ghost"),fontSize:11,padding:"6px 12px"}} onClick={()=>setCat(c)}>{c}</button>)}</div>
      </div>
      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontFamily:"'JetBrains Mono',monospace",fontSize:12}}>
        <thead><tr>{["Clave","Cat","Descripcion","U","Insumos","HH tot","Materiales","MO","Directo","P.U. final",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{list.map((item,i)=>{
          const apu=calcAPU(item,cfg);const col=CAT_COLORS[item.cat]||"#888";
          return(<tr key={item.clave}>
            <td style={S.td(i)}><span style={S.bdg("#FFD600")}>{item.clave}</span></td>
            <td style={S.td(i)}><span style={S.bdg(col)}>{item.cat}</span></td>
            <td style={{...S.td(i),fontFamily:"'Barlow',sans-serif",maxWidth:200}}>{item.desc}</td>
            <td style={{...S.td(i),color:"#6b7280"}}>{item.u}</td>
            <td style={{...S.td(i),textAlign:"center"}}>{item.mats.length}</td>
            <td style={{...S.td(i),color:"#f59e0b"}}>{n2(item.mo.reduce((a,m)=>a+m.hh,0))}</td>
            <td style={{...S.td(i),color:"#3b82f6"}}>{mxn(apu.tM)}</td>
            <td style={{...S.td(i),color:"#10b981"}}>{mxn(apu.tMO)}</td>
            <td style={S.td(i)}>{mxn(apu.dir)}</td>
            <td style={{...S.td(i),color:"#FFD600",fontWeight:700,fontSize:13}}>{mxn(apu.pu)}</td>
            <td style={S.td(i)}><div style={{display:"flex",gap:6}}>
              <button style={{...S.btn("ghost"),padding:"4px 10px",fontSize:11}} onClick={()=>setMV(item)}>Ver APU</button>
              <button style={{...S.btn(),padding:"4px 10px",fontSize:11}} onClick={()=>setME(item)}>Editar</button>
            </div></td>
          </tr>);
        })}</tbody>
      </table></div>
      <div style={{marginTop:8,fontSize:10,color:"#4b5563",fontFamily:"'JetBrains Mono',monospace"}}>{list.length}/{bib.length} conceptos mostrados</div>
    </div>
  </div>);
}

function ModPartidas({partidas,setPartidas,cfg,bib}){
  const [bus,setBus]=useState("");
  const [cant,setCant]=useState(1);
  const [sel,setSel]=useState(null);
  const [drop,setDrop]=useState(false);
  const [mV,setMV]=useState(null);
  const res=useMemo(()=>bus.length<2?[]:bib.filter(b=>b.desc.toLowerCase().includes(bus.toLowerCase())||b.clave.toLowerCase().includes(bus.toLowerCase())).slice(0,8),[bus,bib]);
  const catGrp=useMemo(()=>{const g={};partidas.forEach(p=>{if(!g[p.cat])g[p.cat]=[];g[p.cat].push(p);});return g;},[partidas]);
  return(<div>
    {mV&&<ModalAPU item={mV} cfg={cfg} onClose={()=>setMV(null)}/>}
    <div style={S.card}><div style={S.ct}>Agregar concepto</div>
      <div style={{display:"flex",gap:10,alignItems:"flex-end",flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:280,position:"relative"}}>
          <label style={S.lbl}>Buscar en biblioteca</label>
          <input style={S.inp} placeholder="Escribe clave o descripcion..." value={sel?sel.desc:bus}
            onChange={e=>{setBus(e.target.value);setSel(null);setDrop(true);}}
            onFocus={()=>setDrop(true)} onBlur={()=>setTimeout(()=>setDrop(false),200)}/>
          {drop&&res.length>0&&<div style={{position:"absolute",top:"100%",left:0,right:0,background:"#0d1117",border:"1px solid #FFD600",borderRadius:4,zIndex:50,maxHeight:260,overflowY:"auto"}}>
            {res.map(r=>{const apu=calcAPU(r,cfg);return(<div key={r.clave} style={{padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid #1e2936"}}
              onMouseEnter={e=>e.currentTarget.style.background="#1e2936"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}
              onMouseDown={()=>{setSel(r);setBus(r.desc);}}>
              <div style={{display:"flex",justifyContent:"space-between"}}><span style={S.bdg("#FFD600")}>{r.clave}</span><span style={{color:"#FFD600",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700}}>{mxn(apu.pu)}/{r.u}</span></div>
              <div style={{fontSize:13,marginTop:3}}>{r.desc}</div>
              <div style={{color:"#6b7280",fontSize:11,marginTop:2}}>{r.mats.length} insumos · Mat: {mxn(apu.tM)} · MO: {mxn(apu.tMO)}</div>
            </div>);})}
          </div>}
        </div>
        <div style={{width:110}}><label style={S.lbl}>Cantidad</label><input style={S.inp} type="number" min="0.01" step="0.01" value={cant} onChange={e=>setCant(e.target.value)} onFocus={fi} onBlur={fb}/></div>
        <button style={S.btn("pri")} onClick={()=>{if(!sel)return;setPartidas(p=>[...p,{...sel,id:Date.now(),qty:parseFloat(cant)||1}]);setSel(null);setBus("");setCant(1);}} disabled={!sel}>+ Agregar</button>
      </div>
    </div>
    {Object.entries(catGrp).map(([cat,items])=>{
      const sub=items.reduce((a,p)=>{const bx=bib.find(b=>b.clave===p.clave)||p;return a+calcAPU(bx,cfg).pu*(p.qty||1);},0);
      const col=CAT_COLORS[cat]||"#888";
      return(<div key={cat} style={S.card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <span style={{...S.bdg(col),fontSize:12,padding:"4px 12px"}}>{cat}</span>
          <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,color:"#FFD600",fontWeight:700}}>Subtotal: {mxn(sub)}</span>
        </div>
        <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontFamily:"'JetBrains Mono',monospace",fontSize:12}}>
          <thead><tr>{["Clave","Descripcion","U","Cantidad","Mat/u","MO/u","P.U.","Importe",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{items.map((item,i)=>{
            const bx=bib.find(b=>b.clave===item.clave)||item;const apu=calcAPU(bx,cfg);
            return(<tr key={item.id}>
              <td style={S.td(i)}><span style={S.bdg("#FFD600")}>{item.clave}</span></td>
              <td style={{...S.td(i),fontFamily:"'Barlow',sans-serif",maxWidth:200}}>{item.desc}</td>
              <td style={{...S.td(i),color:"#6b7280"}}>{item.u}</td>
              <td style={S.td(i)}><input type="number" style={{...S.inp,width:85}} value={item.qty} onChange={e=>setPartidas(p=>p.map(x=>x.id===item.id?{...x,qty:parseFloat(e.target.value)||0}:x))} onFocus={fi} onBlur={fb}/></td>
              <td style={{...S.td(i),color:"#3b82f6"}}>{mxn(apu.tM)}</td>
              <td style={{...S.td(i),color:"#10b981"}}>{mxn(apu.tMO)}</td>
              <td style={{...S.td(i),color:"#FFD600",fontWeight:700}}>{mxn(apu.pu)}</td>
              <td style={{...S.td(i),color:"#10b981",fontWeight:700,fontFamily:"'Barlow Condensed',sans-serif",fontSize:14}}>{mxn(apu.pu*(item.qty||1))}</td>
              <td style={S.td(i)}><div style={{display:"flex",gap:4}}>
                <button style={{...S.btn("ghost"),padding:"4px 8px",fontSize:10}} onClick={()=>setMV(bx)}>APU</button>
                <button style={{...S.btn("danger"),padding:"4px 8px",fontSize:10}} onClick={()=>setPartidas(p=>p.filter(x=>x.id!==item.id))}>X</button>
              </div></td>
            </tr>);
          })}</tbody>
        </table></div>
      </div>);
    })}
    {partidas.length===0&&<div style={{textAlign:"center",padding:"60px 20px",color:"#4b5563"}}><div style={{fontSize:40,marginBottom:8}}>lightning</div><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:16}}>Busca y agrega conceptos desde la biblioteca</div></div>}
  </div>);
}

function ModResumen({partidas,cfg,proy,bib}){
  const [ms,setMs]=useState(0);
  const [mo2,setMo2]=useState(0);
  const tots=useMemo(()=>{
    let tM=0,tMO=0,tH=0;const bycat={};
    partidas.forEach(p=>{
      const bx=bib.find(b=>b.clave===p.clave)||p;const apu=calcAPU(bx,cfg);
      const mat=apu.tM*(1+ms/100),mo=apu.tMO*(1+mo2/100),h=mo*(cfg.herr/100);
      tM+=mat*(p.qty||1);tMO+=mo*(p.qty||1);tH+=h*(p.qty||1);
      if(!bycat[p.cat])bycat[p.cat]={mat:0,mo:0,imp:0};
      bycat[p.cat].mat+=mat*(p.qty||1);bycat[p.cat].mo+=mo*(p.qty||1);
      const pu=(mat+mo+h)*(1+cfg.ind/100)*(1+cfg.fin/100)*(1+cfg.util/100);
      bycat[p.cat].imp+=pu*(p.qty||1);
    });
    const dir=tM+tMO+tH,cI=dir*(1+cfg.ind/100),cF=cI*(1+cfg.fin/100),cU=cF*(1+cfg.util/100),iva=cU*(cfg.iva/100);
    return{tM,tMO,tH,dir,cI,cF,cU,iva,total:cU+iva,bycat};
  },[partidas,cfg,ms,mo2,bib]);
  const pieData=Object.entries(tots.bycat).map(([n,v])=>({name:n,value:Math.round(v.imp)}));
  const barData=Object.entries(tots.bycat).map(([n,v])=>({name:n,Materiales:Math.round(v.mat),"M.Obra":Math.round(v.mo)}));
  return(<div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
      {[{v:mxn(tots.total),l:"Total propuesta"},{v:mxn(tots.cU),l:"Antes de IVA"},{v:proy.area?mxn(tots.total/proy.area):"—",l:"Costo / m2"},{v:`${Math.round(tots.tMO/Math.max(tots.tM+tots.tMO,1)*100)}% MO`,l:"Proporcion MO"}].map(k=><div key={k.l} style={S.kpi}><span style={S.kpiV}>{k.v}</span><span style={S.kpiL}>{k.l}</span></div>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
      <div style={S.card}><div style={S.ct}>Integracion APU global</div>
        {[{l:"Materiales (c/desp.)",v:tots.tM,c:"#3b82f6"},{l:"Mano de obra",v:tots.tMO,c:"#10b981"},{l:"Herramienta/equipo",v:tots.tH,c:"#f59e0b"}].map(r=><div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #1e2936"}}><span style={{color:"#9ca3af",fontSize:13}}>{r.l}</span><span style={{color:r.c,fontFamily:"'JetBrains Mono',monospace",fontSize:13}}>{mxn(r.v)}</span></div>)}
        <hr style={S.div}/>
        {[{l:"Subtotal directo",v:tots.dir},{l:`Indirectos (${cfg.ind}%)`,v:tots.cI-tots.dir},{l:`Financiamiento (${cfg.fin}%)`,v:tots.cF-tots.cI},{l:`Utilidad (${cfg.util}%)`,v:tots.cU-tots.cF}].map(r=><div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #0d1117"}}><span style={{color:"#9ca3af",fontSize:13}}>{r.l}</span><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13}}>{mxn(r.v)}</span></div>)}
        <hr style={S.div}/>
        <div style={{display:"flex",justifyContent:"space-between",padding:"5px 0"}}><span style={{color:"#9ca3af",fontSize:13}}>Subtotal sin IVA</span><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13}}>{mxn(tots.cU)}</span></div>
        <div style={{display:"flex",justifyContent:"space-between",padding:"5px 0"}}><span style={{color:"#9ca3af",fontSize:13}}>IVA ({cfg.iva}%)</span><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13}}>{mxn(tots.iva)}</span></div>
        <div style={{display:"flex",justifyContent:"space-between",padding:"12px 0 0",borderTop:"2px solid #FFD600",marginTop:8}}><span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18,color:"#FFD600"}}>Total propuesta</span><span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,color:"#FFD600"}}>{mxn(tots.total)}</span></div>
      </div>
      <div style={S.card}><div style={S.ct}>Distribucion por partida</div>
        <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>{pieData.map((e,i)=><Cell key={i} fill={CAT_COLORS[e.name]||"#6b7280"}/>)}</Pie><Tooltip formatter={v=>mxn(v)} contentStyle={{background:"#0d1117",border:"1px solid #1e2936",fontFamily:"'JetBrains Mono',monospace",fontSize:11}}/></PieChart></ResponsiveContainer>
      </div>
    </div>
    <div style={S.card}><div style={S.ct}>Materiales vs mano de obra por partida</div>
      <ResponsiveContainer width="100%" height={200}><BarChart data={barData} margin={{top:10,right:20,bottom:20,left:10}}>
        <XAxis dataKey="name" tick={{fill:"#6b7280",fontSize:11}}/><YAxis tick={{fill:"#6b7280",fontSize:10}} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
        <Tooltip formatter={v=>mxn(v)} contentStyle={{background:"#0d1117",border:"1px solid #1e2936",fontFamily:"'JetBrains Mono',monospace",fontSize:11}}/>
        <Legend wrapperStyle={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:12}}/>
        <Bar dataKey="Materiales" fill="#3b82f6" radius={[2,2,0,0]}/><Bar dataKey="M.Obra" fill="#10b981" radius={[2,2,0,0]}/>
      </BarChart></ResponsiveContainer>
    </div>
    <div style={S.card}><div style={S.ct}>Analisis de sensibilidad</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div><label style={{...S.lbl,display:"block",marginBottom:8}}>Variacion materiales: {ms>0?"+":""}{ms}%</label>
          <input type="range" min={-30} max={30} value={ms} onChange={e=>setMs(+e.target.value)} style={{width:"100%",accentColor:"#FFD600"}}/>
          <div style={{color:ms>0?"#ef4444":"#10b981",fontFamily:"'JetBrains Mono',monospace",fontSize:12,marginTop:6}}>Total ajustado: {mxn(tots.total)}</div>
        </div>
        <div><label style={{...S.lbl,display:"block",marginBottom:8}}>Variacion mano de obra: {mo2>0?"+":""}{mo2}%</label>
          <input type="range" min={-20} max={35} value={mo2} onChange={e=>setMo2(+e.target.value)} style={{width:"100%",accentColor:"#10b981"}}/>
          <div style={{color:mo2>0?"#ef4444":"#10b981",fontFamily:"'JetBrains Mono',monospace",fontSize:12,marginTop:6}}>Factor condicion: x{FACTOR_CONDICION[cfg.cond]}</div>
        </div>
      </div>
    </div>
  </div>);
}

function ModPropuesta({partidas,cfg,proy,bib}){
  const [notas,setNotas]=useState({alcance:"Suministro, instalacion, pruebas y puesta en servicio de la instalacion electrica completa conforme a planos y especificaciones.",pago:"30% anticipo a la firma · 40% al 60% de avance · 30% a la conclusion y entrega.",exclusiones:"Obra civil, permisos CFE/municipio, luminarias decorativas, equipos de proceso.",garantia:"12 meses en materiales y mano de obra a partir de la fecha de entrega."});
  const catGrp=useMemo(()=>{const g={};partidas.forEach(p=>{if(!g[p.cat])g[p.cat]=[];g[p.cat].push(p);});return g;},[partidas]);
  const tots=useMemo(()=>{const sub=partidas.reduce((a,p)=>{const bx=bib.find(b=>b.clave===p.clave)||p;return a+calcAPU(bx,cfg).pu*(p.qty||1);},0);return{sub,iva:sub*(cfg.iva/100),total:sub*(1+cfg.iva/100)};},[partidas,cfg,bib]);
  return(<div><div style={{...S.card,border:"1px solid #1e2936"}}>
    <div style={{display:"flex",justifyContent:"space-between",paddingBottom:18,borderBottom:"2px solid #FFD600",marginBottom:20}}>
      <div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:28,color:"#FFD600",letterSpacing:2}}>COTIZACION ELECTRICA</div>
        <div style={{color:"#6b7280",fontFamily:"'JetBrains Mono',monospace",fontSize:11,marginTop:3}}>{cfg.norma} · {cfg.tipo} · {cfg.tension}</div>
      </div>
      <div style={{textAlign:"right"}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",color:"#FFD600",fontSize:13}}>No. {proy.folio}</div>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"#6b7280"}}>{proy.fecha}</div>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"#6b7280"}}>Vigencia: {proy.vigencia} dias</div>
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
      <div><div style={S.lbl}>Proyecto</div><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:17}}>{proy.nombre}</div>{proy.area&&<div style={{fontSize:12,color:"#6b7280"}}>Area: {proy.area} m2</div>}</div>
      <div><div style={S.lbl}>Cliente</div><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600,fontSize:15}}>{proy.cliente}</div></div>
    </div>
    {Object.entries(catGrp).map(([cat,items])=>{
      const sub=items.reduce((a,p)=>{const bx=bib.find(b=>b.clave===p.clave)||p;return a+calcAPU(bx,cfg).pu*(p.qty||1);},0);
      const col=CAT_COLORS[cat]||"#FFD600";
      return(<div key={cat} style={{marginBottom:18}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:12,color:col,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8,paddingBottom:5,borderBottom:`1px solid ${col}44`}}>{cat}</div>
        <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"'JetBrains Mono',monospace",fontSize:12}}>
          <thead><tr>{["#","Clave","Descripcion","U","Cant.","P.U.","Importe"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {items.map((p,i)=>{const bx=bib.find(b=>b.clave===p.clave)||p;const apu=calcAPU(bx,cfg);return(<tr key={p.id}>
              <td style={S.td(i)}>{i+1}</td><td style={S.td(i)}><span style={S.bdg(col)}>{p.clave}</span></td>
              <td style={{...S.td(i),fontFamily:"'Barlow',sans-serif"}}>{p.desc}</td>
              <td style={{...S.td(i),color:"#6b7280"}}>{p.u}</td><td style={S.td(i)}>{n2(p.qty||1)}</td>
              <td style={S.td(i)}>{mxn(apu.pu)}</td>
              <td style={{...S.td(i),color:"#10b981",fontWeight:700,fontFamily:"'Barlow Condensed',sans-serif",fontSize:13}}>{mxn(apu.pu*(p.qty||1))}</td>
            </tr>);})}
            <tr><td colSpan={6} style={{padding:"7px 12px",textAlign:"right",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600,fontSize:12,color:"#9ca3af",background:"#0d1117"}}>Subtotal {cat}:</td><td style={{padding:"7px 12px",background:"#0d1117",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,color:col,fontSize:13}}>{mxn(sub)}</td></tr>
          </tbody>
        </table>
      </div>);
    })}
    <div style={{background:"#0d1117",borderRadius:6,padding:14,marginTop:8}}>
      {[{l:"Subtotal antes de IVA",v:tots.sub},{l:`IVA (${cfg.iva}%)`,v:tots.iva}].map(r=><div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #1e2936"}}><span style={{color:"#9ca3af",fontSize:13}}>{r.l}</span><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13}}>{mxn(r.v)}</span></div>)}
      <div style={{display:"flex",justifyContent:"space-between",padding:"12px 0 0"}}><span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18,color:"#FFD600"}}>Total de la propuesta</span><span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:24,color:"#FFD600"}}>{mxn(tots.total)}</span></div>
    </div>
    <hr style={{...S.div,margin:"20px 0"}}/><div style={S.ct}>Notas y condiciones</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      {[["alcance","Alcance de los trabajos"],["pago","Condiciones de pago"],["exclusiones","Exclusiones"],["garantia","Garantia"]].map(([k,l])=><div key={k}><label style={S.lbl}>{l}</label><textarea style={{...S.inp,height:72,resize:"vertical",fontFamily:"'Barlow',sans-serif",fontSize:12,lineHeight:1.5}} value={notas[k]} onChange={e=>setNotas(n=>({...n,[k]:e.target.value}))}/></div>)}
    </div>
    <div style={{marginTop:16,padding:"10px 14px",background:"#0d1117",borderRadius:6,border:"1px solid #FFD600",color:"#FFD600",fontFamily:"'JetBrains Mono',monospace",fontSize:11,textAlign:"center"}}>
      {cfg.norma} · {cfg.tipo} · Zona {cfg.zona} · Utilidad {cfg.util}% · IVA {cfg.iva}%
    </div>
  </div></div>);
}

const PARTIDAS_EJEMPLO=[
  {...BIB_INICIAL.find(b=>b.clave==="ACO-001"),id:1,qty:1},
  {...BIB_INICIAL.find(b=>b.clave==="ACO-002"),id:2,qty:1},
  {...BIB_INICIAL.find(b=>b.clave==="TAB-001"),id:3,qty:1},
  {...BIB_INICIAL.find(b=>b.clave==="TAB-004"),id:4,qty:12},
  {...BIB_INICIAL.find(b=>b.clave==="CAN-001"),id:5,qty:180},
  {...BIB_INICIAL.find(b=>b.clave==="CAN-002"),id:6,qty:60},
  {...BIB_INICIAL.find(b=>b.clave==="CON-001"),id:7,qty:720},
  {...BIB_INICIAL.find(b=>b.clave==="CON-002"),id:8,qty:120},
  {...BIB_INICIAL.find(b=>b.clave==="SAL-001"),id:9,qty:24},
  {...BIB_INICIAL.find(b=>b.clave==="SAL-002"),id:10,qty:4},
  {...BIB_INICIAL.find(b=>b.clave==="SAL-003"),id:11,qty:12},
  {...BIB_INICIAL.find(b=>b.clave==="SAL-004"),id:12,qty:16},
  {...BIB_INICIAL.find(b=>b.clave==="ILU-001"),id:13,qty:8},
  {...BIB_INICIAL.find(b=>b.clave==="TIE-001"),id:14,qty:2},
];

export default function App(){
  const [tab,setTab]=useState(0);
  const [bib,setBib]=useState(BIB_INICIAL);
  const [partidas,setPart]=useState(PARTIDAS_EJEMPLO);
  const [proy,setProy]=useState({nombre:"Instalacion Electrica Residencial 120 m2",cliente:"Cliente Ejemplo S.A. de C.V.",folio:`COT-${new Date().getFullYear()}-001`,fecha:new Date().toISOString().split("T")[0],vigencia:30,area:120,moneda:"MXN"});
  const [cfg,setCfg]=useState({zona:"CDMX",tipo:"Residencial",tension:"127/220V",cond:"Normal",norma:"NOM-001-SEDE",ind:15,fin:3,util:12,iva:16,herr:4,tc:17.5});
  const totalRapido=useMemo(()=>{const s=partidas.reduce((a,p)=>{const bx=bib.find(b=>b.clave===p.clave)||p;return a+calcAPU(bx,cfg).pu*(p.qty||1);},0);return s*(1+cfg.iva/100);},[partidas,cfg,bib]);
  const exportJSON=()=>{const blob=new Blob([JSON.stringify({proy,cfg,partidas},null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`cotizacion-${proy.folio}.json`;a.click();};
  const TABS=["Proyecto","Biblioteca APU","Partidas","Resumen","Propuesta"];
  return(<div style={S.app}>
    <div style={S.hdr}>
      <div><div style={S.logo}>ELECTROCOT PRO</div><div style={{fontSize:10,color:"#4b5563",letterSpacing:3}}>COTIZADOR ELECTRICO - APU POR INSUMO</div></div>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <div style={{textAlign:"right"}}><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"#6b7280"}}>TOTAL PROPUESTA</div><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:20,color:"#FFD600"}}>{mxn(totalRapido)}</div></div>
        <div style={{display:"flex",gap:8}}>
          <button style={S.btn("ghost")} onClick={exportJSON}>Guardar JSON</button>
          <button style={{...S.btn("pri"),fontSize:11}} onClick={()=>window.print()}>Imprimir</button>
        </div>
      </div>
    </div>
    <div style={S.tabs}>
      {TABS.map((t,i)=><button key={i} style={S.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}
      <div style={{marginLeft:"auto",display:"flex",alignItems:"center",padding:"0 8px"}}><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"#4b5563"}}>{partidas.length} partidas · {bib.length} en lib · {proy.folio}</span></div>
    </div>
    <div style={S.wrap}>
      {tab===0&&<ModProyecto proy={proy} setProy={setProy} cfg={cfg} setCfg={setCfg}/>}
      {tab===1&&<ModBiblioteca cfg={cfg} bib={bib} setBib={setBib}/>}
      {tab===2&&<ModPartidas partidas={partidas} setPartidas={setPart} cfg={cfg} bib={bib}/>}
      {tab===3&&<ModResumen partidas={partidas} cfg={cfg} proy={proy} bib={bib}/>}
      {tab===4&&<ModPropuesta partidas={partidas} cfg={cfg} proy={proy} bib={bib}/>}
    </div>
    <div style={{textAlign:"center",padding:"18px",borderTop:"1px solid #1e2936",fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"#374151"}}>ELECTROCOT PRO · APU Detallado por Insumo · {cfg.norma} · {cfg.tipo}</div>
  </div>);
}
