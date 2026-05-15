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
    <div className="space-y-12 bg-transparent pb-4" id="qr-generator">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">Módulo de Matriz</h2>
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-tighter">SISTEMA.CODIFICADOR_QR</span>
        </div>
        <div className="p-3 bg-black text-white rounded-none shadow-2xl">
          <QrCode size={20} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div className="space-y-10">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-zinc-950 uppercase tracking-[0.3em] flex items-center gap-3 ml-1">
              <LinkIcon size={14} className="text-black" />
              Enlace de Origen (URL)
            </label>
            <div className="relative group">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://dominio.destino"
                className="w-full pl-6 pr-14 py-5 bg-zinc-50 border-2 border-black/5 rounded-none text-base focus:outline-none focus:border-black transition-all font-mono text-black placeholder-zinc-300 shadow-sm"
              />
              <button 
                onClick={copyUrl}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black transition-colors active:scale-90"
                title="Copiar Origen"
              >
                {copied ? <Check size={20} /> : <Copy size={20} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-zinc-950 uppercase tracking-[0.3em] flex items-center gap-3 ml-1">
                <Palette size={14} className="text-black" />
                Primer Plano
              </label>
              <div className="flex items-center gap-5 p-4 bg-zinc-50 border-2 border-black/5 rounded-none group hover:border-black transition-all shadow-sm">
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="w-12 h-12 rounded-none border-0 bg-transparent cursor-pointer ring-2 ring-black/5"
                />
                <span className="text-[12px] font-mono text-black font-black uppercase tracking-widest">{fgColor}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center pr-1">
                <label className="text-[10px] font-black text-zinc-950 uppercase tracking-[0.3em] flex items-center gap-3 ml-1">
                  <Box size={14} className="text-black" />
                  Fondo
                </label>
                <button 
                  onClick={() => setIsTransparent(!isTransparent)}
                  className={`text-[9px] font-black px-3 py-1 rounded-none border-2 uppercase transition-all ${
                    isTransparent ? 'bg-black border-black text-white' : 'bg-transparent border-zinc-200 text-zinc-400 hover:text-black hover:border-black'
                  }`}
                >
                  {isTransparent ? 'Alfa_ON' : 'Alfa_OFF'}
                </button>
              </div>
              {!isTransparent ? (
                <div className="flex items-center gap-5 p-4 bg-zinc-50 border-2 border-black/5 rounded-none group hover:border-black transition-all shadow-sm">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-12 h-12 rounded-none border-0 bg-transparent cursor-pointer ring-2 ring-black/5"
                  />
                  <span className="text-[12px] font-mono text-black font-black uppercase tracking-widest">{bgColor}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center p-4 h-[84px] bg-zinc-50 border-2 border-zinc-200 border-dashed rounded-none">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em]">Transparencia.Vector</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6 p-8 bg-zinc-50 rounded-none border-2 border-zinc-100">
            <div className="flex items-center gap-3 text-[10px] font-black text-zinc-950 uppercase tracking-[0.3em] mb-4">
              <Settings2 size={16} className="text-black" />
              Parámetros de Señal
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] italic">Vector de Corrección</span>
                <select 
                  value={level}
                  onChange={(e) => setLevel(e.target.value as any)}
                  className="w-full bg-white border-2 border-zinc-100 rounded-none py-3 px-4 text-[11px] font-black text-black focus:outline-none focus:border-black transition-all appearance-none cursor-pointer uppercase tracking-widest"
                >
                  <option value="L">Mínimo (L)</option>
                  <option value="M">Medio (M)</option>
                  <option value="Q">Alto (Q)</option>
                  <option value="H">Ultra (H)</option>
                </select>
              </div>
              <div className="flex items-center gap-4 pt-6">
                <input
                  type="checkbox"
                  id="margin"
                  checked={includeMargin}
                  onChange={(e) => setIncludeMargin(e.target.checked)}
                  className="w-6 h-6 accent-black bg-white border-2 border-zinc-200 rounded-none cursor-pointer"
                />
                <label htmlFor="margin" className="text-[10px] font-black text-zinc-950 uppercase tracking-[0.2em] cursor-pointer select-none">
                  Margen de Seguridad
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center space-y-12 lg:pl-16 lg:border-l-4 border-black/5">
          <div className="relative group max-w-full">
            {/* Visual Preview */}
            <div className={`p-8 sm:p-12 lg:p-16 rounded-none border-4 border-black shadow-2xl transition-all hover:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] duration-700 relative max-w-full overflow-hidden ${isTransparent ? 'bg-zinc-50 bg-[size:20px_20px] bg-[linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px)]' : 'bg-white shadow-black/10'}`}>
              <div ref={qrRef} className="flex p-4 bg-transparent rounded-none max-w-full overflow-hidden justify-center overflow-x-auto">
                <QRCodeCanvas
                  value={url || ' '}
                  size={240}
                  fgColor={fgColor}
                  bgColor={effectiveBgColor}
                  level={level}
                  includeMargin={includeMargin}
                  className="max-w-full h-auto"
                />
              </div>
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
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-6 py-2.5 bg-black text-white text-[10px] font-black uppercase rounded-none tracking-[0.4em] shadow-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 z-10 italic">
              SÍNTESIS_ACTIVA:LISTO
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 w-full max-w-[360px]">
            <button
              onClick={downloadPNG}
              disabled={!url}
              className="flex-1 py-5 bg-black text-white rounded-none font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-zinc-800 disabled:opacity-30 transition-all shadow-2xl active:scale-[0.98] border-2 border-black"
            >
              <Download size={16} />
              Exportar .PNG
            </button>
            <button
              onClick={downloadSVG}
              disabled={!url}
              className="flex-1 py-5 bg-white border-2 border-black text-black rounded-none font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-zinc-50 disabled:opacity-30 transition-all active:scale-[0.98] shadow-xl"
            >
              <Download size={16} />
              Vector .SVG
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-10 text-[9px] font-black text-zinc-300 uppercase tracking-[0.4em] pt-12 border-t-2 border-black/5 italic">
        <span className="flex items-center gap-3">
          <div className="w-2 h-2 bg-black" />
          Cuadrícula Óptica_ALTA_EFICIENCIA
        </span>
        <span className="flex items-center gap-3">
          <div className="w-2 h-2 bg-black" />
          Integridad de Matriz_OK
        </span>
      </div>
    </div>
  );
}

