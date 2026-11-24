import { useEffect, useState } from 'react';

export default function App() {
  const [version, setVersion] = useState('');

  useEffect(() => {
    void window.api.version().then(setVersion);
  }, []);

  return (
    <main className="flex h-screen flex-col items-center justify-center gap-2 bg-background text-foreground">
      <h1 className="text-2xl font-semibold">Mi App</h1>
      <p className="text-sm text-muted-foreground" data-testid="version">
        Versión {version}
      </p>
    </main>
  );
}
