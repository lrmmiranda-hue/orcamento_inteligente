import React, { useRef, useState, useEffect } from "react";
import { Trash2, Undo, Palette, Star } from "lucide-react";

interface SketchpadProps {
  onSave: (base64: string | null) => void;
  savedImage: string | null;
  theme: "slate-dark" | "steel-light" | "amber-crt" | "operator-blue";
}

export default function Sketchpad({ onSave, savedImage, theme }: SketchpadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  // Configure drawing color based on theme
  const getDrawingColors = () => {
    switch (theme) {
      case "steel-light":
        return { stroke: "#1e293b", bg: "#f1f5f9" }; // Dark slate on light grey
      case "amber-crt":
        return { stroke: "#f59e0b", bg: "#0d0700" }; // Glowing amber on black
      case "operator-blue":
        return { stroke: "#38bdf8", bg: "#020617" }; // Sky blue on deep dark blue
      case "slate-dark":
      default:
        return { stroke: "#818cf8", bg: "#0b0f19" }; // Indigo on very dark blue-grey
    }
  };

  const colors = getDrawingColors();

  // Reset/Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Check if we need to load a saved image or initialize empty
    if (savedImage) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = colors.bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = savedImage;
    } else {
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [theme]); // redraw background when theme changes

  // Save current canvas to history and trigger onSave
  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    setHistory(prev => [...prev, dataUrl]);
    onSave(dataUrl);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    e.preventDefault();
    setIsDrawing(true);

    const coords = getEventCoords(e, canvas);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = colors.stroke;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    e.preventDefault();
    const coords = getEventCoords(e, canvas);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveState();
    }
  };

  const getEventCoords = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    
    // Scale coordinates in case CSS size differs from coordinate size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    setHistory([]);
    onSave(null);
  };

  const undoLast = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (history.length <= 1) {
      // If only 1 state exists, undoing means clearing it
      clearCanvas();
      return;
    }

    const newHistory = [...history];
    newHistory.pop(); // remove current state
    const previousStateUrl = newHistory[newHistory.length - 1];

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setHistory(newHistory);
      onSave(previousStateUrl);
    };
    img.src = previousStateUrl;
  };

  // Fun stencil generators for industrial drawing presets
  const drawStencil = (type: "cylinder" | "flange" | "block") => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear and draw background first
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    if (type === "cylinder") {
      // Draw Cylinder wireframe
      // Left ellipse
      ctx.beginPath();
      ctx.ellipse(cx - 80, cy, 25, 55, 0, 0, 2 * Math.PI);
      ctx.stroke();

      // Top and bottom lines
      ctx.beginPath();
      ctx.moveTo(cx - 80, cy - 55);
      ctx.lineTo(cx + 80, cy - 55);
      ctx.moveTo(cx - 80, cy + 55);
      ctx.lineTo(cx + 80, cy + 55);
      ctx.stroke();

      // Right ellipse
      ctx.beginPath();
      ctx.ellipse(cx + 80, cy, 25, 55, 0, 0, 2 * Math.PI);
      ctx.stroke();

      // Horizontal dashed axis line
      ctx.strokeStyle = `${colors.stroke}80`; // semi-transparent
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(cx - 120, cy);
      ctx.lineTo(cx + 120, cy);
      ctx.stroke();
      ctx.setLineDash([]); // reset
    } else if (type === "flange") {
      // Draw Circular Flange
      // Outer Circle
      ctx.beginPath();
      ctx.arc(cx, cy, 80, 0, 2 * Math.PI);
      ctx.stroke();

      // Inner Bore Circle
      ctx.beginPath();
      ctx.arc(cx, cy, 35, 0, 2 * Math.PI);
      ctx.stroke();

      // 4 concentric bolt-holes
      ctx.fillStyle = colors.stroke;
      const boltRadius = 6;
      const pitchCircleR = 60;
      const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
      angles.forEach(angle => {
        const bx = cx + Math.cos(angle) * pitchCircleR;
        const by = cy + Math.sin(angle) * pitchCircleR;
        ctx.beginPath();
        ctx.arc(bx, by, boltRadius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fill();
      });

      // Axis lines
      ctx.strokeStyle = `${colors.stroke}50`;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx - 100, cy);
      ctx.lineTo(cx + 100, cy);
      ctx.moveTo(cx, cy - 100);
      ctx.lineTo(cx, cy + 100);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (type === "block") {
      // Draw 3D Isometric block outline
      ctx.beginPath();
      // Front face
      ctx.moveTo(cx - 60, cy + 30);
      ctx.lineTo(cx + 20, cy + 30);
      ctx.lineTo(cx + 20, cy - 30);
      ctx.lineTo(cx - 60, cy - 30);
      ctx.closePath();
      ctx.stroke();

      // Top face projection
      ctx.beginPath();
      ctx.moveTo(cx - 60, cy - 30);
      ctx.lineTo(cx - 20, cy - 60);
      ctx.lineTo(cx + 60, cy - 60);
      ctx.lineTo(cx + 20, cy - 30);
      ctx.stroke();

      // Side face projection
      ctx.beginPath();
      ctx.moveTo(cx + 20, cy - 30);
      ctx.lineTo(cx + 60, cy - 60);
      ctx.lineTo(cx + 60, cy);
      ctx.lineTo(cx + 20, cy + 30);
      ctx.stroke();
    }

    saveState();
  };

  return (
    <div className="space-y-3">
      {/* Preset Stencils */}
      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-950/40 rounded-lg border border-slate-800/60 justify-between">
        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
          <Palette className="w-3.5 h-3.5 text-indigo-400" />
          Modelos Rápidos (Gabaritos CAD):
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => drawStencil("cylinder")}
            className="px-2 py-1 text-[9px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition flex items-center gap-1"
          >
            <Star className="w-2.5 h-2.5 text-amber-400" />
            Cilindro
          </button>
          <button
            type="button"
            onClick={() => drawStencil("flange")}
            className="px-2 py-1 text-[9px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition flex items-center gap-1"
          >
            <Star className="w-2.5 h-2.5 text-amber-400" />
            Flange Furos
          </button>
          <button
            type="button"
            onClick={() => drawStencil("block")}
            className="px-2 py-1 text-[9px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition flex items-center gap-1"
          >
            <Star className="w-2.5 h-2.5 text-amber-400" />
            Bloco 3D
          </button>
        </div>
      </div>

      {/* Canvas Frame */}
      <div className="relative border border-slate-800 rounded-lg overflow-hidden group shadow-inner">
        <canvas
          ref={canvasRef}
          width={320}
          height={240}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-[180px] block cursor-crosshair touch-none"
        />

        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition">
          <button
            type="button"
            onClick={undoLast}
            disabled={history.length === 0}
            className="p-1.5 bg-slate-900/95 hover:bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-800 transition disabled:opacity-40"
            title="Desfazer traço"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={clearCanvas}
            className="p-1.5 bg-slate-900/95 hover:bg-red-950/80 text-slate-300 hover:text-red-400 rounded border border-slate-800 hover:border-red-500/20 transition"
            title="Limpar esboço"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Small guidance text inside canvas */}
        {!savedImage && (
          <div className="absolute inset-x-0 top-3 text-center pointer-events-none opacity-40 select-none">
            <p className="text-[10px] font-mono text-slate-400">Desenhe aqui a peça ou clique num gabarito</p>
          </div>
        )}
      </div>
    </div>
  );
}
