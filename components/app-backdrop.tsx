/**
 * Ambient aurora backdrop. Purely decorative, fixed behind the app chrome and
 * driven by CSS variables so it follows the light/dark theme without JS.
 */
export function AppBackdrop() {
  return (
    <div className="app-backdrop" aria-hidden="true">
      <div className="app-backdrop__blob app-backdrop__blob--one" />
      <div className="app-backdrop__blob app-backdrop__blob--two" />
      <div className="app-backdrop__blob app-backdrop__blob--three" />
      <div className="app-backdrop__grid" />
    </div>
  );
}
