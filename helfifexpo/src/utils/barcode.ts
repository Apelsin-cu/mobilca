const BARCODE_PATTERN = /(^|[^\d])(\d{8,14})(?=[^\d]|$)/g;

export const normalizeScannedBarcode = (
  rawValue: string | null | undefined
): string | null => {
  if (!rawValue) return null;

  const trimmed = rawValue.trim();
  if (!trimmed) return null;

  if (/^\d{8,14}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const params = ['barcode', 'code', 'ean', 'gtin', 'upc'];

    for (const param of params) {
      const value = url.searchParams.get(param);
      if (value && /^\d{8,14}$/.test(value.trim())) {
        return value.trim();
      }
    }
  } catch (error) {
    // Not a URL, continue with plain text extraction.
  }

  const matches = Array.from(trimmed.matchAll(BARCODE_PATTERN))
    .map((match) => match[2])
    .sort((first, second) => second.length - first.length);

  return matches[0] || null;
};
