import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3001;

app.use(express.json({ limit: "10mb" }));

// In-Memory Database for Machining, Inventory, and Quotes
let inventory = [
  {
    id: "MAT-001",
    client: "Acme Aeroespacial Ltda",
    materialType: "Alumínio 6061-T6",
    format: "Tarugo Redondo",
    dimensions: "Ø80mm x 500mm",
    quantityReceived: 12,
    quantityConsumed: 4,
    certificateNumber: "AL-99824-CERT-A",
    location: "Raque A-12, Prateleira 3",
    dateReceived: "2026-06-15",
    notes: "Material de alta precisão com certificado de composição química entregue física e digitalmente.",
  },
  {
    id: "MAT-002",
    client: "MedTech Equipamentos Médicos",
    materialType: "Aço Inox 316L",
    format: "Chapa Retangular",
    dimensions: "20mm x 150mm x 1000mm",
    quantityReceived: 5,
    quantityConsumed: 2,
    certificateNumber: "SS-316L-7741",
    location: "Raque B-04, Prateleira 1",
    dateReceived: "2026-06-20",
    notes: "Material biocompatível para componentes de endoscópio.",
  },
  {
    id: "MAT-003",
    client: "Inova Indústria de Automação",
    materialType: "Titânio Grau 5 (Ti-6Al-4V)",
    format: "Tarugo Hexagonal",
    dimensions: "Ø32mm x 300mm",
    quantityReceived: 8,
    quantityConsumed: 1,
    certificateNumber: "TI-G5-5539-X",
    location: "Armário de Segurança S-2",
    dateReceived: "2026-06-28",
    notes: "Material nobre, alto valor agregado. Controle rígido de sobra de retalhos.",
  },
  {
    id: "MAT-004",
    client: "MetaVeículos Competições",
    materialType: "Aço SAE 1045",
    format: "Bloco Retangular",
    dimensions: "100mm x 100mm x 250mm",
    quantityReceived: 15,
    quantityConsumed: 8,
    certificateNumber: "SAE-1045-2026B",
    location: "Raque C-01, Piso",
    dateReceived: "2026-07-01",
    notes: "Matéria prima pesada destinada a eixos de transmissão sob medida.",
  }
];

