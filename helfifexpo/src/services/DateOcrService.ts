import { extractTextFromImage, isSupported } from 'expo-text-extractor';

import { normalizeExpiryDate, parseProductDate } from '../utils/productDate';

export interface OcrDateMatch {
  isoDate: string;
  raw: string;
  sourceLine: string;
}

export interface OcrScanResult {
  rawText: string;
  lines: string[];
  expiryDate?: OcrDateMatch;
  manufactureDate?: OcrDateMatch;
}

const EXPIRY_HINTS = [
  'годен до',
  'употребить до',
  'срок годности',
  'best before',
  'use by',
  'expiry',
  'exp',
];

const MANUFACTURE_HINTS = [
  'изготов',
  'дата изготовления',
  'дата произв',
  'произвед',
  'mfg',
  'packed on',
  'pack date',
];

const DATE_PATTERNS = [
  /\b(\d{2}[./-]\d{2}[./-]\d{4})\b/g,
  /\b(\d{2}[./-]\d{2}[./-]\d{2})\b/g,
  /\b(\d{4}[./-]\d{2}[./-]\d{2})\b/g,
];

interface LineDateCandidate {
  isoDate: string;
  raw: string;
  sourceLine: string;
  index: number;
  date: Date;
}

const normalizeTextLine = (line: string): string => {
  return line
    .replace(/\s+/g, ' ')
    .replace(/[|]/g, '1')
    .replace(/[OoОо]/g, '0')
    .trim();
};

const toComparableLine = (line: string): string => normalizeTextLine(line).toLowerCase();

const normalizeDateCandidate = (value: string): string => {
  const trimmed = value.trim();

  if (/^\d{2}[./-]\d{2}[./-]\d{2}$/.test(trimmed)) {
    const [day, month, shortYear] = trimmed.split(/[./-]/).map(Number);
    const fullYear = shortYear >= 70 ? 1900 + shortYear : 2000 + shortYear;
    return normalizeExpiryDate(`${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${fullYear}`);
  }

  if (/^\d{2}[./-]\d{2}[./-]\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split(/[./-]/).map(Number);
    return normalizeExpiryDate(`${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`);
  }

  if (/^\d{4}[./-]\d{2}[./-]\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split(/[./-]/).map(Number);
    return normalizeExpiryDate(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  }

  return normalizeExpiryDate(trimmed);
};

const extractCandidates = (lines: string[]): LineDateCandidate[] => {
  const candidates: LineDateCandidate[] = [];

  lines.forEach((line, index) => {
    for (const pattern of DATE_PATTERNS) {
      const matches = line.matchAll(pattern);

      for (const match of matches) {
        const raw = match[1];
        const isoDate = normalizeDateCandidate(raw);
        const parsed = parseProductDate(isoDate);

        if (!parsed) {
          continue;
        }

        candidates.push({
          isoDate,
          raw,
          sourceLine: line,
          index,
          date: parsed,
        });
      }
    }
  });

  return candidates;
};

const findLabelMatch = (
  lines: string[],
  candidates: LineDateCandidate[],
  hints: string[],
  fallback: (items: LineDateCandidate[]) => LineDateCandidate | undefined
): LineDateCandidate | undefined => {
  for (let index = 0; index < lines.length; index += 1) {
    const comparable = toComparableLine(lines[index]);
    if (!hints.some((hint) => comparable.includes(hint))) {
      continue;
    }

    const nearby = candidates.filter((candidate) => Math.abs(candidate.index - index) <= 1);
    const bestNearby = fallback(nearby);
    if (bestNearby) {
      return bestNearby;
    }
  }

  return undefined;
};

const pickExpiryFallback = (candidates: LineDateCandidate[]): LineDateCandidate | undefined => {
  const now = new Date();
  const futureDates = candidates
    .filter((candidate) => candidate.date.getTime() >= now.getTime() - 1000 * 60 * 60 * 24 * 2)
    .sort((first, second) => second.date.getTime() - first.date.getTime());

  return futureDates[0];
};

const pickManufactureFallback = (
  candidates: LineDateCandidate[],
  expiryDate?: LineDateCandidate
): LineDateCandidate | undefined => {
  const now = new Date();
  const pastDates = candidates
    .filter((candidate) => candidate.date.getTime() <= now.getTime() + 1000 * 60 * 60 * 24)
    .filter((candidate) => !expiryDate || candidate.isoDate !== expiryDate.isoDate)
    .sort((first, second) => first.date.getTime() - second.date.getTime());

  return pastDates[0];
};

export const DateOcrService = {
  isSupported,

  async scanImage(uri: string): Promise<OcrScanResult> {
    const rawLines = await extractTextFromImage(uri);
    const lines = rawLines.map(normalizeTextLine).filter(Boolean);
    const candidates = extractCandidates(lines);

    const labelledExpiry = findLabelMatch(lines, candidates, EXPIRY_HINTS, pickExpiryFallback);
    const fallbackExpiry = labelledExpiry || pickExpiryFallback(candidates);
    const labelledManufacture = findLabelMatch(
      lines,
      candidates,
      MANUFACTURE_HINTS,
      (items) => pickManufactureFallback(items, fallbackExpiry)
    );
    const fallbackManufacture =
      labelledManufacture || pickManufactureFallback(candidates, fallbackExpiry);

    return {
      rawText: lines.join('\n'),
      lines,
      expiryDate: fallbackExpiry
        ? {
            isoDate: fallbackExpiry.isoDate,
            raw: fallbackExpiry.raw,
            sourceLine: fallbackExpiry.sourceLine,
          }
        : undefined,
      manufactureDate: fallbackManufacture
        ? {
            isoDate: fallbackManufacture.isoDate,
            raw: fallbackManufacture.raw,
            sourceLine: fallbackManufacture.sourceLine,
          }
        : undefined,
    };
  },
};
