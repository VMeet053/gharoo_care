export function slugify(input) {
  if (input == null) return '';
  return String(input)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function findItemBySlug(items, slug, titleKey = 'title') {
  if (!Array.isArray(items) || !slug) return null;
  for (let i = 0; i < items.length; i++) {
    const item = items[i] || {};
    if (slugify(item[titleKey]) === String(slug)) return { item, index: i };
  }
  const fallbackIdx = Number.isFinite(parseInt(slug, 10)) ? parseInt(slug, 10) - 1 : -1;
  if (fallbackIdx >= 0 && fallbackIdx < items.length) {
    return { item: items[fallbackIdx], index: fallbackIdx };
  }
  return null;
}
