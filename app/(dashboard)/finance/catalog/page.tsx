import { PageHeader } from '@/components/shared/PageHeader';
import { mockUniversities } from '@/lib/mock/mockUniversities';
import { getActivePackagesForUniversity, mockPackages } from '@/lib/mock/mockPackages';
import { mockFeeLedgers } from '@/lib/mock/mockFeeLedgers';
import { UniversityList } from './_components/UniversityList';
import { PackageList } from './_components/PackageList';
import { BookOpen } from 'lucide-react';

interface CatalogPageProps {
  searchParams: Promise<{ uni?: string }>;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const { uni } = await searchParams;
  const activeUnis = mockUniversities.filter(u => u.status === 'ACTIVE');
  const selectedUniId = uni ?? activeUnis[0]?.id;
  const selectedUni = mockUniversities.find(u => u.id === selectedUniId);

  const studentCountByPackage = new Map<string, number>();
  for (const l of mockFeeLedgers) {
    if (l.packageId) studentCountByPackage.set(l.packageId, (studentCountByPackage.get(l.packageId) ?? 0) + 1);
  }
  const universities = mockUniversities.map(u => ({
    ...u,
    packageCount: mockPackages.filter(p => p.universityId === u.id && p.status === 'ACTIVE').length,
  }));

  const packagesForSelected = selectedUni
    ? getActivePackagesForUniversity(selectedUni.id).map(p => ({
        ...p,
        studentCount: studentCountByPackage.get(p.id) ?? 0,
      }))
    : [];

  return (
    <>
      <PageHeader
        title="Catalog"
        description="Universities and package offers. Marketing picks from here when enrolling a student."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-4">
          <UniversityList universities={universities} selectedId={selectedUniId} />
        </aside>
        <section className="lg:col-span-8">
          {selectedUni ? (
            <PackageList university={selectedUni} packages={packagesForSelected} />
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-card p-12 text-center">
              <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-900">No universities yet</p>
              <p className="text-xs text-gray-500 mt-1">Create one from the left pane to start building the catalog.</p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
