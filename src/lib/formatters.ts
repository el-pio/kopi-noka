// Currency & Timezone Formatting Utilities for Kopi Noka

/**
 * Format number to Indonesian Rupiah currency format
 * Example: 25000 -> "Rp 25.000"
 */
export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Rp 0';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format ISO date string into Asia/Makassar (WITA) localized readable string
 */
export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Makassar',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date) + ' WITA';
  } catch (err) {
    return isoString;
  }
}

/**
 * Format only time in Asia/Makassar (WITA)
 */
export function formatTimeOnly(isoString?: string | null): string {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Makassar',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date) + ' WITA';
  } catch (err) {
    return isoString;
  }
}

/**
 * Format date only (DD MMMM YYYY) in Asia/Makassar
 */
export function formatDateOnly(isoString?: string | null): string {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Makassar',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch (err) {
    return isoString;
  }
}

/**
 * Format percentage
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
