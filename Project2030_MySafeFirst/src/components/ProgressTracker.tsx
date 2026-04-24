/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { AppMode } from "../types";

export function ProgressTracker({ mode }: { mode: AppMode }) {
  const getProgress = () => {
    if (mode === 'REPORT') return 100;
    if (mode === 'STEP_BY_STEP' || mode === 'PANIC') return 60;
    if (mode === 'TRIAGE') return 20;
    return 5;
  };

  return (
    <div className="w-full space-y-1">
      <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${getProgress()}%` }}
          className="h-full bg-brand-blue"
        />
      </div>
      <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.15em] text-slate-300">
        <span>Protocol Initialized</span>
        <span className="text-brand-blue">{getProgress()}% COMPLETE</span>
      </div>
    </div>
  );
}
