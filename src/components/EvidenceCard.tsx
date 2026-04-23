/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FileText, Image as ImageIcon, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Evidence } from "../types";

export function EvidenceCard({ evidence }: { evidence: Evidence }) {
  const isHighRisk = (evidence.forensics?.riskScore || 0) > 70;

  return (
    <div className="bg-slate-100 rounded-xl p-4 border border-card-border overflow-hidden group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {evidence.type === 'image' ? <ImageIcon className="w-3.5 h-3.5 text-text-slate" /> : <FileText className="w-3.5 h-3.5 text-text-slate" />}
          <span className="text-[10px] font-bold uppercase text-text-slate tracking-widest">
            {evidence.type}: {evidence.id.slice(0, 8)}
          </span>
        </div>
        {evidence.forensics && (
          <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${isHighRisk ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
            {isHighRisk ? 'Critical' : 'Safe'} {evidence.forensics.riskScore}%
          </div>
        )}
      </div>

      <div className="space-y-3">
        {evidence.url && (
          <div className="relative aspect-video rounded-lg overflow-hidden border border-neutral-200 shadow-sm bg-white">
            <img src={evidence.url} alt="Evidence" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-black/5" />
          </div>
        )}
        {evidence.content && (
          <div className="bg-white border border-neutral-200 p-3 rounded-lg shadow-inner">
            <p className="text-[11px] text-text-primary font-mono line-clamp-4 leading-relaxed">
              {evidence.content}
            </p>
          </div>
        )}

        {evidence.forensics && (
          <div className="pt-2 border-t border-neutral-200">
             <p className="text-[11px] text-text-primary leading-snug">
               {evidence.forensics.evaluation}
             </p>
          </div>
        )}
      </div>
    </div>
  );
}
