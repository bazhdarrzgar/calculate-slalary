'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Bell, Package, TrendingDown } from 'lucide-react';

interface Denomination {
  value: number;
  image_name: string;
  is_available: boolean;
  amount: number;
}

export default function InventoryAlerts({ darkMode, denominations, onRefresh }: { 
  darkMode: boolean; 
  denominations: Denomination[];
  onRefresh: () => void;
}) {
  const [lowStockThreshold, setLowStockThreshold] = useState(20);
  const [criticalThreshold, setCriticalThreshold] = useState(10);

  const lowStockItems = denominations.filter(d => d.amount <= lowStockThreshold && d.amount > criticalThreshold);
  const criticalItems = denominations.filter(d => d.amount <= criticalThreshold);
  const totalAlerts = lowStockItems.length + criticalItems.length;

  return (
    <div className={`rounded-2xl shadow-2xl p-6 backdrop-blur-lg ${darkMode ? 'bg-gray-800/90 border border-gray-700' : 'bg-white/90'}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-2xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          <Package className="w-6 h-6 text-purple-600" />
          Inventory Alerts
        </h2>
        {totalAlerts > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded-full text-sm font-bold">
            <Bell className="w-4 h-4" />
            {totalAlerts}
          </div>
        )}
      </div>

      {/* Threshold Settings */}
      <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
        <h3 className={`font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Alert Thresholds
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Low Stock Warning
            </label>
            <input
              type="number"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 20)}
              min="1"
              className={`w-full px-3 py-2 border rounded-lg focus:border-purple-500 focus:outline-none ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
            />
          </div>
          <div>
            <label className={`block text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Critical Level
            </label>
            <input
              type="number"
              value={criticalThreshold}
              onChange={(e) => setCriticalThreshold(parseInt(e.target.value) || 10)}
              min="0"
              className={`w-full px-3 py-2 border rounded-lg focus:border-purple-500 focus:outline-none ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
            />
          </div>
        </div>
      </div>

      {/* Critical Items */}
      {criticalItems.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className={`font-bold text-red-500`}>
              Critical Stock ({criticalItems.length})
            </h3>
          </div>
          <div className="space-y-2">
            {criticalItems.map(denom => (
              <div
                key={denom.value}
                className={`flex items-center justify-between p-3 rounded-lg border-2 border-red-500 ${darkMode ? 'bg-red-900/20' : 'bg-red-50'}`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={`/currency/${denom.image_name}`}
                    alt={`${denom.value} Dinar`}
                    className="w-16 h-8 object-cover rounded border border-gray-300"
                  />
                  <div>
                    <div className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {denom.value.toLocaleString()} IQD
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Only {denom.amount} left!
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-red-500">
                    {denom.amount}
                  </div>
                  <div className="text-xs text-red-500">CRITICAL</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Low Stock Items */}
      {lowStockItems.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-5 h-5 text-amber-500" />
            <h3 className={`font-bold text-amber-500`}>
              Low Stock ({lowStockItems.length})
            </h3>
          </div>
          <div className="space-y-2">
            {lowStockItems.map(denom => (
              <div
                key={denom.value}
                className={`flex items-center justify-between p-3 rounded-lg border-2 border-amber-500 ${darkMode ? 'bg-amber-900/20' : 'bg-amber-50'}`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={`/currency/${denom.image_name}`}
                    alt={`${denom.value} Dinar`}
                    className="w-16 h-8 object-cover rounded border border-gray-300"
                  />
                  <div>
                    <div className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {denom.value.toLocaleString()} IQD
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Running low
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-amber-500">
                    {denom.amount}
                  </div>
                  <div className="text-xs text-amber-500">LOW</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Good */}
      {totalAlerts === 0 && (
        <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <Package className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <p className="font-semibold">All Denominations Well Stocked!</p>
          <p className="text-sm mt-1">No inventory alerts at this time.</p>
        </div>
      )}

      {/* Inventory Overview */}
      <div className={`mt-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
        <h3 className={`font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Full Inventory Status
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {denominations.map(denom => {
            const isCritical = denom.amount <= criticalThreshold;
            const isLow = denom.amount <= lowStockThreshold && denom.amount > criticalThreshold;
            const statusColor = isCritical ? 'text-red-500' : isLow ? 'text-amber-500' : darkMode ? 'text-green-400' : 'text-green-600';
            
            return (
              <div
                key={denom.value}
                className={`p-2 rounded text-center ${darkMode ? 'bg-gray-600' : 'bg-white'}`}
              >
                <div className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {denom.value.toLocaleString()}
                </div>
                <div className={`text-lg font-bold ${statusColor}`}>
                  {denom.amount}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
