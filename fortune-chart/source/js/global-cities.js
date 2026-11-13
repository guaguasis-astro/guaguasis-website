// GeoNames城市库按名称首字母分片；仅请求官网自身的静态资源。
export const normalizePlace = value => value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[^a-z0-9\u3400-\u9fff ]/g, '').trim();
export function cityShard(query) {
    const first = normalizePlace(query.split(/[,，]/)[0])[0];
    return first && /^[a-z0-9]$/.test(first) ? first : 'han';
}
export function findCities(rows, query, locale = 'en') {
    const [city, ...parts] = query.split(/[,，]/).map(normalizePlace);
    const countryAliases = {usa:'us', 'united states of america':'us', uk:'gb', uae:'ae'};
    const filters = parts.map(part => countryAliases[part] || part);
    if (!city) return [];
    const englishCountries = new Intl.DisplayNames(['en'], { type: 'region' });
    const localCountries = new Intl.DisplayNames([locale], { type: 'region' });
    return rows.map(row => {
        const aliases = row[8];
        const rank = aliases.includes(city) ? 0 : aliases.some(name => name.startsWith(city)) ? 1 : 2;
        if (rank === 2 && !aliases.some(name => name.includes(city))) return null;
        const region = normalizePlace([row[2], row[3], englishCountries.of(row[2]), localCountries.of(row[2]), row[6]].join(' '));
        if (!filters.every(filter => !filter || (/^[a-z]{2}$/.test(filter) ? row[2].toLowerCase() === filter : region.includes(filter)))) return null;
        return { row, rank };
    }).filter(Boolean).sort((a, b) => a.rank - b.rank || b.row[7] - a.row[7]).slice(0, 30).map(item => item.row);
}
