import React, { useState } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
import { GripVertical, Lock, Unlock, LayoutDashboard } from 'lucide-react';
import TextProcessor from './components/TextProcessor';
import PercentageCalculator from './components/PercentageCalculator';
import SocialFormatter from './components/SocialFormatter';
import ScreenwriterIA from './components/ScreenwriterIA';
import FuelCalculator from './components/FuelCalculator';
import JournalistIA from './components/JournalistIA';
import ContentBrainstormer from './components/ContentBrainstormer';
import DirectorIA from './components/DirectorIA';
import QRGenerator from './components/QRGenerator';

// @ts-ignore
const ResponsiveGridLayout = WidthProvider(Responsive);

const INITIAL_LAYOUTS = {
  lg: [
    { i: 'text-processor', x: 0, y: 0, w: 1, h: 14 },
    { i: 'screenwriter', x: 1, y: 0, w: 1, h: 24 },
    { i: 'journalist', x: 0, y: 14, w: 1, h: 15 },
    { i: 'social', x: 1, y: 24, w: 1, h: 12 },
    { i: 'brainstormer', x: 0, y: 29, w: 1, h: 14 },
    { i: 'qr-generator', x: 0, y: 43, w: 1, h: 14 },
    { i: 'percentage', x: 1, y: 36, w: 1, h: 7 },
    { i: 'fuel', x: 1, y: 43, w: 1, h: 7 },
    { i: 'director', x: 0, y: 57, w: 2, h: 22 },
  ],
  md: [
    { i: 'text-processor', x: 0, y: 0, w: 1, h: 14 },
    { i: 'screenwriter', x: 1, y: 0, w: 1, h: 24 },
    { i: 'journalist', x: 0, y: 14, w: 1, h: 15 },
    { i: 'social', x: 1, y: 24, w: 1, h: 12 },
    { i: 'brainstormer', x: 0, y: 29, w: 1, h: 14 },
    { i: 'qr-generator', x: 0, y: 43, w: 1, h: 14 },
    { i: 'percentage', x: 1, y: 36, w: 1, h: 7 },
    { i: 'fuel', x: 1, y: 43, w: 1, h: 7 },
    { i: 'director', x: 0, y: 57, w: 2, h: 22 },
  ],
  sm: [
    { i: 'text-processor', x: 0, y: 0, w: 1, h: 14 },
    { i: 'screenwriter', x: 0, y: 14, w: 1, h: 22 },
    { i: 'director', x: 0, y: 36, w: 1, h: 22 },
    { i: 'journalist', x: 0, y: 58, w: 1, h: 15 },
    { i: 'brainstormer', x: 0, y: 73, w: 1, h: 14 },
    { i: 'qr-generator', x: 0, y: 87, w: 1, h: 14 },
    { i: 'social', x: 0, y: 101, w: 1, h: 12 },
    { i: 'percentage', x: 0, y: 113, w: 1, h: 7 },
    { i: 'fuel', x: 0, y: 120, w: 1, h: 7 },
  ]
};

