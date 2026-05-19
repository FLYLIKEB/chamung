import { type ReactNode } from 'react';
import { Header } from './Header';

interface AuthPageShellProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function AuthPageShell({ title, description, children }: AuthPageShellProps) {
  return (
    <div className="auth-page min-h-screen">
      <Header showBack title={title} showProfile />

      <main className="p-4 pt-8 sm:max-w-md sm:mx-auto">
        <section className="p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">{title}</h1>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>
          {children}
        </section>
      </main>
    </div>
  );
}
