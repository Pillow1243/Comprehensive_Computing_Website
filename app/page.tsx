const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const appPath = `${basePath}/app/index.html`;

export default function HomePage() {
  return (
    <main className="app-shell">
      <h1 className="visually-hidden">SolveEverything — حل همه‌چیز</h1>
      <iframe
        className="solver-frame"
        src={appPath}
        title="SolveEverything scientific calculator"
        allow="clipboard-read; clipboard-write"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <noscript>
        <p className="noscript-message">
          JavaScript is required to use the interactive solver.{' '}
          <a href={appPath}>Open SolveEverything</a>.
        </p>
      </noscript>
    </main>
  );
}
