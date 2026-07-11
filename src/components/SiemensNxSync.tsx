import React, { useState } from "react";
import { Cpu, FileCode, CheckCircle, RefreshCw, UploadCloud, Info } from "lucide-react";
import { motion } from "motion/react";

interface SiemensNxSyncProps {
  onSyncSuccess: () => void;
}

export default function SiemensNxSync({ onSyncSuccess }: SiemensNxSyncProps) {
  const [fileName, setFileName] = useState("NX_WING_BRACKET_V4.prt");
  const [partName, setPartName] = useState("Braço de Suporte Angular - Aeroespacial");
  const [materialType, setMaterialType] = useState("Alumínio 6061-T6");
  const [estimatedTime, setEstimatedTime] = useState(48);
  const [spindleSpeed, setSpindleSpeed] = useState(11500);
  const [feedRate, setFeedRate] = useState(1950);
  const [toolName, setToolName] = useState("Fresa Helicoidal Metal Duro Ø10mm - Alumínio");
  const [tolerance, setTolerance] = useState("± 0.010 mm");
  const [roughness, setRoughness] = useState("Ra 0.8 µm");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any | null>(null);

  const nxPresets = [
    {
      fileName: "NX_WING_BRACKET_V4.prt",
      partName: "Braço de Suporte Angular - Aeroespacial",
      materialType: "Alumínio 6061-T6",
      estimatedTime: 48,
      spindleSpeed: 11500,
      feedRate: 1950,
      toolName: "Fresa Helicoidal Metal Duro Ø10mm - Alumínio",
      tolerance: "± 0.010 mm",
      roughness: "Ra 0.8 µm",
    },
    {
      fileName: "NX_BIO_IMPLANT_X1.prt",
      partName: "Placa Óssea Maxilofacial sob medida",
      materialType: "Titânio Grau 5 (Ti-6Al-4V)",
      estimatedTime: 85,
      spindleSpeed: 5500,
      feedRate: 750,
      toolName: "Fresadora Cônica de Topo Esférico Ø3mm",
      tolerance: "± 0.005 mm",
      roughness: "Ra 0.4 µm",
    },
    {
      fileName: "NX_HYD_VALVE_S1.prt",
      partName: "Corpo de Válvula Hidráulica de Precisão",
      materialType: "Aço Inox 316L",
      estimatedTime: 120,
      spindleSpeed: 4200,
      feedRate: 980,
      toolName: "Broca Canhão Intermediária Ø16mm",
      tolerance: "± 0.015 mm",
      roughness: "Ra 1.6 µm",
    }
  ];

  const handleApplyPreset = (preset: typeof nxPresets[0]) => {
    setFileName(preset.fileName);
    setPartName(preset.partName);
    setMaterialType(preset.materialType);
    setEstimatedTime(preset.estimatedTime);
    setSpindleSpeed(preset.spindleSpeed);
    setFeedRate(preset.feedRate);
    setToolName(preset.toolName);
    setTolerance(preset.tolerance);
    setRoughness(preset.roughness);
    setSyncResult(null);
  };

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch("/api/siemens-nx/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName,
          partName,
          materialType,
          estimatedMachiningTime: estimatedTime,
          spindleSpeed,
          feedRate,
          toolName,
          tolerance,
          roughness
        })
      });

      const data = await response.json();
      if (response.ok) {
        setSyncResult(data);
        onSyncSuccess();
      } else {
        alert(data.error || "Erro ao sincronizar com Siemens NX");
      }
    } catch (err) {
      console.error(err);
      alert("Falha de rede ao conectar com o serviço Siemens NX");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Simulation Workspace Panel */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wider font-mono">INTEGRAÇÃO SIEMENS NX CAM</h2>
              <p className="text-xs text-slate-400">Ambiente de Sincronização de Geometrias e Percursos</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs font-mono border border-emerald-500/20 animate-pulse">
            CONECTADO (ONLINE)
          </span>
        </div>

        {/* CAD/CAM Viewer Preview */}
        <div className="p-6 bg-slate-950/40 border-b border-slate-800/80 flex-1 flex flex-col md:flex-row gap-6">
          <div className="flex-1 bg-slate-950/80 rounded-lg border border-slate-800 p-4 font-mono text-xs text-slate-300 flex flex-col justify-between min-h-[220px]">
            <div>
              <div className="flex items-center gap-2 text-blue-400 font-semibold mb-3 pb-2 border-b border-slate-800">
                <FileCode className="w-4 h-4" />
                <span>NX_CAM_PROGRAM_TREE</span>
              </div>
              <div className="space-y-1.5 text-slate-400">
                <p className="text-slate-200">📂 {fileName}</p>
                <p className="pl-4">📁 GEOMETRY_GROUP</p>
                <p className="pl-8 text-emerald-400">└─ 🔩 MCS_MILL (Z-AXIS ZERO)</p>
                <p className="pl-4">📁 TOOL_LIST</p>
                <p className="pl-8 text-amber-400">└─ 🛠️ {toolName}</p>
                <p className="pl-4">📁 PROGRAM_STAGES</p>
                <p className="pl-8 text-blue-400">└─ ⚙️ ROUGHING_SPIRAL_MAIN (Feed: {feedRate}mm/min)</p>
                <p className="pl-8 text-blue-400">└─ ⚙️ {partName.substring(0, 15).toUpperCase()}_FINISH_PASS</p>
              </div>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <span>Post-Processor: SINUMERIK 840D</span>
              <span>Units: Metric (mm)</span>
            </div>
          </div>

          <div className="w-full md:w-72 bg-slate-900/50 rounded-lg border border-slate-800/80 p-4 flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-400 font-mono tracking-wider">PRESETS NX CAD/CAM</span>
            <div className="space-y-2">
              {nxPresets.map((preset) => (
                <button
                  key={preset.fileName}
                  onClick={() => handleApplyPreset(preset)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition duration-200 flex flex-col gap-1 ${
                    fileName === preset.fileName
                      ? "bg-blue-500/10 border-blue-500/50 text-white"
                      : "bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  }`}
                >
                  <span className="font-semibold text-slate-200">{preset.partName}</span>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>{preset.fileName}</span>
                    <span className="text-blue-400">{preset.materialType}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sync Controls form */}
        <form onSubmit={handleSync} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Nome do Arquivo NX Part (.prt)</label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Nome do Componente Sob-Medida</label>
              <input
                type="text"
                value={partName}
                onChange={(e) => setPartName(e.target.value)}
                className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Liga do Material Requerido</label>
              <input
                type="text"
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value)}
                className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Tempo de Usinagem CNC (minutos)</label>
              <input
                type="number"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(Number(e.target.value))}
                className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Rotação do Spindle NX (RPM)</label>
              <input
                type="number"
                value={spindleSpeed}
                onChange={(e) => setSpindleSpeed(Number(e.target.value))}
                className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Avanço de Corte (mm/min)</label>
              <input
                type="number"
                value={feedRate}
                onChange={(e) => setFeedRate(Number(e.target.value))}
                className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-mono"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Ferramenta Ativa de Corte</label>
              <input
                type="text"
                value={toolName}
                onChange={(e) => setToolName(e.target.value)}
                className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Tolerância Dimensional Exigida</label>
              <input
                type="text"
                value={tolerance}
                onChange={(e) => setTolerance(e.target.value)}
                className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-mono"
                required
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-500 text-xs font-mono">Siemens NX Open API v2212</span>
            <button
              type="submit"
              disabled={isSyncing}
              className="px-6 py-2.5 rounded-lg font-semibold text-xs tracking-wider transition duration-300 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Sincronizando Trajetórias...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  IMPORTAR PROJETO NX PARA PRODUÇÃO
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Sync Status Info Card */}
      <div className="flex flex-col gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400" />
            Como Funciona a Integração NX?
          </h3>
          <ul className="space-y-3.5 text-xs text-slate-400">
            <li className="flex gap-2.5">
              <span className="font-mono text-blue-400 font-bold">1.</span>
              <span><strong>Análise de Tolerância:</strong> O sistema mapeia os limites dimensionais críticos definidos no CAD do NX Siemens de forma direta.</span>
            </li>
            <li className="flex gap-2.5">
              <span className="font-mono text-blue-400 font-bold">2.</span>
              <span><strong>Geração de Ordem de Produção:</strong> Ao sincronizar, o sistema cria a OP correspondente com os tempos estimados de ciclo.</span>
            </li>
            <li className="flex gap-2.5">
              <span className="font-mono text-blue-400 font-bold">3.</span>
              <span><strong>Controle Rastreável de Sobras:</strong> Associa o tarugo do cliente correspondente no estoque rastreável.</span>
            </li>
            <li className="flex gap-2.5">
              <span className="font-mono text-blue-400 font-bold">4.</span>
              <span><strong>Setup Automatizado CNC:</strong> As velocidades e ferramentas do NX são passadas direto para o monitoramento remoto da máquina CNC.</span>
            </li>
          </ul>
        </div>

        {syncResult && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-5 text-emerald-300"
          >
            <div className="flex items-center gap-2 mb-3 text-emerald-400">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-bold font-mono">SINCRONIZADO COM SUCESSO!</span>
            </div>
            <p className="text-xs mb-3 text-emerald-200/80 leading-relaxed">
              As geometrias tridimensionais de <strong>{syncResult.order?.partName}</strong> foram processadas e acopladas ao sistema.
            </p>
            <div className="bg-slate-950/80 rounded border border-emerald-500/20 p-3 font-mono text-xs text-emerald-400 space-y-1">
              <div><span className="text-slate-500">OP Criada:</span> {syncResult.order?.id}</div>
              <div><span className="text-slate-500">Materia:</span> {syncResult.order?.materialType}</div>
              <div><span className="text-slate-500">Ferramenta:</span> {syncResult.order?.nxSpecs?.activeTool}</div>
              <div><span className="text-slate-500">Tempo de Ciclo:</span> {syncResult.order?.nxSpecs?.estimatedMachiningTime} min</div>
              <div><span className="text-slate-500">Tolerância:</span> {syncResult.order?.tolerance}</div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
