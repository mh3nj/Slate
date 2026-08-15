/**
 * Slate — site footer.
 *
 * A quiet, professional strip: the brand mark, the maintainer's links, and an
 * open-source note. Kept minimal — the external-link arrows fade in on hover.
 */

import { ArrowUpRight } from 'lucide-react';

const LINKS: ReadonlyArray<{ href: string; label: string; hint: string }> = [
  { href: 'https://mh3n.com', label: 'Portfolio', hint: 'Portfolio' },
  { href: 'https://dahgan.com', label: 'Software Studio', hint: 'Software studio' },
  { href: 'https://parsegan.com', label: 'Brand identity studio', hint: 'Brand identity studio' },
  { href: 'https://github.com/mh3nj', label: 'GitHub', hint: 'GitHub' },
  {
    href: 'https://www.xing.com/profile/Mohsen_Jafari093223',
    label: 'Xing',
    hint: 'Xing profile',
  },
  { href: 'https://t.me/sltheme', label: 'Telegram Channel', hint: 'Telegram Channel' },
];

interface FooterProps {
  uiTheme: 'dark' | 'light';
}

export default function Footer({ uiTheme }: FooterProps) {
  return (
    <footer className="slate-footer">
      <div className="slate-footer-inner">
        <img
          className="slate-footer-logo"
          src={`${process.env.PUBLIC_URL}/logomark-logotype-${uiTheme}-theme-horizontal.png`}
          alt="Slate"
        />
        <nav className="slate-footer-links" aria-label="About the author">
          {LINKS.map(({ href, label, hint }) => (
            <a
              key={href}
              className="slate-footer-link"
              href={href}
              target="_blank"
              rel="noreferrer"
              title={hint}
            >
              {label}
              <ArrowUpRight size={11} aria-hidden="true" />
            </a>
          ))}
        </nav>
        <div className="slate-footer-legal">
          MIT License · Open source <span className="slate-footer-heart">♥</span>
        </div>
      </div>
    </footer>
  );
}
