import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

// ─── FONTS ────────────────────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;600;700;900&family=JetBrains+Mono:wght@300;400;600&family=Barlow:wght@300;400;500;600&display=swap";
document.head.appendChild(fontLink);

// ─── SALARIOS BASE (MXN/día) ──────────────────────────────────────────────────
const SALARIOS_BASE = {
  maestro:   { label: "Maestro Electricista", dia: 850 },
  oficial:   { label: "Oficial Electricista",  dia: 650 },
  ayudante:  { label: "Ayudante General",      dia: 400 },
  ingeniero: { label: "Ingeniero Residente",   dia: 1800 },
};
const FACTOR_ZONA      = { CDMX: 1.0, Norte: 0.95, Occidente: 0.92, Sur: 0.88 };
const FACTOR_CONDICION = { Normal: 1.0, Altura: 1.2, "Temp. Extrema": 1.15, "Esp. Confinado": 1.35 };
const CAT_COLORS = {
  Canalizaciones:"#3b82f6", Conductores:"#f59e0b", Tableros:"#8b5cf6",
  Salidas:"#10b981", Iluminación:"#06b6d4", Tierras:"#ef4444", Acometida:"#FFD600",
};

// ─── BIBLIOTECA CON MATERIALES DETALLADOS ─────────────────────────────────────
const BIBLIOTECA_BASE = [
  { clave:"CAN-001", descripcion:"Tubería conduit PVC 13mm (1/2\")", unidad:"ml", cat:"Canalizaciones",
    materiales:[
      { desc:"Tubería conduit PVC 13mm tramo 3m", u:"ml",  cant:1.00, pu:14.50, desp:5 },
      { desc:"Unión conduit PVC 13mm",            u:"pza", cant:0.33, pu:3.20,  desp:3 },
      { desc:"Curva conduit PVC 13mm 90°",        u:"pza", cant:0.15, pu:4.80,  desp:2 },
      { desc:"Grapa conduit PVC 1/2\"",           u:"pza", cant:1.00, pu:1.20,  desp:5 },
      { desc:"Tornillo autorroscante 1\"",         u:"pza", cant:1.00, pu:0.35,  desp:5 },
    ],
    mo:[{ cat:"oficial", hh:0.12 },{ cat:"ayudante", hh:0.05 }] },
  { clave:"CAN-002", descripcion:"Tubería conduit PVC 19mm (3/4\")", unidad:"ml", cat:"Canalizaciones",
    materiales:[
      { desc:"Tubería conduit PVC 19mm tramo 3m", u:"ml",  cant:1.00, pu:19.80, desp:5 },
      { desc:"Unión conduit PVC 19mm",            u:"pza", cant:0.33, pu:4.50,  desp:3 },
      { desc:"Curva conduit PVC 19mm 90°",        u:"pza", cant:0.12, pu:6.20,  desp:2 },
      { desc:"Grapa conduit PVC 3/4\"",           u:"pza", cant:1.00, pu:1.50,  desp:5 },
      { desc:"Tornillo autorroscante 1\"",         u:"pza", cant:1.00, pu:0.35,  desp:5 },
    ],
    mo:[{ cat:"oficial", hh:0.15 },{ cat:"ayudante", hh:0.06 }] },
  { clave:"CAN-003", descripcion:"Tubería conduit PVC 25mm (1\")", unidad:"ml", cat:"Canalizaciones",
    materiales:[
      { desc:"Tubería conduit PVC 25mm tramo 3m", u:"ml",  cant:1.00, pu:28.50, desp:5 },
      { desc:"Unión conduit PVC 25mm",            u:"pza", cant:0.33, pu:6.00,  desp:3 },
      { desc:"Curva conduit PVC 25mm 90°",        u:"pza", cant:0.10, pu:8.50,  desp:2 },
      { desc:"Grapa conduit PVC 1\"",             u:"pza", cant:1.00, pu:1.80,  desp:5 },
    ],
    mo:[{ cat:"oficial", hh:0.18 },{ cat:"ayudante", hh:0.08 }] },
  { clave:"CAN-004", descripcion:"Tubería EMT 3/4\" c/accesorios", unidad:"ml", cat:"Canalizaciones",
    materiales:[
      { desc:"Tubería EMT 3/4\" tramo 3m",  u:"ml",  cant:1.00, pu:55.00, desp:3 },
      { desc:"Conector EMT 3/4\" a caja",   u:"pza", cant:0.20, pu:8.50,  desp:2 },
      { desc:"Unión EMT 3/4\"",             u:"pza", cant:0.20, pu:6.80,  desp:2 },
      { desc:"Grapa EMT 3/4\"",             u:"pza", cant:1.00, pu:2.20,  desp:5 },
      { desc:"Tornillo autorroscante 1\"",   u:"pza", cant:1.00, pu:0.35,  desp:5 },
    ],
    mo:[{ cat:"oficial", hh:0.18 },{ cat:"ayudante", hh:0.08 }] },
  { clave:"CAN-005", descripcion:"Charola portacable galv. 100mm×60mm", unidad:"ml", cat:"Canalizaciones",
    materiales:[
      { desc:"Charola portacable galv. 100×60mm", u:"ml",  cant:1.00, pu:78.00, desp:3 },
      { desc:"Unión de charola 100mm",            u:"pza", cant:0.42, pu:22.00, desp:2 },
      { desc:"Soporte de varilla roscada 3/8\"",  u:"pza", cant:0.50, pu:38.00, desp:2 },
      { desc:"Varilla roscada 3/8\"×1m",          u:"pza", cant:0.50, pu:28.00, desp:3 },
    ],
    mo:[{ cat:"oficial", hh:0.25 },{ cat:"ayudante", hh:0.15 }] },

  { clave:"CON-001", descripcion:"Conductor THW-LS Cal. 12 AWG (3 hilos)", unidad:"ml", cat:"Conductores",
    materiales:[
      { desc:"Conductor THW-LS 12 AWG negro",  u:"ml",  cant:1.00, pu:9.80,  desp:8 },
      { desc:"Conductor THW-LS 12 AWG blanco", u:"ml",  cant:1.00, pu:9.80,  desp:8 },
      { desc:"Conductor THW-LS 12 AWG verde",  u:"ml",  cant:1.00, pu:9.80,  desp:8 },
      { desc:"Cinta aislante 3M 600V",          u:"pza", cant:0.02, pu:28.00, desp:0 },
    ],
    mo:[{ cat:"oficial", hh:0.06 },{ cat:"ayudante", hh:0.04 }] },
  { clave:"CON-002", descripcion:"Conductor THW-LS Cal. 10 AWG (3 hilos)", unidad:"ml", cat:"Conductores",
    materiales:[
      { desc:"Conductor THW-LS 10 AWG negro",  u:"ml",  cant:1.00, pu:14.50, desp:8 },
      { desc:"Conductor THW-LS 10 AWG blanco", u:"ml",  cant:1.00, pu:14.50, desp:8 },
      { desc:"Conductor THW-LS 10 AWG verde",  u:"ml",  cant:1.00, pu:14.50, desp:8 },
      { desc:"Cinta aislante 3M 600V",          u:"pza", cant:0.02, pu:28.00, desp:0 },
    ],
    mo:[{ cat:"oficial", hh:0.07 },{ cat:"ayudante", hh:0.04 }] },
  { clave:"CON-003", descripcion:"Conductor THW-LS Cal. 8 AWG (3 hilos)", unidad:"ml", cat:"Conductores",
    materiales:[
      { desc:"Conductor THW-LS 8 AWG negro",   u:"ml",  cant:1.00, pu:22.50, desp:5 },
      { desc:"Conductor THW-LS 8 AWG blanco",  u:"ml",  cant:1.00, pu:22.50, desp:5 },
      { desc:"Conductor THW-LS 8 AWG verde",   u:"ml",  cant:1.00, pu:22.50, desp:5 },
      { desc:"Cinta vulcanizante 3M",           u:"pza", cant:0.01, pu:65.00, desp:0 },
    ],
    mo:[{ cat:"oficial", hh:0.09 },{ cat:"ayudante", hh:0.05 }] },
  { clave:"CON-004", descripcion:"Conductor THW-LS Cal. 6 AWG (3 hilos)", unidad:"ml", cat:"Conductores",
    materiales:[
      { desc:"Conductor THW-LS 6 AWG negro",   u:"ml",  cant:1.00, pu:34.00, desp:5 },
      { desc:"Conductor THW-LS 6 AWG blanco",  u:"ml",  cant:1.00, pu:34.00, desp:5 },
      { desc:"Conductor THW-LS 6 AWG verde",   u:"ml",  cant:1.00, pu:34.00, desp:5 },
    ],
    mo:[{ cat:"oficial", hh:0.11 },{ cat:"ayudante", hh:0.06 }] },
  { clave:"CON-005", descripcion:"Conductor THW-LS Cal. 4 AWG (3 hilos)", unidad:"ml", cat:"Conductores",
    materiales:[
      { desc:"Conductor THW-LS 4 AWG negro",   u:"ml",  cant:1.00, pu:52.00, desp:5 },
      { desc:"Conductor THW-LS 4 AWG blanco",  u:"ml",  cant:1.00, pu:52.00, desp:5 },
      { desc:"Conductor THW-LS 4 AWG verde",   u:"ml",  cant:1.00, pu:52.00, desp:5 },
    ],
    mo:[{ cat:"oficial", hh:0.13 },{ cat:"ayudante", hh:0.07 }] },
  { clave:"CON-006", descripcion:"Conductor THW-LS Cal. 2 AWG (3 hilos)", unidad:"ml", cat:"Conductores",
    materiales:[
      { desc:"Conductor THW-LS 2 AWG negro",   u:"ml",  cant:1.00, pu:78.00, desp:5 },
      { desc:"Conductor THW-LS 2 AWG blanco",  u:"ml",  cant:1.00, pu:78.00, desp:5 },
      { desc:"Conductor THW-LS 2 AWG verde",   u:"ml",  cant:1.00, pu:78.00, desp:5 },
    ],
    mo:[{ cat:"oficial", hh:0.15 },{ cat:"ayudante", hh:0.08 }] },

  { clave:"TAB-001", descripcion:"Tablero residencial 8 circuitos c/main breaker", unidad:"pza", cat:"Tableros",
    materiales:[
      { desc:"Tablero residencial 8 circ. 120/240V",  u:"pza", cant:1,  pu:1480, desp:0 },
      { desc:"Interruptor principal 1P-2P 60A",       u:"pza", cant:1,  pu:320,  desp:0 },
      { desc:"Caja de derivación 4x4\"",              u:"pza", cant:1,  pu:85,   desp:0 },
      { desc:"Conector flexible 3/4\"",               u:"pza", cant:3,  pu:28,   desp:2 },
      { desc:"Tornillo para tablero 1/4\"",           u:"pza", cant:8,  pu:2.5,  desp:5 },
    ],
    mo:[{ cat:"maestro", hh:2.0 },{ cat:"oficial", hh:2.0 },{ cat:"ayudante", hh:1.0 }] },
  { clave:"TAB-002", descripcion:"Tablero residencial 12 circuitos c/main breaker", unidad:"pza", cat:"Tableros",
    materiales:[
      { desc:"Tablero residencial 12 circ. 120/240V", u:"pza", cant:1,  pu:1950, desp:0 },
      { desc:"Interruptor principal 2P 100A",          u:"pza", cant:1,  pu:480,  desp:0 },
      { desc:"Caja de derivación 4x4\"",               u:"pza", cant:1,  pu:85,   desp:0 },
      { desc:"Conector flexible 3/4\"",                u:"pza", cant:4,  pu:28,   desp:2 },
      { desc:"Tornillo para tablero 1/4\"",            u:"pza", cant:12, pu:2.5,  desp:5 },
    ],
    mo:[{ cat:"maestro", hh:2.5 },{ cat:"oficial", hh:2.5 },{ cat:"ayudante", hh:1.0 }] },
  { clave:"TAB-003", descripcion:"Tablero comercial 24 espacios 120/240V", unidad:"pza", cat:"Tableros",
    materiales:[
      { desc:"Tablero comercial 24 esp. 120/240V",  u:"pza", cant:1, pu:4800, desp:0 },
      { desc:"Interruptor principal 2P 200A",        u:"pza", cant:1, pu:980,  desp:0 },
      { desc:"Barra de tierra",                      u:"pza", cant:1, pu:185,  desp:0 },
      { desc:"Conector flexible 1\"",                u:"pza", cant:4, pu:45,   desp:2 },
      { desc:"Tornillo hexagonal 5/16\"",            u:"pza", cant:8, pu:3.5,  desp:5 },
    ],
    mo:[{ cat:"maestro", hh:3.0 },{ cat:"oficial", hh:4.0 },{ cat:"ayudante", hh:2.0 }] },
  { clave:"TAB-004", descripcion:"Interruptor termomagnético 1P 20A", unidad:"pza", cat:"Tableros",
    materiales:[
      { desc:"Interruptor termomagnético 1P 20A 120V", u:"pza", cant:1,    pu:145, desp:0 },
      { desc:"Peine distribución monofásico",           u:"pza", cant:0.08, pu:85,  desp:0 },
    ],
    mo:[{ cat:"oficial", hh:0.40 },{ cat:"ayudante", hh:0.15 }] },
  { clave:"TAB-005", descripcion:"Interruptor termomagnético 2P 30A", unidad:"pza", cat:"Tableros",
    materiales:[
      { desc:"Interruptor termomagnético 2P 30A 240V", u:"pza", cant:1,    pu:295, desp:0 },
      { desc:"Peine distribución bifásico",             u:"pza", cant:0.08, pu:120, desp:0 },
    ],
    mo:[{ cat:"oficial", hh:0.50 },{ cat:"ayudante", hh:0.20 }] },

  { clave:"SAL-001", descripcion:"Salida contacto sencillo NEMA 5-15R", unidad:"pza", cat:"Salidas",
    materiales:[
      { desc:"Contacto sencillo NEMA 5-15R polarizado",  u:"pza", cant:1, pu:58,   desp:0 },
      { desc:"Placa de contacto sencillo",                u:"pza", cant:1, pu:22,   desp:0 },
      { desc:"Caja metálica rectangular 2x4\"",           u:"pza", cant:1, pu:32,   desp:0 },
      { desc:"Conductor THW-LS 12 AWG negro",             u:"ml",  cant:3, pu:9.80, desp:8 },
      { desc:"Conductor THW-LS 12 AWG blanco",            u:"ml",  cant:3, pu:9.80, desp:8 },
      { desc:"Conductor THW-LS 12 AWG verde",             u:"ml",  cant:3, pu:9.80, desp:8 },
      { desc:"Conector flexible 1/2\"",                   u:"pza", cant:1, pu:12,   desp:2 },
      { desc:"Tornillo 6-32×3/4\"",                       u:"pza", cant:4, pu:1.2,  desp:5 },
    ],
    mo:[{ cat:"oficial", hh:1.0 },{ cat:"ayudante", hh:0.5 }] },
  { clave:"SAL-002", descripcion:"Salida GFCI baño/cocina 15A", unidad:"pza", cat:"Salidas",
    materiales:[
      { desc:"Contacto GFCI 15A 120V c/protección",     u:"pza", cant:1, pu:285,  desp:0 },
      { desc:"Placa para contacto GFCI",                 u:"pza", cant:1, pu:28,   desp:0 },
      { desc:"Caja metálica rectangular 2x4\" imperm.",  u:"pza", cant:1, pu:55,   desp:0 },
      { desc:"Conductor THW-LS 12 AWG negro",            u:"ml",  cant:3, pu:9.80, desp:8 },
      { desc:"Conductor THW-LS 12 AWG blanco",           u:"ml",  cant:3, pu:9.80, desp:8 },
      { desc:"Conductor THW-LS 12 AWG verde",            u:"ml",  cant:3, pu:9.80, desp:8 },
      { desc:"Conector flexible impermeable 1/2\"",      u:"pza", cant:1, pu:22,   desp:2 },
    ],
    mo:[{ cat:"oficial", hh:1.2 },{ cat:"ayudante", hh:0.5 }] },
  { clave:"SAL-003", descripcion:"Salida interruptor sencillo 15A", unidad:"pza", cat:"Salidas",
    materiales:[
      { desc:"Interruptor sencillo 15A 120V",  u:"pza", cant:1, pu:45,   desp:0 },
      { desc:"Placa para interruptor sencillo", u:"pza", cant:1, pu:18,   desp:0 },
      { desc:"Caja metálica rectangular 2x4\"", u:"pza", cant:1, pu:32,   desp:0 },
      { desc:"Conductor THW-LS 12 AWG negro",  u:"ml",  cant:3, pu:9.80, desp:8 },
      { desc:"Conductor THW-LS 12 AWG blanco", u:"ml",  cant:3, pu:9.80, desp:8 },
      { desc:"Conector flexible 1/2\"",        u:"pza", cant:1, pu:12,   desp:2 },
    ],
    mo:[{ cat:"oficial", hh:0.9 },{ cat:"ayudante", hh:0.4 }] },
  { clave:"SAL-004", descripcion:"Salida para luminaria en plafón", unidad:"pza", cat:"Salidas",
    materiales:[
      { desc:"Caja octagonal 4\" c/orejas",    u:"pza", cant:1, pu:38,   desp:0 },
      { desc:"Conductor THW-LS 12 AWG negro",  u:"ml",  cant:2, pu:9.80, desp:8 },
      { desc:"Conductor THW-LS 12 AWG blanco", u:"ml",  cant:2, pu:9.80, desp:8 },
      { desc:"Conductor THW-LS 12 AWG verde",  u:"ml",  cant:2, pu:9.80, desp:8 },
      { desc:"Conector flexible 1/2\"",        u:"pza", cant:1, pu:12,   desp:2 },
      { desc:"Tornillo de plafón 1/4-20",      u:"pza", cant:2, pu:2.5,  desp:5 },
    ],
    mo:[{ cat:"oficial", hh:0.8 },{ cat:"ayudante", hh:0.35 }] },
  { clave:"SAL-005", descripcion:"Salida para A/C mini-split 220V", unidad:"pza", cat:"Salidas",
    materiales:[
      { desc:"Caja metálica rectangular 2x4\"",           u:"pza", cant:1, pu:32,   desp:0 },
      { desc:"Contacto especial 240V 20A NEMA 6-20R",    u:"pza", cant:1, pu:185,  desp:0 },
      { desc:"Placa para contacto especial",              u:"pza", cant:1, pu:28,   desp:0 },
      { desc:"Conductor THW-LS 12 AWG negro",             u:"ml",  cant:3, pu:9.80, desp:8 },
      { desc:"Conductor THW-LS 12 AWG rojo",              u:"ml",  cant:3, pu:9.80, desp:8 },
      { desc:"Conductor THW-LS 12 AWG verde",             u:"ml",  cant:3, pu:9.80, desp:8 },
      { desc:"Conector flexible 3/4\"",                  u:"pza", cant:1, pu:18,   desp:2 },
    ],
    mo:[{ cat:"oficial", hh:1.5 },{ cat:"ayudante", hh:0.6 }] },

  { clave:"ILU-001", descripcion:"Luminaria LED panel 60x60cm 40W", unidad:"pza", cat:"Iluminación",
    materiales:[
      { desc:"Luminaria LED panel 60×60cm 40W 4000K", u:"pza", cant:1, pu:680,  desp:0 },
      { desc:"Driver LED regulable 40W",               u:"pza", cant:1, pu:120,  desp:0 },
      { desc:"Marco empotrar panel 60×60cm",           u:"pza", cant:1, pu:95,   desp:0 },
      { desc:"Conductor THW-LS 14 AWG negro",          u:"ml",  cant:2, pu:7.50, desp:8 },
      { desc:"Conductor THW-LS 14 AWG blanco",         u:"ml",  cant:2, pu:7.50, desp:8 },
      { desc:"Conector flexible 3/8\"",               u:"pza", cant:1, pu:10,   desp:2 },
    ],
    mo:[{ cat:"oficial", hh:1.2 },{ cat:"ayudante", hh:0.6 }] },
  { clave:"ILU-002", descripcion:"Luminaria LED industrial campana 100W", unidad:"pza", cat:"Iluminación",
    materiales:[
      { desc:"Campana industrial LED 100W 5700K IP65",  u:"pza", cant:1, pu:1480,  desp:0 },
      { desc:"Soporte suspensión 1m c/gancho",          u:"pza", cant:1, pu:185,   desp:0 },
      { desc:"Caja metálica 4\" con tapa",              u:"pza", cant:1, pu:65,    desp:0 },
      { desc:"Conductor THHW-LS 12 AWG negro",          u:"ml",  cant:3, pu:10.50, desp:8 },
      { desc:"Conductor THHW-LS 12 AWG blanco",         u:"ml",  cant:3, pu:10.50, desp:8 },
      { desc:"Conector flexible líquido 3/4\"",         u:"pza", cant:1, pu:28,    desp:2 },
    ],
    mo:[{ cat:"oficial", hh:1.8 },{ cat:"ayudante", hh:0.8 }] },
  { clave:"ILU-003", descripcion:"Poste alumbrado h=4m c/luminaria LED", unidad:"pza", cat:"Iluminación",
    materiales:[
      { desc:"Poste octagonal galvanizado h=4m",   u:"pza", cant:1,    pu:3800,  desp:0 },
      { desc:"Luminaria LED vial 60W IP66",         u:"pza", cant:1,    pu:1850,  desp:0 },
      { desc:"Ancla de concreto para poste",        u:"pza", cant:1,    pu:320,   desp:0 },
      { desc:"Conductor THW-LS 10 AWG negro",       u:"ml",  cant:8,    pu:14.50, desp:8 },
      { desc:"Conductor THW-LS 10 AWG blanco",      u:"ml",  cant:8,    pu:14.50, desp:8 },
      { desc:"Conductor THW-LS 10 AWG verde",       u:"ml",  cant:8,    pu:14.50, desp:8 },
      { desc:"Caja metálica intemperie 4\"",         u:"pza", cant:1,    pu:85,    desp:0 },
      { desc:"Concreto premezclado f'c=200kg/cm²",  u:"m³",  cant:0.08, pu:1800,  desp:5 },
    ],
    mo:[{ cat:"maestro", hh:2.0 },{ cat:"oficial", hh:4.0 },{ cat:"ayudante", hh:4.0 }] },

  { clave:"TIE-001", descripcion:"Sistema tierra varilla copperweld 5/8\"×2.4m", unidad:"pza", cat:"Tierras",
    materiales:[
      { desc:"Varilla copperweld 5/8\"×2.4m",          u:"pza", cant:1, pu:380, desp:0 },
      { desc:"Conector varilla a cable tipo grapa",     u:"pza", cant:1, pu:85,  desp:0 },
      { desc:"Conductor desnudo cobre 6 AWG",          u:"ml",  cant:3, pu:38,  desp:5 },
      { desc:"Soldadura exotérmica 65g",               u:"pza", cant:1, pu:95,  desp:0 },
      { desc:"Caja de revisión 30×30cm c/tapa",        u:"pza", cant:1, pu:320, desp:0 },
    ],
    mo:[{ cat:"maestro", hh:1.5 },{ cat:"oficial", hh:1.5 },{ cat:"ayudante", hh:2.0 }] },
  { clave:"TIE-002", descripcion:"Supresor de transientes SPD Clase II 40kA", unidad:"pza", cat:"Tierras",
    materiales:[
      { desc:"Supresor SPD Clase II 3P+N 40kA",  u:"pza", cant:1, pu:1580, desp:0 },
      { desc:"Conductor THW-LS 6 AWG verde",     u:"ml",  cant:2, pu:34,   desp:5 },
      { desc:"Terminal presión 6 AWG",           u:"pza", cant:2, pu:18,   desp:2 },
    ],
    mo:[{ cat:"maestro", hh:1.0 },{ cat:"oficial", hh:0.8 }] },

  { clave:"ACO-001", descripcion:"Acometida aérea triplex 2×4+1×6 AWG", unidad:"lote", cat:"Acometida",
    materiales:[
      { desc:"Cable triplex 2×4+1×6 AWG aluminio",    u:"ml",  cant:12, pu:68,  desp:5 },
      { desc:"Caja de registro 30×30cm c/tapa",        u:"pza", cant:1,  pu:220, desp:0 },
      { desc:"Poliducto galv. 1-1/2\" tramo bajada",  u:"ml",  cant:3,  pu:95,  desp:3 },
      { desc:"Abrazadera para poliducto 1-1/2\"",      u:"pza", cant:4,  pu:18,  desp:3 },
      { desc:"Terminal compresión aluminio 4 AWG",    u:"pza", cant:4,  pu:55,  desp:2 },
      { desc:"Cinta autofundente 3M 600V",            u:"pza", cant:1,  pu:85,  desp:0 },
    ],
    mo:[{ cat:"maestro", hh:3.0 },{ cat:"oficial", hh:3.0 },{ cat:"ayudante", hh:3.0 }] },
  { clave:"ACO-002", descripcion:"Caja de medidor base tipo intemperie CFE", unidad:"pza", cat:"Acometida",
    materiales:[
      { desc:"Caja de medidor base intemperie monofásica", u:"pza", cant:1, pu:850, desp:0 },
      { desc:"Interruptor principal 1P-2P 60A",            u:"pza", cant:1, pu:320, desp:0 },
      { desc:"Sello de silicón intemperie",                u:"pza", cant:1, pu:45,  desp:0 },
      { desc:"Tornillo autoperforante 1/2\"",              u:"pza", cant:6, pu:2.5, desp:5 },
      { desc:"Mástil EMT 1-1/4\" 1m",                     u:"ml",  cant:1, pu:95,  desp:0 },
    ],
    mo:[{ cat:"maestro", hh:2.0 },{ cat:"oficial", hh:2.0 },{ cat:"ayudante", hh:1.0 }] },
];

