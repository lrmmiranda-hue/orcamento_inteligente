import React, { useState, useEffect } from "react";
import {
  Cpu,
  Wrench,
  Layers,
  Activity,
  FileText,
  Plus,
  Search,
  Sparkles,
  Coins,
  PackageOpen,
  CheckCircle,
  AlertTriangle,
  Clock,
  User as UserIcon,
  MapPin,
  RefreshCw,
  FileCode,
  ArrowRight,
  TrendingUp,
  FileCheck,
  ShieldCheck,
  Info,
  Image,
  Palette,
  Trash2,
  Undo,
  Upload,
  CheckCircle2,
  ChevronRight,
  UploadCloud,
  Bot,
  MessageSquare,
  Printer,
  Cloud,
  Pencil
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MaterialItem, ProductionOrder, CncMachine, Invoice, AiQuoteResponse, User } from "./types";
import SiemensNxSync from "./components/SiemensNxSync";
import Sketchpad from "./components/Sketchpad";
import logoImg from "./assets/logo3.jpg";
import logologinImg from "./assets/logologin.png";
import { collection, onSnapshot, addDoc, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "./lib/firebase";

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "inventory" | "orders" | "ai-quote" | "siemens-nx" | "finance" | "settings">("dashboard");
  const [currentTheme, setCurrentTheme] = useState<"slate-dark" | "steel-light" | "amber-crt" | "operator-blue">("steel-light");
  
  // Real-time states
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [machines, setMachines] = useState<{ [key: string]: CncMachine }>({});
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings & Users state
  const [users, setUsers] = useState<User[]>([]);
  const [dbMachines, setDbMachines] = useState<CncMachine[]>([]);
  
  // Machine Management Modal State
  const [showMachineForm, setShowMachineForm] = useState(false);
  const [isSubmittingMachine, setIsSubmittingMachine] = useState(false);
  const [newMachineData, setNewMachineData] = useState({
    machineId: "",
    machineName: "",
  });
  
  // Login State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    const qUsers = collection(db, "users");
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
      const loadedUsers: User[] = [];
      snapshot.forEach((docSnap) => {
        loadedUsers.push({ id: docSnap.id, ...docSnap.data() } as User);
      });
      setUsers(loadedUsers);
    });
    
    const qMachines = collection(db, "machines");
    const unsubscribeMachines = onSnapshot(qMachines, (snapshot) => {
      const loadedMachines: CncMachine[] = [];
      snapshot.forEach((docSnap) => {
        loadedMachines.push({ id: docSnap.id, ...docSnap.data() } as any);
      });
      setDbMachines(loadedMachines);
    });
    
    return () => {
      unsubscribeUsers();
      unsubscribeMachines();
    };
  }, []);
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [inventorySearch, setInventorySearch] = useState("");

  // User Management Modal State
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [cloudConnected, setCloudConnected] = useState(false);
  const [cloudCreds, setCloudCreds] = useState({ url: "", user: "", pass: "" });
  const [newUser, setNewUser] = useState<Omit<User, "id">>({
    name: "",
    email: "",
    role: "Operador CNC",
    permissions: ["dashboard"]
  });

  // Material Register Form State
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    client: "",
    materialType: "",
    format: "Tarugo Redondo",
    dimensions: "",
    quantityReceived: 1,
    certificateNumber: "",
    location: "Raque A-1",
    notes: ""
  });

  // OP Creation Form State
  const [showOpForm, setShowOpForm] = useState(false);
  const [newOp, setNewOp] = useState({
    client: "",
    partName: "",
    materialId: "",
    quantity: 1,
    tolerance: "± 0.010 mm",
    roughness: "Ra 0.8 µm",
    operator: "",
    dueDate: "",
    cncMachineId: "CNC-ROMI-D800"
  });

  // Selected Order for stage progression modal
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<ProductionOrder | null>(null);
  const [stageProgressNotes, setStageProgressNotes] = useState("");

  // AI Quote State
  const [quoteMode, setQuoteMode] = useState<"select" | "manual" | "ai">("select");
  const [aiQuoteParams, setAiQuoteParams] = useState({
    partName: "Flange do Distribuidor de Alta Pressão",
    materialType: "Aço Inox 316L",
    dimensionLength: "150",
    dimensionWidth: "80",
    tolerance: "± 0.005 mm",
    roughness: "Ra 0.4 µm",
    features: "Furação concêntrica de 8 canais, rasgo de chaveta interno e alívio de peso helicoidal.",
    quantity: 5,
    urgency: "Normal"
  });
  const [isGeneratingQuote, setIsGeneratingQuote] = useState(false);
  const [aiQuoteResult, setAiQuoteResult] = useState<AiQuoteResponse | null>(null);
  const [imageMode, setImageMode] = useState<"none" | "sketch" | "upload">("none");
  const [sketchImage, setSketchImage] = useState<string | null>(null);
  const [uploadImage, setUploadImage] = useState<string | null>(null);

  // Financial Invoice creation modal/trigger state
  const [showInvoiceModal, setShowInvoiceModal] = useState<ProductionOrder | null>(null);
  const [invoiceValueInput, setInvoiceValueInput] = useState("2800");
  const [invoiceTaxesRate, setInvoiceTaxesRate] = useState("18.5");

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [matRes, opRes, machRes, invRes] = await Promise.all([
        fetch("/api/inventory"),
        fetch("/api/production-orders"),
        fetch("/api/cnc-telemetry"),
        fetch("/api/financial/invoices")
      ]);
      
      if (matRes.ok) setMaterials(await matRes.json());
      if (opRes.ok) setProductionOrders(await opRes.json());
      if (machRes.ok) setMachines(await machRes.json());
      if (invRes.ok) setInvoices(await invRes.json());
    } catch (err) {
      console.error("Erro ao carregar dados do servidor:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Poll telemetry and live updates every 2.5 seconds
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const machRes = await fetch("/api/cnc-telemetry");
        if (machRes.ok) {
          setMachines(await machRes.json());
        }
        // Also refresh OPs silently in background to capture automatic transitions
        const opRes = await fetch("/api/production-orders");
        if (opRes.ok) {
          setProductionOrders(await opRes.json());
        }
      } catch (err) {
        console.error("Erro de sincronização de telemetria:", err);
      }
    }, 2500);

    return () => clearInterval(timer);
  }, []);

  // Handlers
  const handleRegisterMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMaterial)
      });
      if (response.ok) {
        const added = await response.json();
        setMaterials([...materials, added]);
        setShowMaterialForm(false);
        setNewMaterial({
          client: "",
          materialType: "",
          format: "Tarugo Redondo",
          dimensions: "",
          quantityReceived: 1,
          certificateNumber: "",
          location: "Raque A-1",
          notes: ""
        });
      } else {
        const err = await response.json();
        alert(err.error || "Erro ao registrar matéria-prima.");
      }
    } catch (err) {
      console.error(err);
      alert("Falha de comunicação.");
    }
  };

  const handleCreateOP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const targetMat = materials.find(m => m.id === newOp.materialId);
      if (!targetMat) {
        alert("Selecione um lote de matéria-prima válido.");
        return;
      }

      const response = await fetch("/api/production-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: targetMat.client,
          partName: newOp.partName,
          materialId: newOp.materialId,
          quantity: newOp.quantity,
          tolerance: newOp.tolerance,
          roughness: newOp.roughness,
          operator: newOp.operator || "Fila de Processamento",
          dueDate: newOp.dueDate,
          nxSpecs: {
            toolpathName: "SETUP_FACE_CONCENTRIC",
            estimatedMachiningTime: 35,
            spindleSpeed: 7500,
            feedRate: 1400,
            activeTool: "Fresa Modular de Facear Ø50mm"
          }
        })
      });

      if (response.ok) {
        const created = await response.json();
        setProductionOrders([...productionOrders, created]);
        setShowOpForm(false);
        // Deduct quantity local state immediately
        setMaterials(materials.map(m => m.id === newOp.materialId ? { ...m, quantityConsumed: m.quantityConsumed + 1 } : m));
        setNewOp({
          client: "",
          partName: "",
          materialId: "",
          quantity: 1,
          tolerance: "± 0.010 mm",
          roughness: "Ra 0.8 µm",
          operator: "",
          dueDate: "",
          cncMachineId: "CNC-ROMI-D800"
        });
      } else {
        const err = await response.json();
        alert(err.error || "Erro ao gerar ordem de produção.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStage = async (id: string, nextStage: string) => {
    try {
      const response = await fetch(`/api/production-orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: nextStage,
          notes: stageProgressNotes || undefined
        })
      });

      if (response.ok) {
        const updated = await response.json();
        setProductionOrders(productionOrders.map(o => o.id === id ? updated : o));
        setSelectedOrderDetails(null);
        setStageProgressNotes("");
      } else {
        alert("Erro ao progredir etapa.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingQuote(true);
    setAiQuoteResult(null);

    const activeImage = imageMode === "sketch" ? sketchImage : (imageMode === "upload" ? uploadImage : null);

    try {
      const response = await fetch("/api/quote-intelligent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...aiQuoteParams,
          dimensions: `${aiQuoteParams.dimensionLength}mm x ${aiQuoteParams.dimensionWidth}mm`,
          image: activeImage
        })
      });
      if (response.ok) {
        const data = await response.json();
        
        // Sanitize data to prevent React object-as-child crashes (White Screen)
        const safeString = (val: any) => typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val || '');
        const safeNum = (val: any) => Number(val) || 0;
        
        data.partName = safeString(data.partName);
        data.materialType = safeString(data.materialType);
        data.dimensions = safeString(data.dimensions);
        data.robotReview = safeString(data.robotReview);
        data.recommendedMachine = safeString(data.recommendedMachine);
        data.leadTimeDays = safeNum(data.leadTimeDays);
        
        if (data.costs) {
          data.costs.machining = safeNum(data.costs.machining);
          data.costs.setup = safeNum(data.costs.setup);
          data.costs.qualityControl = safeNum(data.costs.qualityControl);
          data.costs.materialHandling = safeNum(data.costs.materialHandling);
          data.costs.profitMargin = safeNum(data.costs.profitMargin);
          data.costs.taxes = safeNum(data.costs.taxes);
          data.costs.urgencySurcharge = safeNum(data.costs.urgencySurcharge);
          data.costs.discount = safeNum(data.costs.discount);
          data.costs.totalPrice = safeNum(data.costs.totalPrice);
        }

        if (Array.isArray(data.stagesBreakdown)) {
          data.stagesBreakdown = data.stagesBreakdown.map((st: any) => ({
            stage: safeString(st?.stage),
            desc: safeString(st?.desc),
            hours: safeNum(st?.hours)
          }));
        }

        if (Array.isArray(data.warnings)) {
          data.warnings = data.warnings.map((warn: any) => safeString(warn));
        }

        if (Array.isArray(data.similarQuotes)) {
          data.similarQuotes = data.similarQuotes.map((sq: any) => ({
            id: safeString(sq?.id),
            client: safeString(sq?.client),
            materialType: safeString(sq?.materialType),
            partName: safeString(sq?.partName),
            matchReason: safeString(sq?.matchReason),
            similarityScore: safeNum(sq?.similarityScore)
          }));
        }

        setAiQuoteResult(data);
      } else {
        alert("Erro na geração do orçamento por IA.");
      }
    } catch (err) {
      console.error(err);
      alert("Falha ao comunicar com o Robô Orçamentista.");
    } finally {
      setIsGeneratingQuote(false);
    }
  };

  const handleEmitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showInvoiceModal) return;

    try {
      const response = await fetch("/api/financial/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: showInvoiceModal.id,
          value: Number(invoiceValueInput),
          taxesRate: Number(invoiceTaxesRate)
        })
      });

      if (response.ok) {
        const data = await response.json();
        setInvoices([...invoices, data.invoice]);
        // Update local OP status to "Emitida"
        setProductionOrders(productionOrders.map(o => o.id === showInvoiceModal.id ? { ...o, nfeStatus: "Emitida", stage: "Expedição & NF-e" } : o));
        setShowInvoiceModal(null);
      } else {
        alert("Erro ao emitir NF-e");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper definitions for rendering stages
  const stagesList = [
    "Revisão de Projeto",
    "Preparação & Setup",
    "Usinagem CNC",
    "Controle de Qualidade",
    "Acabamento & Limpeza",
    "Expedição & NF-e"
  ];

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "Revisão de Projeto": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "Preparação & Setup": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Usinagem CNC": return "bg-purple-500/10 text-purple-400 border-purple-500/20 animate-pulse";
      case "Controle de Qualidade": return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "Acabamento & Limpeza": return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "Expedição & NF-e": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-blue-600/30">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-cyan-400"></div>
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-56 h-28 mb-4 flex items-center justify-center">
              <img src={logologinImg} alt="Login Logo" className="w-full h-full object-contain" />
            </div>
            <p className="text-slate-400 text-xs font-mono mt-1">SISTEMA INTEGRADO DE GESTÃO</p>
          </div>

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              setLoginError("");
              const foundUser = users.find(u => u.email.toLowerCase() === loginEmail.toLowerCase());
              if (foundUser) {
                setCurrentUser(foundUser);
              } else {
                setLoginError("E-mail não encontrado no sistema. Verifique a digitação ou crie o usuário na aba Configurações.");
              }
            }} 
            className="space-y-5"
          >
            <div>
              <label className="block text-xs text-slate-400 font-mono mb-2">E-MAIL DE ACESSO</label>
              <input 
                type="email" 
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                placeholder="seu.email@empresa.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition shadow-inner"
                required
              />
            </div>
            
            {loginError && (
              <p className="text-red-400 text-xs bg-red-950/30 p-3 rounded-lg border border-red-900/50">{loginError}</p>
            )}

            <div className="flex justify-center mt-2">
              <button type="submit" className="w-2/3 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold tracking-wider transition shadow-lg shadow-blue-900/20">
                ACESSAR SISTEMA
              </button>
            </div>
          </form>
          
          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <p className="text-[10px] text-slate-600 font-mono">
              Os dados de acesso estão sincronizados com a nuvem (Firebase).
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600/30">
      {/* Dynamic Theme Styles Overrides */}
      <style>{`
        ${currentTheme === 'steel-light' ? `
          /* Steel Light Theme Overrides */
          .bg-slate-950, .bg-slate-900, .bg-slate-950\\/60, .bg-slate-950\\/40, .bg-slate-900\\/40, .bg-slate-900\\/60, .bg-slate-950\\/80 {
            background-color: #f8fafc !important;
            color: #0f172a !important;
            border-color: #cbd5e1 !important;
          }
          header#app-header {
            background-color: #ffffff !important;
            border-bottom: 1px solid #cbd5e1 !important;
          }
          header#app-header h1 {
            color: #0f172a !important;
          }
          nav#nav-rail {
            background-color: #ffffff !important;
            border-right: 1px solid #cbd5e1 !important;
          }
          nav#nav-rail p {
            color: #64748b !important;
          }
          nav#nav-rail button {
            color: #475569 !important;
          }
          nav#nav-rail button:hover {
            background-color: #f1f5f9 !important;
            color: #0f172a !important;
          }
          /* Global Hover Overrides for Light Theme */
          .hover\\:bg-slate-900\\/50:hover, .hover\\:bg-slate-900:hover, .hover\\:bg-slate-800:hover, .hover\\:bg-slate-800\\/50:hover, .hover\\:bg-slate-700:hover {
            background-color: #f1f5f9 !important;
          }
          nav#nav-rail button[class*="bg-blue-600/10"], nav#nav-rail button[class*="bg-gradient-to-r"] {
            background-color: #eff6ff !important;
            color: #2563eb !important;
            border-left: 2px solid #2563eb !important;
          }
          main {
            background-color: #f8fafc !important;
          }
          .text-slate-100, .text-white, .text-slate-200, .text-slate-300, .text-slate-900 {
            color: #0f172a !important;
          }
          .text-slate-400, .text-slate-500, .text-slate-600 {
            color: #475569 !important;
          }
          .bg-slate-900, .bg-slate-950, .bg-slate-900\\/20, .bg-slate-950\\/40, .bg-slate-950\\/60 {
            background-color: #ffffff !important;
            border-color: #cbd5e1 !important;
          }
          div[class*="bg-slate-950/40"], div[class*="bg-slate-900/40"] {
            background-color: #f1f5f9 !important;
            border-color: #cbd5e1 !important;
          }
          .border-slate-800, .border-slate-800\\/80, .border-slate-800\\/60, .border-slate-900 {
            border-color: #cbd5e1 !important;
          }
          .divide-slate-800\\/80 > * {
            border-color: #cbd5e1 !important;
          }
          input, select, textarea {
            background-color: #ffffff !important;
            color: #0f172a !important;
            border: 1px solid #cbd5e1 !important;
          }
          input::placeholder {
            color: #94a3b8 !important;
          }
          div[class*="bg-slate-900/80"], div[class*="bg-slate-950/80"] {
            background-color: rgba(15, 23, 42, 0.6) !important;
          }
          div[class*="bg-blue-950/20"] {
            background-color: #eff6ff !important;
            border-color: #bfdbfe !important;
            color: #1e3a8a !important;
          }
          span[class*="bg-emerald-500/10"] {
            background-color: #d1fae5 !important;
            color: #065f46 !important;
            border-color: #a7f3d0 !important;
          }
          span[class*="bg-amber-500/10"] {
            background-color: #fef3c7 !important;
            color: #92400e !important;
            border-color: #fde68a !important;
          }
          span[class*="bg-blue-500/10"] {
            background-color: #dbeafe !important;
            color: #1e40af !important;
            border-color: #bfdbfe !important;
          }
          span[class*="bg-purple-500/10"] {
            background-color: #f3e8ff !important;
            color: #6b21a8 !important;
            border-color: #e9d5ff !important;
          }
          span[class*="bg-cyan-500/10"] {
            background-color: #ecfeff !important;
            color: #155e75 !important;
            border-color: #c5f6fa !important;
          }
          span[class*="bg-indigo-500/10"] {
            background-color: #e0e7ff !important;
            color: #3730a3 !important;
            border-color: #c7d2fe !important;
          }
          button[class*="bg-gradient-to-r"], button[class*="bg-blue-600"] {
            background: #2563eb !important;
            color: #ffffff !important;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
          }
        ` : ''}

        ${currentTheme === 'amber-crt' ? `
          /* Amber CRT Theme Overrides */
          * {
            font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace !important;
            text-shadow: 0 0 3px rgba(245, 158, 11, 0.5) !important;
          }
          .bg-slate-950, .bg-slate-900, .bg-slate-950\\/60, .bg-slate-950\\/40, .bg-slate-900\\/40, .bg-slate-900\\/60, .bg-slate-950\\/80 {
            background-color: #000000 !important;
            color: #f59e0b !important;
            border-color: #78350f !important;
          }
          header#app-header {
            background-color: #000000 !important;
            border-bottom: 2px solid #f59e0b !important;
          }
          header#app-header h1 {
            color: #f59e0b !important;
          }
          nav#nav-rail {
            background-color: #000000 !important;
            border-right: 2px solid #f59e0b !important;
          }
          nav#nav-rail p {
            color: #92400e !important;
          }
          nav#nav-rail button {
            color: #d97706 !important;
          }
          nav#nav-rail button:hover {
            background-color: #1c1917 !important;
            color: #fbbf24 !important;
          }
          nav#nav-rail button[class*="bg-blue-600/10"], nav#nav-rail button[class*="bg-gradient-to-r"] {
            background-color: rgba(217, 119, 6, 0.15) !important;
            color: #fbbf24 !important;
            border-left: 3px solid #f59e0b !important;
            box-shadow: 0 0 8px rgba(245, 158, 11, 0.2);
          }
          main {
            background-color: #000000 !important;
          }
          .text-slate-100, .text-white, .text-slate-200, .text-slate-300 {
            color: #fbbf24 !important;
          }
          .text-slate-400, .text-slate-500, .text-slate-600 {
            color: #d97706 !important;
          }
          .bg-slate-900, .bg-slate-950, .bg-slate-900\\/20, .bg-slate-950\\/40, .bg-slate-950\\/60 {
            background-color: #000000 !important;
            border-color: #78350f !important;
          }
          div[class*="bg-slate-950/40"], div[class*="bg-slate-900/40"] {
            background-color: #000000 !important;
            border-color: #78350f !important;
          }
          .border-slate-800, .border-slate-800\\/80, .border-slate-800\\/60, .border-slate-900 {
            border-color: #78350f !important;
          }
          .divide-slate-800\\/80 > * {
            border-color: #78350f !important;
          }
          input, select, textarea {
            background-color: #000000 !important;
            color: #fbbf24 !important;
            border: 1px solid #f59e0b !important;
          }
          input::placeholder {
            color: #78350f !important;
          }
          div[class*="bg-slate-900/80"], div[class*="bg-slate-950/80"] {
            background-color: rgba(0, 0, 0, 0.85) !important;
          }
          div[class*="bg-blue-950/20"] {
            background-color: rgba(217, 119, 6, 0.05) !important;
            border-color: #78350f !important;
            color: #fbbf24 !important;
          }
          span[class*="bg-emerald-500/10"], span[class*="bg-amber-500/10"], span[class*="bg-blue-500/10"], span[class*="bg-purple-500/10"], span[class*="bg-cyan-500/10"], span[class*="bg-indigo-500/10"] {
            background-color: rgba(245, 158, 11, 0.1) !important;
            color: #fbbf24 !important;
            border: 1px solid #78350f !important;
          }
          button[class*="bg-gradient-to-r"], button[class*="bg-blue-600"] {
            background: #f59e0b !important;
            color: #000000 !important;
            box-shadow: 0 0 10px rgba(245, 158, 11, 0.4) !important;
            text-shadow: none !important;
          }
        ` : ''}

        ${currentTheme === 'operator-blue' ? `
          /* Navy Operator Theme Overrides */
          .bg-slate-950, .bg-slate-900, .bg-slate-950\\/60, .bg-slate-950\\/40, .bg-slate-900\\/40, .bg-slate-900\\/60, .bg-slate-950\\/80 {
            background-color: #041421 !important;
            color: #17b890 !important;
            border-color: #0f3443 !important;
          }
          header#app-header {
            background-color: #041421 !important;
            border-bottom: 1px solid #17b890 !important;
          }
          header#app-header h1 {
            color: #f7b05b !important;
          }
          nav#nav-rail {
            background-color: #041421 !important;
            border-right: 1px solid #0f3443 !important;
          }
          nav#nav-rail p {
            color: #4b8f8c !important;
          }
          nav#nav-rail button {
            color: #17b890 !important;
          }
          nav#nav-rail button:hover {
            background-color: #0f3443 !important;
            color: #f7b05b !important;
          }
          nav#nav-rail button[class*="bg-blue-600/10"], nav#nav-rail button[class*="bg-gradient-to-r"] {
            background-color: rgba(23, 184, 144, 0.15) !important;
            color: #f7b05b !important;
            border-left: 2px solid #17b890 !important;
          }
          main {
            background-color: #041421 !important;
          }
          .text-slate-100, .text-white, .text-slate-200, .text-slate-300 {
            color: #deece6 !important;
          }
          .text-slate-400, .text-slate-500, .text-slate-600 {
            color: #4b8f8c !important;
          }
          .bg-slate-900, .bg-slate-950, .bg-slate-900\\/20, .bg-slate-950\\/40, .bg-slate-950\\/60 {
            background-color: #051a2e !important;
            border-color: #0f3443 !important;
          }
          div[class*="bg-slate-950/40"], div[class*="bg-slate-900/40"] {
            background-color: #051a2e !important;
            border-color: #0f3443 !important;
          }
          .border-slate-800, .border-slate-800\\/80, .border-slate-800\\/60, .border-slate-900 {
            border-color: #0f3443 !important;
          }
          .divide-slate-800\\/80 > * {
            border-color: #0f3443 !important;
          }
          input, select, textarea {
            background-color: #041421 !important;
            color: #deece6 !important;
            border: 1px solid #17b890 !important;
          }
          input::placeholder {
            color: #4b8f8c !important;
          }
          div[class*="bg-slate-900/80"], div[class*="bg-slate-950/80"] {
            background-color: rgba(4, 20, 33, 0.8) !important;
          }
          button[class*="bg-gradient-to-r"], button[class*="bg-blue-600"] {
            background: #17b890 !important;
            color: #041421 !important;
            font-weight: bold !important;
          }
        ` : ''}
        
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-quote, #printable-quote * {
            visibility: visible;
          }
          #printable-quote {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white !important;
            color: black !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Full Width Logo Banner with Modern Glassmorphism Overlay */}
      <div className="w-full relative shadow-md border-b border-slate-200 bg-white overflow-hidden">
        {/* Usamos object-cover pois a imagem agora tem a proporção ideal (1920x300) e deixamos com cores mais vivas */}
        <img src={logoImg} alt="WCF Usinagem Logo" className="w-full h-24 md:h-32 lg:h-48 object-cover object-center mix-blend-multiply opacity-85 contrast-100 brightness-100" />
        
        {/* Subtle gradient at the bottom for better contrast of the glass buttons */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/10 to-transparent h-24 pointer-events-none" />

        {/* Overlay Actions */}
        <div className="absolute bottom-4 right-4 md:bottom-6 md:right-8 flex flex-col sm:flex-row items-end sm:items-center gap-3 md:gap-4">
          {/* Real-time status */}
          <div className="flex items-center gap-2 text-xs font-mono bg-white/70 backdrop-blur-md text-slate-700 px-4 py-2.5 rounded-xl border border-white/60 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="font-semibold tracking-wide">Rede CNC: <strong className="text-emerald-700 font-bold">Online</strong></span>
          </div>

          <button
            onClick={() => setShowMaterialForm(true)}
            className="px-5 py-2.5 rounded-xl border border-white/60 bg-white/70 backdrop-blur-md text-sm font-bold text-slate-700 hover:bg-white/90 hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-2 shadow-[0_4px_16px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)]"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            Receber Matéria-Prima
          </button>
          
          <button
            onClick={() => setShowOpForm(true)}
            className="px-5 py-2.5 rounded-xl bg-blue-600/90 backdrop-blur-md text-sm font-bold text-white hover:bg-blue-600 hover:-translate-y-0.5 transition-all shadow-[0_4px_16px_rgba(37,99,235,0.2)] hover:shadow-[0_8px_24px_rgba(37,99,235,0.3)] border border-blue-500/50 cursor-pointer flex items-center gap-2"
          >
            <Wrench className="w-4 h-4" />
            Gerar OP sob-medida
          </button>
        </div>
      </div>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Navigation Rail */}
        <nav id="nav-rail" className="w-full md:w-64 bg-slate-900/40 border-r border-slate-800/80 p-4 space-y-1.5 flex-shrink-0">
          <p className="text-[10px] font-bold text-slate-500 font-mono tracking-wider px-3 mb-2">MÓDULOS OPERACIONAIS</p>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
              activeTab === "dashboard"
                ? "bg-blue-600/10 text-blue-400 border-l-2 border-blue-500"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            }`}
          >
            <Activity className="w-4 h-4" />
            Monitoramento CNC & OPs
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
              activeTab === "inventory"
                ? "bg-blue-600/10 text-blue-400 border-l-2 border-blue-500"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            }`}
          >
            <PackageOpen className="w-4 h-4" />
            Estoque do Cliente
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
              activeTab === "orders"
                ? "bg-blue-600/10 text-blue-400 border-l-2 border-blue-500"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            }`}
          >
            <Layers className="w-4 h-4" />
            Fluxo de Usinagem
          </button>
          <button
            onClick={() => setActiveTab("ai-quote")}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
              activeTab === "ai-quote"
                ? "bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Orçamentos
          </button>
          <button
            onClick={() => setActiveTab("siemens-nx")}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
              activeTab === "siemens-nx"
                ? "bg-blue-600/10 text-blue-400 border-l-2 border-blue-500"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            }`}
          >
            <FileCode className="w-4 h-4" />
            Conexão Siemens NX
          </button>
          <button
            onClick={() => setActiveTab("finance")}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
              activeTab === "finance"
                ? "bg-blue-600/10 text-blue-400 border-l-2 border-blue-500"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            }`}
          >
            <Coins className="w-4 h-4" />
            Notas Fiscais (NF-e)
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
              activeTab === "settings"
                ? "bg-blue-600/10 text-blue-400 border-l-2 border-blue-500"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            }`}
          >
            <UserIcon className="w-4 h-4" />
            Configurações
          </button>

          <div className="pt-6 mt-6 border-t border-slate-800/80">
            <p className="text-[10px] font-bold text-slate-500 font-mono tracking-wider px-3 mb-2">CNC HARDWARE STATUS</p>
            <div className="px-3 space-y-2">
              {Object.keys(machines).map((key) => {
                const mach = machines[key];
                return (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono">{key.replace("CNC-", "").replace("TORNO-", "")}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                      mach.status === "Roda" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                      mach.status === "Setup" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                      "bg-slate-800 text-slate-400"
                    }`}>
                      {mach.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Content Box */}
        <main className="flex-1 p-6 overflow-y-auto bg-slate-950/60 max-w-7xl mx-auto w-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-96 gap-3">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-xs text-slate-400 font-mono">Conectando ao sistema embarcado e banco de dados...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {/* TAB 1: DASHBOARD MONITOR */}
              {activeTab === "dashboard" && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Top Stats Overview */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-4">
                      <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
                        <Wrench className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono uppercase font-semibold">Ordem Ativas</span>
                        <h4 className="text-2xl font-bold font-mono text-white">
                          {productionOrders.filter(o => o.stage !== "Expedição & NF-e").length}
                        </h4>
                      </div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-4">
                      <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
                        <PackageOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono uppercase font-semibold">Matérias Rastreáveis</span>
                        <h4 className="text-2xl font-bold font-mono text-white">{materials.length}</h4>
                      </div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-4">
                      <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
                        <Cpu className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono uppercase font-semibold">Máquinas Online</span>
                        <h4 className="text-2xl font-bold font-mono text-white">
                          {[...(Object.values(machines) as CncMachine[]), ...dbMachines.filter(dbM => !Object.values(machines).some((m: any) => m.machineId === dbM.machineId))].filter(m => m.status === "Roda").length} / {[...(Object.values(machines) as CncMachine[]), ...dbMachines.filter(dbM => !Object.values(machines).some((m: any) => m.machineId === dbM.machineId))].length}
                        </h4>
                      </div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-4">
                      <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono uppercase font-semibold">Serviços Faturados</span>
                        <h4 className="text-2xl font-bold font-mono text-white">
                          {invoices.length}
                        </h4>
                      </div>
                    </div>
                  </div>

                  {/* CNC Machine Live Telemetry Stream */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                    <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                        <span className="text-xs font-bold font-mono text-slate-200 tracking-wider">MONITORAMENTO REMOTO DE MÁQUINAS CNC CONECTADAS (TEMPO REAL)</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">Atualização a cada 2.5s</span>
                    </div>

                    <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[...(Object.values(machines) as CncMachine[]), ...dbMachines.filter(dbM => !Object.values(machines).some((m: any) => m.machineId === dbM.machineId))].map((mach: any) => (
                        <div key={mach.machineId} className="bg-slate-950 border border-slate-800/80 rounded-lg p-4 flex flex-col justify-between hover:border-slate-700 transition">
                          <div>
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h5 className="text-xs font-bold text-slate-200 font-mono">{mach.machineName}</h5>
                                <span className="text-[10px] text-slate-500 font-mono">{mach.machineId}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider ${
                                mach.status === "Roda" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse" :
                                mach.status === "Setup" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                                "bg-slate-800 text-slate-400"
                              }`}>
                                {mach.status === "Roda" ? "EXECUTANDO" : mach.status === "Setup" ? "EM SETUP" : "PARADA"}
                              </span>
                            </div>

                            {/* Telemetry Numbers */}
                            <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-900/40 p-2.5 rounded border border-slate-800/50">
                              <div>
                                <span className="text-[9px] text-slate-500 block font-mono">ROTAÇÃO SPINDLE</span>
                                <span className="text-xs font-bold font-mono text-slate-200">{mach.spindleRPM} RPM</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-500 block font-mono">AVANÇO DE CORTE</span>
                                <span className="text-xs font-bold font-mono text-slate-200">{mach.feedRate} mm/min</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-500 block font-mono">TEMP. MANCAL</span>
                                <span className="text-xs font-bold font-mono text-slate-200">{mach.temperature} °C</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-500 block font-mono">CARGA NOMINAL</span>
                                <span className="text-xs font-bold font-mono text-slate-200">{mach.spindleLoad}%</span>
                              </div>
                            </div>

                            {/* Active Job and Progress */}
                            {mach.activeOP ? (
                              <div className="space-y-2">
                                <div className="flex justify-between text-[10px]">
                                  <span className="text-slate-400 font-mono">OP Vinculada: <strong>{mach.activeOP}</strong></span>
                                  <span className="text-slate-200 font-mono font-bold">{mach.completedPercent}%</span>
                                </div>
                                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                                  <div className="bg-blue-500 h-1.5" style={{ width: `${mach.completedPercent}%` }} />
                                </div>
                                <div className="p-1.5 bg-slate-900 border border-slate-800 rounded font-mono text-[9px] text-slate-400 overflow-x-hidden text-ellipsis whitespace-nowrap">
                                  {mach.activeGcode}
                                </div>
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-500 font-mono italic text-center py-4 bg-slate-900/20 rounded">
                                Sem ordens de usinagem ativas no spindle.
                              </div>
                            )}
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-900 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                            <span className="flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${mach.coolant === "Ligado" ? "bg-emerald-400" : "bg-red-400"}`} />
                              Refrigeração
                            </span>
                            <span>Ferramenta: <strong className="text-slate-200">{mach.activeTool.substring(0, 16)}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Active Production Orders List */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                    <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold font-mono tracking-wider text-slate-200">FILA DE PRODUÇÃO ATIVA & FLUXO DE USINAGEM</h4>
                        <p className="text-[10px] text-slate-500">Clique em qualquer ordem para avançar o fluxo de fabricação</p>
                      </div>
                      <div className="relative w-full sm:w-64">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Buscar por OP ou Cliente..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-slate-950 text-xs text-slate-300 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="divide-y divide-slate-800/80">
                      {productionOrders
                        .filter(o => o.client.toLowerCase().includes(searchQuery.toLowerCase()) || o.partName.toLowerCase().includes(searchQuery.toLowerCase()) || o.id.includes(searchQuery))
                        .map((order) => (
                          <div
                            key={order.id}
                            onClick={() => setSelectedOrderDetails(order)}
                            className="p-5 hover:bg-slate-900/50 transition duration-150 cursor-pointer flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold font-mono text-blue-400 bg-blue-500/5 border border-blue-500/10 px-2 py-0.5 rounded">
                                  {order.id}
                                </span>
                                <h5 className="text-sm font-bold text-white">{order.partName}</h5>
                                {order.nxSynced && (
                                  <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-mono rounded flex items-center gap-1">
                                    <FileCode className="w-2.5 h-2.5" /> Siemens NX
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400">Cliente: <strong className="text-slate-300">{order.client}</strong></p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 font-mono">
                                <span>Tolerância: <strong className="text-slate-300">{order.tolerance}</strong></span>
                                <span>Rugosidade: <strong className="text-slate-300">{order.roughness}</strong></span>
                                <span>Quantidade: <strong className="text-slate-300">{order.quantity} pçs</strong></span>
                              </div>
                            </div>

                            {/* Flow steps visualization inline */}
                            <div className="flex items-center gap-1 bg-slate-950/40 p-1.5 rounded border border-slate-800/60 max-w-full overflow-x-auto">
                              {stagesList.map((stG, idx) => {
                                const isCurrent = order.stage === stG;
                                const isCompleted = stagesList.indexOf(order.stage) > idx;
                                return (
                                  <div key={stG} className="flex items-center">
                                    <span className={`px-2 py-1 rounded text-[9px] font-mono ${
                                      isCurrent ? "bg-blue-600 text-white font-bold animate-pulse" :
                                      isCompleted ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-900 text-slate-600"
                                    }`}>
                                      {stG.split(" ")[0]}
                                    </span>
                                    {idx < stagesList.length - 1 && (
                                      <ArrowRight className="w-2.5 h-2.5 mx-1 text-slate-700" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Current Stage status box */}
                            <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center w-full lg:w-auto gap-4 lg:gap-1 text-right">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStageColor(order.stage)}`}>
                                {order.stage}
                              </span>
                              <div className="text-[10px] text-slate-500 font-mono">
                                Entrega: <span className="text-slate-300">{order.dueDate}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: CLIENT INVENTORY */}
              {activeTab === "inventory" && (
                <motion.div
                  key="inventory"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base font-bold text-white">Estoque Consignado e Rastreabilidade do Cliente</h2>
                      <p className="text-xs text-slate-400">Toda a matéria-prima é fornecida pelo cliente e cadastrada com número de corrida e certificado.</p>
                    </div>
                    <div className="relative w-full md:w-80">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Buscar material, cliente, certificado..."
                        value={inventorySearch}
                        onChange={(e) => setInventorySearch(e.target.value)}
                        className="w-full bg-slate-950 text-xs text-slate-300 border border-slate-800 rounded-lg pl-10 pr-3 py-2.5 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Inventory Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {materials
                      .filter(m => m.client.toLowerCase().includes(inventorySearch.toLowerCase()) || m.materialType.toLowerCase().includes(inventorySearch.toLowerCase()) || m.certificateNumber.toLowerCase().includes(inventorySearch.toLowerCase()))
                      .map((mat) => {
                        const stockLeft = mat.quantityReceived - mat.quantityConsumed;
                        return (
                          <div key={mat.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition">
                            <div className="space-y-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-[10px] font-mono text-blue-400 tracking-wider font-bold block">{mat.id}</span>
                                  <h4 className="text-sm font-extrabold text-white">{mat.materialType}</h4>
                                  <p className="text-xs text-slate-400">Cliente: <strong className="text-slate-300">{mat.client}</strong></p>
                                </div>
                                <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                                  stockLeft > 2 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                  stockLeft > 0 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                                  "bg-red-500/10 text-red-400 border border-red-500/20"
                                }`}>
                                  Disponível: {stockLeft} un
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3 rounded-lg border border-slate-800/60 font-mono">
                                <div>
                                  <span className="text-[9px] text-slate-500 block">FORMATO DA MATÉRIA</span>
                                  <span className="text-slate-300">{mat.format}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-500 block">DIMENSÕES DE CORTE</span>
                                  <span className="text-slate-300">{mat.dimensions}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-500 block">LOCAL DE ARMAZENAMENTO</span>
                                  <span className="text-slate-300 flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-red-400" />
                                    {mat.location}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-500 block">RECEBIDO EM</span>
                                  <span className="text-slate-300">{mat.dateReceived}</span>
                                </div>
                              </div>

                              {/* Material Traceability Section */}
                              <div className="p-3 bg-blue-950/20 border border-blue-500/10 rounded-lg text-xs space-y-1">
                                <span className="text-[9px] font-mono text-blue-400 font-bold tracking-wider uppercase block">Rastreabilidade e Certificado</span>
                                <div className="flex justify-between font-mono">
                                  <span className="text-slate-400">Nº Certificado:</span>
                                  <strong className="text-blue-300">{mat.certificateNumber}</strong>
                                </div>
                                <div className="flex justify-between font-mono">
                                  <span className="text-slate-400">Total Recebido:</span>
                                  <strong className="text-slate-200">{mat.quantityReceived} peças brutas</strong>
                                </div>
                                <div className="flex justify-between font-mono">
                                  <span className="text-slate-400">Consumido em OPs:</span>
                                  <strong className="text-slate-200">{mat.quantityConsumed} peças brutas</strong>
                                </div>
                              </div>

                              {mat.notes && (
                                <p className="text-xs text-slate-400 leading-relaxed font-mono italic">
                                  * Nota de Almoxarifado: {mat.notes}
                                </p>
                              )}
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-800/80 flex justify-between items-center text-[11px] text-slate-500">
                              <span>Ativo para novas Ordens</span>
                              <button
                                onClick={() => {
                                  setNewOp({ ...newOp, client: mat.client, materialId: mat.id });
                                  setShowOpForm(true);
                                }}
                                className="text-blue-400 hover:text-blue-300 transition font-semibold"
                              >
                                Vincular Nova OP +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </motion.div>
              )}

              {/* TAB 3: MACHINING FLOW STAGES */}
              {activeTab === "orders" && (
                <motion.div
                  key="orders"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                    <h2 className="text-base font-bold text-white mb-2">Painel de Etapas do Processo Industrial</h2>
                    <p className="text-xs text-slate-400">Visualize todas as Ordens de Produção (OPs) segmentadas pelo seu status industrial ativo. Mova itens facilmente.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
                    {stagesList.map((stG) => {
                      const opsInStage = productionOrders.filter(o => o.stage === stG);
                      return (
                        <div key={stG} className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 min-w-[200px] flex flex-col gap-3">
                          <div className="pb-2 border-b border-slate-800/80 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-200 truncate">{stG}</span>
                            <span className="bg-slate-800 text-slate-400 font-mono text-[10px] px-2 py-0.5 rounded-full">
                              {opsInStage.length}
                            </span>
                          </div>

                          <div className="space-y-2.5 flex-1 min-h-[400px]">
                            {opsInStage.map((op) => (
                              <div
                                key={op.id}
                                onClick={() => setSelectedOrderDetails(op)}
                                className="bg-slate-950 border border-slate-800 hover:border-blue-500/50 p-3 rounded-lg cursor-pointer transition space-y-2 shadow-sm"
                              >
                                <div className="flex justify-between items-start">
                                  <span className="text-[10px] font-mono font-bold text-blue-400">{op.id}</span>
                                  {op.nfeStatus === "Emitida" && (
                                    <span className="text-[8px] font-bold font-mono text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded">
                                      FATURADA
                                    </span>
                                  )}
                                </div>
                                <h5 className="text-xs font-bold text-slate-200 line-clamp-2">{op.partName}</h5>
                                <div className="text-[10px] text-slate-500 space-y-0.5">
                                  <p className="truncate">Cliente: <strong className="text-slate-400">{op.client}</strong></p>
                                  <p>Qtd: <strong className="text-slate-400">{op.quantity} pçs</strong></p>
                                </div>
                                <div className="pt-2 border-t border-slate-900 flex justify-between items-center text-[9px] text-slate-500">
                                  <span>Entrega: {op.dueDate}</span>
                                </div>
                              </div>
                            ))}
                            {opsInStage.length === 0 && (
                              <div className="h-full flex items-center justify-center border border-dashed border-slate-800/60 rounded-lg p-6">
                                <span className="text-[10px] text-slate-600 font-mono italic text-center">Nenhum item nesta etapa</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* TAB 4: QUOTES GENERATOR (FULL SCREEN) */}
              {activeTab === "ai-quote" && (
                <div className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto">
                  <div className="sticky top-0 z-20 bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center shadow-md">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-400" />
                      Módulo de Orçamentos
                    </h2>
                    <button 
                      onClick={() => { setActiveTab("dashboard"); setQuoteMode("select"); }}
                      className="px-4 py-2 rounded bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold transition hover:from-indigo-500 hover:to-blue-500 shadow-md cursor-pointer"
                    >
                      Voltar ao Painel
                    </button>
                  </div>

                  <div className="p-6 max-w-7xl mx-auto">
                    {quoteMode === "select" && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center min-h-[70vh] space-y-8"
                      >
                        <div className="text-center space-y-2">
                          <h3 className="text-3xl font-extrabold text-white">Escolha o formato do Orçamento</h3>
                          <p className="text-slate-400">Como você deseja gerar a proposta comercial hoje?</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                          <button 
                            onClick={() => setQuoteMode("manual")}
                            className="flex flex-col items-center p-10 bg-slate-900 border-2 border-slate-800 hover:border-blue-500 rounded-2xl transition cursor-pointer group"
                          >
                            <FileText className="w-16 h-16 text-slate-500 group-hover:text-blue-400 mb-4 transition" />
                            <h4 className="text-xl font-bold text-slate-200 mb-2">Orçamento Manual</h4>
                            <p className="text-sm text-slate-400 text-center">Preencha tempos de máquina, custos e taxas manualmente. Ideal para processos clássicos.</p>
                          </button>

                          <button 
                            onClick={() => setQuoteMode("ai")}
                            className="flex flex-col items-center p-10 bg-slate-900 border-2 border-slate-800 hover:border-indigo-500 rounded-2xl transition cursor-pointer group relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition" />
                            <Bot className="w-16 h-16 text-slate-500 group-hover:text-indigo-400 mb-4 transition relative z-10" />
                            <h4 className="text-xl font-bold text-slate-200 mb-2 relative z-10">Robô Orçamentista IA</h4>
                            <p className="text-sm text-slate-400 text-center relative z-10">Deixe a inteligência artificial calcular tudo com base no material, tolerância e algoritmos.</p>
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {quoteMode === "manual" && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg max-w-4xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                           <h3 className="text-lg font-bold text-white flex items-center gap-2">
                             <FileText className="w-5 h-5 text-blue-400" />
                             Orçamento Manual Clássico
                           </h3>
                           <button onClick={() => setQuoteMode("select")} className="text-sm text-slate-400 hover:text-white underline cursor-pointer">Voltar às opções</button>
                        </div>
                        
                        <form className="space-y-4">
                           <div className="grid grid-cols-2 gap-4">
                             <div>
                               <label className="block text-xs text-slate-400 mb-1">Cliente</label>
                               <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white" />
                             </div>
                             <div>
                               <label className="block text-xs text-slate-400 mb-1">Peça</label>
                               <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white" />
                             </div>
                             <div>
                               <label className="block text-xs text-slate-400 mb-1">Tempo de Setup (Horas)</label>
                               <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono" />
                             </div>
                             <div>
                               <label className="block text-xs text-slate-400 mb-1">Tempo de Usinagem CNC (Horas)</label>
                               <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono" />
                             </div>
                             <div>
                               <label className="block text-xs text-slate-400 mb-1">Valor Hora/Máquina (R$)</label>
                               <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono" />
                             </div>
                             <div>
                               <label className="block text-xs text-slate-400 mb-1">Custo de Material (R$)</label>
                               <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono" />
                             </div>
                           </div>
                           <div className="pt-4 flex justify-end">
                             <button type="button" className="px-5 py-2 bg-blue-600 text-white rounded font-bold cursor-pointer">
                               Calcular Proposta Manual
                             </button>
                           </div>
                        </form>
                      </motion.div>
                    )}

                    {quoteMode === "ai" && (
                      <motion.div
                        key="ai-quote-content"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                      >
                        <div className="lg:col-span-3 flex justify-between items-center mb-[-1rem]">
                          <span className="text-xs font-mono text-indigo-400">MODO ATIVO: INTELIGÊNCIA ARTIFICIAL</span>
                          <button onClick={() => setQuoteMode("select")} className="text-sm text-slate-400 hover:text-white underline cursor-pointer">Trocar para Orçamento Manual</button>
                        </div>
                  {/* Quote Form Panel */}
                  <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5">
                    <div>
                      <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        Robô Orçamentista Inteligente
                      </h3>
                      <p className="text-xs text-slate-400">Orçamentos gerados por inteligência artificial em segundos baseado nas características de rugosidade, tolerâncias e materiais.</p>
                    </div>

                    <form onSubmit={handleGenerateQuote} className="space-y-4 text-xs">
                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold">Nome da Peça Desejada</label>
                        <input
                          type="text"
                          value={aiQuoteParams.partName}
                          onChange={(e) => setAiQuoteParams({ ...aiQuoteParams, partName: e.target.value })}
                          className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                          placeholder="Ex: Rotor de Turbina, Flange Rosqueada..."
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold">Liga do Material (Fornecido pelo Cliente)</label>
                        <input
                          type="text"
                          list="materials-list"
                          value={aiQuoteParams.materialType}
                          onChange={(e) => setAiQuoteParams({ ...aiQuoteParams, materialType: e.target.value })}
                          className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                          placeholder="Ex: Alumínio 6061, SAE 8640..."
                          required
                        />
                        <datalist id="materials-list">
                          <option value="Aço SAE 1020" />
                          <option value="Aço SAE 1045" />
                          <option value="Aço SAE 4140" />
                          <option value="Aço SAE 8620" />
                          <option value="Aço SAE 8640" />
                          <option value="Aço Inox 304" />
                          <option value="Aço Inox 316L" />
                          <option value="Alumínio 6061-T6" />
                          <option value="Alumínio 7075" />
                          <option value="Titânio Grau 5 (Ti-6Al-4V)" />
                          <option value="Latão CLA" />
                          <option value="Cobre Eletrolítico" />
                          <option value="Nylon 6.6" />
                          <option value="POM (Delrin/Acetal)" />
                          <option value="Teflon (PTFE)" />
                          <option value="Bronze TM23" />
                          <option value="Ferro Fundido Nodular" />
                        </datalist>
                      </div>

                      {/* Desenho ou Foto no Orçamento */}
                      <div className="space-y-2 border-t border-b border-slate-800/80 py-3.5">
                        <label className="block text-slate-400 font-semibold flex items-center justify-between">
                          <span>Anexar Desenho ou Foto</span>
                          <span className="text-[9px] text-slate-500 font-mono font-normal">Identificação por IA e busca de similares</span>
                        </label>
                        
                        {/* Selector Modes */}
                        <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
                          <button
                            type="button"
                            onClick={() => setImageMode("none")}
                            className={`py-1 text-[10px] font-mono rounded-md font-semibold transition cursor-pointer ${
                              imageMode === "none" ? "bg-slate-800 text-white border border-slate-700/50 shadow-sm" : "text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            Sem Imagem
                          </button>
                          <button
                            type="button"
                            onClick={() => setImageMode("sketch")}
                            className={`py-1 text-[10px] font-mono rounded-md font-semibold transition cursor-pointer ${
                              imageMode === "sketch" ? "bg-indigo-600 text-white border border-indigo-500/30 shadow-sm" : "text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            Esboçar CAD
                          </button>
                          <button
                            type="button"
                            onClick={() => setImageMode("upload")}
                            className={`py-1 text-[10px] font-mono rounded-md font-semibold transition cursor-pointer ${
                              imageMode === "upload" ? "bg-blue-600 text-white border border-blue-500/30 shadow-sm" : "text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            Enviar Arquivo
                          </button>
                        </div>

                        {/* Interactive Canvas Sketchpad */}
                        {imageMode === "sketch" && (
                          <div className="bg-slate-950/20 p-2 border border-slate-800/60 rounded-xl space-y-2">
                            <Sketchpad
                              theme={currentTheme}
                              savedImage={sketchImage}
                              onSave={(base64) => setSketchImage(base64)}
                            />
                            {sketchImage && (
                              <div className="flex items-center gap-1 text-[9px] text-emerald-400 font-mono">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Esboço registrado e pronto para identificação.
                              </div>
                            )}
                          </div>
                        )}

                        {/* File Upload Zone */}
                        {imageMode === "upload" && (
                          <div className="bg-slate-950/20 p-3 border border-slate-800/60 rounded-xl space-y-2.5">
                            <div 
                              className="border border-dashed border-slate-800 hover:border-blue-500/50 rounded-lg p-4 text-center cursor-pointer transition relative group bg-slate-950/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                              tabIndex={0}
                              onPaste={(e) => {
                                const items = e.clipboardData.items;
                                for (let i = 0; i < items.length; i++) {
                                  if (items[i].type.indexOf('image') !== -1 || items[i].type === 'application/pdf') {
                                    const file = items[i].getAsFile();
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        setUploadImage(reader.result as string);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }
                                }
                              }}
                            >
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setUploadImage(reader.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              />
                              <div className="flex flex-col items-center justify-center space-y-1">
                                <Plus className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition" />
                                <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-200 transition">Clique, solte ou cole (Ctrl+V) o arquivo aqui</span>
                                <span className="text-[8px] text-slate-600">PNG, JPG, SVG ou PDF de até 5MB</span>
                              </div>
                            </div>
                            
                            {uploadImage && (
                              <div className="space-y-1">
                                <div className="text-[9px] text-slate-500 font-mono flex justify-between">
                                  <span>Visualização do anexo:</span>
                                  <button
                                    type="button"
                                    onClick={() => setUploadImage(null)}
                                    className="text-red-400 hover:text-red-300 transition"
                                  >
                                    Remover
                                  </button>
                                </div>
                                <div className="border border-slate-800 rounded bg-slate-950/80 p-1 flex justify-center text-center">
                                  {uploadImage.startsWith("data:application/pdf") ? (
                                    <div className="py-4 flex flex-col items-center">
                                      <FileText className="w-8 h-8 text-red-400 mb-2" />
                                      <span className="text-xs text-slate-300">Documento PDF Anexado</span>
                                    </div>
                                  ) : (
                                    <img
                                      src={uploadImage}
                                      alt="Upload preview"
                                      className="max-h-24 object-contain rounded"
                                      referrerPolicy="no-referrer"
                                    />
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-slate-400 mb-1 text-sm font-semibold">Comprimento (mm)</label>
                          <input
                            type="number"
                            value={aiQuoteParams.dimensionLength}
                            onChange={(e) => setAiQuoteParams({ ...aiQuoteParams, dimensionLength: e.target.value })}
                            className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 font-mono"
                            placeholder="Ex: 150"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1 text-sm font-semibold">Largura (mm)</label>
                          <input
                            type="number"
                            value={aiQuoteParams.dimensionWidth}
                            onChange={(e) => setAiQuoteParams({ ...aiQuoteParams, dimensionWidth: e.target.value })}
                            className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 font-mono"
                            placeholder="Ex: 80"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1 text-sm font-semibold">Quantidade</label>
                          <input
                            type="number"
                            value={aiQuoteParams.quantity}
                            onChange={(e) => setAiQuoteParams({ ...aiQuoteParams, quantity: Number(e.target.value) })}
                            className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 font-mono"
                            min="1"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-400 mb-1 font-semibold">Tolerância Dimensional</label>
                          <select
                            value={aiQuoteParams.tolerance}
                            onChange={(e) => setAiQuoteParams({ ...aiQuoteParams, tolerance: e.target.value })}
                            className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="± 0.100 mm">± 0.100 mm (Usinagem Comum)</option>
                            <option value="± 0.050 mm">± 0.050 mm (Média Precisão)</option>
                            <option value="± 0.010 mm">± 0.010 mm (Alta Precisão)</option>
                            <option value="± 0.005 mm">± 0.005 mm (Super Precisão)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1 font-semibold">Rugosidade Superficial</label>
                          <select
                            value={aiQuoteParams.roughness}
                            onChange={(e) => setAiQuoteParams({ ...aiQuoteParams, roughness: e.target.value })}
                            className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="Ra 3.2 µm">Ra 3.2 µm (Desbaste Comum)</option>
                            <option value="Ra 1.6 µm">Ra 1.6 µm (Usinagem Padrão)</option>
                            <option value="Ra 0.8 µm">Ra 0.8 µm (Acabamento Fino)</option>
                            <option value="Ra 0.4 µm">Ra 0.4 µm (Lapidado/Retificado)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold">Urgência de Produção</label>
                        <select
                          value={aiQuoteParams.urgency}
                          onChange={(e) => setAiQuoteParams({ ...aiQuoteParams, urgency: e.target.value })}
                          className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="Normal">Normal (Fila de Máquina Padrão)</option>
                          <option value="Urgente">Urgente (Adicional de Setup Rápido)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold">Complexidade e Recursos Geométricos</label>
                        <textarea
                          value={aiQuoteParams.features}
                          onChange={(e) => setAiQuoteParams({ ...aiQuoteParams, features: e.target.value })}
                          className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 h-20 resize-none"
                          placeholder="Furos rosqueados, chavetas, rebaixos..."
                        />
                      </div>

                      <div className="p-3 bg-indigo-950/15 border border-indigo-500/10 rounded-lg">
                        <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase block mb-1">Aviso de Regra Comercial</span>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          Como a matéria-prima é de fornecimento integral do cliente, o custo de materiais e insumos metálicos brutos é cotado a <strong>R$ 0,00</strong>.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={isGeneratingQuote}
                        className="w-full py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold transition hover:from-indigo-500 hover:to-blue-500 shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isGeneratingQuote && <RefreshCw className="w-4 h-4 animate-spin" />}
                        {!isGeneratingQuote && <Sparkles className="w-4 h-4" />}
                        <span>
                          {isGeneratingQuote ? "Robô Calculando Proposta..." : "GERAR PROPOSTA POR IA"}
                        </span>
                      </button>
                    </form>
                  </div>

                  {/* Quote Result Certificate display */}
                  <div id="printable-quote" className="lg:col-span-2 space-y-6">
                    {aiQuoteResult ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col justify-between"
                      >
                        {/* Header of Proposal */}
                        <div className="bg-gradient-to-r from-indigo-900/40 via-blue-900/30 to-slate-950 px-6 py-5 border-b border-slate-800 flex items-center justify-between">
                          <div>
                            <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-mono font-bold uppercase tracking-wider block w-fit mb-1">
                              {aiQuoteResult.isMock ? "PROPOSTA AUTOMÁTICA (REGRA DE MÁQUINA)" : "PROPOSTA IA GEMINI 3.5 APURADA"}
                            </span>
                            <h3 className="text-base font-extrabold text-white">PROPOSTA DE USINAGEM SOB-MEDIDA</h3>
                          </div>
                          <div className="text-right font-mono text-xs text-slate-500">
                            <span>Emissão: {new Date().toISOString().split("T")[0]}</span>
                          </div>
                        </div>

                        {/* Proposal Body */}
                        <div className="p-6 space-y-6">
                          {/* Part details */}
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs font-mono">
                            <div>
                              <span className="text-slate-500 block">COMPONENTE</span>
                              <strong className="text-slate-200">{aiQuoteResult.partName}</strong>
                            </div>
                            <div>
                              <span className="text-slate-500 block">LIGA DO METAL</span>
                              <strong className="text-slate-200">{aiQuoteResult.materialType}</strong>
                            </div>
                            <div>
                              <span className="text-slate-500 block">DIMENSÕES</span>
                              <strong className="text-slate-200">{aiQuoteResult.dimensions}</strong>
                            </div>
                            <div>
                              <span className="text-slate-500 block">QUANTIDADE</span>
                              <strong className="text-slate-200">{aiQuoteParams.quantity} un</strong>
                            </div>
                            <div>
                              <span className="text-slate-500 block">MÁQUINA RECOMENDADA</span>
                              <strong className="text-indigo-400">{aiQuoteResult.recommendedMachine}</strong>
                            </div>
                          </div>

                          {/* Technical robot analysis */}
                          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                            <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider block mb-2">ANÁLISE DE ENGENHARIA DO ROBÔ</span>
                            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                              {aiQuoteResult.robotReview}
                            </p>
                          </div>

                          {/* Stages Breakdown list */}
                          <div className="space-y-2">
                            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block">PLANEJAMENTO TÁTICO DAS ETAPAS DO PROCESSO</span>
                            <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40">
                              {Array.isArray(aiQuoteResult.stagesBreakdown) && aiQuoteResult.stagesBreakdown.map((st, idx) => (
                                <div key={idx} className="p-3 flex items-center justify-between gap-4 text-xs">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-1.5 font-bold text-slate-200">
                                      <span className="text-[10px] text-indigo-400 font-mono">{idx + 1}.</span>
                                      {st.stage}
                                    </div>
                                    <p className="text-[11px] text-slate-400">{st.desc}</p>
                                  </div>
                                  <span className="px-2 py-1 bg-slate-900 rounded text-[10px] font-mono text-slate-300 flex-shrink-0">
                                    {st.hours} hrs
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Warning / Alerts list */}
                          {Array.isArray(aiQuoteResult.warnings) && aiQuoteResult.warnings.length > 0 && (
                            <div className="p-4 bg-amber-950/10 border border-amber-500/20 rounded-lg text-xs space-y-2">
                              <span className="text-amber-400 font-bold flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                Recomendações e Riscos para Fornecimento da Matéria-Prima:
                              </span>
                              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                                {aiQuoteResult.warnings.map((warn, i) => (
                                  <li key={i}>{warn}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Similar Quotes Match Finder */}
                          {Array.isArray(aiQuoteResult.similarQuotes) && aiQuoteResult.similarQuotes.length > 0 && (
                            <div className="space-y-3 p-4 bg-slate-950 border border-slate-800 rounded-xl">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                                    ROBÔ DE RASTREABILIDADE: PROPOSTAS SEMELHANTES NO HISTÓRICO
                                  </span>
                                </div>
                                <span className="text-[9px] font-mono text-slate-500">2 correspondências top</span>
                              </div>
                              
                              <p className="text-[11px] text-slate-400 leading-relaxed">
                                Cruzamos os dados geométricos e metalúrgicos com nosso banco de dados histórico para validar preços e garantir prazos precisos de usinagem.
                              </p>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                {aiQuoteResult.similarQuotes.map((sq, index) => (
                                  <div key={index} className="bg-slate-900 border border-slate-800 p-3 rounded-lg space-y-2 flex flex-col justify-between hover:border-slate-700 transition">
                                    <div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-mono text-blue-400 bg-blue-500/5 px-1.5 py-0.5 rounded border border-blue-500/10">
                                          {sq.id}
                                        </span>
                                        <div className="flex items-center gap-1">
                                          <span className="text-[10px] font-mono text-slate-500">Aderência:</span>
                                          <span className={`text-[11px] font-bold font-mono ${
                                            sq.similarityScore >= 80 ? "text-emerald-400" : "text-amber-400"
                                          }`}>
                                            {sq.similarityScore}%
                                          </span>
                                        </div>
                                      </div>
                                      
                                      <h5 className="text-xs font-bold text-slate-200 mt-1.5 truncate">
                                        {sq.partName}
                                      </h5>
                                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                        Cliente: {sq.client} • Liga: {sq.materialType}
                                      </p>
                                    </div>
                                    
                                    <div className="pt-2 border-t border-slate-800/60 text-[10px] text-slate-400 italic font-mono leading-relaxed">
                                      * {sq.matchReason}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Financial Cost Breakdown */}
                          <div className="bg-slate-950 rounded-xl p-5 border border-slate-800/80 space-y-3">
                            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block">DEMONSTRATIVO DE INVESTIMENTO</span>
                            <div className="space-y-1.5 text-xs font-mono">
                              <div className="flex justify-between">
                                <span className="text-slate-500">Serviço de Usinagem CNC de Alta Precisão:</span>
                                <span className="text-slate-300">R$ {aiQuoteResult.costs?.machining?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Custos de Setup de Máquina / Dispositivos:</span>
                                <span className="text-slate-300">R$ {aiQuoteResult.costs?.setup?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Controle Metrológico Tridimensional (QC):</span>
                                <span className="text-slate-300">R$ {aiQuoteResult.costs?.qualityControl?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Mapeamento, Certificado & Armazenagem Consignada do Cliente:</span>
                                <span className="text-slate-300">R$ {Number(aiQuoteResult.costs?.materialHandling || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                              </div>
                              {aiQuoteResult.costs?.profitMargin > 0 && (
                                <div className="flex justify-between text-blue-400">
                                  <span>Margem de Lucro Industrial Aplicada:</span>
                                  <span>+ R$ {Number(aiQuoteResult.costs?.profitMargin || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                                </div>
                              )}
                              {aiQuoteResult.costs?.taxes > 0 && (
                                <div className="flex justify-between text-rose-400">
                                  <span>Previsão de Impostos e Tributos (NFS-e):</span>
                                  <span>+ R$ {Number(aiQuoteResult.costs?.taxes || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                                </div>
                              )}
                              {aiQuoteResult.costs?.urgencySurcharge > 0 && (
                                <div className="flex justify-between text-amber-400">
                                  <span>Taxa de Sobrecarga de Urgência de Produção:</span>
                                  <span>+ R$ {aiQuoteResult.costs?.urgencySurcharge?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                                </div>
                              )}
                              {aiQuoteResult.costs?.discount > 0 && (
                                <div className="flex justify-between text-emerald-400">
                                  <span>Desconto de Volume Industrial:</span>
                                  <span>- R$ {aiQuoteResult.costs?.discount?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                                </div>
                              )}
                              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-bold">
                                <span className="text-white">VALOR TOTAL DOS SERVIÇOS (FOB):</span>
                                <span className="text-indigo-400 text-base">R$ {aiQuoteResult.costs?.totalPrice?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Proposal Footer Action */}
                        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <Clock className="w-3.5 h-3.5" />
                            Prazo Estimado de Entrega: <strong className="text-slate-300">{aiQuoteResult.leadTimeDays} dias úteis</strong> a partir do recebimento físico das peças.
                          </div>
                          <div className="flex items-center gap-2 no-print">
                            <button
                              type="button"
                              onClick={() => {
                                const text = `*PROPOSTA COMERCIAL - USINAGEM*\nPeça: ${aiQuoteResult.partName}\nMaterial: ${aiQuoteResult.materialType}\nQuantidade: ${aiQuoteParams.quantity} peças\nPrazo: ${aiQuoteResult.leadTimeDays} dias úteis\n\n*VALOR TOTAL:* R$ ${aiQuoteResult.costs?.totalPrice?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n\n_Orçamento Inteligente_`;
                                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                              }}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold transition flex items-center gap-2"
                              title="Enviar Resumo para WhatsApp"
                            >
                              <MessageSquare className="w-4 h-4" />
                              WhatsApp
                            </button>
                            <button
                              type="button"
                              onClick={() => window.print()}
                              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-semibold transition flex items-center gap-2"
                              title="Salvar como PDF ou Imprimir"
                            >
                              <Printer className="w-4 h-4" />
                              Gerar PDF
                            </button>
                            <button
                              onClick={async () => {
                              // Auto-register a client material if needed, and create an active production order
                              try {
                                const matResponse = await fetch("/api/inventory", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    client: "Cliente Orçamento Rápido",
                                    materialType: aiQuoteResult.materialType,
                                    format: "Sob-medida (Orçamento)",
                                    dimensions: aiQuoteResult.dimensions,
                                    quantityReceived: aiQuoteParams.quantity,
                                    certificateNumber: `AI-CERT-${Math.floor(10000 + Math.random() * 90000)}`,
                                    location: "Raque Orçamento IA",
                                    notes: "Gerado automaticamente através da proposta comercial inteligente aprovada."
                                  })
                                });
                                
                                if (matResponse.ok) {
                                  const registeredMat = await matResponse.json();
                                  // Fetch materials again to populate inventory
                                  await fetchData();
                                  
                                  // Create active production order
                                  const opResponse = await fetch("/api/production-orders", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      client: registeredMat.client,
                                      partName: aiQuoteResult.partName,
                                      materialId: registeredMat.id,
                                      quantity: aiQuoteParams.quantity,
                                      tolerance: aiQuoteResult.tolerance,
                                      roughness: aiQuoteResult.roughness,
                                      dueDate: new Date(Date.now() + (Number(aiQuoteResult.leadTimeDays) || 10) * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                                    })
                                  });

                                  if (opResponse.ok) {
                                    alert("Orçamento aprovado com sucesso! Ordem de Produção e Lote de Estoque Rastreável integrados automaticamente.");
                                    setActiveTab("dashboard");
                                    fetchData();
                                  }
                                }
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wider transition shadow-md shadow-emerald-600/10 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            APROVAR E LANÇAR EM PRODUÇÃO
                          </button>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="h-full min-h-[450px] border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center p-8 bg-slate-900/10 text-slate-500">
                        <Sparkles className="w-12 h-12 text-indigo-500/30 mb-3 animate-pulse" />
                        <h4 className="text-sm font-bold text-slate-400">Aguardando Solicitação de Cotação</h4>
                        <p className="text-xs text-center text-slate-500 max-w-sm mt-1">
                          Configure os parâmetros desejados ao lado e clique em "Gerar Proposta por IA" para que o robô faça a análise completa dos custos e prazos de fabricação.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}

              {/* TAB 5: SIEMENS NX CONNECTION */}
              {activeTab === "siemens-nx" && (
                <motion.div
                  key="siemens-nx"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <SiemensNxSync onSyncSuccess={fetchData} />
                </motion.div>
              )}

              {/* TAB 6: NOTAS FISCAIS & FINANCES */}
              {activeTab === "finance" && (
                <motion.div
                  key="finance"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                      <h2 className="text-base font-bold text-white">Integração Financeira & Emissão de NFS-e (SEFAZ)</h2>
                      <p className="text-xs text-slate-400">Emita notas fiscais de serviço baseadas na complexidade da usinagem e rastreamento das matérias-primas.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* List of OPs pending invoice */}
                    <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                      <div className="bg-slate-950 px-5 py-3 border-b border-slate-800">
                        <h3 className="text-xs font-bold font-mono text-slate-200 tracking-wider">ORDENS DE PRODUÇÃO DISPONÍVEIS PARA EMISSÃO</h3>
                      </div>
                      <div className="divide-y divide-slate-800">
                        {productionOrders
                          .filter(o => o.nfeStatus === "Pendente")
                          .map((op) => (
                            <div key={op.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold font-mono text-blue-400">{op.id}</span>
                                  <h4 className="text-xs font-bold text-white">{op.partName}</h4>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-0.5">Cliente: <strong className="text-slate-300">{op.client}</strong></p>
                                <span className={`inline-block px-2 py-0.5 mt-1 bg-slate-950 rounded text-[9px] font-mono text-slate-400`}>
                                  Status: {op.stage}
                                </span>
                              </div>

                              <button
                                onClick={() => {
                                  setShowInvoiceModal(op);
                                  setInvoiceValueInput("2400");
                                }}
                                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition cursor-pointer"
                              >
                                Emitir Nota Fiscal
                              </button>
                            </div>
                          ))}
                        {productionOrders.filter(o => o.nfeStatus === "Pendente").length === 0 && (
                          <div className="p-8 text-center text-xs text-slate-500 font-mono italic">
                            Nenhuma ordem pendente de faturamento.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* NF-e logs */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
                      <h3 className="text-xs font-bold font-mono text-slate-200 tracking-wider flex items-center gap-1.5">
                        <Coins className="w-4 h-4 text-emerald-400" />
                        Histórico de NFS-e Emitidas
                      </h3>

                      <div className="space-y-3.5 max-h-[450px] overflow-y-auto">
                        {invoices.map((inv) => (
                          <div key={inv.id} className="bg-slate-950 p-3.5 border border-slate-800 rounded-lg text-xs space-y-2">
                            <div className="flex justify-between items-start border-b border-slate-900 pb-1.5">
                              <div>
                                <span className="text-[9px] font-mono text-emerald-400 font-bold tracking-wider">{inv.id}</span>
                                <h4 className="text-[11px] font-bold text-slate-200 line-clamp-1">{inv.partName}</h4>
                              </div>
                              <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold font-mono rounded">
                                AUTORIZADA
                              </span>
                            </div>

                            <div className="space-y-1 font-mono text-[10px] text-slate-400">
                              <div className="flex justify-between">
                                <span>Cliente:</span>
                                <span className="text-slate-300 truncate max-w-[120px]">{inv.client}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Valor do Serviço:</span>
                                <span className="text-slate-300">R$ {inv.serviceValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Impostos (ISS/PIS):</span>
                                <span className="text-slate-300">R$ {inv.taxesValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ({inv.taxesRate}%)</span>
                              </div>
                              <div className="flex justify-between font-bold text-white pt-1">
                                <span>Valor Líquido:</span>
                                <span className="text-emerald-400">R$ {inv.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                              </div>
                            </div>

                            <div className="bg-slate-900/60 p-2 rounded text-[8px] font-mono text-slate-500 leading-none break-all select-all hover:text-slate-300 transition">
                              Chave SEFAZ: {inv.xmlKey}
                            </div>
                          </div>
                        ))}
                        {invoices.length === 0 && (
                          <div className="p-8 border border-dashed border-slate-800/80 rounded-lg text-center text-xs text-slate-600 font-mono italic">
                            Nenhuma nota fiscal emitida ainda no ciclo atual.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              {/* TAB 7: SETTINGS & RBAC */}
              {activeTab === "settings" && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <UserIcon className="w-5 h-5 text-slate-400" />
                        Configurações e Gestão de Usuários
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">Gerencie os acessos ao sistema e controle permissões (RBAC).</p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingUserId(null);
                        setNewUser({ name: "", email: "", role: "Operador CNC", permissions: ["dashboard"] });
                        setShowUserForm(true);
                      }}
                      className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Criar Conta
                    </button>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                    <div className="bg-slate-950 px-5 py-3 border-b border-slate-800">
                      <h3 className="text-xs font-bold font-mono text-slate-200 tracking-wider">CONTAS CADASTRADAS NO SISTEMA</h3>
                    </div>
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 font-mono">
                        <tr>
                          <th className="px-5 py-3 border-b border-slate-800">NOME DO USUÁRIO</th>
                          <th className="px-5 py-3 border-b border-slate-800">E-MAIL</th>
                          <th className="px-5 py-3 border-b border-slate-800">FUNÇÃO (ROLE)</th>
                          <th className="px-5 py-3 border-b border-slate-800">PERMISSÕES</th>
                          <th className="px-5 py-3 border-b border-slate-800 text-right">AÇÕES</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {users.map(u => (
                          <tr key={u.id} className="hover:bg-slate-800/50 transition">
                            <td className="px-5 py-3 font-semibold text-white">{u.name}</td>
                            <td className="px-5 py-3 text-slate-400">{u.email}</td>
                            <td className="px-5 py-3">
                              <span className="text-slate-300 font-mono">
                                {u.role}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-[10px] text-slate-500 font-mono">
                              {u.permissions.join(", ")}
                            </td>
                            <td className="px-5 py-3 text-right">
                              <div className="flex justify-end gap-3">
                                <button
                                  onClick={() => {
                                    setEditingUserId(u.id);
                                    setNewUser(u);
                                    setShowUserForm(true);
                                  }}
                                  className="text-slate-500 hover:text-slate-300 transition cursor-pointer"
                                  title="Editar Usuário"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={async () => {
                                    if(window.confirm(`Tem certeza que deseja excluir o usuário ${u.name}?`)) {
                                      try {
                                        await deleteDoc(doc(db, "users", u.id));
                                      } catch(e) {
                                        alert("Erro ao excluir usuário.");
                                      }
                                    }
                                  }}
                                  className="text-slate-500 hover:text-red-400 transition cursor-pointer"
                                  title="Remover Usuário"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* CNC MACHINES MANAGEMENT */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg mt-8">
                    <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex justify-between items-center">
                      <h3 className="text-xs font-bold font-mono text-slate-200 tracking-wider">MÁQUINAS CNC CADASTRADAS (NUVEM)</h3>
                      <button
                        onClick={() => {
                          setNewMachineData({ machineId: `CNC-${Math.floor(Math.random()*10000)}`, machineName: "" });
                          setShowMachineForm(true);
                        }}
                        className="px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[10px] transition cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Adicionar Máquina
                      </button>
                    </div>
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 font-mono">
                        <tr>
                          <th className="px-5 py-3 border-b border-slate-800">ID / CÓDIGO</th>
                          <th className="px-5 py-3 border-b border-slate-800">NOME DA MÁQUINA</th>
                          <th className="px-5 py-3 border-b border-slate-800 text-right">AÇÕES</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {dbMachines.map((m: any) => (
                          <tr key={m.id} className="hover:bg-slate-800/50 transition">
                            <td className="px-5 py-3 font-mono text-blue-400">{m.machineId}</td>
                            <td className="px-5 py-3 font-semibold text-white">{m.machineName}</td>
                            <td className="px-5 py-3 text-right">
                              <button
                                onClick={async () => {
                                  if(window.confirm(`Tem certeza que deseja remover a máquina ${m.machineName}?`)) {
                                    try {
                                      await deleteDoc(doc(db, "machines", m.id));
                                    } catch(e) {
                                      alert("Erro ao excluir máquina.");
                                    }
                                  }
                                }}
                                className="text-slate-500 hover:text-red-400 transition cursor-pointer"
                                title="Remover Máquina"
                              >
                                <Trash2 className="w-4 h-4 inline" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {dbMachines.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-5 py-6 text-center text-slate-500 font-mono italic">
                              Nenhuma máquina cadastrada na nuvem ainda.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* FOOTER */}
      <footer className="bg-slate-900 border-t border-slate-800/80 px-6 py-4 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 font-mono gap-4">
        <span>© 2026 METAL-IA CONTROLE INDUSTRIAL - USINAGEM 4.0</span>
        <div className="flex items-center gap-4">
          <span>Post-Processor Integrado: SINUMERIK 840D / FANUC Series</span>
          <span>Workspace SDK: Siemens NX Open API v2212</span>
        </div>
      </footer>

      {/* MODAL 0: CREATE USER (RBAC) */}
      {showUserForm && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl max-w-lg w-full"
          >
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-blue-400" />
                {editingUserId ? "EDITAR USUÁRIO" : "CRIAR NOVA CONTA"}
              </h3>
              <button
                onClick={() => setShowUserForm(false)}
                className="text-slate-400 hover:text-slate-200 font-mono text-xs cursor-pointer"
              >
                [FECHAR]
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (isSubmittingUser) return;
              setIsSubmittingUser(true);
              
              // Fecha a janela instantaneamente (Otimista)
              setShowUserForm(false);
              
              const userToSave = { ...newUser };
              const id = editingUserId;
              
              setNewUser({ name: "", email: "", role: "Operador CNC", permissions: ["dashboard"] });
              setEditingUserId(null);

              // Salva em background
              (async () => {
                try {
                  if (id) {
                    await setDoc(doc(db, "users", id), userToSave);
                  } else {
                    await addDoc(collection(db, "users"), userToSave);
                  }
                } catch (error) {
                  console.error("Erro ao salvar no Firebase:", error);
                  alert("Atenção: O usuário não foi salvo na nuvem. Verifique se o Banco de Dados Firestore foi criado no console do Firebase!");
                } finally {
                  setIsSubmittingUser(false);
                }
              })();

            }} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">E-mail de Acesso</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Função (Role)</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Administrador">Administrador</option>
                    <option value="Operador CNC">Operador CNC</option>
                    <option value="Engenheiro">Engenheiro</option>
                    <option value="Vendedor">Vendedor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-2">Módulos Permitidos (Acessos)</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                    {[
                      { id: "dashboard", label: "Dashboard (Monitoramento CNC)" },
                      { id: "inventory", label: "Estoque do Cliente" },
                      { id: "orders", label: "Fluxo de Usinagem" },
                      { id: "ai-quote", label: "Orçamentos (Manual & Robô)" },
                      { id: "siemens-nx", label: "Conexão Siemens NX" },
                      { id: "finance", label: "Notas Fiscais (NF-e)" },
                      { id: "settings", label: "Configurações" },
                    ].map(mod => (
                      <label key={mod.id} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={newUser.permissions.includes(mod.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewUser({ ...newUser, permissions: [...newUser.permissions, mod.id] });
                            } else {
                              setNewUser({ ...newUser, permissions: newUser.permissions.filter(p => p !== mod.id) });
                            }
                          }}
                          className="accent-blue-500"
                        />
                        <span className="text-slate-300 group-hover:text-white transition">{mod.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={isSubmittingUser}
                  onClick={() => setShowUserForm(false)}
                  className="px-4 py-2 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUser}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingUser ? "Salvando..." : editingUserId ? "Salvar Alterações" : "Criar Conta"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 1B: CREATE MACHINE */}
      {showMachineForm && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl max-w-lg w-full"
          >
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-400" />
                CADASTRAR MÁQUINA CNC
              </h3>
              <button
                onClick={() => setShowMachineForm(false)}
                className="text-slate-400 hover:text-slate-200 font-mono text-xs cursor-pointer"
              >
                [FECHAR]
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (isSubmittingMachine) return;
              setIsSubmittingMachine(true);
              
              setShowMachineForm(false);
              
              const machineToSave = {
                machineId: newMachineData.machineId,
                machineName: newMachineData.machineName,
                status: "Parada",
                spindleRPM: 0,
                feedRate: 0,
                coordinates: { x: 0, y: 0, z: 0 },
                activeTool: "Nenhuma",
                activeGcode: "",
                coolant: "Desligado",
                spindleLoad: 0,
                temperature: 20,
                activeOP: null,
                completedPercent: 0
              };

              (async () => {
                try {
                  await addDoc(collection(db, "machines"), machineToSave);
                } catch (error) {
                  console.error("Erro ao salvar no Firebase:", error);
                  alert("Erro ao cadastrar máquina na nuvem.");
                } finally {
                  setIsSubmittingMachine(false);
                }
              })();
            }} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Código / ID da Máquina</label>
                  <input
                    type="text"
                    value={newMachineData.machineId}
                    onChange={(e) => setNewMachineData({ ...newMachineData, machineId: e.target.value })}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 font-mono"
                    placeholder="Ex: CNC-ROMI-D800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Nome Completo / Modelo</label>
                  <input
                    type="text"
                    value={newMachineData.machineName}
                    onChange={(e) => setNewMachineData({ ...newMachineData, machineName: e.target.value })}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                    placeholder="Ex: Romi D800 (3 Eixos)"
                    required
                  />
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={isSubmittingMachine}
                  onClick={() => setShowMachineForm(false)}
                  className="px-4 py-2 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMachine}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingMachine ? "Salvando..." : "Salvar Máquina"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {/* MODAL 1: RECEIVE MATERIAL FROM CLIENT */}
      {showMaterialForm && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl max-w-lg w-full"
          >
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <PackageOpen className="w-4 h-4 text-blue-400" />
                REGISTRAR MATÉRIA-PRIMA DO CLIENTE
              </h3>
              <button
                onClick={() => setShowMaterialForm(false)}
                className="text-slate-400 hover:text-slate-200 font-mono text-xs cursor-pointer"
              >
                [FECHAR]
              </button>
            </div>

            <form onSubmit={handleRegisterMaterial} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Razão Social do Cliente</label>
                  <input
                    type="text"
                    value={newMaterial.client}
                    onChange={(e) => setNewMaterial({ ...newMaterial, client: e.target.value })}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                    placeholder="Ex: Acme Corp Aeroespacial"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Liga do Metal / Composição</label>
                  <input
                    type="text"
                    value={newMaterial.materialType}
                    onChange={(e) => setNewMaterial({ ...newMaterial, materialType: e.target.value })}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                    placeholder="Ex: Alumínio 6061-T6, Aço Inox 316L"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Formato Físico</label>
                  <select
                    value={newMaterial.format}
                    onChange={(e) => setNewMaterial({ ...newMaterial, format: e.target.value })}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Tarugo Redondo">Tarugo Redondo</option>
                    <option value="Tarugo Hexagonal">Tarugo Hexagonal</option>
                    <option value="Chapa Retangular">Chapa Retangular</option>
                    <option value="Bloco Retangular">Bloco Retangular</option>
                    <option value="Tubo Oco">Tubo Oco</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Dimensões Brutas</label>
                  <input
                    type="text"
                    value={newMaterial.dimensions}
                    onChange={(e) => setNewMaterial({ ...newMaterial, dimensions: e.target.value })}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 font-mono"
                    placeholder="Ex: Ø80mm x 500mm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Quantidade de Peças Recebidas</label>
                  <input
                    type="number"
                    value={newMaterial.quantityReceived}
                    onChange={(e) => setNewMaterial({ ...newMaterial, quantityReceived: Number(e.target.value) })}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 font-mono"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Código do Certificado de Corrida</label>
                  <input
                    type="text"
                    value={newMaterial.certificateNumber}
                    onChange={(e) => setNewMaterial({ ...newMaterial, certificateNumber: e.target.value })}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 font-mono"
                    placeholder="Ex: CERT-9982-A"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-400 mb-1">Endereço de Armazenagem Almoxarifado</label>
                  <input
                    type="text"
                    value={newMaterial.location}
                    onChange={(e) => setNewMaterial({ ...newMaterial, location: e.target.value })}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                    placeholder="Ex: Prateleira B-4, Almoxarifado Setor Sul"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-400 mb-1">Observações de Inspeção Visual Recebimento</label>
                  <textarea
                    value={newMaterial.notes}
                    onChange={(e) => setNewMaterial({ ...newMaterial, notes: e.target.value })}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 h-20 resize-none"
                    placeholder="Ex: Tarugos sem rebarbas aparentes, faces limpas..."
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowMaterialForm(false)}
                  className="px-4 py-2 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition shadow-md cursor-pointer"
                >
                  Registrar Matéria-Prima
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 2: CREATE PRODUCTION ORDER */}
      {showOpForm && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl max-w-lg w-full"
          >
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-400" />
                ABRIR NOVA ORDEM DE PRODUÇÃO (OP)
              </h3>
              <button
                onClick={() => setShowOpForm(false)}
                className="text-slate-400 hover:text-slate-200 font-mono text-xs cursor-pointer"
              >
                [FECHAR]
              </button>
            </div>

            <form onSubmit={handleCreateOP} className="p-6 space-y-4 text-xs">
              <div className="space-y-3.5">
                <div>
                  <label className="block text-slate-400 mb-1">Selecione o Lote de Matéria-Prima do Cliente</label>
                  <select
                    value={newOp.materialId}
                    onChange={(e) => {
                      const selectedMat = materials.find(m => m.id === e.target.value);
                      setNewOp({
                        ...newOp,
                        materialId: e.target.value,
                        client: selectedMat ? selectedMat.client : ""
                      });
                    }}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="">-- Escolher Matéria-Prima no Estoque --</option>
                    {materials.map((m) => (
                      <option key={m.id} value={m.id} disabled={m.quantityReceived - m.quantityConsumed <= 0}>
                        {m.id} - {m.materialType} [{m.client}] (Disp: {m.quantityReceived - m.quantityConsumed} pçs)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Nome do Componente Sob-Medida</label>
                  <input
                    type="text"
                    value={newOp.partName}
                    onChange={(e) => setNewOp({ ...newOp, partName: e.target.value })}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                    placeholder="Ex: Engrenagem Cônica Helicoidal"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Quantidade Requerida</label>
                    <input
                      type="number"
                      value={newOp.quantity}
                      onChange={(e) => setNewOp({ ...newOp, quantity: Number(e.target.value) })}
                      className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 font-mono"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Prazo de Entrega Acordado</label>
                    <input
                      type="date"
                      value={newOp.dueDate}
                      onChange={(e) => setNewOp({ ...newOp, dueDate: e.target.value })}
                      className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Tolerância Dimensional Mínima</label>
                    <input
                      type="text"
                      value={newOp.tolerance}
                      onChange={(e) => setNewOp({ ...newOp, tolerance: e.target.value })}
                      className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Rugosidade Superficial Exigida</label>
                    <input
                      type="text"
                      value={newOp.roughness}
                      onChange={(e) => setNewOp({ ...newOp, roughness: e.target.value })}
                      className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Operador / Responsável Alocado</label>
                  <input
                    type="text"
                    value={newOp.operator}
                    onChange={(e) => setNewOp({ ...newOp, operator: e.target.value })}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                    placeholder="Ex: Fernando Silva (Sênior)"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowOpForm(false)}
                  className="px-4 py-2 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition shadow-md cursor-pointer"
                >
                  Abrir Ordem de Produção
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 3: PRODUCTION ORDER DETAILED VIEW & PROGRESS FLOW */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl max-w-2xl w-full"
          >
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono text-blue-400 font-bold uppercase">{selectedOrderDetails.id}</span>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  DETALHAMENTO DA PRODUÇÃO INDUSTRIAL
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedOrderDetails(null);
                  setStageProgressNotes("");
                }}
                className="text-slate-400 hover:text-slate-200 font-mono text-xs cursor-pointer"
              >
                [FECHAR]
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 border-b border-slate-800/80">
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block">Dados da Peça</span>
                  <div className="space-y-1">
                    <div>Componente: <strong className="text-white text-sm">{selectedOrderDetails.partName}</strong></div>
                    <div>Cliente Fornecedor: <strong className="text-slate-300">{selectedOrderDetails.client}</strong></div>
                    <div>Quantidade: <strong className="text-slate-300">{selectedOrderDetails.quantity} peças sob-medida</strong></div>
                    <div>Etapa Ativa: <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getStageColor(selectedOrderDetails.stage)}`}>{selectedOrderDetails.stage}</span></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block">Rastreabilidade Metalúrgica</span>
                  <div className="space-y-1 font-mono">
                    <div>ID Matéria: <strong className="text-blue-400">{selectedOrderDetails.materialId}</strong></div>
                    <div>Material Bruto: <strong className="text-slate-300">{selectedOrderDetails.materialType}</strong></div>
                    <div>Certificado de Corrida: <strong className="text-blue-300">{selectedOrderDetails.materialCertificate}</strong></div>
                    <div>Ficheiro Siemens NX: <strong className="text-slate-400">{selectedOrderDetails.nxFile}</strong></div>
                  </div>
                </div>
              </div>

              {/* CNC Machine specific active parameters */}
              {selectedOrderDetails.stage === "Usinagem CNC" && selectedOrderDetails.nxSpecs && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 text-blue-400 font-bold">
                    <Cpu className="w-4 h-4 animate-spin-slow" />
                    <span>PARÂMETROS DE CONTROLE NX INTEGRADO</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Tempo de Ciclo:</span>
                      <strong className="text-slate-200">{selectedOrderDetails.nxSpecs.estimatedMachiningTime} min/peça</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Spindle de Design:</span>
                      <strong className="text-slate-200">{selectedOrderDetails.nxSpecs.spindleSpeed} RPM</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Avanço Avançado:</span>
                      <strong className="text-slate-200">{selectedOrderDetails.nxSpecs.feedRate} mm/min</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Ferramenta NX:</span>
                      <strong className="text-slate-200 truncate block">{selectedOrderDetails.nxSpecs.activeTool}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline of completed steps */}
              <div className="space-y-3">
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block">Histórico de Rastreabilidade Operacional</span>
                <div className="space-y-2 bg-slate-950 p-4 rounded-lg border border-slate-800 max-h-40 overflow-y-auto font-mono text-[11px]">
                  {selectedOrderDetails.history.map((hist, i) => (
                    <div key={i} className="flex justify-between items-start border-b border-slate-900 pb-1.5 last:border-b-0 last:pb-0">
                      <div>
                        <span className="text-slate-200 font-bold">[{hist.stage}]</span>
                        <p className="text-slate-400 text-[10px] mt-0.5">{hist.note}</p>
                      </div>
                      <span className="text-slate-500 flex-shrink-0">{hist.completedAt || "Em Andamento"}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress Order Stage Options */}
              <div className="pt-4 border-t border-slate-800 space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-bold">Anotações / Diário de Operação (Feedback de Máquina)</label>
                  <input
                    type="text"
                    value={stageProgressNotes}
                    onChange={(e) => setStageProgressNotes(e.target.value)}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                    placeholder="Ex: Medições de diâmetro interno perfeitamente concêntricas no micrômetro."
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="text-[10px] text-slate-500 font-mono block w-full">Mover Ordem para Próxima Fase:</span>
                  {stagesList.map((stG) => {
                    if (stG === selectedOrderDetails.stage) return null;
                    return (
                      <button
                        key={stG}
                        type="button"
                        onClick={() => handleUpdateStage(selectedOrderDetails.id, stG)}
                        className="px-3 py-1.5 rounded bg-slate-950 border border-slate-800 hover:border-blue-500 text-slate-300 hover:text-white transition cursor-pointer font-mono text-[10px]"
                      >
                        {stG}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL 4: EMIT FISCAL INVOICE (NF-e) */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl max-w-md w-full"
          >
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Coins className="w-4 h-4 text-emerald-400" />
                EMITIR NOTA FISCAL (NFS-e SEFAZ)
              </h3>
              <button
                onClick={() => setShowInvoiceModal(null)}
                className="text-slate-400 hover:text-slate-200 font-mono text-xs cursor-pointer"
              >
                [FECHAR]
              </button>
            </div>

            <form onSubmit={handleEmitInvoice} className="p-6 space-y-4 text-xs">
              <div className="space-y-3">
                <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1 font-mono">
                  <div>OP Destino: <strong className="text-white">{showInvoiceModal.id}</strong></div>
                  <div>Componente: <strong className="text-slate-300">{showInvoiceModal.partName}</strong></div>
                  <div>Cliente: <strong className="text-slate-300">{showInvoiceModal.client}</strong></div>
                  <div>Certificado Matéria: <strong className="text-blue-300">{showInvoiceModal.materialCertificate}</strong></div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Valor dos Serviços Prestados (R$)</label>
                  <input
                    type="number"
                    value={invoiceValueInput}
                    onChange={(e) => setInvoiceValueInput(e.target.value)}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Alíquota de Tributação (%)</label>
                  <input
                    type="number"
                    value={invoiceTaxesRate}
                    onChange={(e) => setInvoiceTaxesRate(e.target.value)}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(null)}
                  className="px-4 py-2 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition shadow-md cursor-pointer"
                >
                  Transmitir Nota ao SEFAZ
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
