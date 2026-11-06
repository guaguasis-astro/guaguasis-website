// 综合评估的展示模型：读取既有评分与命中规则，不改变财富判断。
import { ZODIAC_SIGNS, HOUSE_LORDS, PLANET_IDS, PLANET_NAMES } from './astrology.js';

export const MOON_GROWTH_READINGS = {
    增光: '从新月到满月，此时的月亮活跃、具有生产力、也会视为财富好的象征',
    减光: '从满月到新月，此时的月亮比较消极和冷、生产力较弱',
};
export const MOON_PHASE_READINGS = [
    ['新月', '天真开放、过度的自我or踌躇，以本能的方式前进'],
    ['峨眉月', '缺乏安全感、敏感、有来自环境的阻力'],
    ['上弦月', '恐惧、缺乏勇气而行动瘫痪，不自觉地制造危机，建议用新秩序解决问题，展示个性'],
    ['盈凸月', '专注熟练、内省、做有价值的实事'],
    ['满月', '把他人愿望反射到自己身上，渴望关系与互动，整合两极'],
    ['亏凸月', '分享、传达、沟通、有信仰的生活'],
    ['下弦月', '内在心理的危机，建议调整思维方式，破旧立新'],
    ['残月', '与众不同、格格不入，使命感、萃取智慧进化，命运的召唤、“老灵魂”'],
];

// Rudhyar八阶段：从合相起，每45°一个阶段，采用左闭右开区间。
export function getAssessmentMoonPhase(sunLongitude, moonLongitude) {
    const angle = ((moonLongitude - sunLongitude) % 360 + 360) % 360;
    const index = Math.floor(angle / 45);
    const [name, reading] = MOON_PHASE_READINGS[index];
    const growth = angle === 0 || angle === 180 ? null : angle < 180 ? '增光' : '减光';
    return { angle, index, name, reading, growth, growthReading: growth ? MOON_GROWTH_READINGS[growth] : '',
        stages: index < 4 ? [0, 1, 2, 3, 4] : [4, 5, 6, 7, 0] };
}

export const WEALTH_BANDS = [
    { label: '较弱', start: 0, end: 1.5 }, { label: '偏弱', start: 1.5, end: 2.5 },
    { label: '小康', start: 2.5, end: 4 }, { label: '中富', start: 4, end: 5 },
    { label: '大富', start: 5, end: 6.5 }, { label: '巨富', start: 6.5, end: 10 },
];
export function getWealthBand(score) {
    return WEALTH_BANDS.findIndex((band, index) => score >= band.start && (score < band.end || index === WEALTH_BANDS.length - 1));
}

export function getAssessmentFactors(wa) {
    const data = [
        ['围攻格局', wa.normalized.besiegement, .35, wa.besiegementDetails],
        ['福点与三分主星', wa.normalized.pfTriplicityCombined, .30, wa.pfDetails],
        ['钱财宫', wa.normalized.moneyHouse, .15, wa.moneyHouseDetails],
        ['月亮状态', wa.normalized.moon, .10, wa.moonDetails],
        ['其他修正', wa.normalized.extra, .10, wa.extraDetails],
    ];
    const factors = data.map(([name, value, weight, details]) => ({ name, contribution: value * weight,
        status: value < 0 ? '需要留意' : value >= 6 ? '主要助力' : value >= 3 ? '可用支持' : value > 0 ? '仍需经营' : '支持较少',
        details: [...new Set(details)], negative: value < 0 }));
    const indicators = wa.fortuneIndicators;
    if (indicators.wealthBonus > 0) factors.push({ name: '财富获取', contribution: indicators.wealthBonus,
        status: '额外助力', details: indicators.wealth.map(item => item.reason + item.text), bonus: true, negative: false });
    const scale = Math.max(1, ...factors.map(item => Math.abs(item.contribution)));
    return factors.map(item => ({ ...item, width: Math.abs(item.contribution) / scale * 100 }));
}