// ─── MOTOR APU ────────────────────────────────────────────────────────────────
function calcAPU(concepto, cfg) {
  const fz = FACTOR_ZONA[cfg.zona] || 1.0;
  const fc = FACTOR_CONDICION[cfg.condicion] || 1.0;
  let totalMat = 0;
  const desgloseMat = (concepto.materiales||[]).map(m => {
    const base = m.cant * m.pu;
    const conDesp = base * (1 + (m.desp||0)/100);
    totalMat += conDesp;
    return { ...m, base, conDesp };
  });
  let totalMO = 0;
  const desgloseMO = (concepto.mo||[]).map(m => {
    const salDia  = (SALARIOS_BASE[m.cat]?.dia||0) * fz * fc;
    const salHora = salDia / 8;
    const costo   = m.hh * salHora;
    totalMO += costo;
    return { ...m, salDia, salHora, costo };
  });
  const herramienta = totalMO * (cfg.herramienta/100);
  const directo     = totalMat + totalMO + herramienta;
  const ind   = directo  * (cfg.indirectos/100);
  const base2 = directo  + ind;
  const fin   = base2    * (cfg.financiamiento/100);
  const base3 = base2    + fin;
  const util  = base3    * (cfg.utilidad/100);
  const pu    = base3    + util;
  return { desgloseMat, totalMat, desgloseMO, totalMO, herramienta, directo, ind, fin, util, pu };
}

