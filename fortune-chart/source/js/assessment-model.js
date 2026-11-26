// 综合评估的展示模型：读取既有评分与命中规则，不改变财富判断。
import { ZODIAC_SIGNS, HOUSE_LORDS, PLANET_IDS, PLANET_NAMES, PLANET_PERIODS, SUPPORT_BANDS } from './astrology.js';

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

export const WEALTH_BANDS = SUPPORT_BANDS;
export function getWealthBand(score) {
    return WEALTH_BANDS.findIndex((band, index) => score >= band.start && (score < band.end || index === WEALTH_BANDS.length - 1));
}

// 只转换展示文案，沿用已有六档边界，不修改计算对象。
export const WEALTH_READINGS = [
    { label: '财富稀薄', reading: '财富格局中的支持较少，资源取得与收入积累可能需要付出更多心力。适合从自身擅长的事情做起，逐步建立稳定的收入来源，耐心积累可持续的资源。' },
    { label: '财富较弱', reading: '财富格局中的助力偏弱，机会的承接与收入的稳定性仍需经营。重视专业能力与长期积累，善用已有的人脉和资源，有助于逐步改善物质基础。' },
    { label: '小康', reading: '财富格局整体平稳，具备经营日常生活与逐步积累的基础。通过持续投入、发挥自身所长，并把握合适的机会，有利于建立安稳而有余裕的生活。' },
    { label: '中富', reading: '财富格局具有一定支持，人生机遇、赚钱能力或资源取得方面有所助力。若能发挥优势、持续经营，具备积累较丰厚资产、获得较为优渥生活的潜力。' },
    { label: '大富', reading: '财富格局较为突出，多项关键条件为事业发展、资源取得与财富积累提供支持。善于整合资源、承接机遇并长期经营，有机会形成较大的财富规模。' },
    { label: '巨富', reading: '财富格局中呈现较强的支持组合，人生机遇、资源层级与财富取得之间联系紧密，具有广阔的积累空间。发挥核心优势、重视合作与长期经营，有利于将格局中的助力转化为持续成果。' },
];
export function getWealthConclusion(score) {
    return WEALTH_READINGS[getWealthBand(score)];
}

export const assessmentDetailText = text => text.replaceAll('已纳入财富支持评分。', '可为财富积累提供支持。').replaceAll('未见围攻强化，按中性支持处理', '未见围攻格局');
export const getSupportLabel = value => value >= 8 ? '强支持' : value >= 6 ? '有支持' : value >= 4 ? '无' : '支持偏弱';

export function getAssessmentFactors(wa) {
    const data = [
        ['围攻格局', wa.normalized.besiegement, .25, wa.besiegementDetails],
        ['福点与三分主星', wa.normalized.pfTriplicityCombined, .30, [...wa.pfDetails, ...(wa.lotRelationDetails || [])]],
        ['钱财宫', wa.normalized.moneyHouse, .25, wa.moneyHouseDetails],
        ['月亮状态', wa.normalized.moon, .10, wa.moonDetails],
        ['其他修正', wa.normalized.extra, .10, wa.extraDetails],
    ];
    const factors = data.map(([name, value, weight, details]) => ({ name, contribution: value * weight,
        status: getSupportLabel(value),
        details: [...new Set(details.map(assessmentDetailText))], negative: value < 4 }));
    const scale = Math.max(1, ...factors.map(item => Math.abs(item.contribution)));
    return factors.map(item => ({ ...item, width: item.status === '无' ? 0 : Math.abs(item.contribution) / scale * 100 }));
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
            case 'fortune-lord-natal-second':
                nodes = [fortune(), pfLord(), point('本命第二宫', planets[pfLordKey].signIndex)]; links = ['主星', '进入']; break;
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
    const stars = comprehensive.score >= 8 ? 3 : comprehensive.score >= 4 ? 2 : 1;
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
        periodYears: PLANET_PERIODS[lord.planetKey] ?? null,
        fixedStars: wa.triplicityStarConjunctions[lord.planetKey] || [] };
}
