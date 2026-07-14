/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

/**
 * Equaris brand mark — a faithful vector trace of the wallet logo: rounded
 * wallet body, two cards peeking over the top edge, cash notes with peaked tops
 * poking out the top-left, a clasp with a snap dot on the right, and the gold
 * dividing slash. Wallet strokes use `currentColor` so the mark is cream on the
 * maroon sidebar and maroon on light surfaces; the slash is always gold.
 */
export const EquarisLogo: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 52 46"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    stroke="currentColor"
    strokeWidth={2.4}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    {/* cash notes with peaked tops, poking out the top-left */}
    <path d="M13.5 16 L21.5 5.5 a1.6 1.6 0 0 1 2.4 0 L27 16" />
    <path d="M24.5 16 L30.5 7 a1.5 1.5 0 0 1 2.1 0 L36 16" />
    {/* two card tops peeking over the wallet's top edge */}
    <path d="M11.5 16 a3 2.6 0 0 1 6 0" />
    <path d="M19 16 a3.2 2.8 0 0 1 6.4 0" />
    {/* wallet body */}
    <rect x="6" y="16" width="38" height="24" rx="5" />
    {/* clasp with snap dot */}
    <path d="M44 22.5 h3.5 a2.2 2.2 0 0 1 2.2 2.2 v4.6 a2.2 2.2 0 0 1 -2.2 2.2 H44" />
    <circle cx="45.6" cy="27" r="1.35" fill="currentColor" stroke="none" />
    {/* gold dividing slash */}
    <path d="M35.5 6.5 L14 40.5" stroke="var(--gold, #c7a15c)" strokeWidth={2.6} />
  </svg>
);
