'use client';

import { useSensorData } from '@/hooks/useSensorData';
import { Header } from '@/components/ui/Header';
import { Container } from '@/components/ui/Container';
import { DataTable } from '@/components/table/DataTable';

export default function DataPage() {
  const { data, history, loading, error, connected, resetLocalState } =
    useSensorData();

  return (
    <div className="min-h-screen max-w-full mx-auto bg-slate-50 text-slate-950 flex flex-col items-center">
      <div className="w-full">
        <Header
          data={data}
          loading={loading}
          connected={connected}
          onClearAll={resetLocalState}
        />
      </div>

      <main className="w-full">
        <Container className="mb-8 flex flex-col items-center">
          <div className="flex flex-col items-center text-center mb-10 px-4">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl mb-4 leading-tight">
              Historical Data
            </h2>
            <p className="text-lg text-slate-600 font-medium">
              Complete record of all sensor readings with timestamps. Browse and
              analyze trends.
            </p>
          </div>
        </Container>

        <Container className="mb-8">
          <div className="w-full">
            <DataTable history={history} />
          </div>
        </Container>

        {error && (
          <Container>
            <div className="w-full rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm text-center">
              <p className="text-sm font-semibold text-red-700">
                System Alert: {error}
              </p>
            </div>
          </Container>
        )}
      </main>
    </div>
  );
}
