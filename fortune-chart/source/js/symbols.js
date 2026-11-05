// 星盘Canvas与文字报告共用HamburgSymbols键位。
export const ZODIAC_HAMBURG = 'asdfghjklzxc';
export const PLANET_HAMBURG = {
    SUN: 'Q', MOON: 'W', MERCURY: 'E', VENUS: 'R', MARS: 'T',
    JUPITER: 'Y', SATURN: 'U', URANUS: 'I', NEPTUNE: 'O', PLUTO: 'P',
};
const planets = [
    ['☉', '太阳', 'SUN'], ['☽', '月亮', 'MOON'], ['☿', '水星', 'MERCURY'],
    ['♀', '金星', 'VENUS'], ['♂', '火星', 'MARS'], ['♃', '木星', 'JUPITER'],
    ['♄', '土星', 'SATURN'], ['♅', '天王星', 'URANUS'],
    ['♆', '海王星', 'NEPTUNE'], ['♇', '冥王星', 'PLUTO'],
];
const signs = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
export const HAMBURG_GLYPHS = Object.fromEntries([
    ...planets.map(([symbol, label, key]) => [symbol, { key: PLANET_HAMBURG[key], label }]),
    ...signs.map((label, index) => [String.fromCodePoint(0x2648 + index), { key: ZODIAC_HAMBURG[index], label }]),
]);

// 保留普通文字，只让单个符号span使用符号字体，避免将中文或英文误排成图案。
export function splitHamburgSymbols(text) {
    const tokens = [];
    const pattern = /[☉☽☿♀♂♃♄♅♆♇♈-♓][\uFE0E\uFE0F]?/gu;
    let lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
        if (match.index > lastIndex) tokens.push({ text: text.slice(lastIndex, match.index) });
        tokens.push({ ...HAMBURG_GLYPHS[match[0][0]] });
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) tokens.push({ text: text.slice(lastIndex) });
    return tokens;
}
