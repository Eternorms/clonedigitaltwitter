interface MainContentProps {
  children: React.ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  return (
    <main className="flex-1 ml-72 p-12 max-w-[1400px]">
      {children}
    </main>
  );
}
