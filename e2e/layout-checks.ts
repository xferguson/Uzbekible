/**
 * Deterministic layout invariants (V2): checks on the live DOM instead of image comparison. Each returns a list of
 * human-readable violations (empty = pass), so a failure names the offending element.
 */
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

export const MIN_TARGET = 44;
/** Chromium's built-in ButtonFace (light, dark) and button font size: what an unstyled control looks like. */
const DEFAULT_FACES = ['rgb(239, 239, 239)', 'rgb(107, 107, 107)'];
const DEFAULT_CONTROL_FONT_SIZE = '13.3333px';

/** Runs inside the page. Kept self-contained: Playwright serialises it. */
function inPage({
  min,
  faces,
  defaultFont,
}: {
  min: number;
  faces: string[];
  defaultFont: string;
}) {
  const out: { check: string; detail: string }[] = [];
  const describe = (e: Element) => {
    const label = (e.getAttribute('aria-label') ?? e.textContent ?? '').trim().slice(0, 40);
    return `<${e.tagName.toLowerCase()}> "${label}"`;
  };
  const visible = (e: Element) => {
    const r = e.getBoundingClientRect();
    const s = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
  };
  // Content inside a horizontal scroller (the level map) is meant to extend past the viewport.
  const inScroller = (e: Element) => {
    for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (['auto', 'scroll'].includes(s.overflowX) && p.scrollWidth > p.clientWidth) return true;
    }
    return false;
  };
  const root = document.documentElement;
  if (root.scrollWidth > root.clientWidth)
    out.push({
      check: 'overflow',
      detail: `scrollWidth ${root.scrollWidth} > ${root.clientWidth}`,
    });

  for (const e of document.body.querySelectorAll('*')) {
    if (!visible(e)) continue;
    const s = getComputedStyle(e);
    const hasText = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim());
    const clips = s.overflowX === 'hidden' || s.overflowX === 'clip';
    if (hasText && clips && e.clientWidth > 1 && e.scrollWidth > e.clientWidth + 1)
      out.push({
        check: 'clipped',
        detail: `${describe(e)} scrollWidth ${e.scrollWidth} > ${e.clientWidth}`,
      });
  }

  const controls = document.body.querySelectorAll(
    'button, input:not([type=hidden]), select, textarea, summary, [role=button]',
  );
  for (const e of controls) {
    if (!visible(e)) continue;
    // A checkbox or radio is operated through its label: that is the target to size.
    const label =
      e instanceof HTMLInputElement && ['checkbox', 'radio'].includes(e.type)
        ? e.closest('label')
        : null;
    const r = (label ?? e).getBoundingClientRect();
    if (!inScroller(e) && (r.left < -0.5 || r.right > window.innerWidth + 0.5))
      out.push({
        check: 'outside-viewport',
        detail: `${describe(e)} at ${Math.round(r.left)}..${Math.round(r.right)}`,
      });
    if (r.width < min - 0.5 || r.height < min - 0.5)
      out.push({
        check: 'small-target',
        detail: `${describe(e)} is ${Math.round(r.width)}x${Math.round(r.height)}`,
      });
    const s = getComputedStyle(e);
    if (e.tagName !== 'INPUT' || ['button', 'submit'].includes((e as HTMLInputElement).type)) {
      if (faces.includes(s.backgroundColor))
        out.push({
          check: 'default-button',
          detail: `${describe(e)} has the browser's ButtonFace background`,
        });
    }
    if (!label && s.fontSize === defaultFont)
      out.push({
        check: 'default-font',
        detail: `${describe(e)} uses the browser's default control font`,
      });
  }
  return out;
}

export async function layoutViolations(page: Page): Promise<string[]> {
  const found = await page.evaluate(inPage, {
    min: MIN_TARGET,
    faces: DEFAULT_FACES,
    defaultFont: DEFAULT_CONTROL_FONT_SIZE,
  });
  return found.map((v) => `${v.check}: ${v.detail}`);
}

export async function contrastViolations(page: Page): Promise<string[]> {
  const res = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
  return res.violations.flatMap((v) =>
    v.nodes.map((n) => `${v.id}: ${n.target.join(' ')} ${n.any[0]?.message ?? ''}`.trim()),
  );
}
