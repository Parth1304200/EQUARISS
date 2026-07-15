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
import logoImg from "../assets/equaris-logo.png";
import { cn } from "@/lib/utils";

export const EquarisLogo: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = ({ className, ...props }) => (
  <img
    src={logoImg}
    alt="Equaris Logo"
    className={cn("object-contain aspect-[52/46] shrink-0", className)}
    {...props}
  />
);
