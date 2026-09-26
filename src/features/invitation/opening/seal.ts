/**
 * The wax seal's outline: a circle with a slightly irregular edge, in a 100×100 view box.
 * Deterministic (same on server and client). Shared by the envelope and the landing page's
 * mockups, in a plain module because values exported from a Client Component module reach Server
 * Components only as references.
 */
export const SEAL_PATH = (() => {
  const points = 72;
  const commands: string[] = [];
  for (let index = 0; index <= points; index += 1) {
    const angle = (index / points) * Math.PI * 2;
    const radius = 46 + 2.4 * Math.sin(angle * 7) + 1.5 * Math.sin(angle * 13 + 1.3);
    const x = 50 + radius * Math.cos(angle);
    const y = 50 + radius * Math.sin(angle);
    commands.push(`${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return `${commands.join(' ')} Z`;
})();