let productionOrders = [
  {
    id: "OP-2026-001",
    client: "Acme Aeroespacial Ltda",
    partName: "Suporte de Flap de Turbina - Rev B",
    materialId: "MAT-001",
    materialType: "Alumínio 6061-T6",
    materialCertificate: "AL-99824-CERT-A",
    quantity: 4,
    stage: "Usinagem CNC", // stages: "Revisão de Projeto", "Preparação & Setup", "Usinagem CNC", "Controle de Qualidade", "Acabamento & Limpeza", "Expedição & NF-e"
    tolerance: "± 0.010 mm",
    roughness: "Ra 0.8 µm",
    operator: "Luiz Henrique (Operador CNC Sênior)",
    nxProgrammer: "Ricardo Silva",
    nxFile: "NX_ACME_FLAP_REV_B.prt",
    nxSynced: true,
    nxSpecs: {
      toolpathName: "FINISHING_POCKET_MAIN",
      estimatedMachiningTime: 42, // minutes per piece
      spindleSpeed: 12000, // RPM
      feedRate: 1800, // mm/min
      activeTool: "Fresadora de Metal Duro Ø12mm - 4 Navalhas"
    },
    dueDate: "2026-07-10",
    startedAt: "2026-07-02",
    completedAt: null,
    history: [
      { stage: "Revisão de Projeto", completedAt: "2026-07-02 09:00", note: "Projeto NX aprovado por Ricardo Silva. Geometria importada com sucesso." },
      { stage: "Preparação & Setup", completedAt: "2026-07-02 14:30", note: "Matéria prima de certificado AL-99824-CERT-A separada. Setup de ferramentas concluído." },
      { stage: "Usinagem CNC", completedAt: null, note: "Páginas de usinagem ativas na máquina CNC ROMI D800." }
    ],
    nfeStatus: "Pendente",
    cncMachineId: "CNC-ROMI-D800",
    elapsedTime: 180, // simulated minutes in current stage
  },
  {
    id: "OP-2026-002",
    client: "MedTech Equipamentos Médicos",
    partName: "Cilindro Guia de Câmara Óptica",
    materialId: "MAT-002",
    materialType: "Aço Inox 316L",
    materialCertificate: "SS-316L-7741",
    quantity: 2,
    stage: "Controle de Qualidade",
    tolerance: "± 0.005 mm",
    roughness: "Ra 0.4 µm",
    operator: "Ana Beatriz (Metrologista)",
    nxProgrammer: "Ricardo Silva",
    nxFile: "NX_MED_CYLINDER_V3.prt",
    nxSynced: true,
    nxSpecs: {
      toolpathName: "EXT_TURNING_PRECISION",
      estimatedMachiningTime: 28,
      spindleSpeed: 3200,
      feedRate: 150,
      activeTool: "Pastilha Diamantada DNMG 150404"
    },
    dueDate: "2026-07-08",
    startedAt: "2026-07-03",
    completedAt: null,
    history: [
      { stage: "Revisão de Projeto", completedAt: "2026-07-03 10:00", note: "Tolerâncias críticas de ± 0.005mm confirmadas." },
      { stage: "Preparação & Setup", completedAt: "2026-07-03 11:30", note: "Fixação em pinça mecânica de alta precisão programada." },
      { stage: "Usinagem CNC", completedAt: "2026-07-03 16:45", note: "Peças usinadas com sucesso no Centro de Usinagem CNC HAAS VF-2." },
      { stage: "Controle de Qualidade", completedAt: null, note: "Em medição na máquina tridimensional de coordenadas (CMM)." }
    ],
    nfeStatus: "Pendente",
    cncMachineId: "CNC-HAAS-VF2",
    elapsedTime: 45,
  },
  {
    id: "OP-2026-003",
    client: "Inova Indústria de Automação",
    partName: "Pino de Trava de Eixo Planetário",
    materialId: "MAT-003",
    materialType: "Titânio Grau 5 (Ti-6Al-4V)",
    materialCertificate: "TI-G5-5539-X",
    quantity: 1,
    stage: "Revisão de Projeto",
    tolerance: "± 0.020 mm",
    roughness: "Ra 1.6 µm",
    operator: "Aguardando Alocação",
    nxProgrammer: "Maurício Neves",
    nxFile: "NX_INO_PIN_TI.prt",
    nxSynced: true,
    nxSpecs: {
      toolpathName: "HELI_MILL_THREAD",
      estimatedMachiningTime: 18,
      spindleSpeed: 4500,
      feedRate: 600,
      activeTool: "Fresa de rosca inteiriça de metal duro"
    },
    dueDate: "2026-07-15",
    startedAt: null,
    completedAt: null,
    history: [
      { stage: "Revisão de Projeto", completedAt: null, note: "Aguardando importação final da simulação de colisão do NX Siemens." }
    ],
    nfeStatus: "Pendente",
    cncMachineId: "CNC-ROMI-D800",
    elapsedTime: 0,
  }
];

let simulations = {
  "CNC-ROMI-D800": {
    machineId: "CNC-ROMI-D800",
    machineName: "Romi D800 (Centro de Usinagem 3 Eixos)",
    status: "Roda", // "Roda" (Running), "Setup", "Parada" (Idle), "Erro"
    spindleRPM: 8450,
    feedRate: 1520,
    coordinates: { x: 124.542, y: -45.122, z: -12.405 },
    activeTool: "Fresa Ø12mm Metal Duro",
    activeGcode: "G01 X124.542 Y-45.122 Z-12.405 F1520",
    coolant: "Ligado",
    spindleLoad: 68, // %
    temperature: 42.5, // °C
    activeOP: "OP-2026-001",
    completedPercent: 62
  },
  "CNC-HAAS-VF2": {
    machineId: "CNC-HAAS-VF2",
    machineName: "Haas VF-2 (Centro de Usinagem 3 Eixos)",
    status: "Setup",
    spindleRPM: 0,
    feedRate: 0,
    coordinates: { x: 0.0, y: 0.0, z: 0.0 },
    activeTool: "Fresa de Facear Ø50mm",
    activeGcode: "M05 (Parada de Spindle)",
    coolant: "Desligado",
    spindleLoad: 0,
    temperature: 24.8,
    activeOP: "OP-2026-002",
    completedPercent: 100
  }
};

let invoiceLogs: any[] = [];

// Gemini Client Lazy Initializer
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return null;
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// REST APIs
// 1. Inventory Management
app.get("/api/inventory", (req, res) => {
  res.json(inventory);
});