// ─── UTILS ───────────────────────────────────────────────────────────────────
const fmt  = n => new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",minimumFractionDigits:2}).format(n||0);
const fmtN = n => new Intl.NumberFormat("es-MX",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n||0);

// ─── ESTILOS ──────────────────────────────────────────────────────────────────
const fi = e => e.target.style.borderColor="#FFD600";
const fb = e => e.target.style.borderColor="#1e2936";
const S = {
  app:    { fontFamily:"'Barlow',sans-serif", background:"#0a0e14", minHeight:"100vh", color:"#e2e8f0" },
  header: { background:"linear-gradient(135deg,#0d1117,#111827)", borderBottom:"2px solid #FFD600",
            padding:"0 24px", display:"flex", alignItems:"center", justifyContent:"space-between",
            height:64, position:"sticky", top:0, zIndex:100 },
  logo:   { fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, color:"#FFD600",
            letterSpacing:2, display:"flex", alignItems:"center", gap:10 },
  tabs:   { display:"flex", gap:2, padding:"0 24px", background:"#0d1117",
            borderBottom:"1px solid #1e2936", overflowX:"auto" },
  tab: a=>({ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:a?700:400, fontSize:13,
             letterSpacing:1, padding:"14px 20px", cursor:"pointer", border:"none",
             background:"transparent", color:a?"#FFD600":"#6b7280",
             borderBottom:a?"3px solid #FFD600":"3px solid transparent",
             whiteSpace:"nowrap", transition:"all .2s", textTransform:"uppercase" }),
  wrap:   { padding:"24px", maxWidth:1400, margin:"0 auto" },
  card:   { background:"#111827", border:"1px solid #1e2936", borderRadius:8, padding:20, marginBottom:16 },
  ct:     { fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:16, letterSpacing:1.5,
            color:"#FFD600", textTransform:"uppercase", marginBottom:16, display:"flex", alignItems:"center", gap:8 },
  lbl:    { display:"block", fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"#6b7280",
            marginBottom:5, letterSpacing:1, textTransform:"uppercase" },
  inp:    { width:"100%", background:"#0d1117", border:"1px solid #1e2936", borderRadius:4,
            padding:"8px 12px", color:"#e2e8f0", fontFamily:"'JetBrains Mono',monospace",
            fontSize:13, outline:"none", boxSizing:"border-box" },
  sel:    { width:"100%", background:"#0d1117", border:"1px solid #1e2936", borderRadius:4,
            padding:"8px 12px", color:"#e2e8f0", fontFamily:"'JetBrains Mono',monospace",
            fontSize:13, outline:"none", boxSizing:"border-box" },
  btn: v=>({ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, letterSpacing:1,
             textTransform:"uppercase", padding:"10px 20px", borderRadius:4, border:"none", cursor:"pointer",
             background:v==="primary"?"#FFD600":v==="danger"?"#ef4444":v==="green"?"#10b981":v==="ghost"?"transparent":"#1e2936",
             color:v==="primary"?"#0a0e14":v==="ghost"?"#6b7280":"#e2e8f0",
             border:v==="ghost"?"1px solid #1e2936":"none" }),
  th:     { background:"#0d1117", padding:"9px 12px", textAlign:"left", color:"#6b7280", fontSize:11,
            fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:1, textTransform:"uppercase",
            borderBottom:"1px solid #1e2936", whiteSpace:"nowrap" },
  td: i=> ({ padding:"9px 12px", borderBottom:"1px solid #0d1117",
             background:i%2===0?"#111827":"#0f1620", verticalAlign:"middle" }),
  bdg:c=> ({ display:"inline-block", padding:"2px 8px", borderRadius:3, fontSize:10,
             fontFamily:"'JetBrains Mono',monospace", fontWeight:600,
             background:c+"22", color:c, border:`1px solid ${c}44`, letterSpacing:.5 }),
  div:    { border:"none", borderTop:"1px solid #1e2936", margin:"14px 0" },
  kpi:    { background:"#0d1117", border:"1px solid #1e2936", borderRadius:8, padding:"14px 18px", textAlign:"center" },
  kpiV:   { fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:22, color:"#FFD600", display:"block" },
  kpiL:   { fontFamily:"'Barlow',sans-serif", fontSize:11, color:"#6b7280", marginTop:3, textTransform:"uppercase", letterSpacing:1 },
};
function IF({ label, value, onChange, type="text" }) {
  return <div><label style={S.lbl}>{label}</label>
    <input style={S.inp} type={type} value={value} onChange={e=>onChange(e.target.value)} onFocus={fi} onBlur={fb} /></div>;
}
function SF({ label, value, onChange, options }) {
  return <div><label style={S.lbl}>{label}</label>
    <select style={S.sel} value={value} onChange={e=>onChange(e.target.value)}>
      {options.map(o=><option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}
    </select></div>;
}

// ─── MODAL VER APU ────────────────────────────────────────────────────────────
function ModalAPU({ concepto, cfg, onClose }) {
  const apu = calcAPU(concepto, cfg);
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.85)", zIndex:200,
      display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={onClose}>
      <div style={{ background:"#111827", border:"2px solid #FFD600", borderRadius:10,
        maxWidth:780, width:"100%", maxHeight:"92vh", overflowY:"auto", padding:28 }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
          <div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, color:"#FFD600" }}>
              DESGLOSE APU — {concepto.clave}
            </div>
            <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:13, color:"#9ca3af", marginTop:3 }}>{concepto.descripcion}</div>
            <div style={{ marginTop:6, display:"flex", gap:6, flexWrap:"wrap" }}>
              <span style={S.bdg(CAT_COLORS[concepto.cat]||"#6b7280")}>{concepto.cat}</span>
              <span style={S.bdg("#10b981")}>Zona {cfg.zona} ×{FACTOR_ZONA[cfg.zona]}</span>
              <span style={S.bdg("#8b5cf6")}>Cond ×{FACTOR_CONDICION[cfg.condicion]}</span>
              <span style={S.bdg("#f59e0b")}>{concepto.unidad}</span>
            </div>
          </div>
          <button style={{ ...S.btn("ghost"), fontSize:18, padding:"4px 12px" }} onClick={onClose}>✕</button>
        </div>

        {/* A) MATERIALES */}
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, color:"#3b82f6", fontSize:13,
          letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>A. MATERIALES E INSUMOS</div>
        <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:"'JetBrains Mono',monospace", fontSize:12, marginBottom:4 }}>
          <thead><tr>
            {["Insumo","U","Cant.","P.U.","Desp%","Subtotal"].map(h=><th key={h} style={S.th}>{h}</th>)}
          </tr></thead>
          <tbody>
            {apu.desgloseMat.map((m,i)=>(
              <tr key={i}>
                <td style={{ ...S.td(i), fontFamily:"'Barlow',sans-serif", fontSize:13, maxWidth:220 }}>{m.desc}</td>
                <td style={S.td(i)}>{m.u}</td>
                <td style={S.td(i)}>{fmtN(m.cant)}</td>
                <td style={S.td(i)}>{fmt(m.pu)}</td>
                <td style={{ ...S.td(i), color:"#f59e0b" }}>{m.desp}%</td>
                <td style={{ ...S.td(i), color:"#3b82f6", fontWeight:600 }}>{fmt(m.conDesp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display:"flex", justifyContent:"flex-end", padding:"8px 12px",
          background:"#0d1117", borderRadius:"0 0 4px 4px", marginBottom:16 }}>
          <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, color:"#3b82f6", fontSize:15 }}>
            Total Materiales: {fmt(apu.totalMat)}
          </span>
        </div>

        {/* B) MANO DE OBRA */}
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, color:"#10b981", fontSize:13,
          letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>B. MANO DE OBRA</div>
        <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:"'JetBrains Mono',monospace", fontSize:12, marginBottom:4 }}>
          <thead><tr>
            {["Categoría","Sal./día","Sal./hora","H-H","Costo MO"].map(h=><th key={h} style={S.th}>{h}</th>)}
          </tr></thead>
          <tbody>
            {apu.desgloseMO.map((m,i)=>(
              <tr key={i}>
                <td style={{ ...S.td(i), fontFamily:"'Barlow',sans-serif", fontSize:13 }}>{SALARIOS_BASE[m.cat]?.label}</td>
                <td style={S.td(i)}>{fmt(m.salDia)}</td>
                <td style={S.td(i)}>{fmt(m.salHora)}</td>
                <td style={{ ...S.td(i), color:"#f59e0b" }}>{fmtN(m.hh)}</td>
                <td style={{ ...S.td(i), color:"#10b981", fontWeight:600 }}>{fmt(m.costo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display:"flex", justifyContent:"flex-end", padding:"8px 12px",
          background:"#0d1117", borderRadius:"0 0 4px 4px", marginBottom:16 }}>
          <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, color:"#10b981", fontSize:15 }}>
            Total Mano de Obra: {fmt(apu.totalMO)}
          </span>
        </div>

        {/* C) INTEGRACIÓN */}
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, color:"#8b5cf6", fontSize:13,
          letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>C. INTEGRACIÓN AL PRECIO UNITARIO</div>
        <div style={{ background:"#0d1117", borderRadius:6, padding:16 }}>
          {[
            { lbl:"(A) Materiales con desperdicio",    val:apu.totalMat,    c:"#3b82f6" },
            { lbl:"(B) Mano de Obra",                  val:apu.totalMO,     c:"#10b981" },
            { lbl:`(C) Herramienta/Equipo (${cfg.herramienta}% MO)`, val:apu.herramienta, c:"#f59e0b" },
          ].map(r=>(
            <div key={r.lbl} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid #1e2936" }}>
              <span style={{ color:"#9ca3af", fontSize:13 }}>{r.lbl}</span>
              <span style={{ color:r.c, fontFamily:"'JetBrains Mono',monospace", fontSize:13 }}>{fmt(r.val)}</span>
            </div>
          ))}
          <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 0",
            borderBottom:"2px solid #374151", marginBottom:4 }}>
            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:16 }}>COSTO DIRECTO (A+B+C)</span>
            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:16 }}>{fmt(apu.directo)}</span>
          </div>
          {[
            { lbl:`+ Indirectos (${cfg.indirectos}%)`,        val:apu.ind,  pct:cfg.indirectos },
            { lbl:`+ Financiamiento (${cfg.financiamiento}%)`,val:apu.fin,  pct:cfg.financiamiento },
            { lbl:`+ Utilidad (${cfg.utilidad}%)`,            val:apu.util, pct:cfg.utilidad },
          ].map(r=>(
            <div key={r.lbl} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #1e2936" }}>
              <span style={{ color:"#9ca3af", fontSize:13 }}>{r.lbl}</span>
              <span style={{ color:"#e2e8f0", fontFamily:"'JetBrains Mono',monospace", fontSize:13 }}>{fmt(r.val)}</span>
            </div>
          ))}
          <div style={{ display:"flex", justifyContent:"space-between", padding:"14px 0 0" }}>
            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, color:"#FFD600" }}>
              PRECIO UNITARIO FINAL
            </span>
            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:26, color:"#FFD600" }}>
              {fmt(apu.pu)} / {concepto.unidad}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL EDITAR MATERIALES ──────────────────────────────────────────────────
