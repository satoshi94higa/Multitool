import React from 'react';
import TextProcessor from './components/TextProcessor';
import PercentageCalculator from './components/PercentageCalculator';
import SocialFormatter from './components/SocialFormatter';
import ScreenwriterIA from './components/ScreenwriterIA';
import FuelCalculator from './components/FuelCalculator';
import ShotPlannerIA from './components/ShotPlannerIA';
import JournalistIA from './components/JournalistIA';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900" id="app">
      <header className="py-4 px-6 border-b bg-white">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight">UtilHub</h1>
          <div className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold uppercase">Sistema Online</div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main Column */}
          <div className="space-y-8">
            <section className="bg-white p-6 rounded-xl border shadow-sm">
              <TextProcessor />
            </section>
            <section className="bg-white p-6 rounded-xl border shadow-sm">
              <ScreenwriterIA />
            </section>
            <section className="bg-white p-6 rounded-xl border shadow-sm">
              <ShotPlannerIA />
            </section>
            <section className="bg-white p-6 rounded-xl border shadow-sm">
              <JournalistIA />
            </section>
          </div>

          {/* Utils Column */}
          <div className="space-y-8">
            <section className="bg-white p-6 rounded-xl border shadow-sm">
              <PercentageCalculator />
            </section>
            <section className="bg-white p-6 rounded-xl border shadow-sm">
              <SocialFormatter />
            </section>
            <section className="bg-white p-6 rounded-xl border shadow-sm">
              <FuelCalculator />
            </section>
          </div>
        </div>
      </main>

      <footer className="py-4 px-6 border-t bg-white text-center text-[10px] text-gray-400 font-medium">
        Workspace v3.0.0 • 2026 © Digital Utilities
      </footer>
    </div>
  );
}
