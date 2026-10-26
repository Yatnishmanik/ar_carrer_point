'use client';

import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Navbar } from '../../components/Navbar';
import { PracticeCard } from '../../components/PracticeCard';
import { Footer } from '../../components/Footer';
import { AuthModal } from '../../components/AuthModal';

export default function PracticePage() {
  const { practiceSets, setActiveTab } = useApp();

  useEffect(() => {
    setActiveTab('practice');
  }, [setActiveTab]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 w-full">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-900">
            Practice Bank & PDFs
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Practice Sets एवं मॉडल पेपर्स
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            अध्याय-वार एवं विषय-वार मॉडल प्रश्न पत्र डाउनलोड करें या ऑनलाइन अभ्यास करें।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {practiceSets.map((practice) => (
            <PracticeCard key={practice.id} practice={practice} />
          ))}
        </div>
      </main>

      <AuthModal />
      <Footer />
    </div>
  );
}
