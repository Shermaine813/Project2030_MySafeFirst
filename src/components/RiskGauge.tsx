/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { RiskLevel } from "../types";

export function RiskGauge({ level }: { level: RiskLevel }) {
  const getPointerPosition = () => {
    switch (level) {
      case "low": return "10%";
      case "medium": return "50%";
      case "high": return "90%";
    }
  };

  return (
    <div className="w-full">
      <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500" />
        <motion.div
          animate={{ left: getPointerPosition() }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="absolute top-0 w-1 h-full bg-slate-900 z-10 -ml-[2px]"
        />
      </div>
      
      <div className="flex justify-between items-center text-[9px] font-black tracking-widest text-slate-400 uppercase">
        <span>Trust Level</span>
        <span className={level === 'high' ? 'text-red-500' : 'text-slate-900'}>
          Threat status: {level}
        </span>
      </div>
    </div>
  );
}
