/**
 * useThemeTokens.ts — React bridge over ThemeBridge (feature 001-whole-site-3d,
 * T012/T033): rooms and fx subscribe to live token updates and re-render
 * (materials re-colour on theme switch). The island never toggles themes.
 */
import { useEffect, useReducer } from 'react';
import type { ThemeBridge, ThemeTokens } from './ThemeBridge';

export function useThemeTokens(theme: ThemeBridge): ThemeTokens {
  const [, bump] = useReducer((x: number) => x + 1, 0);
  useEffect(() => theme.subscribe(() => bump()), [theme]);
  return theme.tokens;
}
