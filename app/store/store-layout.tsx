import { CollectionHeader } from '@/app/store/components/collection-header';

/**
 * Store page layout component that displays products with filtering and sorting
 */

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CollectionHeader />
      <main className="w-full">{children}</main>
    </>
  );
}