// 关系图只为现有命中项生成路径；嵌套强组合取一条路径，避免重复。
export function getAssessmentRelations(chart) {
    const { partOfFortune: pof, planets, wealthAssessment: wa } = chart;
    const f = wa.fortuneIndicators;
    const spirit = f.spirit;
    const sign = index => ZODIAC_SIGNS[index];
    const point = (title, index) => ({ title, symbol: sign(index).symbol, detail: sign(index).name });
    const body = (title, key) => ({ title, symbol: PLANET_NAMES[key], detail: sign(planets[key].signIndex).name,
        state: planets[key].dignitySummary.summaryText });
    const fortune = () => point('福点', pof.signIndex);
    const spiritPoint = () => point('精神点', spirit.signIndex);
    const acquisition = () => point('福点第十一宫 · 获取宫', f.acquisitionSign);
    const tenth = () => point('福点第十宫 · 成就位置', f.tenthSign);
    const pfLordKey = pof.lord.key || Object.keys(PLANET_IDS).find(key => PLANET_IDS[key] === HOUSE_LORDS[pof.signIndex]);
    const spiritLord = () => body('精神点主星', spirit.lordKey);
    const pfLord = () => body('福点主星', pfLordKey);
    const rules = [...f.wealth, ...f.prominence];
    const layered = rules.some(rule => rule.id === 'layered-acquisition');
    const paths = [];
    for (const rule of rules) {
        let nodes, links, mutual = false;
        switch (rule.id) {
            case 'fortune-lord-acquisition':
                if (layered) continue;
                nodes = [fortune(), pfLord(), acquisition()]; links = ['主星', '进入']; break;
            case 'sect-benefic-acquisition': {
                if (layered) continue;
                const key = chart.isDayChart ? 'JUPITER' : 'VENUS';
                nodes = [body(chart.isDayChart ? '日生盘吉星' : '夜生盘吉星', key), acquisition()]; links = ['进入']; break;
            }
            case 'layered-acquisition': nodes = [fortune(), pfLord(), acquisition()]; links = ['主星 · 合昼夜性', (planets[pfLordKey].dignity.domicile ? '入庙' : '擢升') + ' · 进入']; break;
            case 'acquisition-reception': nodes = [pfLord(), body('获取宫主星', f.acquisitionLordKey)]; links = ['交换守护星座']; mutual = true; break;
            case 'spirit-lord-acquisition': nodes = [spiritPoint(), spiritLord(), acquisition()]; links = ['主星', '进入']; break;
            case 'spirit-lord-fortune': nodes = [spiritPoint(), spiritLord(), point('福点所在星座', pof.signIndex)]; links = ['主星', '进入']; break;
            case 'spirit-lord-tenth': nodes = [spiritPoint(), spiritLord(), tenth()]; links = ['主星', '进入']; break;
            case 'fortune-lord-tenth': nodes = [fortune(), pfLord(), tenth()]; links = ['主星', '进入']; break;
            case 'spirit-tenth': nodes = [spiritPoint(), tenth()]; links = ['落入']; break;
            case 'cross-link': nodes = [body('福点主星 · 落精神点星座', pfLordKey), body('精神点主星 · 落福点星座', spirit.lordKey)]; links = ['双向连接']; mutual = true; break;
            default: continue;
        }
        paths.push({ id: rule.id, title: rule.title, reason: rule.reason, reading: rule.text, nodes, links, mutual,
            category: f.wealth.includes(rule) ? 'wealth' : 'prominence' });
    }
    return { paths, sources: f.sources };
}

export function getAssessmentLord(lord, wa) {
    const comprehensive = wa.triplicityLordComprehensive[lord.planetKey] || lord.dignitySummary;
    const stars = comprehensive.score >= 3 ? 3 : comprehensive.score >= 0 ? 2 : 1;
    const houseKind = [1, 4, 7, 10].includes(lord.house) ? '角宫' : [2, 5, 8, 11].includes(lord.house) ? '续宫' : '果宫';
    const d = lord.dignity;
    const tags = [{ label: houseKind, good: houseKind === '角宫', pressure: houseKind === '果宫' }];
    for (const [key, label] of [['domicile', '入庙'], ['exaltation', '擢升'], ['triplicity', '三分'], ['term', '界'], ['face', '面']]) {
        if (d[key]) tags.push({ label, good: true });
    }
    if (d.detriment) tags.push({ label: '落陷', pressure: true });
    if (d.fall) tags.push({ label: '失意', pressure: true });
    if (d.peregrine) tags.push({ label: '外来' });
    return { ...lord, level: comprehensive.level, stars, houseKind, tags,
        fixedStars: wa.triplicityStarConjunctions[lord.planetKey] || [] };
}