app.post("/api/inventory", (req, res) => {
  const { client, materialType, format, dimensions, quantityReceived, certificateNumber, location, notes } = req.body;
  if (!client || !materialType || !dimensions || !quantityReceived || !certificateNumber) {
    return res.status(400).json({ error: "Faltam campos obrigatórios." });
  }

  const newItem = {
    id: `MAT-${String(inventory.length + 1).padStart(3, "0")}`,
    client,
    materialType,
    format: format || "Tarugo",
    dimensions,
    quantityReceived: Number(quantityReceived),
    quantityConsumed: 0,
    certificateNumber,
    location: location || "Almoxarifado Geral",
    dateReceived: new Date().toISOString().split("T")[0],
    notes: notes || ""
  };

  inventory.push(newItem);
  res.status(201).json(newItem);
});

// 2. Production Orders Management
app.get("/api/production-orders", (req, res) => {
  res.json(productionOrders);
});

app.post("/api/production-orders", (req, res) => {
  const { client, partName, materialId, quantity, tolerance, roughness, operator, dueDate, nxSpecs } = req.body;
  
  if (!client || !partName || !materialId || !quantity || !dueDate) {
    return res.status(400).json({ error: "Faltam campos obrigatórios." });
  }

  // Find material
  const mat = inventory.find(m => m.id === materialId);
  if (!mat) {
    return res.status(400).json({ error: "Matéria prima do cliente não encontrada no estoque." });
  }

  // Update consumed quantity (simulation)
  mat.quantityConsumed += 1;

  const newOP = {
    id: `OP-2026-${String(productionOrders.length + 1).padStart(3, "0")}`,
    client,
    partName,
    materialId,
    materialType: mat.materialType,
    materialCertificate: mat.certificateNumber,
    quantity: Number(quantity),
    stage: "Revisão de Projeto",
    tolerance: tolerance || "± 0.05 mm",
    roughness: roughness || "Ra 1.6 µm",
    operator: operator || "A definir",
    nxProgrammer: "Ricardo Silva",
    nxFile: nxSpecs?.nxFile || "NX_GENERIC_PART.prt",
    nxSynced: !!nxSpecs,
    nxSpecs: nxSpecs || {
      toolpathName: "ROUGH_FACE",
      estimatedMachiningTime: 30,
      spindleSpeed: 6000,
      feedRate: 1200,
      activeTool: "Fresa Ø10mm"
    },
    dueDate,
    startedAt: new Date().toISOString().split("T")[0],
    completedAt: null,
    history: [
      { stage: "Revisão de Projeto", completedAt: null, note: "Ordem iniciada a partir do recebimento de material do cliente." }
    ],
    nfeStatus: "Pendente",
    cncMachineId: "CNC-HAAS-VF2",
    elapsedTime: 0
  };

  productionOrders.push(newOP);
  res.status(201).json(newOP);
});

// Update OP stage or properties
app.put("/api/production-orders/:id", (req, res) => {
  const { id } = req.params;
  const { stage, operator, cncMachineId, notes, nfeStatus } = req.body;

  const op = productionOrders.find(o => o.id === id);
  if (!op) {
    return res.status(404).json({ error: "Ordem de Produção não encontrada." });
  }

  if (stage && stage !== op.stage) {
    const timestamp = new Date().toISOString().replace("T", " ").substring(0, 16);
    op.stage = stage;
    op.history.push({
      stage,
      completedAt: null,
      note: notes || `Alterado para a etapa ${stage}.`
    });

    // Complete the previous history entry
    const prev = op.history[op.history.length - 2];
    if (prev) {
      prev.completedAt = timestamp;
    }

    if (stage === "Expedição & NF-e") {
      op.completedAt = new Date().toISOString().split("T")[0];
    }
  }

  if (operator) op.operator = operator;
  if (cncMachineId) {
    op.cncMachineId = cncMachineId;
    // Map machine to OP
    Object.keys(simulations).forEach(key => {
      if (simulations[key].activeOP === op.id) {
        simulations[key].activeOP = null;
        simulations[key].status = "Parada";
      }
    });
    if (simulations[cncMachineId]) {
      simulations[cncMachineId].activeOP = op.id;
      simulations[cncMachineId].status = "Roda";
    }
  }

  if (nfeStatus) {
    op.nfeStatus = nfeStatus;
  }

  res.json(op);
});

