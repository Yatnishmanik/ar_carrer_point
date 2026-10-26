'use client';

import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Navbar } from '../../components/Navbar';
import { AdminQuestionManager } from '../../components/AdminQuestionManager';
import { Footer } from '../../components/Footer';
import { AuthModal } from '../../components/AuthModal';

export default function AdminPage() {
  const { setActiveTab } = useApp();

  useEffect(() => {
    setActiveTab('admin');
  }, [setActiveTab]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 w-full">
        <AdminQuestionManager />
      </main>

      <AuthModal />
      <Footer />
    </div>
  );
}
