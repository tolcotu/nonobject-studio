import { config } from '../content/config.js';
export function calculateEstimate(products, rush = false, rules = config.pricing) {
  const lines = products.map(({ imageCount }) => {
    const count = Number(imageCount);
    if (!Number.isInteger(count) || count < rules.minimumImages || count > 100) throw new Error('Choose a whole number from 3 to 100 images.');
    if (count > rules.setSize && rules.aboveNine === 'manual') return null;
    return count === rules.setSize ? rules.set : count * rules.image;
  });
  const knownSubtotal = lines.reduce((sum, n) => sum + (n ?? 0), 0);
  const manual = lines.includes(null);
  const subtotal = manual ? null : knownSubtotal;
  const total = subtotal === null ? null : Math.round(subtotal * (rush ? rules.rushMultiplier : 1) * 100) / 100;
  return { lines, knownSubtotal, subtotal, total, manual, belowMinimum: knownSubtotal < rules.minimumOrder, rushAmount: subtotal === null ? null : Math.round(subtotal * (rush ? rules.rushMultiplier - 1 : 0) * 100) / 100 };
}