// 3. Telemetry Simulation
app.get("/api/cnc-telemetry", (req, res) => {
  // Update simulations randomly to show active fluctuations!
  Object.keys(simulations).forEach(key => {
    const machine = simulations[key];
    if (machine.status === "Roda") {
      // Fluctuating coordinate, speed and loads
      machine.spindleRPM = Math.floor(machine.spindleRPM * (0.95 + Math.random() * 0.1));
      if (machine.spindleRPM > 12000) machine.spindleRPM = 11000;
      if (machine.spindleRPM < 2000) machine.spindleRPM = 5000;
      
      machine.feedRate = Math.floor(machine.feedRate * (0.96 + Math.random() * 0.08));
      
      machine.coordinates.x = Number((machine.coordinates.x + (Math.random() - 0.5) * 2).toFixed(3));
      machine.coordinates.y = Number((machine.coordinates.y + (Math.random() - 0.5) * 2).toFixed(3));
      machine.coordinates.z = Number((machine.coordinates.z + (Math.random() - 0.5) * 0.4).toFixed(3));
      
      machine.spindleLoad = Math.floor(40 + Math.random() * 40);
      machine.temperature = Number((machine.temperature + (Math.random() - 0.5) * 0.6).toFixed(1));
      if (machine.temperature > 65) machine.temperature = 60;
      if (machine.temperature < 35) machine.temperature = 40;

      machine.completedPercent = Math.min(100, machine.completedPercent + (Math.random() > 0.7 ? 1 : 0));
      if (machine.completedPercent >= 100) {
        // Complete machining stage automatically
        const linkedOP = productionOrders.find(o => o.id === machine.activeOP);
        if (linkedOP && linkedOP.stage === "Usinagem CNC") {
          linkedOP.stage = "Controle de Qualidade";
          linkedOP.history.push({
            stage: "Controle de Qualidade",
            completedAt: null,
            note: "Usinagem de precisão concluída pela máquina CNC automaticamente."
          });
          const prev = linkedOP.history[linkedOP.history.length - 2];
          if (prev) prev.completedAt = new Date().toISOString().replace("T", " ").substring(0, 16);
        }
        machine.status = "Setup";
        machine.spindleRPM = 0;
        machine.feedRate = 0;
        machine.spindleLoad = 0;
        machine.activeOP = null;
      }
    } else if (machine.status === "Setup") {
      if (Math.random() > 0.9) {
        // Find an OP waiting for machining
        const waitingOP = productionOrders.find(o => o.stage === "Usinagem CNC" && o.cncMachineId === machine.machineId && machine.activeOP !== o.id);
        if (waitingOP) {
          machine.activeOP = waitingOP.id;
          machine.status = "Roda";
          machine.completedPercent = 0;
          machine.spindleRPM = waitingOP.nxSpecs?.spindleSpeed || 8000;
          machine.feedRate = waitingOP.nxSpecs?.feedRate || 1500;
          machine.activeTool = waitingOP.nxSpecs?.activeTool || "Ferramenta NX Padrão";
        }
      }
    }
  });

  res.json(simulations);
});

// 4. NX Siemens CAD/CAM Import simulator
app.post("/api/siemens-nx/sync", (req, res) => {
  const { fileName, partName, materialType, estimatedMachiningTime, spindleSpeed, feedRate, toolName, tolerance, roughness } = req.body;
  
  if (!fileName || !partName || !materialType) {
    return res.status(400).json({ error: "Faltam parâmetros de integração Siemens NX." });
  }

  // Find or create customer inventory material
  let mat = inventory.find(m => m.materialType.toLowerCase().includes(materialType.toLowerCase()));
  if (!mat) {
    // create a simulated material from client
    mat = {
      id: `MAT-${String(inventory.length + 1).padStart(3, "0")}`,
      client: "Cliente NX Sync",
      materialType,
      format: "Tarugo Sob-Medida",
      dimensions: "Pre-configurado via NX CAD",
      quantityReceived: 5,
      quantityConsumed: 1,
      certificateNumber: `NX-CERT-${Math.floor(10000 + Math.random() * 90000)}`,
      location: "Almoxarifado (Recebimento NX)",
      dateReceived: new Date().toISOString().split("T")[0],
      notes: "Material importado automaticamente via integração NX CAD/CAM."
    };
    inventory.push(mat);
  } else {
    mat.quantityConsumed += 1;
  }

  const newOP = {
    id: `OP-2026-${String(productionOrders.length + 1).padStart(3, "0")}`,
    client: mat.client,
    partName,
    materialId: mat.id,
    materialType: mat.materialType,
    materialCertificate: mat.certificateNumber,
    quantity: 1,
    stage: "Revisão de Projeto",
    tolerance: tolerance || "± 0.01 mm",
    roughness: roughness || "Ra 0.8 µm",
    operator: "A definir (Fila de Programação)",
    nxProgrammer: "Integração Direta NX-CAM",
    nxFile: fileName,
    nxSynced: true,
    nxSpecs: {
      toolpathName: "NX_IMPORTED_TOOLPATH_1",
      estimatedMachiningTime: Number(estimatedMachiningTime) || 35,
      spindleSpeed: Number(spindleSpeed) || 8500,
      feedRate: Number(feedRate) || 1600,
      activeTool: toolName || "Fresadora Esférica R3 Ø6mm"
    },
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    startedAt: new Date().toISOString().split("T")[0],
    completedAt: null,
    history: [
      { stage: "Revisão de Projeto", completedAt: new Date().toISOString().replace("T", " ").substring(0, 16), note: "Sincronização via NX Siemens bem sucedida. Geometria de corte e tempos de usinagem validados." }
    ],
    nfeStatus: "Pendente",
    cncMachineId: "CNC-ROMI-D800",
    elapsedTime: 0
  };

  productionOrders.push(newOP);
  res.status(201).json({
    success: true,
    message: "Projeto importado do Siemens NX com sucesso! Ordem de produção criada automaticamente.",
    order: newOP
  });
});

