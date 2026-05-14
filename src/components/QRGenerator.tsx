import React, { useState, useRef } from 'react';
import { QrCode, Download, Link as LinkIcon, Palette, Settings2, Check, Copy } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

export default function QRGenerator() {
  const [url, setUrl] = useState('https://utilhub.app');
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [size, setSize] = useState(256);
  const [includeMargin, setIncludeMargin] = useState(true);
  const [level, setLevel] = useState<'L' | 'M' | 'Q' | 'H'>('L');
  const [copied, setCopied] = useState(false);
  
  const qrRef = useRef<HTMLDivElement>(null);

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      let downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `qr-code-${Date.now()}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Palette size={12} />
                Color QR
              </label>
              <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-100 rounded-xl">
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer"
                />
                <span className="text-[10px] font-mono text-gray-500">{fgColor.toUpperCase()}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Palette size={12} />
                Fondo
              </label>
              <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-100 rounded-xl">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer"
                />
                <span className="text-[10px] font-mono text-gray-500">{bgColor.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
              <Settings2 size={12} />
              Ajustes Avanzados
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-gray-500 uppercase">Precisión (Error)</span>
                <select 
                  value={level}
                  onChange={(e) => setLevel(e.target.value as any)}
                  className="w-full bg-white border border-gray-100 rounded p-1 text-[10px] focus:outline-none"
                >
                  <option value="L">Baja (Mínimo)</option>
                  <option value="M">Media</option>
                  <option value="Q">Alta</option>
                  <option value="H">Máxima (Complejo)</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="margin"
                  checked={includeMargin}
                  onChange={(e) => setIncludeMargin(e.target.checked)}
                  className="w-3 h-3 text-emerald-600 rounded"
                />
                <label htmlFor="margin" className="text-[10px] font-bold text-gray-500 uppercase cursor-pointer">
                  Incluir Margen
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center space-y-6">
          <div 
            ref={qrRef}
            className="p-8 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-200/50 flex items-center justify-center transition-all hover:scale-105"
          >
            <QRCodeCanvas
              value={url || ' '}
              size={size}
              fgColor={fgColor}
              bgColor={bgColor}
              level={level}
              includeMargin={includeMargin}
            />
          </div>

          <button
            onClick={downloadQR}
            disabled={!url}
            className="w-full max-w-[200px] py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-30 transition-all shadow-md shadow-emerald-100"
          >
            <Download size={16} />
            Descargar PNG
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-4 border-t border-gray-50">
        <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Vectorial
        </span>
        <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Sin límites
        </span>
        <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          Sin trackers
        </span>
      </div>
    </div>
  );
}
