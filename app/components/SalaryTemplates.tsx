'use client';

import React, { useState, useEffect } from 'react';
import { Bookmark, Plus, Trash2, Check, Eye, X } from 'lucide-react';

interface SalaryTemplate {
  id: string;
  name: string;
  rank: string;
  department: string;
  salary: number;
  created_at: string;
}

export default function SalaryTemplates({
  darkMode,
  onSelectTemplate
}: {
  darkMode: boolean;
  onSelectTemplate: (template: SalaryTemplate) => void;
}) {
  const [templates, setTemplates] = useState<SalaryTemplate[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<SalaryTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    rank: '',
    department: '',
    salary: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const createTemplate = async () => {
    if (!newTemplate.name || !newTemplate.salary) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate)
      });

      if (response.ok) {
        await fetchTemplates();
        setNewTemplate({ name: '', rank: '', department: '', salary: 0 });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Failed to create template:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const response = await fetch(`/api/templates?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchTemplates();
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  return (
    <div className={`rounded-2xl shadow-2xl p-6 backdrop-blur-lg ${darkMode ? 'bg-gray-800/90 border border-gray-700' : 'bg-white/90'}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-2xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          <Bookmark className="w-6 h-6 text-purple-600" />
          Salary Templates
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl shadow-2xl p-6 max-w-md w-full ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Template Preview
              </h3>
              <button
                onClick={() => setPreviewTemplate(null)}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Template Name
                </label>
                <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {previewTemplate.name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Rank/Position
                  </label>
                  <p className={`text-base ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {previewTemplate.rank || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Department
                  </label>
                  <p className={`text-base ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {previewTemplate.department || 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <label className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Salary Amount
                </label>
                <p className={`text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                  {previewTemplate.salary.toLocaleString()} IQD
                </p>
              </div>

              <div>
                <label className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Created At
                </label>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {new Date(previewTemplate.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-700">
                <button
                  onClick={() => {
                    onSelectTemplate(previewTemplate);
                    setPreviewTemplate(null);
                  }}
                  className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                >
                  Use This Template
                </button>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className={`px-4 py-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Template Form */}
      {showAddForm && (
        <div className={`mb-6 p-4 rounded-lg border-2 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
          <h3 className={`font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Create New Template
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Template Name *"
              value={newTemplate.name}
              onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:border-purple-500 focus:outline-none ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Rank/Position"
                value={newTemplate.rank}
                onChange={(e) => setNewTemplate({ ...newTemplate, rank: e.target.value })}
                className={`px-3 py-2 border rounded-lg focus:border-purple-500 focus:outline-none ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
              />
              <input
                type="text"
                placeholder="Department"
                value={newTemplate.department}
                onChange={(e) => setNewTemplate({ ...newTemplate, department: e.target.value })}
                className={`px-3 py-2 border rounded-lg focus:border-purple-500 focus:outline-none ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
              />
            </div>
            <input
              type="number"
              placeholder="Salary (IQD) *"
              value={newTemplate.salary || ''}
              onChange={(e) => setNewTemplate({ ...newTemplate, salary: parseInt(e.target.value) || 0 })}
              className={`w-full px-3 py-2 border rounded-lg focus:border-purple-500 focus:outline-none ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
            />
            <div className="flex gap-2">
              <button
                onClick={createTemplate}
                disabled={loading || !newTemplate.name || !newTemplate.salary}
                className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                <Check className="w-4 h-4 inline mr-2" />
                Save Template
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className={`px-4 py-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {templates.length === 0 ? (
          <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            No templates yet. Create one to save common salary configurations!
          </p>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              className={`p-4 rounded-lg border-2 transition-all hover:shadow-lg ${darkMode ? 'bg-gray-700 border-gray-600 hover:border-purple-500' : 'bg-gray-50 border-gray-200 hover:border-purple-400'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className={`font-bold text-lg mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {template.name}
                  </h4>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {template.rank && (
                      <span className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                        {template.rank}
                      </span>
                    )}
                    {template.department && (
                      <span className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                        {template.department}
                      </span>
                    )}
                  </div>
                  <div className={`text-xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                    {template.salary.toLocaleString()} IQD
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPreviewTemplate(template)}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onSelectTemplate(template)}
                    className="px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
                  >
                    Use
                  </button>
                  <button
                    onClick={() => deleteTemplate(template.id)}
                    className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