function ModalEditar({ concepto, onSave, onClose }) {
  const [mats, setMats] = useState(JSON.parse(JSON.stringify(concepto.materiales)));
  const [mos,  setMos]  = useState(JSON.parse(JSON.stringify(concepto.mo)));
  const updM = (i,k,v) => setMats(ms=>ms.map((m,j)=>j===i?{...m,[k]:["desc","u"].includes(k)?v:parseFloat(v)||0}:m));
  const updMO= (i,k,v) => setMos(ms=>ms.map((m,j)=>j===i?{...m,[k]:k==="cat"?v:parseFloat(v)||0}:m));
  const UNITS = ["ml","m²","m³","pza","kg","lote","jgo","rollo","caja","tramo"];
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.9)", zIndex:300,
      display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={onClose}>
      <div style={{ background:"#111827", border:"2px solid #3b82f6", borderRadius:10,
        maxWidth:880, width:"100%", maxHeight:"94vh", overflowY:"auto", padding:28 }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, color:"#3b82f6" }}>
            ✏️ EDITAR APU — {concepto.clave}
          </div>
          <button style={{ ...S.btn("ghost"), padding:"4px 12px", fontSize:18 }} onClick={onClose}>✕</button>
        </div>

        <div style={{ ...S.ct, color:"#3b82f6" }}>📦 Materiales e Insumos</div>
        <div style={{ overflowX:"auto", marginBottom:8 }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:"'JetBrains Mono',monospace", fontSize:12 }}>
            <thead><tr>{["Descripción del Insumo","Unidad","Cantidad","P.U. (MXN)","Desp%",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {mats.map((m,i)=>(
                <tr key={i}>
                  <td style={S.td(i)}><input style={{ ...S.inp, minWidth:220 }} value={m.desc} onChange={e=>updM(i,"desc",e.target.value)} onFocus={fi} onBlur={fb} /></td>
                  <td style={S.td(i)}><select style={{ ...S.sel, width:75 }} value={m.u} onChange={e=>updM(i,"u",e.target.value)}>{UNITS.map(u=><option key={u}>{u}</option>)}</select></td>
                  <td style={S.td(i)}><input style={{ ...S.inp, width:100 }} type="number" step="0.01" value={m.cant} onChange={e=>updM(i,"cant",e.target.value)} onFocus={fi} onBlur={fb} /></td>
                  <td style={S.td(i)}><input style={{ ...S.inp, width:115 }} type="number" step="0.01" value={m.pu} onChange={e=>updM(i,"pu",e.target.value)} onFocus={fi} onBlur={fb} /></td>
                  <td style={S.td(i)}><input style={{ ...S.inp, width:70 }} type="number" value={m.desp} onChange={e=>updM(i,"desp",e.target.value)} onFocus={fi} onBlur={fb} /></td>
                  <td style={S.td(i)}><button style={{ ...S.btn("danger"), padding:"4px 10px", fontSize:11 }} onClick={()=>setMats(ms=>ms.filter((_,j)=>j!==i))}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button style={{ ...S.btn("ghost"), fontSize:12, marginBottom:20 }}
          onClick={()=>setMats(ms=>[...ms,{desc:"Nuevo insumo",u:"pza",cant:1,pu:0,desp:0}])}>+ Agregar Insumo</button>

        <div style={{ ...S.ct, color:"#10b981" }}>👷 Mano de Obra</div>
        <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:"'JetBrains Mono',monospace", fontSize:12, marginBottom:8 }}>
          <thead><tr>{["Categoría","Horas-Hombre (HH)",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {mos.map((m,i)=>(
              <tr key={i}>
                <td style={S.td(i)}><select style={S.sel} value={m.cat} onChange={e=>updMO(i,"cat",e.target.value)}>{Object.entries(SALARIOS_BASE).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></td>
                <td style={S.td(i)}><input style={{ ...S.inp, width:140 }} type="number" step="0.01" value={m.hh} onChange={e=>updMO(i,"hh",e.target.value)} onFocus={fi} onBlur={fb} /></td>
                <td style={S.td(i)}><button style={{ ...S.btn("danger"), padding:"4px 10px", fontSize:11 }} onClick={()=>setMos(ms=>ms.filter((_,j)=>j!==i))}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button style={{ ...S.btn("ghost"), fontSize:12, marginBottom:24 }}
          onClick={()=>setMos(ms=>[...ms,{cat:"oficial",hh:1}])}>+ Agregar MO</button>

        <div style={{ display:"flex", gap:12, justifyContent:"flex-end" }}>
          <button style={S.btn("ghost")} onClick={onClose}>Cancelar</button>
          <button style={S.btn("primary")} onClick={()=>onSave(mats,mos)}>💾 Guardar Cambios</button>
        </div>
      </div>
    </div>
  );
}

// ─── MOD 1: PROYECTO ──────────────────────────────────────────────────────────
function ModProyecto({ proy, setProy, cfg, setCfg }) {
  const sp = k => v => setProy(p=>({...p,[k]:v}));
  const sc = k => v => setCfg(c=>({...c,[k]:isNaN(v)?v:parseFloat(v)||0}));
  const g4 = { display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:16 };
  return (
    <div>
      <div style={S.card}>
        <div style={S.ct}>⚡ Datos del Proyecto</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:16 }}>
          <IF label="Nombre del Proyecto" value={proy.nombre} onChange={sp("nombre")} />
          <IF label="Cliente / Empresa"   value={proy.cliente} onChange={sp("cliente")} />
          <IF label="No. de Cotización"   value={proy.folio}   onChange={sp("folio")} />
        </div>
        <div style={g4}>
          <IF label="Fecha" value={proy.fecha} onChange={sp("fecha")} type="date" />
          <IF label="Vigencia (días)" value={proy.vigencia} onChange={sp("vigencia")} type="number" />
          <IF label="Área del Proyecto (m²)" value={proy.area} onChange={sp("area")} type="number" />
          <SF label="Moneda" value={proy.moneda} onChange={sp("moneda")} options={["MXN","USD"]} />
        </div>
      </div>
      <div style={S.card}>
        <div style={S.ct}>🔧 Configuración APU</div>
        <div style={{ ...g4, marginBottom:16 }}>
          <SF label="Zona Geográfica"     value={cfg.zona}      onChange={sc("zona")}      options={Object.keys(FACTOR_ZONA)} />
          <SF label="Tipo Instalación"    value={cfg.tipo}      onChange={sc("tipo")}      options={["Residencial","Comercial","Industrial"]} />
          <SF label="Tensión del Sistema" value={cfg.tension}   onChange={sc("tension")}   options={["127V","220V","127/220V","220/440V trifásico"]} />
          <SF label="Condición de Trabajo" value={cfg.condicion} onChange={sc("condicion")} options={Object.keys(FACTOR_CONDICION)} />
        </div>
        <div style={g4}>
          <SF label="Norma Aplicable" value={cfg.norma} onChange={sc("norma")} options={["NOM-001-SEDE","NEC 2023","IEC 60364"]} />
          <div><label style={S.lbl}>Indirectos (%)</label><input style={S.inp} type="number" value={cfg.indirectos} onChange={e=>sc("indirectos")(e.target.value)} onFocus={fi} onBlur={fb} /></div>
          <div><label style={S.lbl}>Financiamiento (%)</label><input style={S.inp} type="number" value={cfg.financiamiento} onChange={e=>sc("financiamiento")(e.target.value)} onFocus={fi} onBlur={fb} /></div>
          <div><label style={S.lbl}>Utilidad (%)</label><input style={S.inp} type="number" value={cfg.utilidad} onChange={e=>sc("utilidad")(e.target.value)} onFocus={fi} onBlur={fb} /></div>
        </div>
      </div>
      <div style={S.card}>
        <div style={S.ct}>💰 Financiero y Salarios Efectivos</div>
        <div style={{ ...g4, marginBottom:16 }}>
          <div><label style={S.lbl}>IVA (%)</label><input style={S.inp} type="number" value={cfg.iva} onChange={e=>sc("iva")(e.target.value)} onFocus={fi} onBlur={fb} /></div>
          <div><label style={S.lbl}>Herramienta (%MO)</label><input style={S.inp} type="number" value={cfg.herramienta} onChange={e=>sc("herramienta")(e.target.value)} onFocus={fi} onBlur={fb} /></div>
          <IF label="Tipo Cambio USD→MXN" value={cfg.tipoCambio} onChange={sc("tipoCambio")} type="number" />
          <div style={{ display:"flex", gap:8, alignItems:"center", paddingTop:22 }}>
            <span style={S.bdg("#10b981")}>Zona ×{FACTOR_ZONA[cfg.zona]}</span>
            <span style={S.bdg("#8b5cf6")}>Cond ×{FACTOR_CONDICION[cfg.condicion]}</span>
          </div>
        </div>
        <div style={g4}>
          {Object.entries(SALARIOS_BASE).map(([k,v])=>{
            const ef = v.dia*(FACTOR_ZONA[cfg.zona]||1)*(FACTOR_CONDICION[cfg.condicion]||1);
            return (
              <div key={k} style={{ background:"#0d1117", border:"1px solid #1e2936", borderRadius:6, padding:12 }}>
                <div style={{ fontSize:11, color:"#6b7280", fontFamily:"'JetBrains Mono',monospace", marginBottom:3 }}>{v.label}</div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:20, color:"#FFD600" }}>
                  {fmt(ef)}<span style={{ fontSize:11, color:"#6b7280", fontWeight:300 }}>/día</span>
                </div>
                <div style={{ fontSize:11, color:"#4b5563", fontFamily:"'JetBrains Mono',monospace" }}>{fmt(ef/8)}/hr</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── MOD 2: BIBLIOTECA ────────────────────────────────────────────────────────
function ModBiblioteca({ cfg, biblioteca, setBiblioteca }) {
  const [filtro, setFiltro] = useState("");
  const [cat, setCat]       = useState("Todas");
  const [modalV, setModalV] = useState(null);
  const [modalE, setModalE] = useState(null);

  const cats = ["Todas", ...new Set(biblioteca.map(b=>b.cat))];
  const list = biblioteca.filter(b =>
    (cat==="Todas"||b.cat===cat) &&
    (b.descripcion.toLowerCase().includes(filtro.toLowerCase())||b.clave.toLowerCase().includes(filtro.toLowerCase()))
  );

  const saveEdit = (clave, mats, mos) => {
    setBiblioteca(bib=>bib.map(b=>b.clave===clave?{...b,materiales:mats,mo:mos}:b));
    setModalE(null);
  };
  const nuevoConcepto = () => {
    const clave = `USR-${String(biblioteca.filter(b=>b.clave.startsWith("USR")).length+1).padStart(3,"0")}`;
    const n = { clave, descripcion:"Nuevo concepto", unidad:"pza", cat:"Canalizaciones",
      materiales:[{desc:"Material principal",u:"pza",cant:1,pu:100,desp:0}],
      mo:[{cat:"oficial",hh:1}] };
    setBiblioteca(bib=>[...bib,n]);
    setModalE(n);
  };

  return (
    <div>
      {modalV && <ModalAPU concepto={modalV} cfg={cfg} onClose={()=>setModalV(null)} />}
      {modalE && <ModalEditar concepto={modalE} onSave={(m,mo)=>saveEdit(modalE.clave,m,mo)} onClose={()=>setModalE(null)} />}

      <div style={S.card}>
        <div style={S.ct}>📚 Biblioteca APU — {biblioteca.length} conceptos</div>
        <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
          <input style={{ ...S.inp, maxWidth:280 }} placeholder="Buscar clave o descripción..."
            value={filtro} onChange={e=>setFiltro(e.target.value)} onFocus={fi} onBlur={fb} />
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
            {cats.map(c=><button key={c} style={{ ...S.btn(c===cat?"primary":"ghost"), fontSize:11, padding:"7px 12px" }}
              onClick={()=>setCat(c)}>{c}</button>)}
          </div>
          <button style={{ ...S.btn("green"), marginLeft:"auto" }} onClick={nuevoConcepto}>+ Nuevo Concepto</button>
        </div>

        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:"'JetBrains Mono',monospace", fontSize:12 }}>
            <thead><tr>
              {["Clave","Cat","Descripción","U","Insumos","HH Tot","Mat","MO","Herr","Directo","P.U. Final",""].map(h=><th key={h} style={S.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {list.map((item,i)=>{
                const apu = calcAPU(item,cfg);
                const totalHH = item.mo.reduce((a,m)=>a+m.hh,0);
                return (
                  <tr key={item.clave}>
                    <td style={S.td(i)}><span style={S.bdg("#FFD600")}>{item.clave}</span></td>
                    <td style={S.td(i)}><span style={S.bdg(CAT_COLORS[item.cat]||"#6b7280")}>{item.cat}</span></td>
                    <td style={{ ...S.td(i), fontFamily:"'Barlow',sans-serif", fontSize:13, maxWidth:200 }}>{item.descripcion}</td>
                    <td style={{ ...S.td(i), color:"#6b7280" }}>{item.unidad}</td>
                    <td style={{ ...S.td(i), textAlign:"center" }}>{item.materiales.length}</td>
                    <td style={{ ...S.td(i), color:"#f59e0b" }}>{fmtN(totalHH)}</td>
                    <td style={{ ...S.td(i), color:"#3b82f6" }}>{fmt(apu.totalMat)}</td>
                    <td style={{ ...S.td(i), color:"#10b981" }}>{fmt(apu.totalMO)}</td>
                    <td style={{ ...S.td(i), color:"#8b5cf6" }}>{fmt(apu.herramienta)}</td>
                    <td style={S.td(i)}>{fmt(apu.directo)}</td>
                    <td style={{ ...S.td(i), color:"#FFD600", fontWeight:700, fontSize:14 }}>{fmt(apu.pu)}</td>
                    <td style={S.td(i)}>
                      <div style={{ display:"flex", gap:4 }}>
                        <button style={{ ...S.btn("ghost"), padding:"4px 9px", fontSize:11 }} onClick={()=>setModalV(item)}>👁 APU</button>
                        <button style={{ ...S.btn(), padding:"4px 9px", fontSize:11 }} onClick={()=>setModalE(item)}>✏️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop:10, color:"#4b5563", fontSize:11, fontFamily:"'JetBrains Mono',monospace" }}>
          Mostrando {list.length}/{biblioteca.length} · 👁 APU = desglose completo insumo a insumo · ✏️ = editar materiales y MO
        </div>
      </div>
    </div>
  );
}

// ─── MOD 3: PARTIDAS ──────────────────────────────────────────────────────────
function ModPartidas({ partidas, setPartidas, cfg, biblioteca }) {
  const [bus, setBus]       = useState("");
  const [cant, setCant]     = useState(1);
  const [sel, setSel]       = useState(null);
  const [drop, setDrop]     = useState(false);
  const [modalV, setModalV] = useState(null);

  const res = useMemo(()=>{
    if (bus.length<2) return [];
    return biblioteca.filter(b=>
      b.descripcion.toLowerCase().includes(bus.toLowerCase())||
      b.clave.toLowerCase().includes(bus.toLowerCase())
    ).slice(0,8);
  },[bus,biblioteca]);

  const agregar = () => {
    if (!sel) return;
    setPartidas(p=>[...p,{...sel,id:Date.now(),cantidad:parseFloat(cant)||1}]);
    setBus(""); setSel(null); setCant(1); setDrop(false);
  };

  const catGrp = useMemo(()=>{
    const g={};
    partidas.forEach(p=>{ if(!g[p.cat]) g[p.cat]=[]; g[p.cat].push(p); });
    return g;
  },[partidas]);

  return (
    <div>
      {modalV && <ModalAPU concepto={modalV} cfg={cfg} onClose={()=>setModalV(null)} />}

      <div style={S.card}>
        <div style={S.ct}>➕ Agregar Concepto a la Obra</div>
        <div style={{ display:"flex", gap:12, alignItems:"flex-end", flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:300, position:"relative" }}>
            <label style={S.lbl}>Buscar en biblioteca</label>
            <input style={S.inp} placeholder="Escribe clave o descripción..."
              value={sel?sel.descripcion:bus}
              onChange={e=>{ setBus(e.target.value); setSel(null); setDrop(true); }}
              onFocus={()=>setDrop(true)} onBlur={()=>setTimeout(()=>setDrop(false),200)} />
            {drop && res.length>0 && (
              <div style={{ position:"absolute", top:"100%", left:0, right:0, background:"#0d1117",
                border:"1px solid #FFD600", borderRadius:4, zIndex:50, maxHeight:280, overflowY:"auto" }}>
                {res.map(r=>{
                  const apu=calcAPU(r,cfg);
                  return (
                    <div key={r.clave} style={{ padding:"10px 14px", cursor:"pointer", borderBottom:"1px solid #1e2936" }}
                      onMouseEnter={e=>e.currentTarget.style.background="#1e2936"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                      onMouseDown={()=>{ setSel(r); setBus(r.descripcion); }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span style={S.bdg("#FFD600")}>{r.clave}</span>
                        <span style={{ color:"#FFD600", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700 }}>{fmt(apu.pu)}/{r.unidad}</span>
                      </div>
                      <div style={{ fontSize:13, marginTop:3 }}>{r.descripcion}</div>
                      <div style={{ color:"#6b7280", fontSize:11, marginTop:2 }}>
                        {r.materiales.length} insumos · Mat: {fmt(apu.totalMat)} · MO: {fmt(apu.totalMO)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div style={{ width:110 }}>
            <label style={S.lbl}>Cantidad</label>
            <input style={S.inp} type="number" min="0" value={cant}
              onChange={e=>setCant(e.target.value)} onFocus={fi} onBlur={fb} />
          </div>
          <button style={S.btn("primary")} onClick={agregar} disabled={!sel}>+ Agregar</button>
        </div>
      </div>

      {Object.entries(catGrp).map(([cat,items])=>{
        const sub = items.reduce((a,p)=>a+calcAPU(p,cfg).pu*p.cantidad,0);
        return (
          <div key={cat} style={S.card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <span style={{ ...S.bdg(CAT_COLORS[cat]||"#6b7280"), fontSize:13, padding:"4px 12px" }}>{cat}</span>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, color:"#FFD600", fontWeight:700 }}>Subtotal: {fmt(sub)}</span>
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:"'JetBrains Mono',monospace", fontSize:12 }}>
                <thead><tr>{["Clave","Descripción","U","Cantidad","Mat/u","MO/u","P.U.","Importe",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {items.map((item,i)=>{
                    const apu = calcAPU(item,cfg);
                    return (
                      <tr key={item.id}>
                        <td style={S.td(i)}><span style={S.bdg("#FFD600")}>{item.clave}</span></td>
                        <td style={{ ...S.td(i), fontFamily:"'Barlow',sans-serif", fontSize:13, maxWidth:200 }}>{item.descripcion}</td>
                        <td style={{ ...S.td(i), color:"#6b7280" }}>{item.unidad}</td>
                        <td style={S.td(i)}>
                          <input type="number" style={{ ...S.inp, width:85 }} value={item.cantidad}
                            onChange={e=>setPartidas(p=>p.map(x=>x.id===item.id?{...x,cantidad:parseFloat(e.target.value)||0}:x))}
                            onFocus={fi} onBlur={fb} />
                        </td>
                        <td style={{ ...S.td(i), color:"#3b82f6" }}>{fmt(apu.totalMat)}</td>
                        <td style={{ ...S.td(i), color:"#10b981" }}>{fmt(apu.totalMO)}</td>
                        <td style={{ ...S.td(i), color:"#FFD600", fontWeight:700 }}>{fmt(apu.pu)}</td>
                        <td style={{ ...S.td(i), color:"#10b981", fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif", fontSize:15 }}>{fmt(apu.pu*item.cantidad)}</td>
                        <td style={S.td(i)}>
                          <div style={{ display:"flex", gap:4 }}>
                            <button style={{ ...S.btn("ghost"), padding:"4px 8px", fontSize:10 }} onClick={()=>setModalV(item)}>APU</button>
                            <button style={{ ...S.btn("danger"), padding:"4px 8px", fontSize:10 }} onClick={()=>setPartidas(p=>p.filter(x=>x.id!==item.id))}>✕</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {partidas.length===0 && (
        <div style={{ textAlign:"center", padding:"60px 20px", color:"#4b5563" }}>
          <div style={{ fontSize:48 }}>⚡</div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, marginTop:8 }}>Busca y agrega conceptos desde la biblioteca</div>
        </div>
      )}
    </div>
  );
}

// ─── MOD 4: RESUMEN ───────────────────────────────────────────────────────────
function ModResumen({ partidas, cfg, proy }) {
  const [ms, setMs] = useState(0);
  const [mo2, setMo2] = useState(0);
  const tots = useMemo(()=>{
    let tM=0, tMO=0, tH=0;
    const bycat={};
    partidas.forEach(p=>{
      const apu = calcAPU(p,cfg);
      const mat = apu.totalMat*(1+ms/100);
      const mo  = apu.totalMO*(1+mo2/100);
      const h   = mo*(cfg.herramienta/100);
      tM  += mat*p.cantidad;
      tMO += mo*p.cantidad;
      tH  += h*p.cantidad;
      if (!bycat[p.cat]) bycat[p.cat]={mat:0,mo:0,imp:0};
      bycat[p.cat].mat += mat*p.cantidad;
      bycat[p.cat].mo  += mo*p.cantidad;
      const pu = (mat+mo+h)*(1+cfg.indirectos/100)*(1+cfg.financiamiento/100)*(1+cfg.utilidad/100);
      bycat[p.cat].imp += pu*p.cantidad;
    });
    const dir=tM+tMO+tH;
    const cI=dir*(1+cfg.indirectos/100);
    const cF=cI*(1+cfg.financiamiento/100);
    const cU=cF*(1+cfg.utilidad/100);
    const iva=cU*(cfg.iva/100);
    return {tM,tMO,tH,dir,cI,cF,cU,iva,total:cU+iva,bycat};
  },[partidas,cfg,ms,mo2]);
  const pieData = Object.entries(tots.bycat).map(([n,v])=>({name:n,value:Math.round(v.imp)}));
  const barData = Object.entries(tots.bycat).map(([n,v])=>({name:n,Materiales:Math.round(v.mat),"M.Obra":Math.round(v.mo)}));
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        {[
          {v:fmt(tots.total),  l:"Total Propuesta"},
          {v:fmt(tots.cU),     l:"Antes de IVA"},
          {v:proy.area?fmt(tots.total/proy.area):"—", l:"Costo / m²"},
          {v:`${((tots.tMO/Math.max(tots.tM+tots.tMO,1))*100).toFixed(0)}%`, l:"Proporción MO"},
        ].map(k=><div key={k.l} style={S.kpi}><span style={S.kpiV}>{k.v}</span><span style={S.kpiL}>{k.l}</span></div>)}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
        <div style={S.card}>
          <div style={S.ct}>📊 Integración Global APU</div>
          {[{lbl:"Materiales (c/desp.)",val:tots.tM,c:"#3b82f6"},{lbl:"Mano de Obra",val:tots.tMO,c:"#10b981"},{lbl:"Herramienta/Equipo",val:tots.tH,c:"#8b5cf6"}].map(r=>(
            <div key={r.lbl} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid #1e2936" }}>
              <span style={{ color:"#9ca3af", fontSize:13 }}>{r.lbl}</span>
              <span style={{ color:r.c, fontFamily:"'JetBrains Mono',monospace", fontSize:13 }}>{fmt(r.val)}</span>
            </div>
          ))}
          <hr style={S.div} />
          {[
            {lbl:"Subtotal Directo", val:tots.dir},
            {lbl:`Indirectos (${cfg.indirectos}%)`, val:tots.cI-tots.dir},
            {lbl:`Financiamiento (${cfg.financiamiento}%)`, val:tots.cF-tots.cI},
            {lbl:`Utilidad (${cfg.utilidad}%)`, val:tots.cU-tots.cF},
          ].map(r=>(
            <div key={r.lbl} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #0d1117" }}>
              <span style={{ color:"#9ca3af", fontSize:13 }}>{r.lbl}</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13 }}>{fmt(r.val)}</span>
            </div>
          ))}
          <hr style={S.div} />
          <div style={{ display:"flex", justifyContent:"space-between", padding:"6px 0" }}>
            <span style={{ color:"#9ca3af", fontSize:13 }}>Subtotal (sin IVA)</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13 }}>{fmt(tots.cU)}</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", padding:"6px 0" }}>
            <span style={{ color:"#9ca3af", fontSize:13 }}>IVA ({cfg.iva}%)</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13 }}>{fmt(tots.iva)}</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", padding:"12px 0 0", borderTop:"2px solid #FFD600", marginTop:8 }}>
            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, color:"#FFD600" }}>TOTAL</span>
            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:24, color:"#FFD600" }}>{fmt(tots.total)}</span>
          </div>
        </div>
        <div style={S.card}>
          <div style={S.ct}>🥧 Distribución por Partida</div>
          <ResponsiveContainer width="100%" height={290}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={105} dataKey="value"
                label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                {pieData.map((e,i)=><Cell key={i} fill={CAT_COLORS[e.name]||"#6b7280"} />)}
              </Pie>
              <Tooltip formatter={v=>fmt(v)} contentStyle={{ background:"#0d1117", border:"1px solid #1e2936", fontFamily:"'JetBrains Mono',monospace", fontSize:12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={S.card}>
        <div style={S.ct}>📈 Materiales vs Mano de Obra por Partida</div>
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={barData} margin={{ top:10, right:20, bottom:20, left:20 }}>
            <XAxis dataKey="name" tick={{ fill:"#6b7280", fontSize:11 }} />
            <YAxis tick={{ fill:"#6b7280", fontSize:10 }} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={v=>fmt(v)} contentStyle={{ background:"#0d1117", border:"1px solid #1e2936", fontFamily:"'JetBrains Mono',monospace", fontSize:12 }} />
            <Legend wrapperStyle={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13 }} />
            <Bar dataKey="Materiales" fill="#3b82f6" radius={[2,2,0,0]} />
            <Bar dataKey="M.Obra" fill="#10b981" radius={[2,2,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={S.card}>
        <div style={S.ct}>🎛️ Análisis de Sensibilidad</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          <div>
            <label style={S.lbl}>Variación Materiales: {ms>0?"+":""}{ms}%</label>
            <input type="range" min={-30} max={30} value={ms} onChange={e=>setMs(+e.target.value)} style={{ width:"100%", accentColor:"#FFD600" }} />
            <div style={{ color:ms>0?"#ef4444":"#10b981", fontFamily:"'JetBrains Mono',monospace", fontSize:12, marginTop:4 }}>Total: {fmt(tots.total)}</div>
          </div>
          <div>
            <label style={S.lbl}>Variación Mano de Obra: {mo2>0?"+":""}{mo2}%</label>
            <input type="range" min={-20} max={35} value={mo2} onChange={e=>setMo2(+e.target.value)} style={{ width:"100%", accentColor:"#10b981" }} />
            <div style={{ color:mo2>0?"#ef4444":"#10b981", fontFamily:"'JetBrains Mono',monospace", fontSize:12, marginTop:4 }}>Factor condición: ×{FACTOR_CONDICION[cfg.condicion]}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MOD 5: PROPUESTA ─────────────────────────────────────────────────────────
function ModPropuesta({ partidas, cfg, proy }) {
  const [notas, setNotas] = useState({
    alcance:"Suministro, instalación, pruebas y puesta en servicio de la instalación eléctrica completa conforme a planos y especificaciones del proyecto.",
    pago:"30% anticipo a la firma · 40% al 60% de avance · 30% a la conclusión y entrega.",
    exclusiones:"Obra civil, permisos CFE/municipio, luminarias decorativas, equipos de proceso.",
    garantia:"12 meses en materiales y mano de obra a partir de la fecha de entrega.",
  });
  const catGrp = useMemo(()=>{
    const g={};
    partidas.forEach(p=>{ if(!g[p.cat]) g[p.cat]=[]; g[p.cat].push(p); });
    return g;
  },[partidas]);
  const tots = useMemo(()=>{
    const sub = partidas.reduce((a,p)=>a+calcAPU(p,cfg).pu*p.cantidad,0);
    return { sub, iva:sub*(cfg.iva/100), total:sub*(1+cfg.iva/100) };
  },[partidas,cfg]);
  return (
    <div>
      <div style={{ ...S.card, border:"2px solid #1e2936" }}>
        <div style={{ display:"flex", justifyContent:"space-between", paddingBottom:20, borderBottom:"2px solid #FFD600", marginBottom:22 }}>
          <div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:30, color:"#FFD600", letterSpacing:2 }}>⚡ COTIZACIÓN ELÉCTRICA</div>
            <div style={{ color:"#6b7280", fontFamily:"'JetBrains Mono',monospace", fontSize:12, marginTop:3 }}>{cfg.norma} · {cfg.tipo} · {cfg.tension}</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", color:"#FFD600" }}>No. {proy.folio}</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:"#6b7280" }}>{proy.fecha}</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:"#6b7280" }}>Vigencia: {proy.vigencia} días</div>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
          <div><div style={S.lbl}>Proyecto</div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:18 }}>{proy.nombre||"—"}</div>
            {proy.area && <div style={{ color:"#6b7280", fontSize:13 }}>Área: {proy.area} m²</div>}</div>
          <div><div style={S.lbl}>Cliente</div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600, fontSize:16 }}>{proy.cliente||"—"}</div></div>
        </div>
        {Object.entries(catGrp).map(([cat,items])=>{
          const sub = items.reduce((a,p)=>a+calcAPU(p,cfg).pu*p.cantidad,0);
          return (
            <div key={cat} style={{ marginBottom:18 }}>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14,
                color:CAT_COLORS[cat]||"#FFD600", letterSpacing:1.5, textTransform:"uppercase",
                marginBottom:8, paddingBottom:5, borderBottom:`1px solid ${CAT_COLORS[cat]||"#FFD600"}44` }}>{cat}</div>
              <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:"'JetBrains Mono',monospace", fontSize:12 }}>
                <thead><tr>{["#","Clave","Descripción","U","Cant.","P.U.","Importe"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {items.map((item,i)=>{
                    const apu=calcAPU(item,cfg);
                    return <tr key={item.id}>
                      <td style={S.td(i)}>{i+1}</td>
                      <td style={S.td(i)}><span style={S.bdg(CAT_COLORS[cat]||"#FFD600")}>{item.clave}</span></td>
                      <td style={{ ...S.td(i), fontFamily:"'Barlow',sans-serif", fontSize:13 }}>{item.descripcion}</td>
                      <td style={{ ...S.td(i), color:"#6b7280" }}>{item.unidad}</td>
                      <td style={S.td(i)}>{fmtN(item.cantidad)}</td>
                      <td style={S.td(i)}>{fmt(apu.pu)}</td>
                      <td style={{ ...S.td(i), color:"#10b981", fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif", fontSize:14 }}>{fmt(apu.pu*item.cantidad)}</td>
                    </tr>;
                  })}
                  <tr><td colSpan={6} style={{ padding:"7px 12px", textAlign:"right", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600, fontSize:12, color:"#9ca3af", background:"#0d1117" }}>Subtotal {cat}:</td>
                    <td style={{ padding:"7px 12px", background:"#0d1117", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, color:CAT_COLORS[cat]||"#FFD600", fontSize:13 }}>{fmt(sub)}</td></tr>
                </tbody>
              </table>
            </div>
          );
        })}
        <div style={{ background:"#0d1117", borderRadius:6, padding:16, marginTop:8 }}>
          {[{lbl:"Subtotal antes de IVA",val:tots.sub},{lbl:`IVA (${cfg.iva}%)`,val:tots.iva}].map(r=>(
            <div key={r.lbl} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #1e2936" }}>
              <span style={{ color:"#9ca3af" }}>{r.lbl}</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmt(r.val)}</span>
            </div>
          ))}
          <div style={{ display:"flex", justifyContent:"space-between", padding:"14px 0 0" }}>
            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, color:"#FFD600" }}>TOTAL DE LA PROPUESTA</span>
            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:26, color:"#FFD600" }}>{fmt(tots.total)}</span>
          </div>
        </div>
        <hr style={{ ...S.div, margin:"22px 0" }} />
        <div style={S.ct}>📋 Notas y Condiciones</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          {[["alcance","Alcance"],["pago","Condiciones de Pago"],["exclusiones","Exclusiones"],["garantia","Garantía"]].map(([k,l])=>(
            <div key={k}><label style={S.lbl}>{l}</label>
              <textarea style={{ ...S.inp, height:75, resize:"vertical", fontFamily:"'Barlow',sans-serif", fontSize:12, lineHeight:1.5 }}
                value={notas[k]} onChange={e=>setNotas(n=>({...n,[k]:e.target.value}))} /></div>
          ))}
        </div>
        <div style={{ marginTop:18, padding:"12px 16px", background:"#0d1117", borderRadius:6,
          border:"1px solid #FFD600", color:"#FFD600", fontFamily:"'JetBrains Mono',monospace", fontSize:11, textAlign:"center" }}>
          ⚡ {cfg.norma} · {cfg.tipo} · Zona {cfg.zona} · Utilidad {cfg.utilidad}% · IVA {cfg.iva}%
        </div>
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
const PARTIDAS_EJEMPLO = [
  { ...BIBLIOTECA_BASE.find(b=>b.clave==="ACO-001"), id:1,  cantidad:1   },
  { ...BIBLIOTECA_BASE.find(b=>b.clave==="ACO-002"), id:2,  cantidad:1   },
  { ...BIBLIOTECA_BASE.find(b=>b.clave==="TAB-002"), id:3,  cantidad:1   },
  { ...BIBLIOTECA_BASE.find(b=>b.clave==="TAB-004"), id:4,  cantidad:12  },
  { ...BIBLIOTECA_BASE.find(b=>b.clave==="CAN-001"), id:5,  cantidad:180 },
  { ...BIBLIOTECA_BASE.find(b=>b.clave==="CAN-002"), id:6,  cantidad:60  },
  { ...BIBLIOTECA_BASE.find(b=>b.clave==="CON-001"), id:7,  cantidad:720 },
  { ...BIBLIOTECA_BASE.find(b=>b.clave==="CON-002"), id:8,  cantidad:120 },
  { ...BIBLIOTECA_BASE.find(b=>b.clave==="SAL-001"), id:9,  cantidad:24  },
  { ...BIBLIOTECA_BASE.find(b=>b.clave==="SAL-002"), id:10, cantidad:4   },
  { ...BIBLIOTECA_BASE.find(b=>b.clave==="SAL-003"), id:11, cantidad:12  },
  { ...BIBLIOTECA_BASE.find(b=>b.clave==="SAL-004"), id:12, cantidad:16  },
  { ...BIBLIOTECA_BASE.find(b=>b.clave==="ILU-001"), id:13, cantidad:8   },
  { ...BIBLIOTECA_BASE.find(b=>b.clave==="TIE-001"), id:14, cantidad:2   },
];

export default function App() {
  const [tab, setTab]         = useState(0);
  const [biblioteca, setLib]  = useState(BIBLIOTECA_BASE);
  const [partidas, setPart]   = useState(PARTIDAS_EJEMPLO);
  const [proy, setProy]       = useState({
    nombre:"Instalación Eléctrica Residencial 120 m²",
    cliente:"Cliente Ejemplo S.A. de C.V.",
    folio:`COT-${new Date().getFullYear()}-001`,
    fecha:new Date().toISOString().split("T")[0],
    vigencia:30, area:120, moneda:"MXN",
  });
  const [cfg, setCfg] = useState({
    zona:"CDMX", tipo:"Residencial", tension:"127/220V", condicion:"Normal",
    norma:"NOM-001-SEDE", indirectos:15, financiamiento:3, utilidad:12, iva:16, herramienta:4, tipoCambio:17.5,
  });

  const totalRapido = useMemo(()=>{
    const s = partidas.reduce((a,p)=>{
      const bibItem = biblioteca.find(b=>b.clave===p.clave)||p;
      return a + calcAPU({ ...bibItem, ...p },cfg).pu*p.cantidad;
    },0);
    return s*(1+cfg.iva/100);
  },[partidas,cfg,biblioteca]);

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({proy,cfg,partidas},null,2)],{type:"application/json"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob);
    a.download=`cot-${proy.folio}.json`; a.click();
  };

  const TABS = [
    {l:"⚙️ Proyecto",k:0},{l:"📚 Biblioteca APU",k:1},
    {l:"📋 Partidas",k:2},{l:"📊 Resumen",k:3},{l:"📄 Propuesta",k:4},
  ];

  return (
    <div style={S.app}>
      <div style={S.header}>
        <div style={S.logo}>
          <span style={{ fontSize:28 }}>⚡</span>
          <div>
            <div>ELECTROCOT <span style={{ color:"#e2e8f0", fontWeight:300 }}>PRO</span></div>
            <div style={{ fontSize:11, color:"#4b5563", fontWeight:300, letterSpacing:3 }}>COTIZADOR · APU DETALLADO POR INSUMO</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"#6b7280" }}>TOTAL PROPUESTA</div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:22, color:"#FFD600" }}>{fmt(totalRapido)}</div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button style={S.btn("ghost")} onClick={exportJSON}>💾 JSON</button>
            <button style={{ ...S.btn("primary"), fontSize:12 }} onClick={()=>window.print()}>🖨️ Imprimir</button>
          </div>
        </div>
      </div>

      <div style={S.tabs}>
        {TABS.map(t=><button key={t.k} style={S.tab(tab===t.k)} onClick={()=>setTab(t.k)}>{t.l}</button>)}
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", padding:"0 8px" }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"#4b5563" }}>
            {partidas.length} partidas · {biblioteca.length} en lib · {proy.folio}
          </span>
        </div>
      </div>

      <div style={S.wrap}>
        {tab===0 && <ModProyecto proy={proy} setProy={setProy} cfg={cfg} setCfg={setCfg} />}
        {tab===1 && <ModBiblioteca cfg={cfg} biblioteca={biblioteca} setBiblioteca={setLib} />}
        {tab===2 && <ModPartidas partidas={partidas} setPartidas={setPart} cfg={cfg} biblioteca={biblioteca} />}
        {tab===3 && <ModResumen partidas={partidas} cfg={cfg} proy={proy} />}
        {tab===4 && <ModPropuesta partidas={partidas} cfg={cfg} proy={proy} />}
      </div>

      <div style={{ textAlign:"center", padding:"18px", borderTop:"1px solid #1e2936",
        fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"#374151" }}>
        ELECTROCOT PRO · APU Detallado por Insumo · {cfg.norma} · {cfg.tipo}
      </div>
    </div>
  );
}
