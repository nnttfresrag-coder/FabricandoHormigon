/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Hammer, 
  Droplets, 
  Layers, 
  RotateCw, 
  Timer, 
  CheckCircle2, 
  AlertCircle,
  Trash2,
  Info,
  Trophy,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Constants & Types ---

type Ingredient = 'sand' | 'cement' | 'gravel' | 'water';

interface MixState {
  sand: number;
  cement: number;
  gravel: number;
  water: number;
}

interface SimulationResult {
  quality: number; // 0 to 100
  strength: string;
  feedback: string[];
  status: 'success' | 'warning' | 'fail';
  characteristics: string;
  improvements: string[];
}

const INITIAL_MIX: MixState = {
  sand: 0,
  cement: 0,
  gravel: 0,
  water: 0,
};

// --- Helper Components ---

const ProgressBar = ({ value, label, color = "bg-blue-500" }: { value: number, label: string, color?: string }) => (
  <div className="w-full mb-4">
    <div className="flex justify-between mb-1">
      <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">{label}</span>
      <span className="text-xs font-semibold text-gray-900">{Math.round(value)}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
      <motion.div 
        className={`h-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(value, 100)}%` }}
        transition={{ duration: 0.5 }}
      />
    </div>
  </div>
);

const MixingVessel = ({ mix, mixingProgress, isCuring }: { mix: MixState, mixingProgress: number, isCuring: boolean }) => {
  const total = mix.sand + mix.cement + mix.gravel + mix.water;
  const maxCapacity = 400; // Arbitrary max for visualization
  const fillPercent = (total / maxCapacity) * 100;

  // Calculate heights for each layer (pre-mixed)
  const gravelH = total > 0 ? (mix.gravel / total) * fillPercent : 0;
  const sandH = total > 0 ? (mix.sand / total) * fillPercent : 0;
  const cementH = total > 0 ? (mix.cement / total) * fillPercent : 0;
  const waterH = total > 0 ? (mix.water / total) * fillPercent : 0;

  // Mixed color interpolation
  // Pre-mixed: distinct layers
  // Mixing: layers blur
  // Mixed: uniform gray
  const isMixed = mixingProgress >= 100;

  return (
    <div className="relative w-48 h-64 mx-auto">
      {/* Vessel Outline */}
      <div className="absolute inset-0 border-4 border-gray-400 border-t-0 rounded-b-3xl overflow-hidden bg-white/30 backdrop-blur-sm shadow-inner">
        {/* Content Container */}
        <div className="absolute inset-0 flex flex-col-reverse transition-all duration-500">
          {mixingProgress < 100 ? (
            <>
              {/* Gravel Layer */}
              <motion.div 
                animate={{ height: `${gravelH}%` }}
                className="bg-[#7D7D7D] w-full relative border-t border-black/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]"
              >
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:4px_4px]" />
              </motion.div>
              {/* Sand Layer */}
              <motion.div 
                animate={{ height: `${sandH}%` }}
                className="bg-[#E6D5B8] w-full relative border-t border-black/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]"
              >
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:2px_2px]" />
              </motion.div>
              {/* Cement Layer */}
              <motion.div 
                animate={{ height: `${cementH}%` }}
                className="bg-[#A8A8A8] w-full border-t border-black/10"
              />
              {/* Water Layer */}
              <motion.div 
                animate={{ height: `${waterH}%` }}
                className="bg-[#B8E2F2]/90 w-full border-t border-white/30"
              />
            </>
          ) : (
            /* Mixed Concrete */
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: `${fillPercent}%` }}
              className={`w-full relative transition-colors duration-1000 ${isCuring ? 'bg-[#555555]' : 'bg-[#888888]'}`}
            >
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_2px,transparent_2px)] [background-size:10px_10px]" />
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Mixing Paddle (Visual only) */}
      {mixingProgress > 0 && mixingProgress < 100 && (
        <motion.div 
          animate={{ x: [-10, 10, -10], rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 0.5 }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-full bg-gray-600 origin-top z-20"
        />
      )}
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  // State
  const [mix, setMix] = useState<MixState>(INITIAL_MIX);
  const [gravelCrushLevel, setGravelCrushLevel] = useState(0); // 0 (whole) to 100 (powder)
  const [mixingProgress, setMixingProgress] = useState(0);
  const [isMixing, setIsMixing] = useState(false);
  const [curingProgress, setCuringProgress] = useState(0);
  const [isCuring, setIsCuring] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  // Derived values
  const totalVolume = mix.sand + mix.cement + mix.gravel + mix.water;
  const isReadyToMix = totalVolume > 0 && !isMixing && !isCuring && !result;
  const isReadyToCure = mixingProgress >= 100 && !isCuring && !result;

  // Handlers
  const addIngredient = (type: Ingredient, amount: number) => {
    if (isMixing || isCuring || result) return;
    setMix(prev => ({ ...prev, [type]: prev[type] + amount }));
  };

  const resetSimulation = () => {
    setMix(INITIAL_MIX);
    setGravelCrushLevel(0);
    setMixingProgress(0);
    setIsMixing(false);
    setCuringProgress(0);
    setIsCuring(false);
    setResult(null);
  };

  const crushGravel = () => {
    if (isMixing || isCuring || result) return;
    setGravelCrushLevel(prev => Math.min(prev + 10, 100));
  };

  // Mixing Logic
  useEffect(() => {
    let interval: any;
    if (isMixing && mixingProgress < 100) {
      interval = setInterval(() => {
        setMixingProgress(prev => {
          const next = prev + 2;
          if (next >= 100) {
            setIsMixing(false);
            return 100;
          }
          return next;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isMixing, mixingProgress]);

  // Curing Logic
  useEffect(() => {
    let interval: any;
    if (isCuring && curingProgress < 100) {
      interval = setInterval(() => {
        setCuringProgress(prev => {
          const next = prev + 1;
          if (next >= 100) {
            setIsCuring(false);
            evaluateQuality();
            return 100;
          }
          return next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isCuring, curingProgress]);

  const evaluateQuality = () => {
    const { sand, cement, gravel, water } = mix;
    const feedback: string[] = [];
    const improvements: string[] = [];
    let score = 100;
    let characteristics = "";

    // 1. Water-to-Cement Ratio (Ideal ~0.45)
    const wcRatio = cement > 0 ? water / cement : 10;
    if (wcRatio < 0.3) {
      score -= 30;
      feedback.push("Mezcla demasiado seca.");
      characteristics += "Hormigón con baja trabajabilidad, propenso a coqueras (huecos internos). ";
      improvements.push("Aumenta ligeramente el agua o usa aditivos plastificantes.");
    } else if (wcRatio > 0.6) {
      score -= 40;
      feedback.push("Exceso de agua.");
      characteristics += "Hormigón muy fluido pero con alta porosidad y baja resistencia final. ";
      improvements.push("Reduce la cantidad de agua para evitar la segregación y exudación.");
    } else {
      characteristics += "Buena consistencia y equilibrio entre resistencia y trabajabilidad. ";
    }

    // 2. Aggregate Proportions
    const aggregateRatio = gravel > 0 ? sand / gravel : 10;
    if (aggregateRatio < 0.3) {
      score -= 15;
      feedback.push("Poca arena.");
      characteristics += "Estructura interna discontinua con exceso de huecos entre gravas. ";
      improvements.push("Añade más arena para rellenar los espacios entre la gravilla.");
    } else if (aggregateRatio > 0.7) {
      score -= 15;
      feedback.push("Demasiada arena.");
      characteristics += "Mezcla 'pastosa' que requiere más pasta de cemento para recubrir los granos. ";
      improvements.push("Aumenta la proporción de gravilla para mejorar el esqueleto resistente.");
    }

    // 3. Cement Content
    const totalAgg = sand + gravel;
    const cementRatio = totalAgg > 0 ? cement / totalAgg : 0;
    if (cementRatio < 0.15) {
      score -= 25;
      feedback.push("Falta cemento.");
      characteristics += "Baja capacidad de unión; el hormigón se desmoronará bajo carga. ";
      improvements.push("Incrementa la dosificación de cemento para asegurar la matriz adhesiva.");
    } else if (cementRatio > 0.3) {
      score -= 10;
      feedback.push("Exceso de cemento.");
      characteristics += "Alta resistencia inicial pero muy propenso a fisuras térmicas y retracción. ";
      improvements.push("Optimiza la cantidad de cemento para reducir costes y riesgos de fisuración.");
    }

    // 4. Gravel Size / Crushing
    if (gravelCrushLevel < 30) {
      score -= 10;
      feedback.push("Gravilla muy redondeada.");
      characteristics += "Menor trabazón mecánica entre áridos. ";
      improvements.push("Tritura más la gravilla para obtener caras angulares que mejoren el 'interlocking'.");
    } else if (gravelCrushLevel > 80) {
      score -= 15;
      feedback.push("Gravilla pulverizada.");
      characteristics += "Pérdida del esqueleto grueso del hormigón. ";
      improvements.push("No tritures en exceso; el hormigón necesita áridos gruesos para la resistencia.");
    }

    // Final Status
    let status: 'success' | 'warning' | 'fail' = 'success';
    let strength = "Alta (H-30)";
    
    if (score < 40) {
      status = 'fail';
      strength = "Nula / Escombros";
    } else if (score < 70) {
      status = 'warning';
      strength = "Media (H-15)";
    }

    setResult({
      quality: Math.max(0, Math.min(score, 100)),
      strength,
      feedback,
      status,
      characteristics,
      improvements
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] font-sans p-4 md:p-8">
      {/* Header */}
      <header className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b border-[#141414] pb-6">
        <div>
          <h1 className="text-4xl md:text-6xl font-serif italic tracking-tight mb-2">Simulador de Hormigón</h1>
          <p className="text-sm uppercase tracking-widest opacity-60">Laboratorio de Materiales de Construcción</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-4">
          <button 
            onClick={() => setShowInfo(!showInfo)}
            className="p-3 rounded-full border border-[#141414] hover:bg-[#141414] hover:text-[#F5F5F0] transition-colors"
          >
            <Info size={20} />
          </button>
          <button 
            onClick={resetSimulation}
            className="p-3 rounded-full border border-[#141414] hover:bg-red-500 hover:text-white transition-colors"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Workbench */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Ingredients Section */}
          <section className="bg-white border border-[#141414] p-6 rounded-2xl shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
            <h2 className="text-xs uppercase tracking-widest opacity-50 mb-6 flex items-center gap-2">
              <Layers size={14} /> Suministro de Materiales
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {/* Sand */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-full aspect-square bg-[#E6D5B8] rounded-xl flex items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:4px_4px]"></div>
                  <span className="text-2xl font-serif italic">Arena</span>
                  <button 
                    onClick={() => addIngredient('sand', 10)}
                    disabled={isMixing || isCuring || !!result}
                    className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center transition-all disabled:hidden"
                  >
                    <span className="bg-white text-black px-3 py-1 rounded-full text-xs font-bold shadow-sm">+10kg</span>
                  </button>
                </div>
                <span className="text-sm font-mono">{mix.sand}kg</span>
              </div>

              {/* Cement */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-full aspect-square bg-[#A8A8A8] rounded-xl flex items-center justify-center relative overflow-hidden group">
                  <span className="text-2xl font-serif italic text-white">Cemento</span>
                  <button 
                    onClick={() => addIngredient('cement', 10)}
                    disabled={isMixing || isCuring || !!result}
                    className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center transition-all disabled:hidden"
                  >
                    <span className="bg-white text-black px-3 py-1 rounded-full text-xs font-bold shadow-sm">+10kg</span>
                  </button>
                </div>
                <span className="text-sm font-mono">{mix.cement}kg</span>
              </div>

              {/* Gravel */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-full aspect-square bg-[#7D7D7D] rounded-xl flex flex-col items-center justify-center relative overflow-hidden group">
                  <span className="text-2xl font-serif italic text-white">Gravilla</span>
                  <div className="mt-2 flex gap-1">
                    {[...Array(3)].map((_, i) => (
                      <div 
                        key={i} 
                        className="w-2 h-2 bg-white/50 rounded-full"
                        style={{ transform: `scale(${1 - (gravelCrushLevel / 150)})` }}
                      />
                    ))}
                  </div>
                  <button 
                    onClick={() => addIngredient('gravel', 10)}
                    disabled={isMixing || isCuring || !!result}
                    className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center transition-all disabled:hidden"
                  >
                    <span className="bg-white text-black px-3 py-1 rounded-full text-xs font-bold shadow-sm">+10kg</span>
                  </button>
                </div>
                <span className="text-sm font-mono">{mix.gravel}kg</span>
              </div>

              {/* Water */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-full aspect-square bg-[#B8E2F2] rounded-xl flex items-center justify-center relative overflow-hidden group">
                  <Droplets className="text-[#4A90E2]" size={32} />
                  <button 
                    onClick={() => addIngredient('water', 5)}
                    disabled={isMixing || isCuring || !!result}
                    className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center transition-all disabled:hidden"
                  >
                    <span className="bg-white text-black px-3 py-1 rounded-full text-xs font-bold shadow-sm">+5L</span>
                  </button>
                </div>
                <span className="text-sm font-mono">{mix.water}L</span>
              </div>
            </div>
          </section>

          {/* Visual Vessel Section */}
          <section className="bg-white border border-[#141414] p-8 rounded-2xl flex flex-col items-center justify-center min-h-[400px]">
            <h2 className="text-xs uppercase tracking-widest opacity-50 mb-8 w-full text-left flex items-center gap-2">
              <Activity size={14} /> Vaso de Mezcla
            </h2>
            <MixingVessel mix={mix} mixingProgress={mixingProgress} isCuring={isCuring} />
            <div className="mt-8 text-center">
              <p className="text-sm font-serif italic opacity-60">
                {totalVolume === 0 ? "Vierte ingredientes para comenzar..." : 
                 isMixing ? "Mezclando componentes..." :
                 isCuring ? "Fraguando en el molde..." :
                 result ? "Resultado final obtenido." : "Listo para mezclar."}
              </p>
            </div>
          </section>

          {/* Tools & Mixing Area */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Tool: Hammer */}
            <div className="bg-white border border-[#141414] p-6 rounded-2xl">
              <h3 className="text-xs uppercase tracking-widest opacity-50 mb-4 flex items-center gap-2">
                <Hammer size={14} /> Trituradora Manual
              </h3>
              <div className="flex items-center gap-6">
                <motion.button
                  whileTap={{ scale: 0.9, rotate: -15 }}
                  onClick={crushGravel}
                  disabled={mix.gravel === 0 || isMixing || isCuring || !!result}
                  className="w-20 h-20 rounded-full bg-[#141414] text-white flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <Hammer size={32} />
                </motion.button>
                <div className="flex-1">
                  <ProgressBar value={gravelCrushLevel} label="Nivel de Triturado" color="bg-orange-500" />
                  <p className="text-[10px] text-gray-500 italic">Pulsa para triturar la gravilla y mejorar el agarre.</p>
                </div>
              </div>
            </div>

            {/* Mixing Control */}
            <div className="bg-white border border-[#141414] p-6 rounded-2xl">
              <h3 className="text-xs uppercase tracking-widest opacity-50 mb-4 flex items-center gap-2">
                <RotateCw size={14} /> Mezcladora
              </h3>
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setIsMixing(true)}
                  disabled={!isReadyToMix}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                    isMixing ? 'bg-blue-500 animate-spin' : 'bg-[#141414] text-white'
                  } disabled:opacity-20`}
                >
                  <RotateCw size={32} />
                </button>
                <div className="flex-1">
                  <ProgressBar value={mixingProgress} label="Progreso de Mezcla" color="bg-blue-500" />
                  <p className="text-[10px] text-gray-500 italic">Mezcla bien los componentes antes de fraguar.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Curing Area */}
          <section className="bg-[#141414] text-white p-8 rounded-2xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-serif italic mb-2">Proceso de Fraguado</h3>
                <p className="text-sm opacity-60 max-w-xs">El tiempo y la temperatura determinarán la dureza final del bloque.</p>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-4xl font-mono mb-1">{Math.round(curingProgress)}%</div>
                  <div className="text-[10px] uppercase tracking-widest opacity-50">Completado</div>
                </div>
                
                <button
                  onClick={() => setIsCuring(true)}
                  disabled={!isReadyToCure}
                  className="px-8 py-4 bg-white text-black rounded-full font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors disabled:opacity-20"
                >
                  {isCuring ? 'Fraguando...' : 'Iniciar Fraguado'}
                </button>
              </div>
            </div>
            
            {/* Decorative background animation for curing */}
            {isCuring && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.1 }}
                className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500"
              />
            )}
          </section>
        </div>

        {/* Right Column: Results & Stats */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Current Mix Stats */}
          <section className="bg-white border border-[#141414] p-6 rounded-2xl">
            <h2 className="text-xs uppercase tracking-widest opacity-50 mb-6 flex items-center gap-2">
              <Activity size={14} /> Composición Actual
            </h2>
            
            <div className="space-y-4">
              <ProgressBar value={(mix.sand / 200) * 100} label="Arena" color="bg-[#E6D5B8]" />
              <ProgressBar value={(mix.cement / 200) * 100} label="Cemento" color="bg-[#A8A8A8]" />
              <ProgressBar value={(mix.gravel / 200) * 100} label="Gravilla" color="bg-[#7D7D7D]" />
              <ProgressBar value={(mix.water / 100) * 100} label="Agua" color="bg-[#B8E2F2]" />
              
              <div className="pt-4 border-t border-gray-100 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="opacity-60">Volumen Total</span>
                  <span className="font-mono font-bold">{totalVolume} Unidades</span>
                </div>
              </div>
            </div>
          </section>

          {/* Final Results */}
          <AnimatePresence>
            {result && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-2xl border-2 ${
                  result.status === 'success' ? 'border-green-500 bg-green-50' : 
                  result.status === 'warning' ? 'border-yellow-500 bg-yellow-50' : 
                  'border-red-500 bg-red-50'
                }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-serif italic">Resultado Final</h2>
                  {result.status === 'success' ? <Trophy className="text-green-600" /> : <AlertCircle className="text-red-600" />}
                </div>

                <div className="text-center mb-8">
                  <div className="text-5xl font-mono font-bold mb-1">{result.quality}</div>
                  <div className="text-xs uppercase tracking-widest opacity-60">Calidad del Hormigón</div>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                    <span className="text-sm">Resistencia Est.</span>
                    <span className="font-bold">{result.strength}</span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] uppercase tracking-widest opacity-50">Características</span>
                    <p className="text-xs leading-relaxed">{result.characteristics}</p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] uppercase tracking-widest opacity-50">Mejoras Sugeridas</span>
                    <ul className="space-y-2">
                      {result.improvements.map((imp, i) => (
                        <li key={i} className="flex gap-2 text-xs items-start">
                          <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-blue-500" />
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] uppercase tracking-widest opacity-50">Alertas</span>
                    {result.feedback.map((f, i) => (
                      <div key={i} className="flex gap-2 text-xs items-start text-red-600">
                        <AlertCircle size={12} className="mt-0.5 shrink-0" />
                        <p>{f}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={resetSimulation}
                  className="w-full mt-8 py-3 bg-[#141414] text-white rounded-xl text-sm font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
                >
                  Nueva Simulación
                </button>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Info Panel */}
          <AnimatePresence>
            {showInfo && (
              <motion.section 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#141414] text-white p-6 rounded-2xl"
              >
                <h3 className="text-lg font-serif italic mb-4">Guía de Mezcla</h3>
                <ul className="text-xs space-y-3 opacity-80">
                  <li className="flex gap-2">
                    <CheckCircle2 size={14} className="shrink-0 text-green-400" />
                    <span>La relación agua/cemento debe estar cerca de 0.45.</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 size={14} className="shrink-0 text-green-400" />
                    <span>Usa el doble de gravilla que de arena para una estructura sólida.</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 size={14} className="shrink-0 text-green-400" />
                    <span>Tritura la gravilla hasta un nivel medio (40-60%) para optimizar el interlocking.</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 size={14} className="shrink-0 text-green-400" />
                    <span>Asegúrate de que la mezcla llegue al 100% antes de fraguar.</span>
                  </li>
                </ul>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto mt-12 pt-8 border-t border-gray-200 text-center text-[10px] uppercase tracking-[0.2em] opacity-40">
        &copy; 2026 Laboratorio Virtual de Ingeniería Civil &bull; Simulación de Materiales
      </footer>
    </div>
  );
}
