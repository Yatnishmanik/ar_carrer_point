'use client';

import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Navbar } from '../../components/Navbar';
import { ResultCard } from '../../components/ResultCard';
import { Footer } from '../../components/Footer';
import { AuthModal } from '../../components/AuthModal';

export default function ResultPage() {
  const { setActiveTab } = useApp();

  useEffect(() => {
    setActiveTab('result');
  }, [setActiveTab]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 w-full">
        <ResultCard />
      </main>

      <AuthModal />
      <Footer />
    </div>
  );
}
