import { PackageOpen } from 'lucide-react';

export default function PlaceholderPage({ title, description }: { title: string, description: string }) {
  return (
    <div className="flex h-[80vh] flex-col items-center justify-center text-center">
      <div className="rounded-full bg-[var(--color-bg-surface-2)] p-6 mb-4">
        <PackageOpen className="h-12 w-12 text-[var(--color-primary-base)] opcaity-80" />
      </div>
      <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">{title}</h2>
      <p className="text-[var(--color-text-secondary)] max-w-md">{description}</p>
    </div>
  );
}
