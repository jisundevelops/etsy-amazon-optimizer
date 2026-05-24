import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Copy, 
  Check, 
  Tag, 
  ChevronDown, 
  AlertCircle, 
  FileText, 
  Layers,
  ArrowRight,
  Trophy,
  GitCompare,
  Cpu,
  Zap,
  Star
} from "lucide-react";

// Types
type Platform = "Etsy" | "Amazon" | "Both";
type AIModel = "deepseek-v4-flash" | "llama-3.3-70b" | "qwen3-32b";
type GenerateMode = "single" | "compare";

interface GeneratedListing {
  title: string;
  description: string;
  tags: string[];
  model?: string;
  error?: string;
}

interface BestPick {
  bestModel: string;
  reason: string;
  scores: Record<string, { title: number; description: number; tags: number; overall: number }>;
}

interface FormErrors {
  productName?: string;
  features?: string;
}

const CATEGORIES = [
  "Home & Living",
  "Jewelry & Accessories",
  "Art & Collectibles",
  "Clothing & Shoes",
  "Digital Downloads",
  "Craft Supplies",
  "Beauty & Personal Care",
  "Other"
];

const AI_MODELS: { key: AIModel; name: string; badge: string; color: string }[] = [
  { key: "deepseek-v4-flash", name: "DeepSeek V4 Flash", badge: "Best Reasoning", color: "bg-blue-500" },
  { key: "llama-3.3-70b", name: "Llama 3.3 70B", badge: "Most Balanced", color: "bg-purple-500" },
  { key: "qwen3-32b", name: "Qwen3 Next 80B", badge: "Fast & Smart", color: "bg-orange-500" }
];

