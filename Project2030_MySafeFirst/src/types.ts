/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RiskLevel = 'low' | 'medium' | 'high';

export type AppMode = 'TRIAGE' | 'STEP_BY_STEP' | 'PANIC' | 'REPORT';

export type ToneType = 'FIRST_RESPONDER' | 'DETECTIVE' | 'SUPPORTIVE';

export interface Evidence {
  id: string;
  type: 'image' | 'text' | 'audio' | 'video';
  url?: string;
  content?: string;
  base64?: string;
  mimeType?: string;
  forensics?: {
    redFlags: string[];
    muleAccounts?: string[];
    phoneNumbers?: string[];
    riskScore: number;
    evaluation: string;
  };
}

export interface Step {
  id: number;
  command: string;
  explanation: string;
  deepDive?: string;
  isCompleted: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'step' | 'forensics' | 'report';
  suggestions?: string[]; // Buttons the UI should show for this message
}

export type AppView = 'INPUT' | 'LOADING' | 'CHAT' | 'SUCCESS';

export interface AppState {
  view: AppView;
  mode: AppMode;
  riskLevel: RiskLevel;
  tone: ToneType;
  currentStepIndex: number; // Still good for internal tracking
  steps: Step[];
  evidenceList: Evidence[];
  userInput: string;
  isAnalyzing: boolean;
  incidentSummary?: string;
  chatHistory: Message[];
}
