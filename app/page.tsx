import { HomePage } from '@/components/home-page';

/**
 * Home route.
 *
 * The interactive home screen lives in a client component, but the *build day*
 * comes from here: it is baked into the static HTML, so the "formula of the
 * day" card is part of the first paint (correct link, real text, no shimmer)
 * while the client still rolls the card over to today's formula when the
 * exported site has been live for more than a day.
 */
export default function Page() {
  return <HomePage buildDay={Math.floor(Date.now() / 86_400_000)} />;
}
