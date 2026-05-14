import React, { useState } from 'react';
import { Camera, Layers, Lightbulb, Zap, Copy, Check, Loader2, Send, Languages, Focus } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface Shot {
  id: string;
  type: string; // Close-up, Wide, etc.
  angle: string; // Low angle, High, etc.
  lens: string; // 35mm, 85mm, etc.
  description: string;
  movement: string;
  lighting: string;
}

export default function ShotPlannerIA() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [shots, setShots] = useState<Shot[]>([]);
  const [concept, setConcept] = useState('');
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const generateShotList = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const prompt = `Actúa como un Director de Fotografía (DoP) y Realizador experto.
      A partir de la siguiente descripción de escena o guion, genera una lista de planos (Shot List) técnica y creativa.
      
      Escena: "${input}"
      
      Devuelve la respuesta estrictamente en este formato JSON:
      {
        "concept": "Breve visión estética de la escena (color, atmósfera)",
        "shot_list": [
          {
            "id": "1",
            "type": "Gran Plano General / Primer Plano / etc",
            "angle": "Normal / Picado / Contrapicado / etc",
            "lens": "Sugerencia de focal (ej: 35mm, 85mm)",
            "description": "Qué sucede en el plano",
            "movement": "Fijo / Pan / Tilt / Gimbal / Handheld",
            "lighting": "Sugerencia de luz (ej: Rembrandt, Softbox lateral, Natural)"
          }
        ]
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const data = JSON.parse(response.text);
      setConcept(data.concept);
      setShots(data.shot_list);
    } catch (error) {
      console.error('Error generating shot list:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyTableToClipboard = async () => {
    const headers = ['#', 'Tipo', 'Ángulo', 'Lente', 'Movimiento', 'Descripción', 'Iluminación'].join('\t');
    const rows = shots.map((s, i) => 
      [i + 1, s.type, s.angle, s.lens, s.movement, s.description, s.lighting].join('\t')
    );
    const text = [headers, ...rows].join('\n');
    
    const html = `
      <table border="1" style="border-collapse: collapse; width: 100%; font-family: sans-serif; font-size: 10pt;">
        <thead>
          <tr style="background-color: #f8fafc; font-weight: bold;">
            <th style="padding: 8px; border: 1px solid #e2e8f0;">#</th>
            <th style="padding: 8px; border: 1px solid #e2e8f0;">Tipo</th>
            <th style="padding: 8px; border: 1px solid #e2e8f0;">Ángulo</th>
            <th style="padding: 8px; border: 1px solid #e2e8f0;">Lente</th>
            <th style="padding: 8px; border: 1px solid #e2e8f0;">Movimiento</th>
            <th style="padding: 8px; border: 1px solid #e2e8f0;">Descripción</th>
            <th style="padding: 8px; border: 1px solid #e2e8f0;">Iluminación</th>
          </tr>
        </thead>
        <tbody>
          ${shots.map((s, i) => `
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${i + 1}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">${s.type}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${s.angle}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; color: #2563eb;">${s.lens}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${s.movement}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${s.description}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; color: #d97706;">${s.lighting}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const blobText = new Blob([text], { type: "text/plain" });
    const blobHtml = new Blob([html], { type: "text/html" });
    const item = new ClipboardItem({ "text/plain": blobText, "text/html": blobHtml });
    await navigator.clipboard.write([item]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendToProcessor = () => {
    const mdHeader = "| # | Tipo | Ángulo | Lente | Descripción | Movimiento | Luz |\n|---|---|---|---|---|---|---|";
    const mdRows = shots.map((s, i) => 
      `| ${i+1} | ${s.type} | ${s.angle} | ${s.lens} | ${s.description} | ${s.movement} | ${s.lighting} |`
    ).join('\n');
    
    const fullText = `# PLAN DE RODAJE / SHOT LIST\n\n**Concepto Visual:** ${concept}\n\n${mdHeader}\n${mdRows}`;
    
    window.dispatchEvent(new CustomEvent('app-set-text', { 
      detail: { text: fullText, append: true } 
    }));
    
    setSent(true);
    setTimeout(() => setSent(false), 2000);
  };

  return (
    <div className="space-y-6" id="shot-planner">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
          <Camera size={20} />
        </div>
        <div>
          <h2 className="text-sm font-bold">Shot List Planner</h2>
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Planificación de Rodaje</p>
        </div>
      </div>

      <div className="space-y-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe la escena o pega un fragmento de tu guion..."
          className="w-full h-28 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-emerald-200 resize-none font-sans"
        />
        
        <button
          onClick={generateShotList}
          disabled={loading || !input.trim()}
          className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-30 transition-all shadow-md shadow-emerald-100"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} fill="currentColor" />}
          {loading ? 'Analizando escena...' : 'Generar Shot List Técnico'}
        </button>
      </div>

      {shots.length > 0 && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="p-4 bg-emerald-50/30 rounded-xl border border-emerald-100">
            <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">
              <Lightbulb size={12} />
              <span>Visión Estética</span>
            </div>
            <p className="text-xs text-emerald-900 leading-relaxed italic">{concept}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <Layers size={12} />
                <span>Lista de Planos</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={sendToProcessor}
                  className="flex items-center gap-1.5 px-2 py-1 hover:bg-gray-50 rounded-md text-[9px] font-bold text-gray-400 transition-colors border border-transparent hover:border-gray-100"
                >
                  {sent ? <Check size={12} className="text-green-500" /> : <Send size={12} />}
                  <span>{sent ? 'Enviado' : 'Enviar a Procesador'}</span>
                </button>
                <button 
                  onClick={copyTableToClipboard}
                  className="flex items-center gap-1.5 px-2 py-1 hover:bg-gray-50 rounded-md text-[9px] font-bold text-gray-400 transition-colors border border-transparent hover:border-gray-100"
                >
                  {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                  <span>{copied ? 'Copiado' : 'Copiar Tabla'}</span>
                </button>
              </div>
            </div>

            <div className="grid gap-2 overflow-x-auto">
              <div className="min-w-[600px] grid grid-cols-12 gap-2 text-[8px] font-bold text-gray-400 uppercase tracking-tighter px-3 mb-1">
                <div className="col-span-1">#</div>
                <div className="col-span-2">Plano / Ángulo</div>
                <div className="col-span-1 text-center">Lente</div>
                <div className="col-span-1 text-center">Mov.</div>
                <div className="col-span-4">Descripción</div>
                <div className="col-span-3">Iluminación</div>
              </div>
              
              {shots.map((shot, idx) => (
                <div key={idx} className="min-w-[600px] grid grid-cols-12 gap-2 p-3 bg-white border border-gray-100 rounded-xl hover:border-emerald-100 transition-all text-[11px]">
                  <div className="col-span-1 flex items-center font-bold text-gray-300">{idx + 1}</div>
                  <div className="col-span-2 space-y-0.5">
                    <div className="font-bold text-gray-900">{shot.type}</div>
                    <div className="text-[9px] text-gray-400 uppercase">{shot.angle}</div>
                  </div>
                  <div className="col-span-1 flex items-center justify-center font-bold text-blue-600 bg-blue-50/50 rounded-lg">{shot.lens}</div>
                  <div className="col-span-1 flex items-center justify-center text-center text-[9px] font-medium text-gray-500 leading-tight">{shot.movement}</div>
                  <div className="col-span-4 flex items-center text-gray-600 pr-2">{shot.description}</div>
                  <div className="col-span-3 flex items-center gap-2 text-amber-600 bg-amber-50/30 px-2 py-1 rounded-lg border border-amber-100/30">
                    <Focus size={10} className="flex-none opacity-50" />
                    <span className="text-[10px] leading-snug">{shot.lighting}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
