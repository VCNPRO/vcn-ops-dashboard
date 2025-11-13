'use client';

interface DailyCost {
  id: number;
  appId: number;
  date: string;
  providerId: number;
  costLocal: number;
  currency: string;
  notes?: string;
}

interface App {
  id: number;
  name: string;
  domain?: string;
  repoUrl?: string;
  vercelProjectId?: string;
  dailyCosts: DailyCost[];
}

interface AppsListProps {
  apps: App[];
}

export default function AppsList({ apps }: AppsListProps) {
  if (apps.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No hay aplicaciones registradas
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nombre
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Dominio
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Repositorio
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Costo Total
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {apps.map((app) => {
            const totalCost = app.dailyCosts.reduce(
              (sum, cost) => sum + Number(cost.costLocal || 0),
              0
            );

            return (
              <tr key={app.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {app.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {app.domain ? (
                      <a
                        href={`https://${app.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {app.domain}
                      </a>
                    ) : (
                      '-'
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {app.repoUrl ? (
                      <a
                        href={app.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        GitHub
                      </a>
                    ) : (
                      '-'
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    ${totalCost.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {app.dailyCosts.length} registros
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
