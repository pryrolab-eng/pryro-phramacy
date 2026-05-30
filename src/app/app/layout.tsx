/** White shell so /app matches entry loader before redirect. */
export default function AppEntryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-neutral-900 antialiased">
      {children}
    </div>
  );
}
