export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-primary">
      <div className="mx-auto max-w-6xl px-4 py-10">{children}</div>
    </div>
  );
}
