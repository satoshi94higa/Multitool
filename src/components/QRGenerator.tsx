import React, { useState, useRef } from 'react';
import { QrCode, Download, Link as LinkIcon, Palette, Settings2, Check, Copy, Box } from 'lucide-react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';

export default function QRGenerator() {
  const [url, setUrl] = useState('https://utilhub.app');
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [isTransparent, setIsTransparent] = useState(false);
  const [size, setSize] = useState(512);
  const [includeMargin, setIncludeMargin] = useState(true);
  const [level, setLevel] = useState<'L' | 'M' | 'Q' | 'H'>('Q');
  const [copied, setCopied] = useState(false);
  
  const qrRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);

  const downloadPNG = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `qr-code-${Date.now()}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const downloadSVG = () => {
    const svg = svgRef.current?.querySelector('svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const svgUrl = URL.createObjectURL(svgBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = svgUrl;
      downloadLink.download = `qr-code-${Date.now()}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(svgUrl);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const effectiveBgColor = isTransparent ? 'transparent' : bgColor;

  return (
    <div className="space-y-6" id="qr-generator">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
          <QrCode size={20} />
        </div>
        <div>
          <h2 className="text-sm font-bold">Generador de QR</h2>
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Dinámico & Personalizable</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <LinkIcon size={12} />
              URL o Contenido
            </label>
            <div className="relative group">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://ejemplo.com"
                className="w-full pl-3 pr-10 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-emerald-200"
              />
              <button 
                onClick={copyUrl}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-emerald-500 transition-colors"
                title="Copiar link"
              >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Palette size={12} />
                Color del código
              </label>
              <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-100 rounded-xl">
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer"
                />
                <span className="text-[10px] font-mono text-gray-500 font-bold">{fgColor.toUpperCase()}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center pr-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Box size={12} />
                  Fondo
                </label>
                <button 
                  onClick={() => setIsTransparent(!isTransparent)}
                  className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase transition-all ${
                    isTransparent ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-gray-200 text-gray-400'
                  }`}
                >
                  {isTransparent ? 'Transparente ON' : 'Transparente OFF'}
                </button>
              </div>
              {!isTransparent ? (
                <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-100 rounded-xl">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-gray-500 font-bold">{bgColor.toUpperCase()}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center p-2 h-[42px] bg-emerald-50/50 border border-emerald-100 border-dashed rounded-xl">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">Sin fondo activo</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
              <Settings2 size={12} />
              Ajustes de Lectura
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-gray-500 uppercase">Redundancia</span>
                <select 
                  value={level}
                  onChange={(e) => setLevel(e.target.value as any)}
                  className="w-full bg-white border border-gray-100 rounded p-1.5 text-[10px] focus:outline-none"
                >
                  <option value="L">Mínima (L)</option>
                  <option value="M">Media (M)</option>
                  <option value="Q">Alta (Q) - Recomendada</option>
                  <option value="H">Máxima (H)</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="margin"
                  checked={includeMargin}
                  onChange={(e) => setIncludeMargin(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                />
                <label htmlFor="margin" className="text-[10px] font-bold text-gray-500 uppercase cursor-pointer select-none">
                  Incluir Margen Blanco
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center space-y-6 lg:border-l lg:border-gray-50 lg:pl-8">
          <div className="relative group">
            {/* Visual Preview (Alpha pattern if transparent) */}
            <div className={`p-8 rounded-2xl shadow-2xl transition-all hover:scale-[1.02] relative ${isTransparent ? 'bg-[url("https://www.transparenttextures.com/patterns/carbon-fibre.png")] bg-gray-100' : 'bg-white shadow-gray-200/50'}`}>
              <div ref={qrRef} className="flex">
                <QRCodeCanvas
                  value={url || ' '}
                  size={200}
                  fgColor={fgColor}
                  bgColor={effectiveBgColor}
                  level={level}
                  includeMargin={includeMargin}
                />
              </div>
              {/* Hidden SVG for download */}
              <div ref={svgRef} className="hidden">
                <QRCodeSVG
                  value={url || ' '}
                  size={size}
                  fgColor={fgColor}
                  bgColor={effectiveBgColor}
                  level={level}
                  includeMargin={includeMargin}
                />
              </div>
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-900 text-white text-[9px] font-black uppercase rounded-full tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
              Preview Dinámico
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full max-w-[280px]">
            <button
              onClick={downloadPNG}
              disabled={!url}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-30 transition-all shadow-md shadow-emerald-100"
            >
              <Download size={14} />
              PNG
            </button>
            <button
              onClick={downloadSVG}
              disabled={!url}
              className="flex-1 py-3 bg-white border border-emerald-100 text-emerald-600 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-emerald-50 disabled:opacity-30 transition-all shadow-sm"
            >
              <Download size={14} />
              SVG (Vector)
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-4 border-t border-gray-50">
        <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          HQ Vectorial
        </span>
        <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Transparencia OK
        </span>
        <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          Lectura Verificada
        </span>
      </div>
    </div>
  );
}