// 5. NF-e Financial Integration Simulator
app.post("/api/financial/invoice", (req, res) => {
  const { orderId, value, taxesRate } = req.body;
  if (!orderId) {
    return res.status(400).json({ error: "orderId é obrigatório." });
  }

  const op = productionOrders.find(o => o.id === orderId);
  if (!op) {
    return res.status(404).json({ error: "Ordem de produção não encontrada." });
  }

  const valNum = Number(value) || 2500;
  const rateNum = Number(taxesRate) || 18.5; // default tax rate %
  const taxesValue = Number((valNum * (rateNum / 100)).toFixed(2));

  const invoice = {
    id: `NFE-${Math.floor(100000 + Math.random() * 900000)}`,
    orderId,
    client: op.client,
    partName: op.partName,
    materialCertificate: op.materialCertificate,
    serviceValue: valNum,
    taxesRate: rateNum,
    taxesValue,
    totalValue: valNum + taxesValue,
    emittedAt: new Date().toISOString().replace("T", " ").substring(0, 19),
    status: "Autorizada (SEFAZ)",
    xmlKey: `352607${Math.floor(10000000 + Math.random() * 90000000)}991001000${Math.floor(10000 + Math.random() * 90000)}`
  };

  invoiceLogs.push(invoice);
  op.nfeStatus = "Emitida";
  op.stage = "Expedição & NF-e";
  
  res.json({
    success: true,
    message: "Nota Fiscal de Serviço (NFS-e) emitida com sucesso e enviada ao SEFAZ!",
    invoice
  });
});

app.get("/api/financial/invoices", (req, res) => {
  res.json(invoiceLogs);
});

