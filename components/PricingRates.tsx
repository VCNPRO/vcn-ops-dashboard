'use client';

import { useEffect, useState } from 'react';
import { CurrencyDollarIcon, PlusIcon } from '@heroicons/react/24/outline';

interface PricingRate {
  id: number;
  providerId: number;
  resourceType: string;
  unitPrice: number;
  currency: string;
  unit?: string;
  effectiveDate: string;
  notes?: string;
  provider: {
    id: number;
    name: string;
    type: string;
  };
}

interface Provider {
  id: number;
  name: string;
  type: string;
}

export default function PricingRates() {
  const [rates, setRates] = useState<PricingRate[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportForm, setShowImportForm] = useState(false);
  const [importJson, setImportJson] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ratesRes, providersRes] = await Promise.all([
        fetch('/api/pricing-rates'),
        fetch('/api/providers'),
      ]);

      const ratesData = await ratesRes.json();
      const providersData = await providersRes.json();

      setRates(ratesData);
      setProviders(providersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    try {
      const parsedJson = JSON.parse(importJson);

      const response = await fetch('/api/pricing-rates/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rates: parsedJson }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Imported ${result.imported} rates successfully!`);
        setImportJson('');
        setShowImportForm(false);
        fetchData();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      alert('Invalid JSON format');
    }
  };

  const groupedRates = rates.reduce((acc, rate) => {
    const key = rate.provider.name;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(rate);
    return acc;
  }, {} as Record<string, PricingRate[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Precios por Recurso
        </h2>
        <button
          onClick={() => setShowImportForm(!showImportForm)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Importar Precios
        </button>
      </div>

      {showImportForm && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Importar precios desde JSON
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Formato esperado:
            <code className="block mt-1 p-2 bg-white rounded text-xs">
              {`{\n  "vercel": {\n    "serverless_invocation": 0.000016,\n    "bandwidth_gb": 0.09\n  },\n  "twilio": {\n    "sms_sent": 0.0075\n  }\n}`}
            </code>
          </p>
          <textarea
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            placeholder="Pega tu JSON aquí..."
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleImport}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              Importar
            </button>
            <button
              onClick={() => {
                setShowImportForm(false);
                setImportJson('');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {Object.keys(groupedRates).length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No hay precios configurados
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Comienza importando precios desde JSON
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedRates).map(([providerName, providerRates]) => (
            <div
              key={providerName}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">
                  {providerName}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Tipo de Recurso
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Precio Unitario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Moneda
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Fecha Efectiva
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {providerRates.map((rate) => (
                      <tr key={rate.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {rate.resourceType}
                          </div>
                          {rate.unit && (
                            <div className="text-xs text-gray-500">
                              por {rate.unit}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            ${Number(rate.unitPrice).toFixed(6)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {rate.currency}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(rate.effectiveDate).toLocaleDateString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