export default function App() {
  // Form States
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [features, setFeatures] = useState("");
  const [audience, setAudience] = useState("");
  const [price, setPrice] = useState("");
  const [platform, setPlatform] = useState<Platform>("Both");

  // AI Model & Mode States
  const [selectedModel, setSelectedModel] = useState<AIModel>("deepseek-v4-flash");
  const [generateMode, setGenerateMode] = useState<GenerateMode>("single");

  // UX States
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedListing | null>(null);
  const [compareResults, setCompareResults] = useState<GeneratedListing[] | null>(null);
  const [bestPick, setBestPick] = useState<BestPick | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Copy Feedback States
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Clear toast after 3 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Form Validation
  const validateForm = (): boolean => {
    const tempErrors: FormErrors = {};
    if (!productName.trim()) tempErrors.productName = "Product name is required.";
    if (!features.trim()) tempErrors.features = "Key features are required.";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Submit Generation Request
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setApiError(null);
    setResult(null);
    setCompareResults(null);
    setBestPick(null);

    const requestBody = {
      productName, category, features, audience, price, platform,
      ...(generateMode === "single" ? { model: selectedModel } : {})
    };

    try {
      const endpoint = generateMode === "single" ? "/api/generate" : "/api/compare";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate listing. Please try again.");
      }

      if (generateMode === "single") {
        setResult(data);
        setToastMessage("SEO listing compiled successfully!");
      } else {
        setCompareResults(data.results);
        setBestPick(data.bestPick);
        setToastMessage("All 3 AI models compared!");
      }
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Copy Handler
  const handleCopy = (text: string, fieldId: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldId);
      setToastMessage(`${label} copied!`);
      setTimeout(() => setCopiedField(null), 2000);
    }).catch(() => setToastMessage("Failed to copy."));
  };

  const getModelName = (key: string) => AI_MODELS.find(m => m.key === key)?.name || key;
  const getModelColor = (key: string) => AI_MODELS.find(m => m.key === key)?.color || "bg-slate-500";

  // Render a single result card
  const ResultCard = ({ listing, isBest, scores }: { listing: GeneratedListing; isBest?: boolean; scores?: { title: number; description: number; tags: number; overall: number } }) => {
    if (listing.error) {
      return (
        <div className="bg-red-50/50 rounded-xl border border-red-100 p-4 text-center">
          <AlertCircle className="w-5 h-5 text-red-400 mx-auto mb-2" />
          <p className="text-xs text-red-600 font-medium">{getModelName(listing.model)} failed</p>
          <p className="text-[10px] text-red-400 mt-1">{listing.error}</p>
        </div>
      );
    }

    return (
      <div className={`bg-white rounded-xl border ${isBest ? 'border-[#00B67A] ring-2 ring-[#00B67A]/20' : 'border-slate-200'} p-4 flex flex-col h-full`}>
        {/* Model Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getModelColor(listing.model || '')}`} />
            <span className="text-xs font-bold text-slate-700">{getModelName(listing.model || '')}</span>
          </div>
          {isBest && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-[#00B67A]/10 text-[#00B67A] text-[10px] font-bold rounded-full">
              <Trophy className="w-3 h-3" /> BEST
            </span>
          )}
          {scores && (
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              Score: {scores.overall}/100
            </span>
          )}
        </div>

        {/* Title */}
        <div className="mb-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Title</span>
            <span className={`text-[10px] font-mono ${listing.title.length > 140 ? 'text-red-400' : 'text-[#00B67A]'}`}>
              {listing.title.length}/140
            </span>
          </div>
          <p className="text-xs font-semibold text-[#0A2540] leading-snug bg-slate-50 p-2 rounded-lg border border-slate-100 select-all">
            {listing.title}
          </p>
        </div>

        {/* Description */}
        <div className="mb-2 flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Description</span>
            <span className="text-[10px] font-mono text-slate-400">~{listing.description.split(/\s+/).filter(Boolean).length}w</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100 max-h-[120px] overflow-y-auto whitespace-pre-line">
            {listing.description}
          </p>
        </div>

        {/* Tags */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Tags</span>
            <span className="text-[10px] font-mono text-slate-400">{listing.tags.length}/13</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {listing.tags.slice(0, 6).map((tag, i) => (
              <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-semibold rounded border border-slate-200">
                #{tag.toLowerCase().replace(/\s+/g, '')}
              </span>
            ))}
            {listing.tags.length > 6 && (
              <span className="px-1.5 py-0.5 text-[9px] text-slate-400 font-semibold">+{listing.tags.length - 6} more</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-800 selection:bg-[#00B67A]/30 selection:text-slate-900 pb-16">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center space-x-3 border border-slate-800 text-sm font-medium max-w-sm"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#00B67A] shrink-0 animate-ping" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <header className="bg-[#0A2540] text-white px-6 md:px-8 py-5 flex flex-col sm:flex-row justify-between items-center border-b-4 border-[#00B67A] shadow-md relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#00B67A]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col text-center sm:text-left z-10">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Etsy & Amazon Listing Optimizer</h1>
          <p className="text-[#00B67A] text-xs font-semibold uppercase tracking-widest mt-1">
            Multi-AI SEO Engine • Compare & Pick Best
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs opacity-90 z-10 mt-3 sm:mt-0 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
          <span className="w-2 h-2 rounded-full bg-[#00B67A] animate-pulse"></span>
          <span className="text-slate-300 font-mono">Groq + OpenRouter • 3 AI Models</span>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-7xl w-full mx-auto px-4 md:px-8 mt-6 grid grid-cols-12 gap-6 items-stretch flex-1">
        
        {/* FORM SECTION */}
        <section className="col-span-12 lg:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between overflow-hidden">
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-[#0A2540] uppercase tracking-wider mb-2 pb-2 border-b border-slate-100 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#00B67A]" />
              Product Details
            </h2>

            <form onSubmit={handleGenerate} className="space-y-3">
              {/* Product Name */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label htmlFor="productName" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Product Name <span className="text-emerald-600">*</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">{productName.length}/100</span>
                </div>
                <input
                  id="productName"
                  type="text"
                  maxLength={100}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-1 transition-all ${
                    errors.productName ? "border-red-400 focus:ring-red-300" : "border-slate-200 focus:ring-[#00B67A] focus:border-[#00B67A] focus:bg-white"
                  }`}
                  placeholder="e.g. Handmade Speckled Ceramic Mug"
                  value={productName}
                  onChange={(e) => {
                    setProductName(e.target.value);
                    if (e.target.value.trim() && errors.productName) setErrors((prev) => ({ ...prev, productName: undefined }));
                  }}
                />
                {errors.productName && (
                  <p className="text-[11px] text-red-500 flex items-center gap-1 mt-0.5">
                    <AlertCircle className="w-3 h-3 shrink-0" />{errors.productName}
                  </p>
                )}
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Category</label>
                <div className="relative">
                  <select
                    className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#00B67A] focus:bg-white transition-all"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400"><ChevronDown className="w-4 h-4" /></div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Key Features / Materials <span className="text-emerald-600">*</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">{features.length}/500</span>
                </div>
                <textarea
                  maxLength={500}
                  rows={3}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-1 transition-all resize-none ${
                    errors.features ? "border-red-400 focus:ring-red-300" : "border-slate-200 focus:ring-[#00B67A] focus:border-[#00B67A] focus:bg-white"
                  }`}
                  placeholder="12oz capacity, lead-free glaze, ergonomic handle, microwave safe."
                  value={features}
                  onChange={(e) => {
                    setFeatures(e.target.value);
                    if (e.target.value.trim() && errors.features) setErrors((prev) => ({ ...prev, features: undefined }));
                  }}
                />
                {errors.features && (
                  <p className="text-[11px] text-red-500 flex items-center gap-1 mt-0.5">
                    <AlertCircle className="w-3 h-3 shrink-0" />{errors.features}
                  </p>
                )}
              </div>

              {/* Audience & Price */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Audience</label>
                  <input type="text" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#00B67A] focus:bg-white transition-all" placeholder="e.g. Coffee Lovers" value={audience} onChange={(e) => setAudience(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Price</label>
                  <input type="text" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#00B67A] focus:bg-white transition-all" placeholder="e.g. $34.00" value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
              </div>

              {/* Platform */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Target Platform</label>
                <div className="flex space-x-2 bg-slate-50 p-1 rounded-lg border border-slate-100">
                  {(["Etsy", "Amazon", "Both"] as Platform[]).map((plat) => (
                    <button key={plat} type="button" className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${platform === plat ? "bg-[#00B67A] text-white shadow-sm" : "bg-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-100/50"}`} onClick={() => setPlatform(plat)}>
                      {plat}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Model Selection - NEW! */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-[#00B67A]" />
                  AI Model
                </label>
                <div className="space-y-1.5">
                  {AI_MODELS.map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setSelectedModel(m.key)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-all cursor-pointer ${
                        selectedModel === m.key
                          ? "border-[#00B67A] bg-[#00B67A]/5 ring-1 ring-[#00B67A]/20"
                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${m.color}`} />
                        <span className="text-xs font-semibold text-slate-700">{m.name}</span>
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        selectedModel === m.key ? "bg-[#00B67A]/10 text-[#00B67A]" : "bg-slate-100 text-slate-400"
                      }`}>
                        {m.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Mode Toggle - NEW! */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <GitCompare className="w-3 h-3 text-[#00B67A]" />
                  Mode
                </label>
                <div className="flex space-x-2 bg-slate-50 p-1 rounded-lg border border-slate-100">
                  <button
                    type="button"
                    className={`flex-1 py-2 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      generateMode === "single" ? "bg-[#0A2540] text-white shadow-sm" : "bg-transparent text-slate-600 hover:text-slate-800"
                    }`}
                    onClick={() => setGenerateMode("single")}
                  >
                    <Zap className="w-3 h-3" />
                    Single Model
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-2 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      generateMode === "compare" ? "bg-[#00B67A] text-white shadow-sm" : "bg-transparent text-slate-600 hover:text-slate-800"
                    }`}
                    onClick={() => setGenerateMode("compare")}
                  >
                    <GitCompare className="w-3 h-3" />
                    Compare All
                  </button>
                </div>
                {generateMode === "compare" && (
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    All 3 AI models will generate listings simultaneously. An AI judge will pick the best one.
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full mt-1 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-md transition-all active:scale-[0.98] cursor-pointer ${
                  loading ? "bg-slate-400 cursor-not-allowed" : generateMode === "compare" ? "bg-[#00B67A] hover:bg-[#009a66]" : "bg-[#0A2540] hover:bg-[#153450]"
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-200 border-t-white rounded-full animate-spin" />
                    <span>{generateMode === "compare" ? "COMPARING 3 AI MODELS..." : "GENERATING..."}</span>
                  </>
                ) : (
                  <>
                    {generateMode === "compare" ? (
                      <>
                        <GitCompare className="w-4 h-4 shrink-0" />
                        <span>COMPARE ALL MODELS</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-[#00B67A] shrink-0 fill-[#00B67A] animate-pulse" />
                        <span>OPTIMIZE LISTING</span>
                      </>
                    )}
                  </>
                )}
              </button>
            </form>
          </div>
        </section>

        {/* OUTPUT SECTION */}
        <section className="col-span-12 lg:col-span-8 flex flex-col h-full min-h-[520px]">
          <AnimatePresence mode="wait">
            
            {/* LOADING */}
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-center h-full my-auto"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-[#00B67A] animate-spin mb-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  {generateMode === "compare" ? "Comparing All 3 AI Models" : "Generating Optimized SEO Assets"}
                </h3>
                <p className="text-xs text-slate-400 mt-2 max-w-sm font-medium">
                  {generateMode === "compare" 
                    ? <>Running <strong className="text-slate-600">DeepSeek V4 Flash</strong>, <strong className="text-slate-600">Llama 3.3 70B</strong>, and <strong className="text-slate-600">Qwen3 Next 80B</strong> in parallel...</>
                    : <>Applying platform-specific guidelines for <strong className="text-slate-600">{platform === "Both" ? "Etsy & Amazon" : platform}</strong> using <strong className="text-slate-600">{getModelName(selectedModel)}</strong>.</>
                  }
                </p>
                {generateMode === "compare" && (
                  <div className="mt-6 space-y-2 w-full max-w-xs text-left border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin shrink-0" />
                      <span>DeepSeek V4 Flash generating...</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-purple-400 border-t-transparent animate-spin shrink-0" />
                      <span>Llama 3.3 70B generating...</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-orange-400 border-t-transparent animate-spin shrink-0" />
                      <span>Qwen3 Next 80B generating...</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ERROR */}
            {apiError && !loading && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50/50 rounded-2xl border border-red-100 shadow-sm p-8 flex flex-col items-center justify-center text-center h-full my-auto"
              >
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4"><AlertCircle className="w-6 h-6" /></div>
                <h3 className="text-lg font-bold text-slate-950">Generation Failed</h3>
                <p className="text-sm text-red-600 mt-2 max-w-md bg-white border border-red-100 px-4 py-2.5 rounded-xl text-left font-mono text-xs overflow-auto max-h-40 shadow-inner">{apiError}</p>
                <button onClick={handleGenerate} className="mt-6 px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm shadow-md hover:bg-slate-800 transition-all cursor-pointer">Try Again</button>
              </motion.div>
            )}

            {/* EMPTY STATE */}
            {!result && !compareResults && !loading && !apiError && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-50 border border-slate-200/50 rounded-2xl p-10 flex flex-col items-center justify-center text-center h-full min-h-[460px] my-auto"
              >
                <div className="w-16 h-16 rounded-2xl bg-[#0A2540]/5 flex items-center justify-center text-[#0A2540] mb-5 shadow-sm">
                  <Layers className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Your Optimized Listing Awaits</h3>
                <p className="text-slate-500 text-sm mt-2 max-w-sm leading-relaxed">
                  Choose an AI model or compare all three, then click <strong className="text-slate-700">"Optimize Listing"</strong> to generate high-ranking SEO content.
                </p>
                <div className="grid grid-cols-3 gap-4 w-full max-w-md mt-8 pt-6 border-t border-slate-200/60">
                  <div className="text-center">
                    <span className="block text-xl font-extrabold text-blue-500">3</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">AI Models</span>
                  </div>
                  <div className="text-center border-x border-slate-200">
                    <span className="block text-xl font-extrabold text-[#00B67A] font-mono">⚡</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fast</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-xl font-extrabold text-purple-500">AI</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Judge</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SINGLE MODEL RESULT */}
            {result && !loading && !apiError && generateMode === "single" && (
              <motion.div
                key="single-result"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="grid grid-cols-2 gap-4 h-full"
              >
                {/* Title Card */}
                <div className="col-span-2 bg-white rounded-2xl shadow-sm border-l-4 border-l-[#00B67A] p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#00B67A]" />
                        Optimized Product Title
                        <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full ml-1">{getModelName(result.model || selectedModel)}</span>
                      </h3>
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-md ${result.title.length > 140 ? "bg-red-50 text-red-500" : "bg-[#00B67A]/10 text-[#00B67A]"}`}>
                        {result.title.length} / 140 Chars
                      </span>
                    </div>
                    <p className="text-base font-semibold text-[#0A2540] leading-snug font-mono select-all bg-slate-50/50 p-4 rounded-xl border border-slate-100">{result.title}</p>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button onClick={() => handleCopy(result.title, "title", "Title")} className="text-[#00B67A] hover:text-[#00B67A]/80 text-xs font-bold flex items-center gap-1 hover:underline uppercase tracking-tighter cursor-pointer">
                      {copiedField === "title" ? <><Check className="w-3.5 h-3.5 text-emerald-600 animate-pulse" /><span>Copied!</span></> : <><Copy className="w-3.5 h-3.5" /><span>Copy Title</span></>}
                    </button>
                  </div>
                </div>

                {/* Description Card */}
                <div className="col-span-2 md:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col h-full max-h-[380px] overflow-hidden">
                  <div className="flex justify-between items-start mb-2 border-b border-slate-50 pb-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#00B67A]" />SEO Description
                    </h3>
                    <button onClick={() => handleCopy(result.description, "desc", "Description")} className="text-[#00B67A] hover:text-[#00B67A]/80 text-xs font-bold uppercase tracking-tighter flex items-center gap-1 cursor-pointer">
                      {copiedField === "desc" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-2 text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-line bg-slate-50/50 p-3 rounded-lg border border-slate-100">{result.description}</div>
                  <div className="mt-2 text-[10px] text-slate-400 font-mono text-right">~{result.description.split(/\s+/).filter(Boolean).length} words</div>
                </div>

                {/* Tags & Actions */}
                <div className="col-span-2 md:col-span-1 flex flex-col space-y-4">
                  <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3 text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-[#00B67A]" />Optimized SEO Tags</span>
                        <span>{result.tags.length} / 13</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-[170px] overflow-y-auto pr-1">
                        {result.tags.map((tag, i) => (
                          <span key={`${tag}-${i}`} className="px-2 py-1 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded-md border border-slate-200 hover:bg-slate-200/50 transition-all select-all flex items-center gap-1">
                            #{tag.toLowerCase().replace(/\s+/g, '')}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => handleCopy(result.tags.join(", "), "tags", "All tags")} className="mt-4 w-full py-2 border border-dashed border-[#00B67A] text-[#00B67A] hover:bg-[#00B67A]/5 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer">
                      {copiedField === "tags" ? "Copied All Tags!" : "Copy All Tags"}
                    </button>
                  </div>
                  <div className="bg-[#00B67A] text-white p-4 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-center space-x-3 z-10">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">✓</div>
                      <div>
                        <p className="text-[10px] font-bold opacity-80 uppercase">SEO Rank Score</p>
                        <p className="text-lg font-bold">98 / 100</p>
                      </div>
                    </div>
                    <button onClick={() => handleCopy(`=== OPTIMIZED LISTING ===\n\nTitle: ${result.title}\n\nDescription: ${result.description}\n\nTags: ${result.tags.join(", ")}`, "all", "Everything")} className="px-4 py-2 bg-white text-[#00B67A] hover:bg-slate-50 text-xs font-bold rounded-lg shadow-sm uppercase tracking-tight transition-all active:scale-95 cursor-pointer z-10">
                      {copiedField === "all" ? "Copied All!" : "Copy Everything"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* COMPARE ALL RESULTS */}
            {compareResults && !loading && !apiError && generateMode === "compare" && (
              <motion.div
                key="compare-results"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="space-y-4"
              >
                {/* AI Judge Verdict */}
                {bestPick && (
                  <div className="bg-gradient-to-r from-[#0A2540] to-[#153450] text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[#00B67A]/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="flex items-start gap-4 z-10 relative">
                      <div className="w-12 h-12 rounded-xl bg-[#00B67A] flex items-center justify-center shrink-0 shadow-lg">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#00B67A]">AI Judge Verdict</span>
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        </div>
                        <h3 className="text-lg font-bold">{getModelName(bestPick.bestModel)} Wins!</h3>
                        <p className="text-sm text-slate-300 mt-1 leading-relaxed">{bestPick.reason}</p>
                        {bestPick.scores && (
                          <div className="flex gap-3 mt-3 flex-wrap">
                            {Object.entries(bestPick.scores).map(([modelKey, score]) => (
                              <div key={modelKey} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${modelKey === bestPick.bestModel ? "bg-[#00B67A] text-white" : "bg-white/10 text-slate-300"}`}>
                                {getModelName(modelKey)}: {score.overall}/100
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3 Result Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {compareResults.map((listing) => (
                    <ResultCard
                      key={listing.model}
                      listing={listing}
                      isBest={bestPick?.bestModel === listing.model}
                      scores={bestPick?.scores?.[listing.model || '']}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="mt-20 border-t border-slate-200 pt-8 text-center px-4 max-w-6xl mx-auto w-full">
        <p className="text-xs text-slate-400 font-medium">
          Multi-AI SEO Optimizer • DeepSeek V4 Flash • Llama 3.3 70B • Qwen3 Next 80B • Powered by Groq + OpenRouter
        </p>
        <p className="text-[10px] text-slate-300 mt-2 font-mono">
          Etsy & Amazon Listing Optimizer • {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
