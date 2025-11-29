import StoreHeader from '@/app/store/components/store-header';

/**
 * Store page layout component that displays products with filtering and sorting
 */

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Header Component "including navigation" */}
      <StoreHeader />
      <main className="w-full">{children}</main>
    </>
  );
}
