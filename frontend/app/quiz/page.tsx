'use client';

import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Navbar } from '../../components/Navbar';
import { QuizEngine } from '../../components/QuizEngine';
import { Footer } from '../../components/Footer';
import { AuthModal } from '../../components/AuthModal';

export default function QuizPage() {
  const { activeTest, startTestById, setActiveTab } = useApp();

  useEffect(() => {
    setActiveTab('quiz');
    if (!activeTest) {
      startTestById();
    }
  }, [activeTest, startTestById, setActiveTab]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 w-full">
        <QuizEngine />
      </main>

      <AuthModal />
      <Footer />
    </div>
  );
}
