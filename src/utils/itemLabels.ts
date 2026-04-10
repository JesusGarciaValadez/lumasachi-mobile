/**
 * Translates an item_type key (e.g. "engine_block") using i18n.
 * Falls back to Title Case from snake_case if the key is missing.
 */
export const getItemTypeLabel = (
  t: (key: string) => string,
  itemType: string,
): string => {
  const key = `itemTypes.${itemType}`;
  const translated = t(key);
  // If t() returns the key itself, the translation is missing — fallback
  if (translated === key) {
    return itemType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
  return translated;
};

/**
 * Translates a component key (e.g. "bearing_caps") using i18n.
 * Falls back to Title Case from snake_case if the key is missing.
 */
export const getComponentLabel = (
  t: (key: string) => string,
  componentName: string,
): string => {
  const key = `components.${componentName}`;
  const translated = t(key);
  if (translated === key) {
    return componentName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
  return translated;
};
