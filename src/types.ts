export interface MaterialItem {
  id: string;
  client: string;
  materialType: string;
  format: string;
  dimensions: string;
  quantityReceived: number;
  quantityConsumed: number;
  certificateNumber: string;
  location: string;
  dateReceived: string;
  notes?: string;
}

export interface NxSpecs {
  toolpathName: string;
  estimatedMachiningTime: number; // minutes
  spindleSpeed: number; // RPM
  feedRate: number; // mm/min
  activeTool: string;
}

export interface OrderHistoryItem {
  stage: string;
  completedAt: string | null;
  note: string;
}

export interface ProductionOrder {
  id: string;
  client: string;
  partName: string;
  materialId: string;
  materialType: string;
  materialCertificate: string;
  quantity: number;
  stage: "Revisão de Projeto" | "Preparação & Setup" | "Usinagem CNC" | "Controle de Qualidade" | "Acabamento & Limpeza" | "Expedição & NF-e";
  tolerance: string;
  roughness: string;
  operator: string;
  nxProgrammer: string;
  nxFile: string;
  nxSynced: boolean;
  nxSpecs: NxSpecs;
  dueDate: string;
  startedAt: string | null;
  completedAt: string | null;
  history: OrderHistoryItem[];
  nfeStatus: "Pendente" | "Emitida";
  cncMachineId: string;
  elapsedTime: number;
}

export interface CncMachine {
  machineId: string;
  machineName: string;
  status: "Roda" | "Setup" | "Parada" | "Erro";
  spindleRPM: number;
  feedRate: number;
  coordinates: { x: number; y: number; z: number };
  activeTool: string;
  activeGcode: string;
  coolant: string;
  spindleLoad: number;
  temperature: number;
  activeOP: string | null;
  completedPercent: number;
}

export interface Invoice {
  id: string;
  orderId: string;
  client: string;
  partName: string;
  materialCertificate: string;
  serviceValue: number;
  taxesRate: number;
  taxesValue: number;
  totalValue: number;
  emittedAt: string;
  status: string;
  xmlKey: string;
}

export interface AiQuoteResponse {
  partName: string;
  materialType: string;
  dimensions: string;
  leadTimeDays: number;
  hourlyRateApplied: number;
  estimatedMachiningHours: number;
  setupHours: number;
  costs: {
    machining: number;
    setup: number;
    qualityControl: number;
    materialHandling: number;
    urgencySurcharge: number;
    discount: number;
    totalPrice: number;
  };
  robotReview: string;
  recommendedMachine: string;
  stagesBreakdown: {
    stage: string;
    hours: number;
    desc: string;
  }[];
  warnings: string[];
  isMock?: boolean;
  similarQuotes?: {
    id: string;
    partName: string;
    client: string;
    materialType: string;
    similarityScore: number;
    matchReason: string;
  }[];
}