export default function App() {
  const [isDraggable, setIsDraggable] = useState(false);
  const [layouts, setLayouts] = useState(() => {
    const saved = localStorage.getItem('hub-layouts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Clean up shot-planner if it exists in saved layouts
        if (parsed.lg) {
          parsed.lg = parsed.lg.filter((item: any) => item.i !== 'shot-planner');
        }
        return parsed;
      } catch (e) {
        return INITIAL_LAYOUTS;
      }
    }
    return INITIAL_LAYOUTS;
  });

  const onLayoutChange = (currentLayout: any, allLayouts: any) => {
    setLayouts(allLayouts);
    localStorage.setItem('hub-layouts', JSON.stringify(allLayouts));
  };

  const toggleDraggable = () => setIsDraggable(!isDraggable);

  const resetLayout = () => {
    if (confirm('¿Restablecer el diseño original?')) {
      localStorage.removeItem('hub-layouts');
      setLayouts(INITIAL_LAYOUTS);
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900" id="app">
      <header className="py-4 px-6 border-b bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm shadow-blue-200">
              <LayoutDashboard size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">UtilHub</h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {isDraggable && (
              <button
                onClick={resetLayout}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-all"
              >
                Restablecer
              </button>
            )}
            <button
              onClick={toggleDraggable}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all shadow-sm border ${
                isDraggable 
                ? 'bg-amber-500 border-amber-600 text-white animate-pulse' 
                : 'bg-white border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600'
              }`}
            >
              {isDraggable ? <Unlock size={14} /> : <Lock size={14} />}
              <span>{isDraggable ? 'Editando Diseño' : 'Diseño Fijo'}</span>
            </button>
            <div className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold uppercase hidden sm:block">Sistema Online</div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 pb-20">
        <div className="max-w-7xl mx-auto">
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 2, md: 2, sm: 1, xs: 1, xxs: 1 }}
            rowHeight={40}
            isDraggable={isDraggable}
            isResizable={isDraggable}
            draggableHandle=".drag-handle"
            onLayoutChange={onLayoutChange}
            margin={[24, 24]}
          >
            <div key="text-processor" className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col h-full">
              {isDraggable && (
                <div className="drag-handle h-8 bg-gray-50 border-b flex items-center justify-center text-gray-300 hover:text-gray-400 transition-colors shrink-0">
                  <GripVertical size={16} />
                </div>
              )}
              <div className="p-6 flex-1 overflow-y-auto overflow-x-hidden transition-all duration-300 scroll-smooth">
                <TextProcessor />
              </div>
            </div>

            <div key="screenwriter" className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col h-full">
              {isDraggable && (
                <div className="drag-handle h-8 bg-gray-50 border-b flex items-center justify-center text-gray-300 hover:text-gray-400 transition-colors shrink-0">
                  <GripVertical size={16} />
                </div>
              )}
              <div className="p-6 flex-1 overflow-y-auto overflow-x-hidden transition-all duration-300 scroll-smooth">
                <ScreenwriterIA />
              </div>
            </div>

            <div key="percentage" className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col h-full">
              {isDraggable && (
                <div className="drag-handle h-8 bg-gray-50 border-b flex items-center justify-center text-gray-300 hover:text-gray-400 transition-colors shrink-0">
                  <GripVertical size={16} />
                </div>
              )}
              <div className="p-6 flex-1 overflow-y-auto overflow-x-hidden transition-all duration-300 scroll-smooth">
                <PercentageCalculator />
              </div>
            </div>

            <div key="social" className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col h-full">
              {isDraggable && (
                <div className="drag-handle h-8 bg-gray-50 border-b flex items-center justify-center text-gray-300 hover:text-gray-400 transition-colors shrink-0">
                  <GripVertical size={16} />
                </div>
              )}
              <div className="p-6 flex-1 overflow-y-auto overflow-x-hidden transition-all duration-300 scroll-smooth">
                <SocialFormatter />
              </div>
            </div>

            <div key="fuel" className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col h-full">
              {isDraggable && (
                <div className="drag-handle h-8 bg-gray-50 border-b flex items-center justify-center text-gray-300 hover:text-gray-400 transition-colors shrink-0">
                  <GripVertical size={16} />
                </div>
              )}
              <div className="p-6 flex-1 overflow-y-auto overflow-x-hidden transition-all duration-300 scroll-smooth">
                <FuelCalculator />
              </div>
            </div>

            <div key="journalist" className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col h-full">
              {isDraggable && (
                <div className="drag-handle h-8 bg-gray-50 border-b flex items-center justify-center text-gray-300 hover:text-gray-400 transition-colors shrink-0">
                  <GripVertical size={16} />
                </div>
              )}
              <div className="p-6 flex-1 overflow-y-auto overflow-x-hidden transition-all duration-300 scroll-smooth">
                <JournalistIA />
              </div>
            </div>

            <div key="brainstormer" className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col h-full">
              {isDraggable && (
                <div className="drag-handle h-8 bg-gray-50 border-b flex items-center justify-center text-gray-300 hover:text-gray-400 transition-colors shrink-0">
                  <GripVertical size={16} />
                </div>
              )}
              <div className="p-6 flex-1 overflow-y-auto overflow-x-hidden transition-all duration-300 scroll-smooth">
                <ContentBrainstormer />
              </div>
            </div>

            <div key="director" className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col h-full">
              {isDraggable && (
                <div className="drag-handle h-8 bg-gray-50 border-b flex items-center justify-center text-gray-300 hover:text-gray-400 transition-colors shrink-0">
                  <GripVertical size={16} />
                </div>
              )}
              <div className="p-6 flex-1 overflow-y-auto overflow-x-hidden transition-all duration-300 scroll-smooth">
                <DirectorIA />
              </div>
            </div>

            <div key="qr-generator" className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col h-full">
              {isDraggable && (
                <div className="drag-handle h-8 bg-gray-50 border-b flex items-center justify-center text-gray-300 hover:text-gray-400 transition-colors shrink-0">
                  <GripVertical size={16} />
                </div>
              )}
              <div className="p-6 flex-1 overflow-y-auto overflow-x-hidden transition-all duration-300 scroll-smooth">
                <QRGenerator />
              </div>
            </div>
          </ResponsiveGridLayout>
        </div>
      </main>

      <footer className="py-4 px-6 border-t bg-white text-center text-[10px] text-gray-400 font-medium">
        Workspace v4.0.0 • 2026 © Digital Utilities
      </footer>
    </div>
  );
}
