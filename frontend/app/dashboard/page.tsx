'use client';

import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Navbar } from '../../components/Navbar';
import { StudentDashboardView } from '../../components/StudentDashboardView';
import { Footer } from '../../components/Footer';
import { AuthModal } from '../../components/AuthModal';

export default function DashboardPage() {
  const { setActiveTab } = useApp();

  useEffect(() => {
    setActiveTab('dashboard');
  }, [setActiveTab]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 w-full">
        <StudentDashboardView />
      </main>

      <AuthModal />
      <Footer />
    </div>
  );
}
