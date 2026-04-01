import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center text-center px-4">
      <h1 className="mb-4 text-4xl font-bold">IntlParty</h1>
      <p className="mb-8 text-lg text-fd-muted-foreground max-w-lg">
        The easiest and most developer-friendly internationalization library for
        Next.js with TypeScript.
      </p>
      <Link
        href="/docs"
        className="inline-flex items-center rounded-lg bg-fd-primary px-6 py-3 text-sm font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
      >
        Get Started
      </Link>
    </main>
  );
}
