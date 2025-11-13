'use client';

import { useEffect, useState } from 'react';
import { CurrencyDollarIcon, ServerIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import CostChart from './CostChart';
import AppsList from './AppsList';

interface App {
  id: number;
  name: string;
  domain?: string;
  repoUrl?: string;
  vercelProjectId?: string;
  dailyCosts: DailyCost[];
}

interface DailyCost {
  id: number;
  appId: number;
  date: string;
  providerId: number;
  costLocal: number;
  currency: string;
  notes?: string;
}

export default function DashboardClient() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      const response = await fetch('/api/apps');
      const data = await response.json();
      setApps(data);
    } catch (error) {
      console.error('Error fetching apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalCosts = apps.reduce((acc, app) => {
    const appTotal = app.dailyCosts.reduce(
      (sum, cost) => sum + Number(cost.costLocal || 0),
      0
    );
    return acc + appTotal;
  }, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ServerIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Apps
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {apps.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Costos Totales
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    ${totalCosts.toFixed(2)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Promedio por App
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    ${apps.length > 0 ? (totalCosts / apps.length).toFixed(2) : '0.00'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Costos por Día
        </h2>
        <CostChart apps={apps} />
      </div>

      {/* Apps List */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Aplicaciones
        </h2>
        <AppsList apps={apps} />
      </div>
    </div>
  );
}
