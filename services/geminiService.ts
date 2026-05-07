
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const SYSTEM_PROMPT = `
You are a senior Jungian Art Therapist and an AI Music Composer. 
The user provides an image of a "Soul Vinyl" art therapy exercise.
- **Center/Inner Circle**: Represents the Subconscious, raw emotions, and the "Shadow".
- **Periphery/Outer Circle**: Represents the Persona, social mask, and interaction with the world.

**TASK 1: PROFESSIONAL PSYCHOLOGICAL ANALYSIS**
Analyze the painting using Art Therapy principles:
1.  **Color Psychology**: Analyze Hue (emotion), Saturation (energy intensity), and Value (conscious awareness).
2.  **Structural Analysis**: Geometric vs Organic.
3.  **Integration**: How do the inner and outer circles meet?

**TASK 2: COMPOSE A COMPLEX 4-STAGE HEALING SYMPHONY**
Design a procedural music configuration.
The song MUST follow this structure with **dynamic evolution**:
1.  **Intro**: Atmosphere, low tempo, establishing the root.
2.  **Inner Reflection**: Deep, focusing on the subconscious.
3.  **Integration**: Increasing harmonic complexity and tempo.
4.  **Outer Persona**: Structured, rhythmic, resolving the tension.

**Advanced Musical Rules:**
- **Harmony**: Do NOT stick to simple triads [1,3,5]. Use **Extended Chords** (7ths, 9ths, sus4) to express complex emotions.
  - *Example*: [1, 3, 5, 7] for longing, [1, 4, 5] for suspension.
- **Rhythm**: Varies per stage.
  - *Inner*: 'flowing' or 'chaotic'.
  - *Outer*: 'steady' or 'syncopated'.
- **Tempo**: Varies per stage. Integration usually speeds up.
- **Scale**:
  - Healing -> Lydian/Major.
  - Deep/Sad -> Dorian/Phrygian.

Return ONLY valid JSON.
`;

export const analyzeVinylImage = async (base64Image: string, lang: 'en' | 'zh'): Promise<AnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `${SYSTEM_PROMPT}. 
  Provide the output in ${lang === 'zh' ? 'Chinese (Simplified)' : 'English'}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "image/jpeg", data: base64Image } }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            innerCircle: {
              type: Type.OBJECT,
              properties: { dominantColor: { type: Type.STRING }, mood: { type: Type.STRING } },
              required: ["dominantColor", "mood"]
            },
            outerCircle: {
              type: Type.OBJECT,
              properties: { dominantColor: { type: Type.STRING }, mood: { type: Type.STRING } },
              required: ["dominantColor", "mood"]
            },
            title: { type: Type.STRING },
            psychologicalProfile: {
              type: Type.OBJECT,
              properties: {
                archetype: { type: Type.STRING },
                emotionalState: { type: Type.STRING },
                subconsciousAnalysis: { type: Type.STRING },
                personaAnalysis: { type: Type.STRING },
                integrationAdvice: { type: Type.STRING }
              },
              required: ["archetype", "emotionalState", "subconsciousAnalysis", "personaAnalysis", "integrationAdvice"]
            },
            musicalJourney: {
              type: Type.OBJECT,
              properties: {
                key: { type: Type.STRING },
                baseFrequency: { type: Type.NUMBER },
                tempo: { type: Type.NUMBER },
                stages: {
                  type: Type.ARRAY,
                  description: "Exactly 4 items: Intro, Inner, Integration, Outer",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      stageName: { type: Type.STRING },
                      tempo: { type: Type.NUMBER, description: "BPM for this specific stage" },
                      energy: { type: Type.NUMBER },
                      texture: { type: Type.STRING, enum: ["ethereal", "grounded", "complex", "structured"] },
                      rhythmicFeel: { type: Type.STRING, enum: ["steady", "flowing", "syncopated", "chaotic"] },
                      instrumentation: { 
                        type: Type.ARRAY, 
                        items: { type: Type.STRING, enum: ["pad", "bass", "chimes", "lead", "rhythm", "texture"] } 
                      },
                      chordProgression: {
                         type: Type.ARRAY,
                         items: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                         description: "Array of chords, where each chord is an array of scale degrees (e.g. [1,3,5,7])"
                      },
                      scaleMode: { type: Type.STRING, enum: ["major", "minor", "dorian", "lydian", "mixolydian", "phrygian"] }
                    },
                    required: ["stageName", "tempo", "energy", "texture", "rhythmicFeel", "instrumentation", "chordProgression", "scaleMode"]
                  }
                }
              },
              required: ["key", "baseFrequency", "tempo", "stages"]
            }
          },
          required: ["innerCircle", "outerCircle", "title", "psychologicalProfile", "musicalJourney"]
        }
      }
    });

    return JSON.parse(response.text || "{}") as AnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw new Error("Failed to analyze the soul record.");
  }
};
