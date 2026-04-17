/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Languages, 
  Pill, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Loader2,
  ChevronRight,
  Stethoscope,
  AlertTriangle,
  RefreshCw,
  Settings,
  ShieldAlert,
  Search,
  X,
  Zap,
  Activity,
  Brain,
  Clock,
  ClipboardList,
  History,
  Trash2,
  ArrowLeft
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { analyzeMedicineImage, searchMedicineByText } from './services/geminiService';
import { MedicineAnalysis, Language, LANGUAGES, HistoryItem } from './types';
import { AppLogo } from './components/AppLogo';

// Error Boundary Component
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-4">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Something went wrong</h2>
            <p className="text-slate-500">The application encountered an unexpected error. Please try refreshing the page.</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-3 rounded-2xl font-bold hover:bg-blue-700 transition-colors"
            >
              Refresh App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function MainApp() {
  const [image, setImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [language, setLanguage] = useState<Language>('en');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<MedicineAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history from API
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/history');
        if (response.ok) {
          const data = await response.json();
          setHistory(data);
        }
      } catch (e) {
        console.error("Failed to fetch history", e);
      }
    };
    fetchHistory();
  }, []);

  const addToHistory = async (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    try {
      console.log("Attempting to save to history:", item.type);
      const response = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (response.ok) {
        const newItem = await response.json();
        console.log("History saved successfully:", newItem.id);
        setHistory(prev => [newItem, ...prev].slice(0, 50));
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to save history. Status:", response.status, errorData);
      }
    } catch (e) {
      console.error("Failed to save history", e);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_DIM = 600;
          if (width > height) {
            if (width > MAX_DIM) {
              height *= MAX_DIM / width;
              width = MAX_DIM;
            }
          } else {
            if (height > MAX_DIM) {
              width *= MAX_DIM / height;
              height = MAX_DIM;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressed = canvas.toDataURL('image/jpeg', 0.6);
          setImage(compressed);
          setResult(null);
          setError(null);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const startAnalysis = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const analysis = await analyzeMedicineImage(image, 'image/jpeg', LANGUAGES[language]);
      setResult(analysis);
      addToHistory({
        type: 'scan',
        image,
        result: analysis,
        language
      });
    } catch (err) {
      setError('Could not analyze the image. Please ensure the medicine details are clearly visible and try again.');
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setImage(null); // Clear image if searching by text
    
    try {
      const analysis = await searchMedicineByText(searchQuery, LANGUAGES[language]);
      setResult(analysis);
      addToHistory({
        type: 'search',
        query: searchQuery,
        result: analysis,
        language
      });
    } catch (err) {
      setError('Could not find information for this medicine. Please check the spelling or try another name.');
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setImage(null);
    setSearchQuery('');
    setResult(null);
    setError(null);
    setShowHistory(false);
  };

  const loadFromHistory = (item: HistoryItem) => {
    setResult(item.result);
    setImage(item.image || null);
    setSearchQuery(item.query || '');
    setLanguage(item.language);
    setShowHistory(false);
    setError(null);
  };

  const clearHistory = async () => {
    if (window.confirm('Are you sure you want to clear your history?')) {
      try {
        const response = await fetch('/api/history', { method: 'DELETE' });
        if (response.ok) {
          setHistory([]);
        }
      } catch (e) {
        console.error("Failed to clear history", e);
      }
    }
  };

  // Automatically re-trigger analysis or search when language changes
  useEffect(() => {
    if (result) {
      if (image) {
        startAnalysis();
      } else if (searchQuery) {
        handleSearch();
      }
    }
  }, [language]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AppLogo className="w-10 h-10" />
            <h1 className="text-xl font-bold tracking-tight text-slate-800">NetraArogya</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 rounded-lg transition-colors ${showHistory ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-100 text-slate-500'}`}
              title="History"
            >
              <History className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
              <Languages className="w-4 h-4 text-slate-500" />
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer"
              >
                {Object.entries(LANGUAGES).map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {showHistory ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setShowHistory(false)}
                  className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Scan
                </button>
                <h2 className="text-xl font-bold text-slate-800">Recent History</h2>
                <button 
                  onClick={clearHistory}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  title="Clear History"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {history.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center space-y-4 border border-slate-100">
                  <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                    <Clock className="w-8 h-8 text-slate-300" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800">No history yet</p>
                    <p className="text-slate-500 text-sm">Your scanned medicines will appear here.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <button
                      key={item._id || item.id}
                      onClick={() => loadFromHistory(item)}
                      className="w-full bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-300 hover:shadow-md transition-all text-left flex items-center gap-4 group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                        {item.type === 'scan' && item.image ? (
                          <img src={item.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Search className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                          {item.result.name}
                        </h4>
                        <p className="text-xs text-slate-400 flex items-center gap-2">
                          {new Date(item.timestamp).toLocaleDateString()} • {LANGUAGES[item.language]}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <>
              {/* Search Box */}
              <div className="mb-8">
                <form onSubmit={handleSearch} className="relative group">
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by medicine name or composition..."
                    className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-12 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  {searchQuery && (
                    <button 
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-16 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  )}
                  <button 
                    type="submit"
                    disabled={!searchQuery.trim() || isAnalyzing}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-br from-[#7D2AE8] via-[#5A32FA] to-[#00C4CC] text-white px-4 py-2 rounded-xl text-sm font-bold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Search
                  </button>
                </form>
              </div>

              <AnimatePresence mode="wait">
                {!image && !result && !isAnalyzing ? (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-slate-800">Identify Your Medicine</h2>
                <p className="text-slate-500">Upload a photo of the back of your medicine strip for instant details.</p>
              </div>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-3xl p-12 flex flex-col items-center justify-center gap-4 bg-white hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer group"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Camera className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-700">Take a Photo or Upload</p>
                  <p className="text-sm text-slate-400">Supports JPG, PNG</p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-800 leading-relaxed">
                  <strong>Important:</strong> Ensure the text on the tablet sheet is clear and well-lit. This tool is for informational purposes only.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
                    <div className="relative aspect-video rounded-3xl overflow-hidden shadow-xl bg-slate-200">
                      <img 
                        src={image || ''} 
                        alt="Medicine strip" 
                        className="w-full h-full object-cover"
                      />
                      {!result && !isAnalyzing && (
                        <button 
                          onClick={reset}
                          className="absolute top-4 right-4 bg-white/90 backdrop-blur p-2 rounded-full shadow-lg hover:bg-white transition-colors"
                        >
                          <RefreshCw className="w-5 h-5 text-slate-600" />
                        </button>
                      )}
                    </div>

              {!result && !isAnalyzing && (
                <button 
                  onClick={startAnalysis}
                  className="w-full bg-gradient-to-br from-[#7D2AE8] via-[#5A32FA] to-[#00C4CC] text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-blue-200 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  Analyze Medicine
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              {isAnalyzing && (
                <div className="bg-white rounded-3xl p-8 text-center space-y-4 shadow-sm border border-slate-100">
                  <Loader2 className="w-12 h-12 text-[#5A32FA] animate-spin mx-auto" />
                  <div className="space-y-1">
                    <p className="font-bold text-lg">Analyzing Details...</p>
                    <p className="text-slate-500 text-sm">Recognizing text and chemical composition</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                  <div className="space-y-2">
                    <p className="text-sm text-red-800 font-medium">{error}</p>
                    <button 
                      onClick={reset}
                      className="text-xs font-bold text-red-600 uppercase tracking-wider hover:underline"
                    >
                      Try Another Photo
                    </button>
                  </div>
                </div>
              )}

              {result && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Result Card */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white bg-gradient-to-r from-[#7D2AE8] to-[#5A32FA] px-2 py-0.5 rounded">Medicine Identified</span>
                        <h3 className="text-2xl font-bold text-slate-800">{result.name || 'Unknown Medicine'}</h3>
                        <p className="text-slate-500 text-sm font-medium">{result.composition || 'Composition not detected'}</p>
                      </div>
                      <div className="bg-green-100 p-2 rounded-full">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <Section 
                        icon={<Brain className="w-5 h-5 text-purple-600" />}
                        title="🧠 Simple understanding"
                        content={result.simpleUnderstanding || 'No summary available.'}
                        variant="default"
                      />

                      <Section 
                        icon={<Stethoscope className="w-5 h-5 text-blue-600" />}
                        title="🩺 Main purpose"
                        content={result.purpose || 'No purpose information available.'}
                      />

                      <div className="bg-blue-50/30 rounded-2xl p-4 space-y-3 border border-blue-100/50">
                        <div className="flex items-center gap-2">
                          <ClipboardList className="w-5 h-5 text-blue-600" />
                          <h4 className="font-bold text-slate-800 text-sm">🧾 Conditions treated</h4>
                        </div>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(result.diseases || []).length > 0 ? result.diseases.map((d, i) => (
                            <li key={`${result.name}-disease-${i}`} className="text-sm font-medium text-slate-700 flex items-center gap-2 bg-white/50 p-2 rounded-xl">
                              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                              {d}
                            </li>
                          )) : <li className="text-sm text-slate-400 italic">No specific diseases listed</li>}
                        </ul>
                      </div>

                      <Section 
                        icon={<Settings className="w-5 h-5 text-slate-600" />}
                        title="⚙️ How it works"
                        content={result.howItWorks || 'Mechanism of action not detected.'}
                      />

                      <Section 
                        icon={<Zap className="w-5 h-5 text-yellow-600" />}
                        title="Role of each component"
                        content={result.componentRoles || 'Component roles not detected.'}
                      />
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                          <div className="flex items-center gap-2 mb-1">
                            <Activity className="w-4 h-4 text-rose-500" />
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">🤒 Symptoms it helps</p>
                          </div>
                          <ul className="space-y-1">
                            {(result.symptoms || []).length > 0 ? result.symptoms.map((s, i) => (
                              <li key={`${result.name}-symptom-${i}`} className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <div className="w-1 h-1 bg-rose-400 rounded-full" />
                                {s}
                              </li>
                            )) : <li className="text-sm text-slate-400 italic">No specific symptoms listed</li>}
                          </ul>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                          <div className="flex items-center gap-2 mb-1">
                            <Zap className="w-4 h-4 text-green-500" />
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Extra Use Cases</p>
                          </div>
                          <ul className="space-y-1">
                            {(result.extraUseCases || []).length > 0 ? result.extraUseCases.map((e, i) => (
                              <li key={`${result.name}-extra-${i}`} className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <div className="w-1 h-1 bg-green-400 rounded-full" />
                                {e}
                              </li>
                            )) : <li className="text-sm text-slate-400 italic">No extra use cases listed</li>}
                          </ul>
                        </div>
                      </div>

                      <Section 
                        icon={<Clock className="w-5 h-5 text-indigo-600" />}
                        title="⏰ How to take (general guidance)"
                        content={result.dosageInfo || 'No dosage information detected.'}
                      />

                      <Section 
                        icon={<ShieldAlert className="w-5 h-5 text-amber-600" />}
                        title="⚠️ Precautions"
                        content={result.warnings || 'No specific warnings detected.'}
                        variant="warning"
                      />

                      <Section 
                        icon={<AlertCircle className="w-5 h-5 text-red-600" />}
                        title="Side Effects"
                        content={result.sideEffects || 'No side effects information detected.'}
                        variant="danger"
                      />
                    </div>

                    <button 
                      onClick={reset}
                      className="w-full py-3 border-2 border-slate-100 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                      Scan Another
                    </button>
                  </div>

                  {/* Legal Disclaimer */}
                  <div className="bg-slate-100 rounded-2xl p-4 text-[10px] text-slate-400 leading-relaxed text-center italic">
                    DISCLAIMER: This information is generated by AI and is for educational purposes only. It is NOT a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read on this app.
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )}
  </AnimatePresence>
</main>

      <footer className="py-8 text-center text-slate-400 text-xs">
        <p>© 2026 NetraArogya • Powered by Gemini AI</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}

function Section({ 
  icon, 
  title, 
  content, 
  variant = 'default' 
}: { 
  icon: React.ReactNode, 
  title: string, 
  content: string,
  variant?: 'default' | 'warning' | 'danger'
}) {
  const bgClass = {
    default: 'bg-blue-50/50',
    warning: 'bg-amber-50/50',
    danger: 'bg-red-50/50'
  }[variant];

  return (
    <div className={`${bgClass} rounded-2xl p-4 space-y-2 border border-transparent hover:border-slate-100 transition-colors`}>
      <div className="flex items-center gap-2">
        {icon}
        <h4 className="font-bold text-slate-800 text-sm">{title}</h4>
      </div>
      <div className="text-sm text-slate-600 leading-relaxed">
        <ReactMarkdown>{content || ''}</ReactMarkdown>
      </div>
    </div>
  );
}
