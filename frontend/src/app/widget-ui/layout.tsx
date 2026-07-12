export default function WidgetUiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style>{`body { background: transparent !important; }`}</style>
      {children}
    </>
  );
}
