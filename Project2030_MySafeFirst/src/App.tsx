/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, 
  AlertCircle, 
  Upload, 
  ArrowRight, 
  HelpCircle, 
  CheckCircle2, 
  RefreshCcw,
  MessageSquare,
  FileText,
  Lock,
  Phone,
  Paperclip,
  Send,
  User,
  Bot,
  ChevronRight
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { jsPDF } from "jspdf";

import { AppState, Evidence, Step, AppMode, RiskLevel, ToneType, Message } from "./types";
import { analyzeCrisis, generateIncidentSummary, continueChat } from "./services/geminiService";
import { RiskGauge } from "./components/RiskGauge";
import { ProgressTracker } from "./components/ProgressTracker";
import { EvidenceCard } from "./components/EvidenceCard";
import { ScamChecker } from "./components/ScamChecker";

const INITIAL_STATE: AppState = {
  view: "INPUT",
  mode: "TRIAGE",
  riskLevel: "low",
  tone: "SUPPORTIVE",
  currentStepIndex: 0,
  steps: [],
  evidenceList: [],
  userInput: "",
  isAnalyzing: false,
  chatHistory: [],
};

export default function App() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [scammerInfo, setScammerInfo] = useState({ bank: "", no: "", amount: "", time: "" });
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.chatHistory]);

  const handlePanic = async () => {
    setState(prev => ({ 
      ...prev, 
      isAnalyzing: true,
      view: "LOADING"
    }));

    await new Promise(resolve => setTimeout(resolve, 2000));

    const analysis = await analyzeCrisis("I ALREADY LOST MONEY", [], true);
    
    const botMsg: Message = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'assistant',
      content: analysis.botResponse,
      suggestions: analysis.buttons,
      type: 'text'
    };

    setState(prev => ({
      ...prev,
      view: "CHAT",
      isAnalyzing: false,
      mode: "PANIC",
      riskLevel: "high",
      tone: "FIRST_RESPONDER",
      steps: analysis.initialSteps,
      currentStepIndex: 0,
      chatHistory: [botMsg],
      incidentSummary: analysis.forensics
    }));
  };

  const handleAnalyze = async () => {
    if (!state.userInput && state.evidenceList.length === 0) return;

    setState(prev => ({ ...prev, isAnalyzing: true, view: "LOADING" }));
    
    await new Promise(resolve => setTimeout(resolve, 2000));

    const analysis = await analyzeCrisis(state.userInput, state.evidenceList);
    
    const botMsg: Message = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'assistant',
      content: analysis.botResponse,
      suggestions: analysis.buttons,
      type: 'text'
    };

    setState(prev => ({
      ...prev,
      view: "CHAT",
      isAnalyzing: false,
      riskLevel: analysis.riskLevel as RiskLevel,
      tone: analysis.tone as ToneType,
      mode: analysis.suggestedMode,
      steps: analysis.initialSteps,
      currentStepIndex: 0,
      chatHistory: [botMsg],
      incidentSummary: analysis.forensics
    }));
  };

  const handleReset = () => {
    setState(INITIAL_STATE);
    setScammerInfo({ bank: "", no: "", amount: "", time: "" });
    setChatInput("");
  };

  const handleSendMessage = async (text?: string) => {
    const messageContent = text || chatInput;
    if (!messageContent.trim()) return;

    const userMsg: Message = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'user',
      content: messageContent
    };

    const newHistory = [...state.chatHistory, userMsg];
    setState(prev => ({
      ...prev,
      chatHistory: newHistory,
      isAnalyzing: true
    }));
    setChatInput("");

    const botResponse = await continueChat(newHistory, messageContent);

    // Watch for hard redirect command
    if (botResponse.message.includes("[REDIRECT_HOME]")) {
      setState(prev => ({ ...prev, view: "SUCCESS", isAnalyzing: false }));
      return;
    }

    const botMsg: Message = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'assistant',
      content: botResponse.message,
      suggestions: botResponse.buttons
    };

    setState(prev => ({
      ...prev,
      chatHistory: [...newHistory, botMsg],
      isAnalyzing: false
    }));
  };

  const handleDownloadPDF = () => {
    const reportMsg = [...state.chatHistory].reverse().find(m => 
      m.content.includes("ROYAL MALAYSIA POLICE") || 
      m.suggestions?.some(s => s.toLowerCase().includes("pdf report"))
    );

    if (!reportMsg) {
      alert("Report not found. Please complete the recovery protocol first.");
      return;
    }

    const doc = new jsPDF();
    const margin = 20;
    const lineHeight = 7;
    let cursorY = 30;

    // Remove markdown syntax for PDF
    const cleanContent = reportMsg.content
      .replace(/[*#>`]/g, '')
      .replace(/\[REDIRECT_HOME\]/g, '');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("OFFICIAL PDRM SCAM CASE REPORT", margin, cursorY);
    cursorY += lineHeight * 2;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const splitText = doc.splitTextToSize(cleanContent, 170);
    
    splitText.forEach((line: string) => {
      if (cursorY > 280) {
        doc.addPage();
        cursorY = 20;
      }
      doc.text(line, margin, cursorY);
      cursorY += lineHeight;
    });

    // Add signature space
    if (cursorY > 240) {
      doc.addPage();
      cursorY = 30;
    }
    
    cursorY += 20;
    doc.text("___________________________", margin, cursorY);
    doc.text("___________________________", 120, cursorY);
    cursorY += 5;
    doc.text("Informant Signature", margin, cursorY);
    doc.text("Date", 120, cursorY);

    doc.save(`PDRM_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleSuggestionClick = (suggestion: string) => {
    const lowSugg = suggestion.toLowerCase();
    if (lowSugg.includes("download report") || lowSugg.includes("download pdf report")) {
      handleDownloadPDF();
      return;
    }
    handleSendMessage(`User selected: ${suggestion}`);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          const newEvidence: Evidence = {
            id: Math.random().toString(36).substr(2, 9),
            type: file.type.startsWith('image') ? 'image' : 
                  file.type.startsWith('audio') ? 'audio' :
                  file.type.startsWith('video') ? 'video' : 'text',
            url: URL.createObjectURL(file), 
            base64: base64String,
            mimeType: file.type,
          };
          setState(prev => ({
            ...prev,
            evidenceList: [...prev.evidenceList, newEvidence]
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const currentStep = Array.isArray(state.steps) ? state.steps[state.currentStepIndex] : undefined;

  return (
    <div className={`flex flex-col h-screen overflow-hidden transition-all duration-700 bg-white`}>
      <AnimatePresence mode="wait">
        {state.view === "INPUT" && (
          <motion.div 
            key="input-view"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50"
          >
            <div className="w-full max-w-2xl space-y-8">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                  <ShieldCheck className="w-5 h-5 text-brand-blue" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">MySafeFirst Protocol</span>
                </div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tight">Malaysia's AI Scam Defense</h1>
                <p className="text-slate-500 font-medium">Instant analysis & recovery guidance for digital scam victims.</p>
              </div>

              <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
                <textarea 
                  value={state.userInput}
                  onChange={(e) => setState(prev => ({ ...prev, userInput: e.target.value }))}
                  placeholder="Paste scam text or describe what happened..."
                  className="w-full h-48 p-8 text-lg border-none focus:ring-0 resize-none placeholder:text-slate-300"
                />
                <div className="p-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
                  <div className="flex gap-2">
                    <label className="p-2 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors text-slate-400 flex items-center gap-2">
                      <Paperclip className="w-5 h-5" />
                      <span className="text-xs font-bold uppercase tracking-widest">Attach Proof</span>
                      <input type="file" className="hidden" onChange={handleUpload} multiple />
                    </label>
                  </div>
                  <button 
                    onClick={handleAnalyze} 
                    disabled={!state.userInput && state.evidenceList.length === 0}
                    className="bg-brand-blue text-white px-6 py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-30 shadow-lg shadow-blue-200"
                  >
                    Analyse <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {state.evidenceList.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {state.evidenceList.map(ev => (
                    <div key={ev.id} className="relative aspect-square rounded-lg border border-slate-200 overflow-hidden bg-slate-100">
                      {ev.type === 'image' && <img src={ev.url} className="w-full h-full object-cover" />}
                      <div className="absolute inset-0 bg-black/10 flex items-center justify-center text-white">
                        <FileText className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center gap-4 py-4">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Quick Utilities</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
                
                <ScamChecker />
              </div>

              <div className="pt-8">
                <button 
                  onClick={handlePanic}
                  className="w-full py-6 bg-brand-red text-white rounded-2xl font-black uppercase tracking-[0.2em] text-lg flex items-center justify-center gap-4 hover:bg-red-600 transition-all shadow-2xl shadow-red-200 border-4 border-white"
                >
                  🚨 I ALREADY LOST MONEY
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {state.view === "LOADING" && (
          <motion.div 
            key="loading-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-6"
          >
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-4 border-brand-blue rounded-full border-t-transparent"
              />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight animate-pulse">Scanning for threats...</h2>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Applying PDRM & NSRC Intelligence</p>
            </div>
          </motion.div>
        )}

        {state.view === "CHAT" && (
          <motion.div 
            key="chat-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 flex flex-col h-full bg-slate-50 relative"
          >
            {/* Sticky Header with Risk Gauge */}
            <div className={`p-4 bg-white border-b border-slate-100 shadow-sm sticky top-0 z-50 transition-colors duration-500 ${state.mode === 'PANIC' ? 'panic-bg-static' : ''}`}>
               <div className="max-w-3xl mx-auto space-y-4">
                  <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                    <span className="flex items-center gap-2 text-slate-900">
                      <div className={`w-2 h-2 rounded-full ${state.isAnalyzing ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`} />
                      Live Session: MSF-99-ALPHA
                    </span>
                    <div className="flex items-center gap-4">
                      <span className={state.mode === 'PANIC' ? 'text-brand-red' : 'text-brand-blue'}>
                         {state.mode} PROTOCOL ACTIVE
                      </span>
                      <button 
                        onClick={handleReset}
                        className="flex items-center gap-2 px-3 py-1.5 bg-brand-red/10 text-brand-red hover:bg-brand-red text-[10px] font-black uppercase tracking-widest rounded-lg transition-all hover:text-white"
                        title="End Session & Clear Data"
                       >
                         <Lock className="w-3 h-3" />
                         End Session
                       </button>
                    </div>
                  </div>
                  <RiskGauge level={state.riskLevel} />
                  <ProgressTracker mode={state.mode} />
               </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="max-w-3xl mx-auto space-y-6 w-full">
                {state.chatHistory.map((msg) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${
                        msg.role === 'assistant' 
                          ? 'bg-brand-blue text-white border-blue-600' 
                          : 'bg-white text-slate-500 border-slate-200'
                      }`}>
                        {msg.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                      </div>
                      <div className={`space-y-2`}>
                        <div className={`p-5 rounded-3xl shadow-sm border ${
                          msg.role === 'assistant' 
                            ? 'bg-white border-slate-100 text-slate-800' 
                            : 'bg-brand-blue text-white border-blue-600'
                        }`}>
                          <div className={`prose prose-sm font-medium leading-relaxed ${msg.role === 'user' ? 'prose-invert' : ''}`}>
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        </div>

                        {/* Interactive Buttons from AI Suggestions */}
                        {msg.role === 'assistant' && msg.suggestions && msg.suggestions.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-3">
                             {msg.suggestions.map((suggestion, i) => (
                               <button 
                                 key={i}
                                 onClick={() => handleSuggestionClick(suggestion)}
                                 className="bg-brand-blue/5 hover:bg-brand-blue/10 text-brand-blue border border-brand-blue/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                               >
                                 {suggestion}
                               </button>
                             ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                <div ref={chatEndRef} />
                {state.isAnalyzing && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-brand-blue/10 flex items-center justify-center border border-brand-blue/20">
                        <RefreshCcw className="w-4 h-4 text-brand-blue animate-spin" />
                      </div>
                      <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-6 bg-white border-t border-slate-100 shadow-lg">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="max-w-3xl mx-auto relative flex items-center"
              >
                <input 
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a question or reply..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-6 py-4 pr-16 focus:border-brand-blue outline-none transition-all shadow-inner"
                />
                <button 
                  type="submit"
                  className="absolute right-2 p-3 bg-brand-blue text-white rounded-2xl hover:bg-blue-700 transition-all shadow-md active:scale-90"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
            
            {/* Quick Hotline Overlay if in Panic */}
            {state.mode === 'PANIC' && (
               <div className="absolute top-32 right-6 z-40 bg-brand-red text-white p-4 rounded-2xl shadow-2xl space-y-2 border-2 border-white max-w-[200px]">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Urgent Support</p>
                  <p className="text-xl font-black">NSRC 997</p>
                  <a href="tel:997" className="block w-full text-center py-2 bg-white text-brand-red rounded-lg font-black text-xs uppercase">Call Now</a>
               </div>
            )}
          </motion.div>
        )}
          {state.view === "SUCCESS" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-emerald-50/95 backdrop-blur-sm"
            >
              <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl border border-emerald-100 text-center space-y-8">
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-slate-900">Mission Complete</h2>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    You've taken all the critical steps to secure your future. The protocol is successfully closed.
                  </p>
                </div>

                <div className="space-y-3 pt-4 text-left">
                  {[
                    "Immediate assets frozen",
                    "National Scam Response Center notified",
                    "Evidence forensic summary generated",
                    "Reporting path verified"
                  ].map((task, i) => (
                    <div key={i} className="flex items-center gap-3 text-slate-600 font-semibold text-sm">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      {task}
                    </div>
                  ))}
                </div>

                <button 
                  onClick={handleReset}
                  className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                >
                  Return to Hub
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
}

