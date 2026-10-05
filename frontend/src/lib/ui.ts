/**
 * Shared class tokens. Every page composes its markup from these so spacing,
 * radii, shadows and typography stay identical across Auth, Clients, Pipeline
 * and Dashboard. Changing a token here changes it everywhere.
 */

export const PAGE_CLASS = "space-y-6";

export const PAGE_HEADER_CLASS =
  "flex flex-wrap items-center justify-between gap-3";

export const PAGE_TITLE_CLASS = "text-2xl font-bold text-gray-900";

export const PAGE_SUBTITLE_CLASS = "text-xs text-gray-500";

export const CARD_SURFACE_CLASS =
  "rounded-2xl border border-gray-200 bg-white shadow-sm";

/** Paired with CARD_SURFACE_CLASS so every card lifts the same amount on hover. */
export const CARD_HOVER_CLASS = "transition-shadow hover:shadow-md";

export const SECTION_TITLE_CLASS = "text-sm font-semibold text-gray-900";

export const FIELD_CLASS =
  "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

export const FIELD_ERROR_CLASS =
  "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700";

export const MUTED_LABEL_CLASS = "text-xs text-gray-500";

export const LABEL_CLASS = "block text-sm font-medium text-gray-700";

export const SPACER_PY_LOADING_CLASS = "flex flex-col items-center gap-3 py-16";
