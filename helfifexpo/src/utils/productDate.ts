const MS_PER_DAY = 1000 * 60 * 60 * 24;

const createLocalDate = (year: number, month: number, day: number): Date => {
  return new Date(year, month - 1, day, 12, 0, 0, 0);
};

export const parseProductDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d{2}\.\d{2}\.\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split('.').map(Number);
    const parsed = createLocalDate(year, month, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split('-').map(Number);
    const parsed = createLocalDate(year, month, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const fallback = new Date(trimmed);
  if (Number.isNaN(fallback.getTime())) {
    return null;
  }

  return createLocalDate(
    fallback.getFullYear(),
    fallback.getMonth() + 1,
    fallback.getDate()
  );
};

export const normalizeExpiryDate = (
  value: string | null | undefined
): string => {
  const parsed = parseProductDate(value);
  if (!parsed) return value?.trim() || '';

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatExpiryDateForDisplay = (
  value: string | null | undefined
): string => {
  const parsed = parseProductDate(value);
  if (!parsed) return value?.trim() || '';

  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = parsed.getFullYear();
  return `${day}.${month}.${year}`;
};

export const getDaysUntilExpiry = (
  value: string | null | undefined,
  now: Date = new Date()
): number => {
  const parsed = parseProductDate(value);
  if (!parsed) return Number.NaN;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
  return Math.round((parsed.getTime() - today.getTime()) / MS_PER_DAY);
};