// 6. Intelligent Robot Quote Generator via Gemini API
app.post("/api/quote-intelligent", async (req, res) => {
  const { partName, materialType, dimensions, tolerance, roughness, features, quantity, urgency, image } = req.body;

  if (!partName || !materialType || !dimensions || !quantity) {
    return res.status(400).json({ error: "Faltam parâmetros básicos para gerar o orçamento." });
  }

  // Generate historical similar quotes list
  const getLocalSimilarQuotes = (hasImage: boolean) => {
    return productionOrders.map(order => {
      let score = 0;
      
      // material matching score
      if (order.materialType.toLowerCase() === materialType.toLowerCase()) {
        score += 45;
      } else if (
        (order.materialType.toLowerCase().includes("alumínio") && materialType.toLowerCase().includes("alumínio")) ||
        (order.materialType.toLowerCase().includes("inox") && materialType.toLowerCase().includes("inox")) ||
        (order.materialType.toLowerCase().includes("titânio") && materialType.toLowerCase().includes("titânio")) ||
        (order.materialType.toLowerCase().includes("aço") && materialType.toLowerCase().includes("aço"))
      ) {
        score += 30;
      }

      // partName keyword matching
      const inputWords = partName.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const orderWords = order.partName.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      let wordMatches = 0;
      inputWords.forEach(w => {
        if (orderWords.includes(w)) wordMatches++;
      });
      if (wordMatches > 0) {
        score += Math.min(40, wordMatches * 15);
      }

      // tolerance similarity
      if (order.tolerance === tolerance) {
        score += 10;
      }
      
      // roughness similarity
      if (order.roughness === roughness) {
        score += 5;
      }

      if (hasImage) {
        score += Math.floor(Math.random() * 8) + 2; // a small dynamic boost for sketch/photo alignment
      }
      
      // Cap at 98%
      score = Math.min(98, score);
      if (score < 15) {
        score = 15 + Math.floor(Math.random() * 15); // baseline similar score
      }

      // match reasons
      let matchReason = "Compartilha parâmetros dimensionais e requisitos de usinagem semelhantes.";
      if (order.materialType.toLowerCase() === materialType.toLowerCase() && wordMatches > 0) {
        matchReason = `Excelente correspondência: mesma liga metálica (${order.materialType}) e características geométricas de "${partName}".`;
      } else if (order.materialType.toLowerCase() === materialType.toLowerCase()) {
        matchReason = `Semelhança metalúrgica: ambas as peças utilizam ${order.materialType}, exigindo taxas de avanço e velocidades de rotação similares.`;
      } else if (wordMatches > 0) {
        matchReason = `Design similar: ambas as peças compartilham a mesma tipologia funcional de "${orderWords[0]}", simplificando a preparação CAM.`;
      } else if (order.tolerance === tolerance) {
        matchReason = `Requisito de acabamento: classe de precisão idêntica (${tolerance}), demandando etapas rigorosas de metrologia 3D.`;
      }

      return {
        id: order.id,
        partName: order.partName,
        client: order.client,
        materialType: order.materialType,
        similarityScore: score,
        matchReason
      };
    })
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, 2);
  };

  const localSimilar = getLocalSimilarQuotes(!!image);

  const ai = getAIClient();
  if (!ai) {
    // Fallback Mock response if API Key is not set or valid
    console.warn("GEMINI_API_KEY is not defined. Using rule-based auto-quotation.");
    
    // Simple mock budget logic
    const setupTimeHrs = 2.5;
    const programmingTimeHrs = 1.5;
    const matString = typeof materialType === 'string' ? materialType.toLowerCase() : "";
    const cuttingTimeHrsPerPiece = matString.includes("titânio") ? 1.0 : matString.includes("inox") ? 0.7 : 0.4;
    const swapTimeHrsPerPiece = 0.01; // ~36 seconds
    const machiningTimeHrsPerPiece = cuttingTimeHrsPerPiece + swapTimeHrsPerPiece;
    
    const baseQcTime = (typeof tolerance === 'string' && tolerance.includes("0.005")) ? 0.5 : 0.2;
    const qcTimePerAdditionalPiece = (typeof tolerance === 'string' && tolerance.includes("0.005")) ? 0.1 : 0.03;
    
    const machiningHourlyRate = 170;
    const laborHourlyRate = 90;
    
    const totalMachiningHours = (machiningTimeHrsPerPiece * Number(quantity));
    const totalQCHours = baseQcTime + (qcTimePerAdditionalPiece * Math.max(0, Number(quantity) - 1));
    
    const machiningCost = totalMachiningHours * machiningHourlyRate;
    const qcCost = totalQCHours * laborHourlyRate;
    const setupCost = (setupTimeHrs + programmingTimeHrs) * laborHourlyRate;
    const materialHandlingCost = 150; // material is client provided, only storage/handling fee
    
    const baseTotal = machiningCost + qcCost + setupCost + materialHandlingCost;
    const profitMargin = baseTotal * 0.40; // 40% margin
    const withMargin = baseTotal + profitMargin;
    const taxes = withMargin * 0.15; // 15% taxes
    const urgencySurcharge = urgency === "Urgente" ? withMargin * 0.3 : 0;
    const subtotal = withMargin + taxes + urgencySurcharge;
    const discount = Number(quantity) > 10 ? subtotal * 0.1 : 0;
    const finalPrice = subtotal - discount;

    const reviewWithImage = image 
      ? `[Análise Visual do Robô]: Desenho técnico / imagem identificada com sucesso! A imagem sugere uma peça com geometria personalizada simétrica e detalhes de usinagem compatíveis com fresamento ou torneamento CNC. Com base no design da imagem e no material (${materialType}), calculamos os canais helicoidais e furos de centralização. Comparamos o arquivo visual com ordens de fabricação anteriores em nossa biblioteca e encontramos correspondências muito próximas, o que nos permitiu otimizar o tempo de setup.`
      : `Análise Automática do Robô de Usinagem:\nPeça sob medida em ${materialType} com dimensões de ${dimensions}. Devido à tolerância exigida de ${tolerance} e acabamento superficial de ${roughness}, a operação demandará ferramentas com pastilhas especiais para evitar desgaste acelerado e garantir rugosidade controlada. Como a matéria-prima é fornecida inteiramente por você (cliente), o custo do material foi zerado, cobrando-se apenas taxas de armazenamento e manuseio rastreável.`;

    const mockProposal = {
      isMock: true,
      partName,
      materialType,
      dimensions,
      leadTimeDays: urgency === "Urgente" ? 4 : 10,
      hourlyRateApplied: machiningHourlyRate,
      estimatedMachiningHours: Number((machiningTimeHrsPerPiece * Number(quantity)).toFixed(1)),
      setupHours: setupTimeHrs,
      costs: {
        machining: Number(machiningCost.toFixed(2)),
        setup: Number(setupCost.toFixed(2)),
        qualityControl: Number(qcCost.toFixed(2)),
        materialHandling: materialHandlingCost,
        profitMargin: Number(profitMargin.toFixed(2)),
        taxes: Number(taxes.toFixed(2)),
        urgencySurcharge: Number(urgencySurcharge.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        totalPrice: Number(finalPrice.toFixed(2))
      },
      robotReview: reviewWithImage,
      recommendedMachine: materialType.toLowerCase().includes("titânio") ? "Haas VF-2 (3 Eixos)" : "Romi D800 (3 Eixos)",
      stagesBreakdown: [
        { stage: "Recebimento & Inspeção do Tarugo", hours: 0.5, desc: "Validação do certificado de corrida e dimensões brutas enviadas pelo cliente." },
        { stage: "Programação CAM (Siemens NX)", hours: 1.5, desc: "Geração de trajetórias de ferramentas livres de colisão." },
        { stage: "Setup de Máquina & CNC Ferramental", hours: setupTimeHrs, desc: "Fixação e zeramento de peça brutas no spindle/mesa." },
        { stage: "Usinagem de Precisão CNC", hours: Number(totalMachiningHours.toFixed(1)), desc: `Frezamento/Torneamento CNC controlado com resfriamento contínuo.` },
        { stage: "Inspeção Tridimensional (Metrologia)", hours: Number(totalQCHours.toFixed(1)), desc: "Validação de tolerâncias críticas com micrômetro digital e braço de medição." }
      ],
      warnings: ["Tolerâncias abaixo de 0.010mm exigem ambiente de metrologia climatizado a 20°C.", "Garantir que os tarugos entregues tenham pelo menos 5mm extras de sobremetal para fixação mecânica."],
      similarQuotes: localSimilar
    };

    return res.json(mockProposal);
  }

  try {
    const existingOrdersStr = JSON.stringify(productionOrders.map(o => ({
      id: o.id,
      partName: o.partName,
      client: o.client,
      materialType: o.materialType,
      tolerance: o.tolerance,
      roughness: o.roughness,
      quantity: o.quantity
    })));

    const prompt = `Você é o Engenheiro Orçamentista Inteligente e Especialista de Processos Industriais CNC de uma empresa de usinagem de alta precisão.
Seu objetivo é gerar uma proposta comercial detalhada, realista e ALTAMENTE COMPETITIVA frente aos concorrentes de mercado. Você deve calcular os tempos de ciclo de usinagem (corte) e setup com máxima eficiência.
MUITO IMPORTANTE (ECONOMIA DE ESCALA):
1. Programação CAM e Setup/Zeramento de Máquina são custos FIXOS e cobrados apenas UMA VEZ, seja para 1 ou 30 peças. O valor de setup não se multiplica pela quantidade.
2. Metrologia/Inspeção: a medição de dimensões simples (tamanhos, diâmetros, roscas com paquímetro) é rápida. O tempo por peça cai drasticamente em lotes maiores.
3. A troca de peças na máquina é muito rápida (ex: menos de 30 segundos para peças pequenas), então o tempo de usinagem por peça em lotes reflete majoritariamente apenas o tempo de corte efetivo.
A matéria-prima é fornecida pelo cliente, então o custo do material bruto deve ser R$ 0. Você cobrará apenas serviços de engenharia, programação CAM, setup de CNC, tempo de usinagem por hora e inspeção metrológica.

${image ? "Analise a imagem/desenho/esboço anexado para identificar o perfil de geometria física da peça, furos, ranhuras, chanfros e complexidade visual." : ""}

Os parâmetros da peça para orçamento são:
- Nome da Peça: "${partName}"
- Material Fornecido pelo Cliente: "${materialType}"
- Dimensões Brutas estimadas: "${dimensions}"
- Tolerância Exigida: "${tolerance}"
- Rugosidade Desejada: "${roughness}"
- Detalhes Complexos / Recursos: "${features || 'Sem detalhes específicos'}"
- Quantidade encomendada: ${quantity} unidades
- Urgência de Entrega: "${urgency || 'Normal'}"

Adicionalmente, você deve analisar a lista de Ordens de Produção existentes e encontrar as 1 ou 2 ordens mais parecidas/semelhantes a esta nova peça (com base no nome, material, geometria identificada na imagem se houver, ou tolerâncias).

Ordens de Produção Existentes (Banco Histórico):
${existingOrdersStr}

Seu output deve ser RIGOROSAMENTE um JSON válido em português contendo os seguintes campos exatamente:
{
  "partName": string,
  "materialType": string,
  "dimensions": string,
  "leadTimeDays": número (estimar dias úteis ideais baseado na complexidade e urgência),
  "hourlyRateApplied": número (R$ cobrado por hora de máquina, OBRIGATÓRIO SER EXATAMENTE 170 independente do material),
  "estimatedMachiningHours": número (tempo total de corte estimado para a quantidade total),
  "setupHours": número (horas para configurar a máquina CNC, tipicamente entre 1 e 4 horas),
  "costs": {
    "machining": número (horas usinagem * taxa hora),
    "setup": número (horas setup * R$ 100/hora),
    "qualityControl": número (horas QC * R$ 80/hora),
    "materialHandling": número (taxa de recebimento, inspeção: R$ 100 a R$ 250),
    "profitMargin": número (margem de lucro industrial padrão de mercado: 30% a 50% da soma dos custos),
    "taxes": número (impostos e tributos, tipicamente 12% a 18% sobre o subtotal),
    "urgencySurcharge": número (se urgente, adicionar entre 20% e 40%),
    "discount": número (se quantidade > 5 dar desconto volumétrico),
    "totalPrice": número (total calculado lógica de mercado: custos + margem + impostos + urgência - desconto)
  },
  "robotReview": string (texto explicativo detalhado de engenheiro, justificando as velocidades de corte, desafios do material fornecido pelo cliente e controle de tolerâncias exigidas. Se houver imagem/esboço, inclua uma descrição clara e identificação de qual geometria você detectou no desenho e como isso afetou o processo sugerido),
  "recommendedMachine": string (ex: "Centro de Usinagem CNC Romi D800" ou "Centro de Usinagem Haas VF-2"),
  "stagesBreakdown": [
    {
      "stage": string (nome da etapa do fluxo de usinagem),
      "hours": número (horas estimadas),
      "desc": string (explicação técnica da etapa)
    }
  ],
  "warnings": string[] (avisos e alertas de tolerância, rugosidade ou sobremetal que o cliente deve atentar ao enviar as peças brutas),
  "similarQuotes": [
    {
      "id": string,
      "partName": string,
      "client": string,
      "materialType": string,
      "similarityScore": número (porcentagem de similaridade entre 1 e 100),
      "matchReason": string (por que essa ordem do histórico é semelhante ao item atual, ex: liga semelhante, furos próximos, etc.)
    }
  ]
}`;

    let contents: any;
    if (image) {
      // Extract clean base64 data and mime type
      let cleanBase64 = image;
      let mimeType = "image/png";
      const matches = image.match(/^data:([^;]+);base64,(.*)$/);
      if (matches && matches.length === 3) {
        mimeType = matches[1];
        cleanBase64 = matches[2];
      }

      const imagePart = {
        inlineData: {
          mimeType: mimeType,
          data: cleanBase64
        }
      };

      contents = {
        parts: [
          imagePart,
          { text: prompt }
        ]
      };
    } else {
      contents = prompt;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        responseMimeType: "application/json",
        systemInstruction: "Você é o Robô Orçamentista CNC Sênior. Forneça análises de usinagem e propostas de preços precisas em formato JSON em português. Se houver imagem de desenho, identifique as geometrias ranhuradas/cilíndricas e furos. Siga estritamente as regras de preço e calcule o total de forma perfeitamente lógica.",
      }
    });

    const text = response.text || "{}";
    const cleanedText = text.trim();
    const resultJson = JSON.parse(cleanedText);

    // If Gemini didn't return similar quotes or is incomplete, assign the local ones
    if (!resultJson.similarQuotes || resultJson.similarQuotes.length === 0) {
      resultJson.similarQuotes = localSimilar;
    }

    res.json(resultJson);

  } catch (err: any) {
    console.error("Gemini Quotation Error: ", err);
    // fallback to local on API failure
    res.status(500).json({ error: "Erro ao gerar orçamento inteligente por IA: " + err.message });
  }
});


// Serve static Vite bundle in production and setup Vite middleware in dev
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    app.get("*", async (req, res, next) => {
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.join(process.cwd(), "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server: ", err);
});
