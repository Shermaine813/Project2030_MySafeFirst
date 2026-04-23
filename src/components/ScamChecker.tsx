/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ShieldAlert, ShieldCheck, Loader2, Info, AlertTriangle } from 'lucide-react';
import { checkScam, ScamRecord } from '../services/scamCheckService';

export function ScamChecker() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScamRecord | null | 'NOT_FOUND'>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResult(null);

    const record = await checkScam(query);
    setResult(record || 'NOT_FOUND');
    setIsLoading(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-6 bg-white rounded-2xl border border-card-border shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-dark flex items-center gap-2">
          <Search className="w-5 h-5 text-brand-blue" />
          Scam Database Check
        </h2>
        <p className="text-sm text-text-slate mt-1">
          Verify phone numbers or bank accounts against known Malaysian scammer databases (Simulated Semak Mule).
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter Bank Acc or Ph Number (e.g. 1234567890)"
            className="w-full px-4 py-3 bg-panel-right border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="px-6 py-3 bg-brand-blue text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[120px]"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Check'}
        </button>
      </form>

      <AnimatePresence mode="wait">
        {result === 'NOT_FOUND' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-4"
          >
            <div className="p-2 bg-emerald-100 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-800">No Record Found</h3>
              <p className="text-sm text-emerald-700 leading-relaxed">
                This account/number is not currently in our flagged database. However, please remain vigilant as new scams emerge daily.
              </p>
            </div>
          </motion.div>
        )}

        {result && result !== 'NOT_FOUND' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className={`p-5 rounded-xl border-2 flex flex-col gap-4 ${
              result.status === 'FLAGGED' 
                ? 'bg-red-50 border-red-200' 
                : 'bg-amber-50 border-amber-200'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${
                  result.status === 'FLAGGED' ? 'bg-red-100' : 'bg-amber-100'
                }`}>
                  <ShieldAlert className={`w-8 h-8 ${
                    result.status === 'FLAGGED' ? 'text-red-600' : 'text-amber-600'
                  }`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`font-black text-xl uppercase ${
                      result.status === 'FLAGGED' ? 'text-red-700' : 'text-amber-700'
                    }`}>
                      {result.status}
                    </h3>
                    <span className="px-2 py-0.5 bg-white/50 rounded text-xs font-mono border border-current opacity-60">
                      {result.id}
                    </span>
                  </div>
                  <p className="font-mono text-lg font-bold text-slate-800 tracking-wider">
                    {result.value} {result.bankName && `(${result.bankName})`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase font-bold text-slate-500 tracking-tighter">Reports</p>
                <p className="text-2xl font-black text-slate-800 leading-none">{result.reportCount}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/40 p-3 rounded-lg">
                <p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
                  <AlertTriangle className="w-3 h-3" /> Category
                </p>
                <p className="font-semibold text-slate-700">{result.category}</p>
              </div>
              <div className="bg-white/40 p-3 rounded-lg">
                <p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
                  <Info className="w-3 h-3" /> Last Reported
                </p>
                <p className="font-semibold text-slate-700">{result.lastReported}</p>
              </div>
            </div>

            <div className="mt-2 text-sm text-slate-600 italic bg-white/20 p-3 border-l-4 border-current rounded-r-lg">
              "{result.context}"
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
