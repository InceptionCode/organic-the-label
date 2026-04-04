import { CollectionHeader } from '@/app/store/components/collection-header';

/**
 * Store page layout component that displays products with filtering and sorting
 */

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CollectionHeader />
      <main className="w-full">
        <div className="content-container-xl py-8 md:py-10">
          {children}
        </div>
      </main>
    </>
  );
}
