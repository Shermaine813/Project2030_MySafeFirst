/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { AppMode, RiskLevel, ToneType, Evidence, Step, Message } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const model = "gemini-3-flash-preview";

function extractJson(text: string): string {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return text.substring(start, end + 1);
  }
  return text.trim();
}

export async function analyzeCrisis(
  input: string,
  evidence?: Evidence[],
  isPanic: boolean = false
): Promise<{
  riskLevel: RiskLevel;
  tone: ToneType;
  forensics: string;
  suggestedMode: AppMode;
  initialSteps: Step[];
  botResponse: string;
  buttons: string[];
}> {
  const panicPrefix = isPanic ? "PANIC PROTOCOL ACTIVATED. User has already lost money. Start freezing assets immediately. " : "";
  const parts: any[] = [{ text: `${panicPrefix}Analyze the following user crisis input and any evidence provided. User says: "${input}"` }];

  if (evidence) {
    evidence.forEach(ev => {
      if (ev.base64 && ev.mimeType) {
        parts.push({ inlineData: { data: ev.base64, mimeType: ev.mimeType } });
      } else if (ev.content) {
        parts.push({ text: `Evidence Content: ${ev.content}` });
      }
    });
  }

  parts.push({
    text: `
    Return your analysis in JSON format exactly as specified.
    
    The 'botResponse' is your first chat message.
    Follow Phase 1: summary + "Ready to start?"
    Follow Phase 3 if isPanic: "Freeze assets fast."
    
    The 'buttons' field MUST contain the action buttons for the current step.
    
    Schema:
    {
      "riskLevel": "high" | "medium" | "low",
      "tone": "FIRST_RESPONDER" | "DETECTIVE" | "SUPPORTIVE",
      "forensics": "concise summary",
      "suggestedMode": "TRIAGE" | "PANIC" | "STEP_BY_STEP",
      "botResponse": "AI message text",
      "buttons": ["Button Label 1", "Button Label 2"],
      "initialSteps": []
    }
  `});

  try {
    const result = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: { type: Type.STRING },
            tone: { type: Type.STRING },
            forensics: { type: Type.STRING },
            suggestedMode: { type: Type.STRING },
            botResponse: { type: Type.STRING },
            buttons: { type: Type.ARRAY, items: { type: Type.STRING } },
            initialSteps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.NUMBER },
                  command: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  deepDive: { type: Type.STRING },
                  isCompleted: { type: Type.BOOLEAN },
                },
                required: ["id", "command", "explanation", "isCompleted"],
              },
            },
          },
          required: ["riskLevel", "tone", "forensics", "suggestedMode", "botResponse", "buttons", "initialSteps"],
        } as any,
      },
    });

    const text = result?.text || "{}";
    const cleanedText = extractJson(text);

    try {
      const parsed = JSON.parse(cleanedText);
      return {
        riskLevel: (parsed.riskLevel as RiskLevel) || "medium",
        tone: (parsed.tone as ToneType) || "SUPPORTIVE",
        forensics: parsed.forensics || "No forensic data extracted.",
        suggestedMode: (parsed.suggestedMode as AppMode) || "TRIAGE",
        botResponse: parsed.botResponse || "I'm looking into this for you.",
        buttons: Array.isArray(parsed.buttons) ? parsed.buttons : ["Ready to start"],
        initialSteps: Array.isArray(parsed.initialSteps) ? parsed.initialSteps : [],
      };
    } catch (e) {
      throw e;
    }
  } catch (error) {
    console.error("Gemini Analysis Failure:", error);
    return {
      riskLevel: "medium",
      tone: "SUPPORTIVE",
      forensics: "Error during analysis.",
      suggestedMode: "TRIAGE",
      botResponse: "I'm here to help. Let's start by securing your accounts.",
      buttons: ["Start Recovery"],
      initialSteps: [],
    };
  }
}

export async function continueChat(
  history: Message[],
  userInput: string
): Promise<{ message: string; buttons: string[] }> {
  const prompt = `
    User input: "${userInput}"
    History: ${JSON.stringify(history.slice(-10))}
    
    Instruction: Answer and provide 1-3 buttons for the next action.
    Return JSON: { "message": "...", "buttons": ["..."] }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING },
            buttons: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["message", "buttons"],
        } as any,
      },
    });

    const parsed = JSON.parse(extractJson(response?.text || "{}"));
    return {
      message: parsed.message || "I'm here to help.",
      buttons: Array.isArray(parsed.buttons) ? parsed.buttons : [],
    };
  } catch (error) {
    return {
      message: "I'm here for you. Let's focus on the next step together.",
      buttons: ["Continue"],
    };
  }
}

export async function generateIncidentSummary(
  scammerInfo: { bank?: string; no?: string; amount?: string; time?: string },
  evidence: Evidence[]
): Promise<string> {
  const prompt = `
    Generate a PDRM Standard Incident Summary based on the Following Template:
    
    🧾 ROYAL MALAYSIA POLICE (PDRM)
    POLICE REPORT (SCAM CASE)

    A. INFORMANT DETAILS
    Full Name: [PENDING]
    NRIC / Passport No.: [PENDING]
    Contact Number: [PENDING]
    Address: [PENDING]

    B. INCIDENT DETAILS
    Date & Time: ${scammerInfo.time || "[PENDING]"}
    Platform / Location: [PENDING]

    C. TYPE OF CASE
    [Detected Scam Type]

    D. INCIDENT DESCRIPTION
    [Detailed narrative]

    E. SUSPECT DETAILS
    Name: [If available]
    Phone Number: ${scammerInfo.no || "[PENDING]"}
    Bank Details: ${scammerInfo.bank || "[PENDING]"}

    F. TRANSACTION DETAILS
    Amount: RM ${scammerInfo.amount || "[PENDING]"}

    G. SUPPORTING EVIDENCE
    Evidence List: ${JSON.stringify(evidence.map(e => e.type))}

    Information Provided: ${JSON.stringify(scammerInfo)}
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
  });

  return response?.text || "Failed to generate report.";
}
