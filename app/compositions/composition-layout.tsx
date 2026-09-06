import CompositionHeader from './components/composition-header';

export default function CompositionLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="w-full">
      <div className="content-container-xl py-8 md:py-12">
        <CompositionHeader />
        {children}
      </div>
    </main>
  );
}
