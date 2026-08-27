import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Màu nhấn của app.
 *
 * Toàn bộ class `*-brand-*` trong giao diện đọc từ biến CSS `--brand-*`, nên đổi
 * màu chỉ là ghi lại 7 biến trên thẻ <html>. Không cần build lại Tailwind, cũng
 * không cần render lại cây component.
 *
 * Lựa chọn nằm ở localStorage (theo máy, không theo tài khoản): nó là sở thích
 * hiển thị, đổi máy thì đổi lại một nốt nhạc, không đáng để tốn một vòng ghi
 * Firestore và không nên chờ mạng mới vẽ được màn hình đầu tiên.
 */

export const THEME_STORAGE_KEY = 'outfit-log:theme';

type Shade = '50' | '100' | '200' | '500' | '600' | '700' | '800';

export interface ThemePreset {
  id: string;
  label: string;
  /** Màu chấm tròn trong bảng chọn, cũng là màu ghi vào <meta name="theme-color">. */
  swatch: string;
  shades: Record<Shade, string>;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'indigo',
    label: 'Chàm',
    swatch: '#4f46e5',
    shades: {
      '50': '238 242 255',
      '100': '224 231 255',
      '200': '199 210 254',
      '500': '99 102 241',
      '600': '79 70 229',
      '700': '67 56 202',
      '800': '55 48 163',
    },
  },
  {
    id: 'violet',
    label: 'Tím',
    swatch: '#7c3aed',
    shades: {
      '50': '245 243 255',
      '100': '237 233 254',
      '200': '221 214 254',
      '500': '139 92 246',
      '600': '124 58 237',
      '700': '109 40 217',
      '800': '91 33 182',
    },
  },
  {
    id: 'rose',
    label: 'Hồng',
    swatch: '#e11d48',
    shades: {
      '50': '255 241 242',
      '100': '255 228 230',
      '200': '254 205 211',
      '500': '244 63 94',
      '600': '225 29 72',
      '700': '190 18 60',
      '800': '159 18 57',
    },
  },
  {
    id: 'orange',
    label: 'Cam',
    swatch: '#ea580c',
    shades: {
      '50': '255 247 237',
      '100': '255 237 213',
      '200': '254 215 170',
      '500': '249 115 22',
      '600': '234 88 12',
      '700': '194 65 12',
      '800': '154 52 18',
    },
  },
  {
    id: 'emerald',
    label: 'Lục',
    swatch: '#059669',
    shades: {
      '50': '236 253 245',
      '100': '209 250 229',
      '200': '167 243 208',
      '500': '16 185 129',
      '600': '5 150 105',
      '700': '4 120 87',
      '800': '6 95 70',
    },
  },
  {
    id: 'sky',
    label: 'Trời',
    swatch: '#0284c7',
    shades: {
      '50': '240 249 255',
      '100': '224 242 254',
      '200': '186 230 253',
      '500': '14 165 233',
      '600': '2 132 199',
      '700': '3 105 161',
      '800': '7 89 133',
    },
  },
  {
    id: 'graphite',
    label: 'Than chì',
    swatch: '#3f3f46',
    shades: {
      '50': '250 250 250',
      '100': '244 244 245',
      '200': '228 228 231',
      '500': '113 113 122',
      '600': '82 82 91',
      '700': '63 63 70',
      '800': '39 39 42',
    },
  },
];

export const DEFAULT_THEME_ID = THEME_PRESETS[0].id;

export const findPreset = (id: string | null | undefined): ThemePreset =>
  THEME_PRESETS.find(p => p.id === id) || THEME_PRESETS[0];

/** Ghi biến CSS + màu thanh trạng thái. Tách riêng để index.html gọi lại được. */
export const applyTheme = (preset: ThemePreset) => {
  const root = document.documentElement;
  (Object.keys(preset.shades) as Shade[]).forEach(shade => {
    root.style.setProperty(`--brand-${shade}`, preset.shades[shade]);
  });
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', preset.swatch);
};

const readStoredThemeId = (): string => {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME_ID;
  } catch {
    // Safari chế độ riêng tư chặn localStorage; màu mặc định vẫn dùng được.
    return DEFAULT_THEME_ID;
  }
};

interface ThemeContextValue {
  theme: ThemePreset;
  presets: ThemePreset[];
  setTheme: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeId] = useState<string>(() => readStoredThemeId());
  const theme = useMemo(() => findPreset(themeId), [themeId]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((id: string) => {
    setThemeId(findPreset(id).id);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, findPreset(id).id);
    } catch {
      // Không lưu được thì màu vẫn đổi cho phiên này.
    }
  }, []);

  const value = useMemo(() => ({ theme, presets: THEME_PRESETS, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme phải nằm trong ThemeProvider');
  return ctx;
};
