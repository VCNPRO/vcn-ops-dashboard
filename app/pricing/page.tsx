import PricingRates from '@/components/PricingRates';
import Navigation from '@/components/Navigation';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Gestión de Precios
          </h1>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <PricingRates />
        </div>
      </main>
    </div>
  );
}
