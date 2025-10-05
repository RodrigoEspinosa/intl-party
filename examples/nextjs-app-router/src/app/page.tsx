export default function HomePage() {
  return (
    <main style={{ padding: "2rem" }}>
      <h1>Cookie-Based Locale Detection</h1>
      <p>
        This example demonstrates how to use IntlParty with Next.js App Router
        using cookie-based locale storage without URL parameters.
      </p>

      <section style={{ marginTop: "2rem" }}>
        <h2>How it works:</h2>
        <ol>
          <li>
            The middleware detects the locale from cookies, Accept-Language
            header, or query parameters
          </li>
          <li>The locale is stored in a cookie for persistence</li>
          <li>No URL modification occurs - clean URLs maintained</li>
          <li>The layout uses `getLocale()` to read the detected locale</li>
          <li>All pages share the same URLs regardless of language</li>
        </ol>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2>Test locale detection:</h2>
        <ul>
          <li>
            <a href="?locale=en">English (?locale=en)</a>
          </li>
          <li>
            <a href="?locale=es">Español (?locale=es)</a>
          </li>
          <li>
            <a href="?locale=fr">Français (?locale=fr)</a>
          </li>
          <li>
            <a href="?locale=de">Deutsch (?locale=de)</a>
          </li>
        </ul>
        <p>
          <small>
            After clicking a link, reload the page to see the locale persisted
            via cookie.
          </small>
        </p>
      </section>
    </main>
  );
}
