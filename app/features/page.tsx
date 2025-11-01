'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BatchProcessor from '../components/BatchProcessor';
import AdvancedAnalytics from '../components/AdvancedAnalytics';
import SalaryTemplates from '../components/SalaryTemplates';
import InventoryAlerts from '../components/InventoryAlerts';
import AnimatedBackground from '../components/AnimatedBackground';

interface Denomination {
  value: number;
  image_name: string;
  is_available: boolean;
  amount: number;
}

export default function FeaturesPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'batch' | 'analytics' | 'templates' | 'inventory'>('batch');
  const [denominations, setDenominations] = useState<Denomination[]>([]);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('darkMode');
    if (saved) {
      setDarkMode(JSON.parse(saved));
    }
    fetchDenominations();
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode, mounted]);

  const fetchDenominations = async () => {
    try {
      const response = await fetch('/api/denominations');
      const data = await response.json();
      setDenominations(data);
    } catch (err) {
      console.error('Error fetching denominations:', err);
    }
  };

  const handleTemplateSelect = (template: any) => {
    // Store template in localStorage and redirect to main page
    localStorage.setItem('selectedTemplate', JSON.stringify(template));
    router.push('/');
  };

  const tabs = [
    { id: 'batch' as const, label: 'Batch Processing', icon: '📊' },
    { id: 'analytics' as const, label: 'Analytics', icon: '📈' },
    { id: 'templates' as const, label: 'Templates', icon: '📋' },
    { id: 'inventory' as const, label: 'Inventory', icon: '📦' }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 relative p-4 md:p-8`}>
      <AnimatedBackground darkMode={darkMode} />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => router.push('/')}
            className={`mb-4 px-4 py-2 rounded-lg flex items-center gap-2 mx-auto transition-colors ${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-800 hover:bg-gray-100'}`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Calculator
          </button>
          
          <h1 className={`text-4xl md:text-5xl font-bold mb-3 flex items-center justify-center gap-3 ${darkMode ? 'text-white' : 'text-white'}`}>
            <Sparkles className="w-10 h-10" />
            Advanced Features
          </h1>
          <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-purple-100'}`}>
            Powerful tools to manage your salary calculations
          </p>
        </div>

        {/* Tab Navigation */}
        <div className={`flex flex-wrap gap-2 mb-6 p-2 rounded-2xl backdrop-blur-lg ${darkMode ? 'bg-gray-800/90' : 'bg-white/90'}`}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[120px] px-4 py-3 rounded-lg font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                  : darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="mb-8">
          {activeTab === 'batch' && (
            <BatchProcessor darkMode={darkMode} denominations={denominations} />
          )}
          
          {activeTab === 'analytics' && (
            <AdvancedAnalytics darkMode={darkMode} />
          )}
          
          {activeTab === 'templates' && (
            <SalaryTemplates darkMode={darkMode} onSelectTemplate={handleTemplateSelect} />
          )}
          
          {activeTab === 'inventory' && (
            <InventoryAlerts 
              darkMode={darkMode} 
              denominations={denominations}
              onRefresh={fetchDenominations}
            />
          )}
        </div>
      </div>
    </div>
  );
}
