import { PageHeader } from '@/components/shared/PageHeader';
import { UniversityList } from './_components/UniversityList';
import { PackageList } from './_components/PackageList';
import { BookOpen } from 'lucide-react';
import { backendFetch } from '@/lib/backend';
import { Package, University } from '@/types';

interface CatalogPageProps {
  searchParams: Promise<{ uni?: string }>;
}

interface UniversitiesResponse {
  items: University[];
}

interface PackagesResponse {
  items: (Package & { university?: { id: string; name: string; country: string } })[];
}

async function loadCatalog(): Promise<{
  universities: University[];
  packages: Package[];
  error: string | null;
}> {
  try {
    const [uniRes, pkgRes] = await Promise.all([
      backendFetch('/finance/universities?limit=500'),
      backendFetch('/finance/packages?limit=500'),
    ]);
    if (!uniRes.ok || !pkgRes.ok) {
      return {
        universities: [],
        packages: [],
        error: `Failed to load catalog (universities HTTP ${uniRes.status}, packages HTTP ${pkgRes.status})`,
      };
    }
    const uniBody = (await uniRes.json()) as UniversitiesResponse;
    const pkgBody = (await pkgRes.json()) as PackagesResponse;
    return {
      universities: uniBody.items ?? [],
      packages: pkgBody.items ?? [],
      error: null,
    };
  } catch {
    return { universities: [], packages: [], error: 'Unable to reach the backend.' };
  }
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const { uni } = await searchParams;
  const { universities, packages, error } = await loadCatalog();

  const activeUnis = universities.filter((u) => u.status === 'ACTIVE');
  const selectedUniId = uni ?? activeUnis[0]?.id;
  const selectedUni = universities.find((u) => u.id === selectedUniId);

  const universitiesWithCounts = universities.map((u) => ({
    ...u,
    packageCount: packages.filter(
      (p) => p.universityId === u.id && p.status === 'ACTIVE',
    ).length,
  }));

  // Student-count-per-package isn't yet a direct backend aggregation;
  // surface 0 until we wire a dedicated `/packages/:id/stats` endpoint.
  const packagesForSelected = selectedUni
    ? packages
        .filter(
          (p) => p.universityId === selectedUni.id && p.status === 'ACTIVE',
        )
        .map((p) => ({ ...p, studentCount: 0 }))
    : [];

  return (
    <>
      <PageHeader
        title="Catalog"
        description="Universities and package offers. Marketing picks from here when enrolling a student."
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-4">
          <UniversityList
            universities={universitiesWithCounts}
            selectedId={selectedUniId}
          />
        </aside>
        <section className="lg:col-span-8">
          {selectedUni ? (
            <PackageList university={selectedUni} packages={packagesForSelected} />
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-card p-12 text-center">
              <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-900">
                No universities yet
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Create one from the left pane to start building the catalog.
              </p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
