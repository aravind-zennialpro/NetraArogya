/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { MedicineAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeMedicineImage(
  base64Image: string,
  mimeType: string,
  targetLanguage: string
): Promise<MedicineAnalysis> {
  const prompt = `
    Analyze this medicine tablet sheet image. Note: The sheet might be torn, folded, or partially used.
    1. OCR: Extract Brand Name and Chemical Composition precisely. If the sheet is damaged, use visible fragments to identify the medicine.
    2. Analysis: Provide details in ${targetLanguage}.
    
    JSON structure:
    {
      "name": "Brand Name (Identify even if partially visible)",
      "composition": "Active ingredients (Identify even if partially visible)",
      "purpose": "👉 Short summary of main purpose",
      "howItWorks": "Mechanism of action",
      "componentRoles": "Role of each component",
      "diseases": ["Conditions treated"],
      "symptoms": ["Symptoms helped"],
      "extraUseCases": ["Additional use cases"],
      "dosageInfo": "How to take (e.g., before food, shake well)",
      "warnings": "Precautions",
      "sideEffects": "Side effects",
      "simpleUnderstanding": "👉 One-sentence simple explanation"
    }
    
    If unidentified after your best effort to reconstruct fragments, return {"error": "reason"}. Translate all to ${targetLanguage}.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType,
            data: base64Image.split(',')[1] || base64Image,
          },
        },
        { text: prompt },
      ],
    },
    config: {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          composition: { type: Type.STRING },
          purpose: { type: Type.STRING },
          howItWorks: { type: Type.STRING },
          componentRoles: { type: Type.STRING },
          diseases: { type: Type.ARRAY, items: { type: Type.STRING } },
          symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
          extraUseCases: { type: Type.ARRAY, items: { type: Type.STRING } },
          dosageInfo: { type: Type.STRING },
          warnings: { type: Type.STRING },
          sideEffects: { type: Type.STRING },
          simpleUnderstanding: { type: Type.STRING },
          error: { type: Type.STRING },
        },
      },
    },
  });

  const result = JSON.parse(response.text || '{}');
  if (result.error) {
    throw new Error(result.error);
  }
  return result as MedicineAnalysis;
}

export async function searchMedicineByText(
  query: string,
  targetLanguage: string
): Promise<MedicineAnalysis> {
  const prompt = `
    Provide info for medicine: "${query}".
    Details in ${targetLanguage}.
    
    JSON structure:
    {
      "name": "Name",
      "composition": "Ingredients",
      "purpose": "👉 Purpose",
      "howItWorks": "How it works",
      "componentRoles": "Component roles",
      "diseases": ["Conditions"],
      "symptoms": ["Symptoms"],
      "extraUseCases": ["Extra uses"],
      "dosageInfo": "How to take",
      "warnings": "Precautions",
      "sideEffects": "Side effects",
      "simpleUnderstanding": "👉 Simple explanation"
    }
    
    If not found, return {"error": "reason"}. Translate all to ${targetLanguage}.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          composition: { type: Type.STRING },
          purpose: { type: Type.STRING },
          howItWorks: { type: Type.STRING },
          componentRoles: { type: Type.STRING },
          diseases: { type: Type.ARRAY, items: { type: Type.STRING } },
          symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
          extraUseCases: { type: Type.ARRAY, items: { type: Type.STRING } },
          dosageInfo: { type: Type.STRING },
          warnings: { type: Type.STRING },
          sideEffects: { type: Type.STRING },
          simpleUnderstanding: { type: Type.STRING },
          error: { type: Type.STRING },
        },
      },
    },
  });

  const result = JSON.parse(response.text || '{}');
  if (result.error) {
    throw new Error(result.error);
  }
  return result as MedicineAnalysis;
}
