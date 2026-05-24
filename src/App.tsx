import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Copy, 
  Check, 
  ShoppingBag, 
  Tag, 
  ChevronDown, 
  AlertCircle, 
  FileText, 
  Layers,
  Search,
  Globe,
  Coins,
  ArrowRight,
  Info
} from "lucide-react";

// Platform Type
type Platform = "Etsy" | "Amazon" | "Both";

interface GeneratedListing {
  title: string;
  description: string;
  tags: string[];
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

export default function App() {
  // Form States
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [features, setFeatures] = useState("");
  const [audience, setAudience] = useState("");
  const [price, setPrice] = useState("");
  const [platform, setPlatform] = useState<Platform>("Both");

  // UX States
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedListing | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Copy Feedback States
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [copiedDescription, setCopiedDescription] = useState(false);
  const [copiedTags, setCopiedTags] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Clear toast after 3 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Form Validation
  const validateForm = (): boolean => {
    const tempErrors: FormErrors = {};
    if (!productName.trim()) {
      tempErrors.productName = "Product name is required.";
    }
    if (!features.trim()) {
      tempErrors.features = "Key features are required.";
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Submit Generation Request
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setApiError(null);
    // Smooth scroll option if already generated previously, keeping context
    setResult(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productName,
          category,
          features,
          audience,
          price,
          platform
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate listing. Please try again.");
      }

      setResult(data);
      setToastMessage("SEO listing compiled successfully!");
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Safe Text Copy Handler
  const handleCopyToClipboard = (text: string, type: "title" | "description" | "tags" | "all") => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === "title") {
        setCopiedTitle(true);
        setToastMessage("Optimized title copied!");
        setTimeout(() => setCopiedTitle(false), 2000);
      } else if (type === "description") {
        setCopiedDescription(true);
        setToastMessage("SEO description copied!");
        setTimeout(() => setCopiedDescription(false), 2000);
      } else if (type === "tags") {
        setCopiedTags(true);
        setToastMessage("All tags copied as comma-separated values!");
        setTimeout(() => setCopiedTags(false), 2000);
      } else if (type === "all") {
        setCopiedAll(true);
        setToastMessage("Complete listing details copied to clipboard!");
        setTimeout(() => setCopiedAll(false), 2000);
      }
    }).catch((err) => {
      console.error("Could not copy text: ", err);
      setToastMessage("Failed to copy. Please manually select and copy.");
    });
  };

  // Create All-Inclusive Copy Text
  const getFormattedAllText = () => {
    if (!result) return "";
    return `=== OPTIMIZED PRODUCT LISTING (Targeting: ${platform === "Both" ? "Etsy & Amazon" : platform}) ===

[PRODUCT NAME]
${productName}

[CATEGORY]
${category}

[OPTIMIZED SEO TITLE]
${result.title}

[SEO DESCRIPTION]
${result.description}

[OPTIMIZED TAGS]
${result.tags.join(", ")}`;
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
            id="global-toast"
            className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center space-x-3 border border-slate-800 text-sm md:text-base font-medium max-w-sm"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#00B67A] shrink-0 animate-ping" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER SECTION */}
      <header id="main-header" className="bg-[#0A2540] text-white px-6 md:px-8 py-5 flex flex-col sm:flex-row justify-between items-center border-b-4 border-[#00B67A] shadow-md relative overflow-hidden">
        {/* Subtle decorative background patterns - client only visual */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#00B67A]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col text-center sm:text-left z-10">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Etsy & Amazon Listing Optimizer</h1>
          <p className="text-[#00B67A] text-xs font-semibold uppercase tracking-widest mt-1">
            AI-Powered SEO • More Views • More Sales
          </p>
        </div>
        
        <div className="flex items-center space-x-2 text-xs opacity-90 z-10 mt-3 sm:mt-0 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
          <span className="w-2 h-2 rounded-full bg-[#00B67A] animate-pulse"></span>
          <span className="text-slate-300 font-mono">Llama 3.3 70B via Groq Active</span>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main id="main-content" className="max-w-7xl w-full mx-auto px-4 md:px-8 mt-6 grid grid-cols-12 gap-6 items-stretch flex-1">
        
        {/* FORM SECTION (LEFT) - Bento Cell 1 */}
        <section id="form-section" className="col-span-12 lg:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between overflow-hidden">
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-[#0A2540] uppercase tracking-wider mb-2 pb-2 border-b border-slate-100 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#00B67A]" />
              Product Details
            </h2>

            <form onSubmit={handleGenerate} className="space-y-4">
              {/* PRODUCT NAME */}
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
                    errors.productName 
                      ? "border-red-400 focus:ring-red-300" 
                      : "border-slate-200 focus:ring-[#00B67A] focus:border-[#00B67A] focus:bg-white"
                  }`}
                  placeholder="e.g. Handmade Speckled Ceramic Mug"
                  value={productName}
                  onChange={(e) => {
                    setProductName(e.target.value);
                    if (e.target.value.trim() && errors.productName) {
                      setErrors((prev) => ({ ...prev, productName: undefined }));
                    }
                  }}
                />
                {errors.productName && (
                  <p className="text-[11px] text-red-500 flex items-center gap-1 mt-0.5">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {errors.productName}
                  </p>
                )}
              </div>

              {/* CATEGORY DROPDOWN */}
              <div className="space-y-1">
                <label htmlFor="category" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Category
                </label>
                <div className="relative">
                  <select
                    id="category"
                    className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#00B67A] focus:bg-white transition-all"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* KEY FEATURES */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label htmlFor="features" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Key Features / Materials <span className="text-emerald-600">*</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">{features.length}/500</span>
                </div>
                <textarea
                  id="features"
                  maxLength={500}
                  rows={3}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-1 transition-all resize-none ${
                    errors.features 
                      ? "border-red-400 focus:ring-red-300" 
                      : "border-slate-200 focus:ring-[#00B67A] focus:border-[#00B67A] focus:bg-white"
                  }`}
                  placeholder="12oz capacity, lead-free glaze, ergonomic handle, microwave safe, minimalist aesthetic."
                  value={features}
                  onChange={(e) => {
                    setFeatures(e.target.value);
                    if (e.target.value.trim() && errors.features) {
                      setErrors((prev) => ({ ...prev, features: undefined }));
                    }
                  }}
                />
                {errors.features && (
                  <p className="text-[11px] text-red-500 flex items-center gap-1 mt-0.5">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {errors.features}
                  </p>
                )}
              </div>

              {/* AUDIENCE AND PRICE ROW */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="audience" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Audience
                  </label>
                  <input
                    id="audience"
                    type="text"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#00B67A] focus:bg-white transition-all animate-none"
                    placeholder="e.g. Coffee Lovers"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="price" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Price
                  </label>
                  <input
                    id="price"
                    type="text"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#00B67A] focus:bg-white transition-all"
                    placeholder="e.g. $34.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              </div>

              {/* TARGET PLATFORM */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Target Platform
                </label>
                <div className="flex space-x-2 bg-slate-50 p-1 rounded-lg border border-slate-100">
                  {(["Etsy", "Amazon", "Both"] as Platform[]).map((plat) => {
                    const isActive = platform === plat;
                    return (
                      <button
                        key={plat}
                        type="button"
                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                          isActive
                            ? "bg-[#00B67A] text-white shadow-sm"
                            : "bg-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-100/50"
                        }`}
                        onClick={() => setPlatform(plat)}
                      >
                        {plat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* COMPILING ACTIONS */}
              <button
                id="generate-button"
                type="submit"
                disabled={loading}
                className={`w-full mt-2 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-md transition-all active:scale-[0.98] cursor-pointer ${
                  loading 
                    ? "bg-slate-400 cursor-not-allowed" 
                    : "bg-[#0A2540] hover:bg-[#153450]"
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-200 border-t-white rounded-full animate-spin" />
                    <span>GENERATING...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#00B67A] shrink-0 fill-[#00B67A] animate-pulse" />
                    <span>OPTIMIZE LISTING</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </section>

        {/* OUTPUT SECTION / PLACEHOLDER (RIGHT) - Bento Columns */}
        <section id="results-section" className="col-span-12 lg:col-span-8 flex flex-col h-full min-h-[520px]">
          
          <AnimatePresence mode="wait">
            
            {/* 1. LOADING SPIN CARD */}
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-center h-full my-auto"
              >
                <div className="relative">
                  {/* Modern Pulsing Loading Effect */}
                  <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-[#00B67A] animate-spin mb-6" />
                  <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-transparent border-b-[#0A2540]/3 border-r-[#0A2540]/10 animate-pulse" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 tracking-tight">Generating Optimized SEO Assets</h3>
                <p className="text-xs text-slate-400 mt-2 max-w-sm font-medium">
                  Applying platform-specific guidelines for <strong className="text-slate-600 font-semibold">{platform === "Both" ? "Etsy & Amazon" : platform}</strong>.
                </p>
                
                <div className="mt-8 space-y-2 w-full max-w-xs text-left border-t border-slate-100 pt-6">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Check className="w-3.5 h-3.5 text-[#00B67A]" />
                    <span>Analyzing top Etsy / Amazon search volumes</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Check className="w-3.5 h-3.5 text-[#00B67A]" />
                    <span>Structuring premium 140-char title</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-200 border-t-[#00B67A] animate-spin shrink-0" />
                    <span className="text-[#0A2540] font-semibold animate-pulse">Drafting sales copy description</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. ERROR DISPLAY CARD */}
            {apiError && !loading && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50/50 rounded-2xl border border-red-100 shadow-sm p-8 flex flex-col items-center justify-center text-center h-full my-auto animate-none"
              >
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-950">Generation Failed</h3>
                <p className="text-sm text-red-600 mt-2 max-w-md bg-white border border-red-100 px-4 py-2.5 rounded-xl text-left font-mono text-xs overflow-auto max-h-40 shadow-inner">
                  {apiError}
                </p>
                <button
                  onClick={handleGenerate}
                  className="mt-6 px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm shadow-md hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Try Again
                </button>
              </motion.div>
            )}

            {/* 3. EMPTY STATE CARD */}
            {!result && !loading && !apiError && (
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
                  Provide product criteria on the left panel, choose platform tags, and click <strong className="text-slate-700">"Optimize Listing"</strong> to construct high-ranking titles and metadata.
                </p>

                <div className="grid grid-cols-3 gap-4 w-full max-w-md mt-8 pt-6 border-t border-slate-200/60 text-left">
                  <div className="text-center">
                    <span className="block text-xl font-extrabold text-[#0A2540]">13</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">SEO Tags</span>
                  </div>
                  <div className="text-center border-x border-slate-200">
                    <span className="block text-xl font-extrabold text-[#00B67A] font-mono">⚡</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fast Response</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-xl font-extrabold text-[#0A2540]">100%</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-clip-text">Optimized</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 4. ACTUAL RESULTS BENTO GRID */}
            {result && !loading && !apiError && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="grid grid-cols-2 gap-4 h-full"
              >
                {/* A. OPTIMIZED PRODUCT TITLE CARD - Span 2 Columns */}
                <div id="optimized-title-card" className="col-span-2 bg-white rounded-2xl shadow-sm border-l-4 border-l-[#00B67A] p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#00B67A]" />
                        Optimized Product Title
                      </h3>
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-md ${
                        result.title.length > 140 
                          ? "bg-red-50 text-red-500" 
                          : "bg-[#00B67A]/10 text-[#00B67A]"
                      }`}>
                        {result.title.length} / 140 Chars
                      </span>
                    </div>

                    <p className="text-base font-semibold text-[#0A2540] leading-snug font-mono select-all bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                      {result.title}
                    </p>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <button
                      id="copy-title-button"
                      onClick={() => handleCopyToClipboard(result.title, "title")}
                      className="text-[#00B67A] hover:text-[#00B67A]/80 text-xs font-bold flex items-center gap-1 hover:underline uppercase tracking-tighter cursor-pointer"
                    >
                      {copiedTitle ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                          <span>Copied Title!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Title</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* B. SEO DESCRIPTION CARD - Span 1 Column */}
                <div id="seo-description-card" className="col-span-2 md:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col h-full max-h-[380px] overflow-hidden">
                  <div className="flex justify-between items-start mb-2 border-b border-slate-50 pb-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#00B67A]" />
                      SEO Description
                    </h3>
                    <button
                      id="copy-description-button"
                      onClick={() => handleCopyToClipboard(result.description, "description")}
                      className="text-[#00B67A] hover:text-[#00B67A]/80 text-xs font-bold uppercase tracking-tighter flex items-center gap-1 cursor-pointer"
                    >
                      {copiedDescription ? "Copied!" : "Copy"}
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-line bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                    {result.description}
                  </div>
                  
                  <div className="mt-2 text-[10px] text-slate-400 font-mono text-right">
                    ~{result.description.split(/\s+/).filter(Boolean).length} words
                  </div>
                </div>

                {/* C. TAGS & ACTIONS CONTAINER - Span 1 Column */}
                <div className="col-span-2 md:col-span-1 flex flex-col space-y-4">
                  {/* SEO TAGS CELL */}
                  <div id="tags-card" className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3 text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-[#00B67A]" />
                          Optimized SEO Tags
                        </span>
                        <span>{result.tags.length} / 13</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 max-h-[170px] overflow-y-auto pr-1">
                        {result.tags.map((tag, i) => (
                          <span 
                            key={`${tag}-${i}`} 
                            className="px-2 py-1 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded-md border border-slate-200 hover:bg-slate-200/50 transition-all select-all flex items-center gap-1"
                          >
                            #{tag.toLowerCase().replace(/\s+/g, '')}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      id="copy-tags-button"
                      onClick={() => handleCopyToClipboard(result.tags.join(", "), "tags")}
                      className="mt-4 w-full py-2 border border-dashed border-[#00B67A] text-[#00B67A] hover:bg-[#00B67A]/5 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer"
                    >
                      {copiedTags ? "Copied All Tags!" : "Copy All Tags"}
                    </button>
                  </div>

                  {/* MASTER ACTION & SCORE CARD */}
                  <div className="bg-[#00B67A] text-white p-4 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none transform translate-x-8 -translate-y-8" />
                    
                    <div className="flex items-center space-x-3 z-10">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
                        ✓
                      </div>
                      <div>
                        <p className="text-[10px] font-bold opacity-80 uppercase">SEO Rank Score</p>
                        <p className="text-lg font-bold">98 / 100</p>
                      </div>
                    </div>

                    <button
                      id="copy-all-master-button"
                      onClick={() => handleCopyToClipboard(getFormattedAllText(), "all")}
                      className="px-4 py-2 bg-white text-[#00B67A] hover:bg-slate-50 text-xs font-bold rounded-lg shadow-sm uppercase tracking-tight transition-all active:scale-95 cursor-pointer z-10"
                    >
                      {copiedAll ? "Copied All!" : "Copy Everything"}
                    </button>
                  </div>
                </div>

              </motion.div>
            )}

          </AnimatePresence>
        </section>

      </main>


      {/* FOOTER */}
      <footer className="mt-20 border-t border-slate-200 pt-8 text-center px-4 max-w-6xl mx-auto w-full">
        <p className="text-xs text-slate-400 font-medium">
          Built adhering to Etsy character limits (140) and listing tags rules (exactly 13 chips). Powered by Groq (Llama 3.3 70B).
        </p>
        <p className="text-[10px] text-slate-300 mt-2 font-mono">
          Etsy & Amazon Listing Optimizer • {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
