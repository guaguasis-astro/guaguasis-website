// 占星计算核心模块
// 基于瑞士星历表 (Swiss Ephemeris)

import SwissEPH from "sweph-wasm";
import { getSignPeriod, getSignPeriodRounded } from "./sign-periods.js";

let swe = null;

// 初始化星历表
export async function initSwe() {
    if (swe) return swe;
    swe = await SwissEPH.init();
    // 从默认 CDN 加载星历文件（行星 + 月球 + 恒星）
    // 默认 CDN: https://ptprashanttripathi.github.io/sweph-wasm/ephe/
    try {
        await swe.swe_set_ephe_path();
        console.log("瑞士星历表文件加载成功");
    } catch (e) {
        console.warn("星历表文件加载失败，将使用 Moshier 模式（行星计算仍准确，恒星数据用内置）:", e.message);
    }
    return swe;
}

// ===== 常量定义 =====

// 行星 ID 映射
export const PLANET_IDS = {
    SUN: 0,
    MOON: 1,
    MERCURY: 2,
    VENUS: 3,
    MARS: 4,
    JUPITER: 5,
    SATURN: 6,
    URANUS: 7,
    NEPTUNE: 8,
    PLUTO: 9,
    MEAN_NODE: 10,
    TRUE_NODE: 11,
};

// 行星中文名
export const PLANET_NAMES = {
    SUN: "太阳",
    MOON: "月亮",
    MERCURY: "水星",
    VENUS: "金星",
    MARS: "火星",
    JUPITER: "木星",
    SATURN: "土星",
    URANUS: "天王星",
    NEPTUNE: "海王星",
    PLUTO: "冥王星",
};

// 十二星座
export const ZODIAC_SIGNS = [
    { name: "白羊座", symbol: "♈", element: "fire", modality: "cardinal" },
    { name: "金牛座", symbol: "♉", element: "earth", modality: "fixed" },
    { name: "双子座", symbol: "♊", element: "air", modality: "mutable" },
    { name: "巨蟹座", symbol: "♋", element: "water", modality: "cardinal" },
    { name: "狮子座", symbol: "♌", element: "fire", modality: "fixed" },
    { name: "处女座", symbol: "♍", element: "earth", modality: "mutable" },
    { name: "天秤座", symbol: "♎", element: "air", modality: "cardinal" },
    { name: "天蝎座", symbol: "♏", element: "water", modality: "fixed" },
    { name: "射手座", symbol: "♐", element: "fire", modality: "mutable" },
    { name: "摩羯座", symbol: "♑", element: "earth", modality: "cardinal" },
    { name: "水瓶座", symbol: "♒", element: "air", modality: "fixed" },
    { name: "双鱼座", symbol: "♓", element: "water", modality: "mutable" },
];

// 宫主星（传统守护星，古典占星）
export const HOUSE_LORDS = {
    0: 4,   // 白羊座 → 火星
    1: 3,   // 金牛座 → 金星
    2: 2,   // 双子座 → 水星
    3: 1,   // 巨蟹座 → 月亮
    4: 0,   // 狮子座 → 太阳
    5: 2,   // 处女座 → 水星
    6: 3,   // 天秤座 → 金星
    7: 4,   // 天蝎座 → 火星 (古典守护)
    8: 5,   // 射手座 → 木星
    9: 6,   // 摩羯座 → 土星
    10: 6,  // 水瓶座 → 土星 (古典守护)
    11: 5,  // 双鱼座 → 木星 (古典守护)
};

// 擢升表（星座索引 → 行星ID）
// 古典占星传统擢升：
// 白羊→太阳，金牛→月亮，处女→水星，双鱼→金星，
// 摩羯→火星，巨蟹→木星，天秤→土星
// 双子、狮子、天蝎、射手、水瓶、宝瓶 没有传统擢升主星
export const EXALTATION_PLANETS = {
    0: 0,   // 白羊座 → 太阳
    1: 1,   // 金牛座 → 月亮
    5: 2,   // 处女座 → 水星
    11: 3,  // 双鱼座 → 金星
    9: 4,   // 摩羯座 → 火星
    3: 5,   // 巨蟹座 → 木星
    6: 6,   // 天秤座 → 土星
};

// 界（Term）主星 - 埃及界（Egyptian Terms / Egyptian Bounds）
// 每个星座5个界，按度数分配，左闭右开 [start, end)
// 数据格式：星座索引 → [{planet, start, end}]
export const TERMS_EGYPTIAN = {
    0: [  // 白羊座 ♈
        { planet: "JUPITER", start: 0, end: 6 },
        { planet: "VENUS", start: 6, end: 12 },
        { planet: "MERCURY", start: 12, end: 20 },
        { planet: "MARS", start: 20, end: 25 },
        { planet: "SATURN", start: 25, end: 30 },
    ],
    1: [  // 金牛座 ♉
        { planet: "VENUS", start: 0, end: 8 },
        { planet: "MERCURY", start: 8, end: 14 },
        { planet: "JUPITER", start: 14, end: 22 },
        { planet: "SATURN", start: 22, end: 27 },
        { planet: "MARS", start: 27, end: 30 },
    ],
    2: [  // 双子座 ♊
        { planet: "MERCURY", start: 0, end: 6 },
        { planet: "JUPITER", start: 6, end: 12 },
        { planet: "VENUS", start: 12, end: 17 },
        { planet: "MARS", start: 17, end: 24 },
        { planet: "SATURN", start: 24, end: 30 },
    ],
    3: [  // 巨蟹座 ♋
        { planet: "MARS", start: 0, end: 7 },
        { planet: "VENUS", start: 7, end: 13 },
        { planet: "MERCURY", start: 13, end: 19 },
        { planet: "JUPITER", start: 19, end: 26 },
        { planet: "SATURN", start: 26, end: 30 },
    ],
    4: [  // 狮子座 ♌
        { planet: "JUPITER", start: 0, end: 6 },
        { planet: "VENUS", start: 6, end: 11 },
        { planet: "SATURN", start: 11, end: 18 },
        { planet: "MERCURY", start: 18, end: 24 },
        { planet: "MARS", start: 24, end: 30 },
    ],
    5: [  // 处女座 ♍
        { planet: "MERCURY", start: 0, end: 7 },
        { planet: "VENUS", start: 7, end: 17 },
        { planet: "JUPITER", start: 17, end: 21 },
        { planet: "MARS", start: 21, end: 28 },
        { planet: "SATURN", start: 28, end: 30 },
    ],
    6: [  // 天秤座 ♎
        { planet: "SATURN", start: 0, end: 6 },
        { planet: "MERCURY", start: 6, end: 14 },
        { planet: "JUPITER", start: 14, end: 21 },
        { planet: "VENUS", start: 21, end: 28 },
        { planet: "MARS", start: 28, end: 30 },
    ],
    7: [  // 天蝎座 ♏
        { planet: "MARS", start: 0, end: 7 },
        { planet: "VENUS", start: 7, end: 11 },
        { planet: "MERCURY", start: 11, end: 19 },
        { planet: "JUPITER", start: 19, end: 24 },
        { planet: "SATURN", start: 24, end: 30 },
    ],
    8: [  // 射手座 ♐
        { planet: "JUPITER", start: 0, end: 12 },
        { planet: "VENUS", start: 12, end: 17 },
        { planet: "MERCURY", start: 17, end: 21 },
        { planet: "SATURN", start: 21, end: 26 },
        { planet: "MARS", start: 26, end: 30 },
    ],
    9: [  // 摩羯座 ♑
        { planet: "MERCURY", start: 0, end: 7 },
        { planet: "JUPITER", start: 7, end: 14 },
        { planet: "VENUS", start: 14, end: 22 },
        { planet: "SATURN", start: 22, end: 26 },
        { planet: "MARS", start: 26, end: 30 },
    ],
    10: [ // 水瓶座 ♒
        { planet: "MERCURY", start: 0, end: 7 },
        { planet: "VENUS", start: 7, end: 13 },
        { planet: "JUPITER", start: 13, end: 20 },
        { planet: "MARS", start: 20, end: 25 },
        { planet: "SATURN", start: 25, end: 30 },
    ],
    11: [ // 双鱼座 ♓
        { planet: "VENUS", start: 0, end: 12 },
        { planet: "JUPITER", start: 12, end: 16 },
        { planet: "MERCURY", start: 16, end: 19 },
        { planet: "MARS", start: 19, end: 28 },
        { planet: "SATURN", start: 28, end: 30 },
    ],
};

// 面（Face）主星 - 迦勒底面（Chaldean Faces）
// 每个星座3个面，每面10度
// 顺序按迦勒底行星秩序：土星、木星、火星、太阳、金星、水星、月亮
// 白羊座第一面从火星开始，依次循环
const FACE_ORDER = ["MARS", "SUN", "VENUS", "MERCURY", "MOON", "SATURN", "JUPITER"];

// 生成每个星座的面主星
export function getFaceLord(signIndex, degree) {
    // 白羊座第1面=火星，第2面=太阳，第3面=金星
    // 金牛座第1面=水星，第2面=月亮，第3面=土星
    // ... 依次循环
    const faceIndex = Math.floor(degree / 10); // 0, 1, 2
    const startIdx = signIndex * 3 + faceIndex;
    const lordIdx = startIdx % 7;
    return FACE_ORDER[lordIdx];
}

// 喜乐宫（Joy Houses）- 每颗行星在特定宫位喜乐
// 古典占星喜乐宫：
// 水星 - 第1宫，月亮 - 第3宫，金星 - 第5宫，火星 - 第6宫，
// 太阳 - 第9宫，木星 - 第11宫，土星 - 第12宫
export const JOY_HOUSES = {
    SUN: 9,
    MOON: 3,
    MERCURY: 1,
    VENUS: 5,
    MARS: 6,
    JUPITER: 11,
    SATURN: 12,
};

// 行星周期年份
export const PLANET_PERIODS = {
    SUN: 19,
    MOON: 25,
    MERCURY: 20,
    VENUS: 8,
    MARS: 15,
    JUPITER: 12,
    SATURN: 30,
};

// 三分主星（古典占星）
// 火象：日生=太阳,木星,土星；夜生=木星,太阳,土星
// 土象：日生=金星,月亮,火星；夜生=月亮,金星,火星
// 风象：日生=土星,水星,木星；夜生=水星,土星,木星
// 水象：日生=金星,火星,月亮；夜生=火星,金星,月亮
export const TRIPLICITY_LORDS = {
    fire: {
        day: ["SUN", "JUPITER", "SATURN"],
        night: ["JUPITER", "SUN", "SATURN"],
    },
    earth: {
        day: ["VENUS", "MOON", "MARS"],
        night: ["MOON", "VENUS", "MARS"],
    },
    air: {
        day: ["SATURN", "MERCURY", "JUPITER"],
        night: ["MERCURY", "SATURN", "JUPITER"],
    },
    water: {
        day: ["VENUS", "MARS", "MOON"],
        night: ["MARS", "VENUS", "MOON"],
    },
};

// 恒星列表（用户提供，用 swe_fixstar 计算精确位置）
// sweName: 瑞士星历表中的恒星名（用于查询）
// en/zh: 显示名称
// 30颗重要恒星的 J2000.0 黄道坐标（黄经、黄纬，单位：度）
// J2000 黄经由校准数据（2026.10.11 黄道度数）反推岁差得到
// 校准数据来源：用户提供的 2026.10.11 恒星黄道位置
// 岁差速率：50.290966 角秒/年（IAU 1976）
// 黄纬保留近似值（合相主要看黄经差，黄纬影响可忽略）
export const FIXED_STARS = [
    { en: "Spica", zh: "角宿一", nature: "吉（木星/金星性质）", lon: 203.826, lat: -2.128, desc: "具有水星和金星性质的吉星，象征权力与专业领域的洞见。对科学家、作家、艺术家（画家、雕塑家、音乐家）格外幸运。被视为所有恒星中最重要、最幸运的一颗。" },
    { en: "Vega", zh: "织女一（织女星）", nature: "吉（金星/水星性质）", lon: 284.943, lat: 62.158, desc: "合上升则好运、幸福、易得馈赠，感情与婚姻顺遂，可通过遗产与遗赠获益。合 MC 则荣誉与成功，通过与女性打交道获得帮助，在金星性质的职业中取得成功。" },
    { en: "Fomalhaut", zh: "北落师门", nature: "吉（金星/水星性质）", lon: 333.859, lat: -32.302, desc: "波斯四大皇家之星之一，南方的守望者，象征冬至。赋予从上而来的巨大力量与智慧，与将我们从过去的惰性中解放、开启新时代有很大关系。伟大而持久的荣誉，不朽的名声。" },
    { en: "Deneb Adige", zh: "天津四", nature: "吉（金星/水星性质）", lon: 335.326, lat: 45.287, desc: "使人变得巧妙、善于接受任何学习或知识。直觉精炼，若遵循精神道路、注意精神向导，可被引导至许多神圣目的。知名、著名、足智多谋、非常博学、雄辩、有创意、有洞察力。" },
    { en: "Alphecca", zh: "贯索四（侯）", nature: "吉（金星/水星性质）", lon: 222.293, lat: 24.518, desc: "赋予荣誉、尊严以及诗意和艺术能力。形象是母鸡或戴王冠的人。给予人的贞洁、爱和善意。光荣，大祭司或女祭司，领导人的朋友，充满活力的身体，成名并受到许多人的喜爱。" },
    { en: "Regulus", zh: "轩辕十四", nature: "吉（木星/火星性质）", lon: 149.809, lat: 0.481, desc: "狮子的心，象征雄心、骄傲、热爱权力、宏大的视野。AC 合相带来军事荣誉，MC 合相带来高教会荣誉、军事偏好、商业繁荣。一生为众人所知，拥有自由权力，不施展恶意的毒药。" },
    { en: "Arcturus", zh: "大角", nature: "吉（木星性质）", lon: 204.226, lat: 31.560, desc: "通过航行带来财富、荣誉、决心和繁荣。传达美术、商业、好运的成功，但许多焦虑的时刻、高荣誉、高职位。湍流是可能的。" },
    { en: "Altair", zh: "河鼓二（牵牛星）", nature: "吉（火星/木星性质）", lon: 301.776, lat: -8.848, desc: "赋予大胆、自信、英勇、不屈不挠、雄心勃勃和自由的天性，巨大而突然但短暂的财富，以及指挥地位。辉煌的生活；强大和指挥的天性；名声，忙于许多活动，丰富的资源。" },
    { en: "Antares", zh: "心宿二", nature: "凶（火星/金星性质）", lon: 249.759, lat: -4.962, desc: "波斯四大皇家之星之一，蝎子的心。带来恶意、破坏性，同时也有慷慨、心胸宽广的特质，存在邪恶预示和死亡危险。传统上被认为是暴力死亡的重要指征，火灾、武器或机械可能造成危险。" },
    { en: "Sirius", zh: "天狼星", nature: "吉（木星/火星性质）", lon: 104.076, lat: -39.606, desc: "夜间最亮的星。雄心勃勃，喜欢行使权力，具有宏伟的前景，好的声誉与荣耀，信念的保卫者。有利于商业繁荣、荣誉、财富和名誉。受到上级和朋友的青睐。" },
    { en: "Rigel", zh: "参宿七", nature: "吉（木星/金星性质）", lon: 76.826, lat: -25.135, desc: "赋予荣光、名望、财富与顺遂。独立自主、行事果敢，凭借自身成就收获财富与显赫地位。年少顺遂兴旺，家底丰厚、家境富庶，运势昌隆，财源广进，坐拥至高且长久的名望与殊荣。" },
    { en: "Alnilam", zh: "参宿二", nature: "中（火星/木星性质）", lon: 83.459, lat: -14.248, desc: "所有受其星力影响出生的人都将获得世人的赞誉与殊荣。一生辉煌显赫；品性伟岸威严、气势磅礴；声名远扬，行事广博，家底丰厚，在各城各地声名卓著。" },
    { en: "Menkalinan", zh: "五车三", nature: "中（火星性质）", lon: 89.909, lat: 13.587, desc: "御夫座第二亮星。罗布森指出具有金星特质，会招致毁灭、耻辱，且常常带来横祸，源于过度沉溺于享乐。整体具备木星的星性特质，夹杂微弱的火星与金星性影响。" },
    { en: "Rukbat", zh: "天渊三", nature: "凶（土星/火星性质）", lon: 286.626, lat: -18.149, desc: "热衷权势、手握大权、具备统领之才、坐拥军功荣誉、获君王赏识、克敌制胜、心胸豁达且拥有广阔包容的眼界。有望收获崇高名望、丰厚财富与赫赫声名。" },
    { en: "Algol", zh: "大陵五", nature: "凶（土星/木星性质，最凶恒星之一）", lon: 56.159, lat: 22.468, desc: "恶魔之首，咽部颈部的危险，象征戈耳工三姐妹中美杜莎的头颅。上升合相：失明、眼疾、面部受伤、声名狼藉、刺伤、创口、牢狱之灾。最凶的恒星之一。" },
    { en: "Capella", zh: "五车二", nature: "吉（火星/木星性质）", lon: 81.859, lat: 22.428, desc: "带来荣誉、财富、名望、声誉、受人信赖的公职地位与显贵挚友，同时会让命主心思缜密、性格怯懦、好奇心强、极度渴求学识，尤其热衷于新奇事物。" },
    { en: "Zuben Eschemali", zh: "氐宿四", nature: "吉（金星/水星性质）", lon: 229.359, lat: -0.975, desc: "天之根。思维与才智格外敏锐，同时往往还蕴含极强的灵性特质；但若星体格局与相位凶煞凌厉，这份特质便会演变为精神失常。吉星高照，赐世间荣华与功成名就。" },
    { en: "Castor", zh: "北河二", nature: "凶（水星/火星性质）", lon: 110.226, lat: 10.218, desc: "象征与众不同、思维敏锐、法务领域有所成就、游历四方、喜爱骏马、一朝声名鹊起且荣加身，但往往随之而来的是家财散尽、身败名裂、病痛缠身。上升合：失明、眼疾、面部受伤、声名狼藉、刺伤、牢狱之灾。" },
    { en: "Pollux", zh: "北河三", nature: "凶（火星性质）", lon: 113.209, lat: 6.849, desc: "象征狡黠诡诈、英气勇武，兼具胆大妄为的特质，又交织着残忍与鲁莽。财富、权力、勇气、慷慨、聪慧机敏、身居高位、战功卓著，同时易遭遇割伤、创伤、意外事故、面部损伤。" },
    { en: "Aldebaran", zh: "毕宿五", nature: "凶（火星性质）", lon: 69.793, lat: -5.475, desc: "古波斯四大皇家星之一，波斯战神，象征财富与荣耀。年少得志，坐拥故土繁华。声名显赫、德望卓著、荣光加身，可执掌城邑与一方疆域。因女性助力而财运亨通、富贵盈门。" },
    { en: "Bellatrix", zh: "参宿五", nature: "凶（火星性质）", lon: 80.943, lat: -17.693, desc: "主享有极高的文职或武职荣誉，但易突遭名誉折损；亦能带来声名、财富、显贵挚友，同时易遭遇意外灾厄，有失明与破败之虞。赋予对权力的热衷、战胜对手的执念、强大的威望、野心勃勃。" },
    { en: "Procyon", zh: "南河三", nature: "凶（水星/火星性质）", lon: 115.776, lat: -16.072, desc: "象征行动力、暴戾之气、突发且凶狠的恶意、凭一己之力骤然获擢升、位高权重却终遭祸殃，还有被犬只咬伤与罹患狂犬病的风险。性情乖戾、傲慢无礼、浮躁轻率。" },
    { en: "Betelgeuse", zh: "参宿四", nature: "吉（火星/木星/水星性质）", lon: 88.743, lat: 7.520, desc: "目前已知体积最大的恒星之一。象征勇武荣誉、仕途晋升与财富福报。上升合：天资出众的运动员，天生具备超凡的身体敏捷度与奔跑速度。情绪起伏多变，一生可获荣誉加身、名号傍身。" },
    { en: "Alpheratz", zh: "壁宿二", nature: "吉（金星性质）", lon: 14.309, lat: 28.352, desc: "被锁链束缚女子之首。赋予人独立、自由、爱情、财富、荣誉以及聪慧敏锐的心智。开朗性情、乐观心态、多才多艺、出色判断力、热爱生活、向往安逸舒适，同时也会使人产生慵懒懈怠的倾向。" },
    { en: "Sheat", zh: "室宿二", nature: "凶（火星/水星性质）", lon: 359.376, lat: 14.253, desc: "马的肩膀。会招致极大的厄运、凶杀、自杀以及溺水身亡。命主性格倔强、好争好斗。亲友聚散无常，运势多有不顺，性情多变、事业心极强，且易卷入暴力事端。" },
    { en: "Toliman", zh: "南门二（半人马座α）", nature: "吉（金星/木星性质）", lon: 239.476, lat: -42.360, desc: "赋予命主宿命论的心态，带来尊贵的地位，同时赐予命主优雅涵养的潜质以及愿意伸出援手相助的友人。" },
    { en: "Acamar", zh: "天园六", nature: "吉（木星/金星性质）", lon: 23.276, lat: -54.598, desc: "河的尽头，象征在公职领域或宗教神职领域能够获得成就与顺遂。品性纯粹、性情随和、热爱音乐、交友广泛、虔诚笃信、豁达慷慨、理智通透、乐于倾听。" },
    { en: "Denebola", zh: "五帝座一", nature: "吉（金星/土星性质）", lon: 171.609, lat: 13.781, desc: "狮子座尾部的蓝星。象征决断仓促、意志消沉、心生悔憾、身败名裂、天灾横祸、乐极生悲。受其降生之人，性情高贵果敢、自制力强、慷慨大方。" },
    { en: "Zosma", zh: "西上相", nature: "中（金星/水星性质）", lon: 161.309, lat: 19.780, desc: "象征政务清明高效、宰相贤能干练。上升合：运势顺遂、生活喜乐、易得馈赠，感情与婚姻运势佳，可通过遗赠及遗产获得收益。属性同金星。" },
    { en: "Alphard", zh: "星宿一", nature: "凶（土星/金星性质）", lon: 147.276, lat: -8.148, desc: "蛇之心，大幅加重与毒物相关的凶险事宜：败血症、投毒谋杀、蓄意下毒加害、煤气中毒、滥用药物、毒蛇咬伤、毒虫蜇咬、狂犬咬伤等。沉迷女色，行事放纵无度。" },
];

// 岁差常数：每儒略年的黄经岁差（IAU 1976）
// 50.290966 角秒/年 = 0.01396971 度/年
// 精度对于 1.5° 容许度的恒星合相判断完全足够（误差 < 1角分/百年）
const PRECESSION_PER_YEAR = 50.290966 / 3600; // 度/年
const J2000_JD = 2451545.0; // J2000.0 对应的儒略日
const J2000_YEAR = 2000.0;

// 相位类型
export const ASPECT_TYPES = [
    { angle: 0, name: "合相", symbol: "☌", orb: 12, nature: "neutral", class: "aspect-conjunction" },
    { angle: 60, name: "六合", symbol: "⚹", orb: 6, nature: "harmonious", class: "aspect-sextile" },
    { angle: 90, name: "刑相", symbol: "□", orb: 8, nature: "hard", class: "aspect-square" },
    { angle: 120, name: "拱相", symbol: "△", orb: 8, nature: "harmonious", class: "aspect-trine" },
    { angle: 180, name: "冲相", symbol: "☍", orb: 12, nature: "hard", class: "aspect-opposition" },
];

// 古典相位容许度（按行星）
// 日月：12°，木土：9°，金火：8°，水星：7°
// 实际计算取两颗行星容许度的平均值
export const PLANET_ORBS = {
    SUN: 12,
    MOON: 12,
    MERCURY: 7,
    VENUS: 8,
    MARS: 8,
    JUPITER: 9,
    SATURN: 9,
    URANUS: 6,
    NEPTUNE: 6,
    PLUTO: 5,
};

// ===== 工具函数 =====

// 获取黄经对应的星座索引和度数
export function getSignAndDegree(longitude) {
    const normalized = ((longitude % 360) + 360) % 360;
    const signIndex = Math.floor(normalized / 30);
    const degree = normalized % 30;
    return { signIndex, degree, normalizedLongitude: normalized };
}

// 格式化度数显示（到秒）
export function formatDegree(degree) {
    const d = Math.floor(degree);
    const m = Math.floor((degree - d) * 60);
    const s = Math.floor(((degree - d) * 60 - m) * 60);
    return `${d}°${m.toString().padStart(2, "0")}'${s.toString().padStart(2, "0")}"`;
}

// 格式化度数显示（到分，用于表格等展示用）
export function formatDegreeMinute(degree) {
    const d = Math.floor(degree);
    const m = Math.floor((degree - d) * 60);
    return `${d}°${m.toString().padStart(2, "0")}'`;
}

// 判断日生/夜生
// 日生：太阳在地平线以上（AC-DC 轴的上半球，经过天顶一侧）
// 夜生：太阳在地平线以下（AC-DC 轴的下半球，经过天底一侧）
// 黄道经度逆时针递增，从上升顺时针转到下降（经过天顶）是上半球
// 即：太阳与上升点的逆时针角度差 > 180° 时，太阳在上半球
export function isDayChart(sunLongitude, ascLongitude) {
    // 计算从上升逆时针到太阳的角度差
    let diff = sunLongitude - ascLongitude;
    diff = ((diff % 360) + 360) % 360;
    // 逆时针差 > 180° = 顺时针差 < 180° = 上半球 = 日生
    return diff > 180;
}

// 计算两颗行星之间的角距
export function getAspectDifference(lon1, lon2) {
    let diff = Math.abs(lon1 - lon2);
    diff = Math.min(diff, 360 - diff);
    return diff;
}

// 检查两颗行星是否形成相位
export function checkAspect(lon1, lon2, planet1Key, planet2Key) {
    const diff = getAspectDifference(lon1, lon2);
    const planet1Orb = PLANET_ORBS[planet1Key] || 6;
    const planet2Orb = PLANET_ORBS[planet2Key] || 6;
    const avgOrb = (planet1Orb + planet2Orb) / 2;

    for (const aspect of ASPECT_TYPES) {
        // 合相的容许度用平均值
        const orb = aspect.angle === 0 || aspect.angle === 180
            ? avgOrb
            : Math.min(avgOrb * 0.7, aspect.orb); // 和谐/硬相位容许度略小

        if (Math.abs(diff - aspect.angle) <= orb) {
            return {
                ...aspect,
                exactOrb: Math.abs(diff - aspect.angle),
                diff,
            };
        }
    }
    return null;
}

// 获取行星的尊贵状态
export function getDignityStatus(planetKey, signIndex, degree, isDayChart) {
    const planetId = PLANET_IDS[planetKey];
    const status = {
        domicile: false,   // 庙
        exaltation: false, // 旺
        triplicity: false, // 三分
        term: false,       // 界
        face: false,       // 面
        detriment: false,  // 落陷
        fall: false,       // 失意（落）
        peregrine: false,  // 外来
    };

    // 庙（domicile）：行星是该星座的守护星
    if (HOUSE_LORDS[signIndex] === planetId) {
        status.domicile = true;
    }

    // 落陷（detriment）：行星在其守护星座的对宫
    const opposingSign = (signIndex + 6) % 12;
    if (HOUSE_LORDS[opposingSign] === planetId) {
        status.detriment = true;
    }

    // 旺（exaltation）
    if (EXALTATION_PLANETS[signIndex] === planetId) {
        status.exaltation = true;
    }

    // 失意（fall）：行星在其擢升星座的对宫
    if (EXALTATION_PLANETS[opposingSign] === planetId) {
        status.fall = true;
    }

    // 三分主星（triplicity）
    const sign = ZODIAC_SIGNS[signIndex];
    const element = sign.element;
    const triplicityKey = isDayChart ? "day" : "night";
    const lords = TRIPLICITY_LORDS[element][triplicityKey];
    if (lords.includes(planetKey)) {
        status.triplicity = true;
    }

    // 界（Term）
    const terms = TERMS_EGYPTIAN[signIndex];
    for (const term of terms) {
        if (degree >= term.start && degree < term.end && term.planet === planetKey) {
            status.term = true;
            break;
        }
    }

    // 面（Face）
    const faceLord = getFaceLord(signIndex, degree);
    if (faceLord === planetKey) {
        status.face = true;
    }

    // 外来（Peregrine）：没有任何尊贵（庙/旺/三分/界/面）
    // 注意：落陷和失意是负面状态，不影响是否外来的判断
    // 外来 = 没有任何正面尊贵
    const hasEssentialDignity = status.domicile || status.exaltation || status.triplicity || status.term || status.face;
    status.peregrine = !hasEssentialDignity;

    return status;
}

// 获取尊贵状态的整体评估
export function getDignitySummary(status) {
    let score = 0;
    let descriptions = [];

    if (status.domicile) {
        score += 5;
        descriptions.push("入庙");
    }
    if (status.exaltation) {
        score += 4;
        descriptions.push("擢升");
    }
    if (status.triplicity) {
        score += 3;
        descriptions.push("三分主");
    }
    if (status.term) {
        score += 2;
        descriptions.push("界");
    }
    if (status.face) {
        score += 1;
        descriptions.push("面");
    }
    if (status.detriment) {
        score -= 5;
        descriptions.push("落陷");
    }
    if (status.fall) {
        score -= 4;
        descriptions.push("失意");
    }
    if (status.peregrine) {
        descriptions.push("外来");
    }

    let level = "中";
    let levelClass = "badge-neutral";
    if (score >= 5) {
        level = "强";
        levelClass = "badge-good";
    } else if (score >= 3) {
        level = "较强";
        levelClass = "badge-good";
    } else if (score <= -5) {
        level = "弱";
        levelClass = "badge-bad";
    } else if (score <= -3) {
        level = "较弱";
        levelClass = "badge-bad";
    }

    return {
        score,
        descriptions,
        level,
        levelClass,
        summaryText: descriptions.length > 0 ? descriptions.join("、") : "无特殊尊贵",
    };
}

// ===== 核心计算函数 =====

// 计算所有行星位置
export async function calculatePlanets(jdUt) {
    const s = await initSwe();
    const planets = {};
    const flags = 0; // 热带黄道，默认

    const planetKeys = ["SUN", "MOON", "MERCURY", "VENUS", "MARS", "JUPITER", "SATURN", "URANUS", "NEPTUNE", "PLUTO"];

    for (const key of planetKeys) {
        const planetId = PLANET_IDS[key];
        const result = s.swe_calc_ut(jdUt, planetId, flags);
        const { signIndex, degree, normalizedLongitude } = getSignAndDegree(result[0]);

        // 计算逆行（速度为负即为逆行）
        const isRetrograde = result[3] < 0;

        planets[key] = {
            key,
            name: PLANET_NAMES[key],
            longitude: normalizedLongitude,
            latitude: result[1],
            distance: result[2],
            longitudeSpeed: result[3],
            signIndex,
            degree,
            isRetrograde,
        };
    }

    // 计算北交（真北交 True Node）
    const trueNodeResult = s.swe_calc_ut(jdUt, PLANET_IDS.TRUE_NODE, flags);
    const { signIndex: nnSign, degree: nnDeg, normalizedLongitude: nnLon } = getSignAndDegree(trueNodeResult[0]);
    planets.NORTH_NODE = {
        key: "NORTH_NODE",
        name: "北交",
        longitude: nnLon,
        latitude: trueNodeResult[1],
        distance: trueNodeResult[2],
        longitudeSpeed: trueNodeResult[3],
        signIndex: nnSign,
        degree: nnDeg,
        isRetrograde: trueNodeResult[3] < 0,
    };
    // 南交 = 北交 + 180°
    const snLon = (nnLon + 180) % 360;
    const { signIndex: snSign, degree: snDeg, normalizedLongitude: snLonNorm } = getSignAndDegree(snLon);
    planets.SOUTH_NODE = {
        key: "SOUTH_NODE",
        name: "南交",
        longitude: snLonNorm,
        latitude: -trueNodeResult[1],
        distance: trueNodeResult[2],
        longitudeSpeed: -trueNodeResult[3],
        signIndex: snSign,
        degree: snDeg,
        isRetrograde: trueNodeResult[3] >= 0,
    };

    return planets;
}

// 计算宫位（整宫制）
export async function calculateHouses(jdUt, lat, lon) {
    const s = await initSwe();
    // 使用整宫制 'W' = Whole Sign
    const houses = s.swe_houses(jdUt, lat, lon, "W");

    // houses.cusps 是 12 个宫头
    // houses.ascmc 是 [ASC, MC, ARMC, Vertex, equasc, coasc1, coasc2, polasc]

    const { signIndex: ascSignIndex, degree: ascDegree } = getSignAndDegree(houses.ascmc[0]);
    const { signIndex: mcSignIndex, degree: mcDegree } = getSignAndDegree(houses.ascmc[1]);

    return {
        cusps: houses.cusps,
        ascmc: houses.ascmc,
        ascendant: {
            longitude: houses.ascmc[0],
            signIndex: ascSignIndex,
            degree: ascDegree,
        },
        midheaven: {
            longitude: houses.ascmc[1],
            signIndex: mcSignIndex,
            degree: mcDegree,
        },
        descendant: {
            longitude: (houses.ascmc[0] + 180) % 360,
            signIndex: (ascSignIndex + 6) % 12,
            degree: ascDegree,
        },
        imumCoeli: {
            longitude: (houses.ascmc[1] + 180) % 360,
            signIndex: (mcSignIndex + 6) % 12,
            degree: mcDegree,
        },
    };
}

// 计算福点 (Part of Fortune)
// 古典公式：
// 日生盘：福点 = 上升 + 月亮 - 太阳
// 夜生盘：福点 = 上升 + 太阳 - 月亮
export function calculatePartOfFortune(ascLongitude, sunLongitude, moonLongitude, isDay) {
    let pofLongitude;
    if (isDay) {
        pofLongitude = ascLongitude + moonLongitude - sunLongitude;
    } else {
        pofLongitude = ascLongitude + sunLongitude - moonLongitude;
    }
    pofLongitude = ((pofLongitude % 360) + 360) % 360;
    const { signIndex, degree } = getSignAndDegree(pofLongitude);
    return {
        longitude: pofLongitude,
        signIndex,
        degree,
    };
}

// 精神点与福点使用相反的昼夜公式
export function calculateLotOfSpirit(ascLongitude, sunLongitude, moonLongitude, isDay) {
    return calculatePartOfFortune(ascLongitude, sunLongitude, moonLongitude, !isDay);
}

// 福点衍生宫：以福点所在星座为第一宫，财富与显赫分别记录
export function calculateFortuneIndicators(pof, planets, houses, isDay) {
    const spirit = calculateLotOfSpirit(houses.ascendant.longitude, planets.SUN.longitude, planets.MOON.longitude, isDay);
    spirit.house = getHouseNumber(spirit.longitude, houses.ascendant.signIndex);
    const lordKey = sign => Object.keys(PLANET_IDS).find(k => PLANET_IDS[k] === HOUSE_LORDS[sign]);
    spirit.lordKey = lordKey(spirit.signIndex);
    spirit.lordName = PLANET_NAMES[spirit.lordKey];
    const pfLordKey = lordKey(pof.signIndex);
    const pfLord = planets[pfLordKey];
    const spiritLord = planets[spirit.lordKey];
    const tenthSign = (pof.signIndex + 9) % 12;
    const acquisitionSign = (pof.signIndex + 10) % 12;
    const acquisitionLordKey = lordKey(acquisitionSign);
    const acquisitionLord = planets[acquisitionLordKey];
    const beneficKey = isDay ? "JUPITER" : "VENUS";
    const lordInAcquisition = pfLord.signIndex === acquisitionSign;
    const sectBeneficInAcquisition = planets[beneficKey].signIndex === acquisitionSign;
    // 必须是不同主星，且双方都进入对方守护的星座；单向接纳与同宫不算
    const mutualReception = pfLordKey !== acquisitionLordKey
        && HOUSE_LORDS[pfLord.signIndex] === PLANET_IDS[acquisitionLordKey]
        && HOUSE_LORDS[acquisitionLord.signIndex] === PLANET_IDS[pfLordKey];
    const layered = lordInAcquisition && pfLordKey === beneficKey
        && (pfLord.dignity.domicile || pfLord.dignity.exaltation);
    const spiritInAcquisition = spiritLord.signIndex === acquisitionSign;
    const wealth = [];
    const prominence = [];
    const sources = [];
    const add = (list, id, text, kind = "核心") => list.push({ id, text, kind });
    if (lordInAcquisition) add(wealth, "fortune-lord-acquisition", `福点主星${PLANET_NAMES[pfLordKey]}落获取宫，物质机缘连接财富取得。`);
    if (sectBeneficInAcquisition) add(wealth, "sect-benefic-acquisition", `${isDay ? "日生木星" : "夜生金星"}落获取宫，是较强的财富取得与积累征象。`);
    if (mutualReception) add(wealth, "acquisition-reception", `福点主星${PLANET_NAMES[pfLordKey]}与获取宫主星${PLANET_NAMES[acquisitionLordKey]}交换守护星座，形成大财潜力组合。`, "强化组合");
    if (layered) add(wealth, "layered-acquisition", "福点主星在获取宫，同时为合昼夜性的吉星且入庙或擢升，财富通道获得多重支持。", "案例强化");
    if (spiritInAcquisition) add(wealth, "spirit-lord-acquisition", `精神点主星${spirit.lordName}落获取宫，行动与志业连接资源获取。`, "辅助");
    if (spiritLord.signIndex === pof.signIndex) add(prominence, "spirit-lord-fortune", `精神点主星${spirit.lordName}落福点星座，行动与机缘连接。`);
    if (spiritLord.signIndex === tenthSign) add(prominence, "spirit-lord-tenth", `精神点主星${spirit.lordName}落福点第十宫，行动通向成就与社会地位。`);
    if (pfLord.signIndex === tenthSign) add(prominence, "fortune-lord-tenth", `福点主星${PLANET_NAMES[pfLordKey]}落福点第十宫，机缘连接突出的社会位置。`);
    if (spirit.signIndex === tenthSign) add(prominence, "spirit-tenth", "精神点本身落福点第十宫，作为志业与显赫的辅助指标。", "辅助");
    if (pfLord.signIndex === spirit.signIndex && spiritLord.signIndex === pof.signIndex) add(prominence, "cross-link", "福点主星进入精神点星座，精神点主星进入福点星座，形成双向交叉连接；不直接等同行星互容。", "强化组合");
    if (pof.house === 4) add(sources, "family", "福点在本命四宫：家庭、父母或出身可能提供机缘，不能据此判断家境富裕。", "来源");
    const secondSign = (houses.ascendant.signIndex + 1) % 12;
    const eighthSign = (houses.ascendant.signIndex + 7) % 12;
    const secondLordKey = lordKey(secondSign);
    const eighthLordKey = lordKey(eighthSign);
    if ([2, 8].includes(pof.house) && secondLordKey !== eighthLordKey
        && HOUSE_LORDS[planets[secondLordKey].signIndex] === PLANET_IDS[eighthLordKey]
        && HOUSE_LORDS[planets[eighthLordKey].signIndex] === PLANET_IDS[secondLordKey]) {
        add(sources, "asset-transfer", "福点连接本命二、八宫，二宫主与八宫主交换守护星座：个人财务与遗产、资产转移主题相连，不代表一定继承巨额资产。", "来源");
    }
    const jupiterSupport = getWholeSignAspects(pof.signIndex, planets.JUPITER.signIndex).some(a => a.type !== "aversion");
    if (pof.house === 8 && jupiterSupport) add(sources, "external-funding", "福点在本命八宫且木星有整宫相位支持：可能连接资助、捐赠或外部资金，不等于个人资产。", "来源");
    const pointLords = [...new Set([pfLordKey, spirit.lordKey])];
    for (const key of pointLords) {
        const planet = planets[key];
        if (planet.house === 11) add(sources, `friends-${key}`, `点的主星${PLANET_NAMES[key]}落本命十一宫：朋友、团体或合作可能提供助力。`, "来源");
        const orb = getAspectDifference(planet.longitude, houses.ascendant.longitude);
        if (orb <= 3) add(sources, `asc-${key}`, `点的主星${PLANET_NAMES[key]}合上升（${orb.toFixed(2)}°）：个人能力、身份或身体条件可能成为资源。`, "来源");
    }
    // 草案未给定分值，采用保守增量；叠加组合取较强值，避免同一结构重复计分
    // 福点主在获取宫的基础力量已由旧规则计入，本处仅计新增支持
    const acquisitionBonus = layered ? 3 : sectBeneficInAcquisition ? 2 : 0;
    const wealthBonus = Math.min(4, acquisitionBonus + (mutualReception ? 3 : 0) + (spiritInAcquisition && spirit.lordKey !== pfLordKey ? 0.5 : 0));
    return {
        spirit, tenthSign, acquisitionSign, acquisitionLordKey,
        wealth, prominence, sources, wealthBonus,
        lordStates: pointLords.map(key => ({ name: PLANET_NAMES[key], house: planets[key].house,
            dignity: planets[key].dignitySummary.summaryText, retrograde: planets[key].isRetrograde })),
    };
}

// 计算行星落在哪一宫（整宫制）
export function getHouseNumber(longitude, ascSignIndex) {
    const { signIndex } = getSignAndDegree(longitude);
    // 整宫制：上升星座是第一宫，依次类推
    let houseNum = signIndex - ascSignIndex + 1;
    if (houseNum <= 0) houseNum += 12;
    return houseNum;
}

// 判断宫位类型（角宫/续宫/果宫）
export function getHouseType(houseNum) {
    if ([1, 4, 7, 10].includes(houseNum)) return { type: "角宫", strength: "强", strengthLevel: 3 };
    if ([2, 5, 8, 11].includes(houseNum)) return { type: "续宫", strength: "中", strengthLevel: 2 };
    return { type: "果宫", strength: "弱", strengthLevel: 1 };
}

// 计算所有相位
export function calculateAllAspects(planets) {
    const aspects = [];
    const planetKeys = Object.keys(planets);

    for (let i = 0; i < planetKeys.length; i++) {
        for (let j = i + 1; j < planetKeys.length; j++) {
            const p1Key = planetKeys[i];
            const p2Key = planetKeys[j];
            const aspect = checkAspect(
                planets[p1Key].longitude,
                planets[p2Key].longitude,
                p1Key,
                p2Key
            );
            if (aspect) {
                aspects.push({
                    planet1: p1Key,
                    planet1Name: PLANET_NAMES[p1Key],
                    planet2: p2Key,
                    planet2Name: PLANET_NAMES[p2Key],
                    ...aspect,
                });
            }
        }
    }

    // 按容许度从小到大排序
    aspects.sort((a, b) => a.exactOrb - b.exactOrb);
    return aspects;
}

// 计算宫主星表
export function calculateHouseLords(planets, ascSignIndex) {
    const houseLords = [];
    for (let house = 1; house <= 12; house++) {
        const signIdx = (ascSignIndex + house - 1) % 12;
        const lordPlanetId = HOUSE_LORDS[signIdx];
        const lordKey = Object.keys(PLANET_IDS).find(k => PLANET_IDS[k] === lordPlanetId);
        const lordPlanet = planets[lordKey];
        const lordHouse = getHouseNumber(lordPlanet.longitude, ascSignIndex);

        houseLords.push({
            house,
            signName: ZODIAC_SIGNS[signIdx].name,
            signIndex: signIdx,
            lordKey,
            lordName: PLANET_NAMES[lordKey],
            lordHouse,
            lordPlanet,
        });
    }
    return houseLords;
}

// 计算恒星在指定时刻的黄经（J2000 坐标 + 岁差）
// 数据已用 2026.10.11 校准值验证，精度优于 1 角分
function getStarLongitudeAtDate(star, jdUt) {
    // 计算 J2000 起的年数
    const yearsSinceJ2000 = (jdUt - J2000_JD) / 365.25;
    // 岁差：恒星黄经每年增加约 50.29 角秒
    const precession = PRECESSION_PER_YEAR * yearsSinceJ2000;
    let lon = star.lon + precession;
    lon = ((lon % 360) + 360) % 360;
    return lon;
}

// 计算恒星位置并检查合相
// 使用校准后的 J2000 黄经 + 岁差计算，精度与专业占星软件一致
export async function calculateFixedStars(jdUt, points, orb = 1.5) {
    const results = [];

    for (const star of FIXED_STARS) {
        const starLongitude = getStarLongitudeAtDate(star, jdUt);
        const { signIndex, degree } = getSignAndDegree(starLongitude);

        // 检查每个点与这颗恒星的合相
        for (const point of points) {
            const diff = getAspectDifference(point.longitude, starLongitude);
            if (diff <= orb) {
                results.push({
                    starNameEn: star.en,
                    starNameZh: star.zh,
                    starNature: star.nature,
                    starDesc: star.desc,
                    starLongitude,
                    starSignIndex: signIndex,
                    starDegree: degree,
                    pointName: point.name,
                    pointKey: point.key,
                    pointLongitude: point.longitude,
                    orb: diff,
                    applying: null, // 恒星不动，没有顺逆之分
                });
            }
        }
    }

    // 按容许度从小到大排序
    results.sort((a, b) => a.orb - b.orb);
    return results;
}

// ===== 普拉西德制宫位计算 =====
// 用于资产点等需要 Placidus 宫位的计算
export async function calculatePlacidusHouses(jdUt, lat, lon) {
    const s = await initSwe();
    const houses = s.swe_houses(jdUt, lat, lon, "P"); // "P" = Placidus
    // 瑞士星历表约定：cusps[1..12] 对应第 1..12 宫头（1-indexed），cusps[0] 未使用
    // houses.ascmc = [ASC, MC, ARMC, Vertex, equasc, coasc1, coasc2, polasc]

    const houseCusps = [];
    for (let i = 1; i <= 12; i++) {
        const lon = houses.cusps[i];
        const { signIndex, degree } = getSignAndDegree(lon);
        houseCusps.push({
            house: i,
            longitude: lon,
            signIndex,
            degree,
        });
    }

    const ascLon = houses.cusps[1]; // 一宫头 = 上升
    const mcLon = houses.cusps[10]; // 十宫头 = 天顶
    const { signIndex: ascSignIndex, degree: ascDegree } = getSignAndDegree(ascLon);
    const { signIndex: mcSignIndex, degree: mcDegree } = getSignAndDegree(mcLon);

    return {
        cusps: houseCusps, // 数组索引 0..11 对应第 1..12 宫
        ascmc: houses.ascmc,
        ascendant: {
            longitude: ascLon,
            signIndex: ascSignIndex,
            degree: ascDegree,
        },
        midheaven: {
            longitude: mcLon,
            signIndex: mcSignIndex,
            degree: mcDegree,
        },
        descendant: {
            longitude: houses.cusps[7], // 七宫头 = 下降
            ...getSignAndDegree(houses.cusps[7]),
        },
        imumCoeli: {
            longitude: houses.cusps[4], // 四宫头 = 天底
            ...getSignAndDegree(houses.cusps[4]),
        },
    };
}

// ===== 资产点计算 (Lot of Assets) =====
// 公式：资产点 = 上升 + 二宫头 - 二宫主
// 日生/夜生公式相同
// 注意：需要用 Placidus 制的二宫头和二宫主
export function calculateLotOfAssets(
    ascLongitude, // 上升黄经（整宫制或Placidus均可，这里用Placidus的上升）
    secondHouseCuspLongitude, // 二宫头黄经（Placidus）
    secondLordLongitude // 二宫主星黄经
) {
    let lon = ascLongitude + secondHouseCuspLongitude - secondLordLongitude;
    lon = ((lon % 360) + 360) % 360;
    const { signIndex, degree } = getSignAndDegree(lon);
    return {
        longitude: lon,
        signIndex,
        degree,
    };
}

// ===== 星座相位（Whole Sign Aspect）判断 =====
// 古典占星中，只要行星所在星座与目标点所在星座形成特定关系，就算有相位
// 不要求具体度数容许度
// 返回相位类型数组（可能有多个，如同时有主相位和特殊相位）
export function getWholeSignAspects(signIndexA, signIndexB) {
    const diff = Math.abs(signIndexA - signIndexB);
    const minDiff = Math.min(diff, 12 - diff);

    const aspects = [];
    if (minDiff === 0) {
        aspects.push({ type: "conjunction", name: "合相（同座）", symbol: "☌", signDiff: 0 });
    }
    if (minDiff === 6) {
        aspects.push({ type: "opposition", name: "冲相（对座）", symbol: "☍", signDiff: 6 });
    }
    if (minDiff === 3) {
        aspects.push({ type: "square", name: "刑相（刑座）", symbol: "□", signDiff: 3 });
    }
    if (minDiff === 4) {
        aspects.push({ type: "trine", name: "拱相（拱座）", symbol: "△", signDiff: 4 });
    }
    if (minDiff === 2) {
        aspects.push({ type: "sextile", name: "六合（六合座）", symbol: "⚹", signDiff: 2 });
    }
    // 不合意的星座关系（aversion）：1, 5, 7(=5), 11(=1)
    if (minDiff === 1 || minDiff === 5) {
        aspects.push({ type: "aversion", name: "不合意", symbol: "—", signDiff: minDiff });
    }

    return aspects;
}

// 计算三分主星状态
// includeSignPeriod: 是否包含星座年限（仅发光体的三分主星需要）
// latitude: 出生地纬度（用于查询星座年限）
export function calculateTriplicityLords(signIndex, isDay, planets, ascSignIndex, includeSignPeriod = false, latitude = 0) {
    const element = ZODIAC_SIGNS[signIndex].element;
    const timeOfDay = isDay ? "day" : "night";
    const lordKeys = TRIPLICITY_LORDS[element][timeOfDay];

    return lordKeys.map((key, idx) => {
        const planet = planets[key];
        const house = getHouseNumber(planet.longitude, ascSignIndex);
        const dignity = getDignityStatus(key, planet.signIndex, planet.degree, isDay);
        const dignitySummary = getDignitySummary(dignity);
        const periodYears = PLANET_PERIODS[key] || null;

        const result = {
            order: idx + 1,
            orderName: idx === 0 ? "第一三分主" : idx === 1 ? "第二三分主" : "第三三分主",
            planetKey: key,
            planetName: PLANET_NAMES[key],
            planet,
            house,
            dignity,
            dignitySummary,
            periodYears,
        };

        // 星座年限（仅在需要时计算，如发光体的三分主星）
        if (includeSignPeriod) {
            result.signPeriod = getSignPeriod(latitude, planet.signIndex);
            result.signPeriodRounded = getSignPeriodRounded(latitude, planet.signIndex);
            result.signName = ZODIAC_SIGNS[planet.signIndex].name;
        }

        return result;
    });
}

// ===== 围攻（Besiegement）计算 =====
// 围攻技法：日月围攻 或 金木围攻
// 两种类型：光线夹（相位围攻）和身体夹（度数围攻）
// 返回所有找到的围攻情况

// 检查是否为光线夹：两颗围攻星都与目标星形成7度以内的托勒密相位 + 星座相位
// 且被夹的目标星不与其他任何行星有7度以内相位（来夹的星有其他相位没关系）
function checkRayBesiegement(targetLon, targetSignIndex, targetKey, starAKey, starBKey, starALon, starBLon, allPlanets, besiegementName) {
    const BESIEGEMENT_ORB = 7; // 7度容許度

    // 检查两颗围攻星是否都与目标有7度以内的托勒密相位
    const aspectA = findPtolemaicAspectWithinOrb(starALon, targetLon, starAKey, targetKey, BESIEGEMENT_ORB);
    const aspectB = findPtolemaicAspectWithinOrb(starBLon, targetLon, starBKey, targetKey, BESIEGEMENT_ORB);

    if (!aspectA || !aspectB) return null;

    // 检查星座相位（两颗围攻星都要能"看到"目标星）
    const signAspectA = getWholeSignAspects(
        Math.floor(starALon / 30) % 12,
        targetSignIndex
    );
    const signAspectB = getWholeSignAspects(
        Math.floor(starBLon / 30) % 12,
        targetSignIndex
    );

    const hasSignAspectA = signAspectA.some(a => a.type !== "aversion");
    const hasSignAspectB = signAspectB.some(a => a.type !== "aversion");

    if (!hasSignAspectA || !hasSignAspectB) return null;

    // 检查被夹的目标星是否与其他行星有7度以内的托勒密相位
    // （来夹的两颗星有其他相位没关系，关键是被夹的星要"纯粹"）
    // 古典占星中，只用传统七行星（日月水金火木土）判断是否有干扰，三王星/虚点不算
    const INTERFERING_BODIES = ["SUN", "MOON", "MERCURY", "VENUS", "MARS", "JUPITER", "SATURN"];
    const otherPlanetKeys = INTERFERING_BODIES.filter(k =>
        k !== targetKey && k !== starAKey && k !== starBKey && allPlanets[k]
    );

    for (const otherKey of otherPlanetKeys) {
        const otherLon = allPlanets[otherKey].longitude;
        const aspectOther = findPtolemaicAspectWithinOrb(targetLon, otherLon, targetKey, otherKey, BESIEGEMENT_ORB);
        if (aspectOther) {
            // 被夹的星还与其他星体有相位，不是纯粹地被两星围攻
            return null;
        }
    }

    return {
        type: "ray",
        typeName: "光线夹",
        besiegementName, // "日月围攻" 或 "金木围攻"
        starA: { key: starAKey, name: PLANET_NAMES[starAKey], aspect: aspectA.name, signAspect: hasSignAspectA },
        starB: { key: starBKey, name: PLANET_NAMES[starBKey], aspect: aspectB.name, signAspect: hasSignAspectB },
    };
}

// 检查是否为身体夹：两颗星在目标星两侧（黄经上），中间不夹杂其他星体
// 3颗星最多分布在连续2个星座里
function checkBodyBesiegement(targetLon, targetKey, starAKey, starBKey, starALon, starBLon, allPlanets, besiegementName) {
    // 确定三颗星的相对位置
    // 把目标星放在中间，两颗围攻星分别在前后
    // 计算每颗星相对目标星的距离（顺时针方向为正）
    const distA = ((starALon - targetLon + 360) % 360);
    const distB = ((starBLon - targetLon + 360) % 360);

    // 判断哪颗在目标"前面"（较小的顺时针距离），哪颗在"后面"
    // 前面：顺时针方向距离较小的那颗（从目标星出发，先遇到的）
    // 后面：逆时针方向距离较小的那颗
    let forwardLon, backwardLon, forwardKey, backwardKey;
    if (distA > 0 && distA < 180 && distB > 180 && distB < 360) {
        // A在顺行方向前半段，B在逆行方向前半段
        forwardLon = starALon; forwardKey = starAKey;
        backwardLon = starBLon; backwardKey = starBKey;
    } else if (distB > 0 && distB < 180 && distA > 180 && distA < 360) {
        forwardLon = starBLon; forwardKey = starBKey;
        backwardLon = starALon; backwardKey = starAKey;
    } else {
        // 两颗星都在目标的同一侧（都在顺时针180度内或都在外侧），不是夹击
        return null;
    }

    // 计算两颗围攻星之间的距离（沿较短弧）
    const gapForward = distA > 0 && distA < 180 ? distA : distB;
    const gapBackward = distA > 180 ? 360 - distA : 360 - distB;

    // 检查中间是否夹杂其他星体
    // 沿顺时针方向：从 backward 到 target 到 forward
    const arcStart = backwardLon;
    const arcEnd = forwardLon;
    // 弧的大小（沿顺时针方向）
    const arcSize = ((forwardLon - backwardLon + 360) % 360);
    if (arcSize === 0 || arcSize >= 180) return null; // 弧太大或为0，不算夹

    // 身体夹与光线夹统一只用传统七行星，三王星与虚点均不算干扰
    const INTERFERING_BODIES_BODY = ["SUN", "MOON", "MERCURY", "VENUS", "MARS", "JUPITER", "SATURN"];
    const otherPlanetKeys = INTERFERING_BODIES_BODY.filter(k =>
        k !== targetKey && k !== starAKey && k !== starBKey && allPlanets[k]
    );

    for (const otherKey of otherPlanetKeys) {
        const otherLon = allPlanets[otherKey].longitude;
        // 检查其他行星是否落在顺时针弧内（不包含端点）
        const distFromStart = ((otherLon - arcStart + 360) % 360);
        if (distFromStart > 0 && distFromStart < arcSize) {
            // 中间有其他星体，不构成身体夹
            return null;
        }
    }

    // 检查3颗星是否分布在连续的2个星座内
    const threeSigns = new Set([
        Math.floor(targetLon / 30) % 12,
        Math.floor(starALon / 30) % 12,
        Math.floor(starBLon / 30) % 12,
    ]);

    // 检查这些星座是否连续（最多跨越2个星座 = 星座数1或2，且必须连续）
    if (threeSigns.size > 2) return null;

    // 如果是2个星座，检查是否相邻
    if (threeSigns.size === 2) {
        const signs = Array.from(threeSigns).sort((a, b) => a - b);
        const diff = signs[1] - signs[0];
        // 相邻：差1，或差11（跨越0度，如双鱼和白羊）
        if (diff !== 1 && diff !== 11) return null;
    }

    return {
        type: "body",
        typeName: "身体夹",
        besiegementName,
        starA: { key: starAKey, name: PLANET_NAMES[starAKey] },
        starB: { key: starBKey, name: PLANET_NAMES[starBKey] },
        arcSize: Math.round(arcSize * 100) / 100,
    };
}

// 辅助：在指定容許度内找到托勒密相位
function findPtolemaicAspectWithinOrb(lon1, lon2, key1, key2, maxOrb) {
    const diff = getAspectDifference(lon1, lon2);
    // 托勒密相位：合0°、六合60°、刑90°、拱120°、冲180°
    const ptolemaicAngles = [0, 60, 90, 120, 180];
    for (const angle of ptolemaicAngles) {
        if (Math.abs(diff - angle) <= maxOrb) {
            const aspectInfo = ASPECT_TYPES.find(a => a.angle === angle);
            return {
                name: aspectInfo.name,
                symbol: aspectInfo.symbol,
                angle,
                orb: Math.abs(diff - angle),
            };
        }
    }
    return null;
}

// 计算所有财富相关关键点的围攻情况
function calculateBesiegement(planets, partOfFortune, houseLords, triplicity, greatBenefic, isDayChart, houses) {
    const results = [];

    // 围攻检测目标：所有传统行星 + 四轴 + 福点
    // 任何重要点被日月/金木围攻都是财富吉格
    const targets = [];

    // 传统行星（日月水金火木土）
    const traditionalPlanets = ["SUN", "MOON", "MERCURY", "VENUS", "MARS", "JUPITER", "SATURN"];
    for (const key of traditionalPlanets) {
        targets.push({
            key,
            name: PLANET_NAMES[key],
            lon: planets[key].longitude,
            signIndex: planets[key].signIndex,
            category: "行星",
        });
    }

    // 四轴
    targets.push({ key: "ASC", name: "上升", lon: houses.ascendant.longitude, signIndex: houses.ascendant.signIndex, category: "四轴" });
    targets.push({ key: "MC", name: "天顶", lon: houses.midheaven.longitude, signIndex: houses.midheaven.signIndex, category: "四轴" });
    targets.push({ key: "DESC", name: "下降", lon: houses.descendant.longitude, signIndex: houses.descendant.signIndex, category: "四轴" });
    targets.push({ key: "IC", name: "天底", lon: houses.imumCoeli.longitude, signIndex: houses.imumCoeli.signIndex, category: "四轴" });

    // 福点
    targets.push({ key: "POF", name: "福点", lon: partOfFortune.longitude, signIndex: partOfFortune.signIndex, category: "福点" });

    // 围攻组合
    const besiegementPairs = [
        { starA: "SUN", starB: "MOON", name: "日月围攻" },
        { starA: "VENUS", starB: "JUPITER", name: "金木围攻" },
    ];

    for (const target of targets) {
        for (const pair of besiegementPairs) {
            // 目标不能是围攻星本身（比如太阳不能被日月围攻）
            if (target.key === pair.starA || target.key === pair.starB) continue;

            const starALon = planets[pair.starA].longitude;
            const starBLon = planets[pair.starB].longitude;

            // 光线夹（四轴只算身体夹，不算光线夹）
            if (target.category !== "四轴") {
                const rayResult = checkRayBesiegement(
                    target.lon, target.signIndex, target.key,
                    pair.starA, pair.starB, starALon, starBLon,
                    planets, pair.name
                );
                if (rayResult) {
                    results.push({
                        target: target.name,
                        targetKey: target.key,
                        targetCategory: target.category,
                        ...rayResult,
                    });
                }
            }

            // 身体夹
            const bodyResult = checkBodyBesiegement(
                target.lon, target.key,
                pair.starA, pair.starB, starALon, starBLon,
                planets, pair.name
            );
            if (bodyResult) {
                results.push({
                    target: target.name,
                    targetKey: target.key,
                    targetCategory: target.category,
                    ...bodyResult,
                });
            }
        }
    }

    return results;
}

// ===== 财富格局综合评估 =====
// 综合围攻、福点、钱财宫、三分主星、月亮状态判断财富格局
export function calculateWealthAssessment(partOfFortune, houseLords, greatBenefic, triplicity, fixedStars, isDayChart, planets, houses) {
    // ========== 围攻（Besiegement）——与福点同等重要的顶级格局 ==========
    const besiegementResults = calculateBesiegement(planets, partOfFortune, houseLords, triplicity, greatBenefic, isDayChart, houses);

    let besiegementScore = 0;
    const besiegementDetails = [];
    const besiegementScored = []; // 每个围攻的评分详情

    // 福点主星（通过signIndex查找对应宫主星）
    const pfLordSignEntry = houseLords.find(hl => hl.signIndex === partOfFortune.signIndex);
    const pfLordKey = pfLordSignEntry ? pfLordSignEntry.lordKey : null;

    // 高价值宫主星（1/2/10/11宫）
    const HIGH_VALUE_HOUSES = [1, 2, 10, 11];

    for (const b of besiegementResults) {
        let siegeScore = 5; // 基础分：5分（10分制）
        let siegeLevel = "基础";
        let upgradeReason = "";

        // 判断是否升级为高分围攻
        const isPfLord = b.targetKey && b.targetKey === pfLordKey;
        const isHighValueAxis = (b.targetCategory === "四轴") &&
            (b.target.includes("上升") || b.target.includes("天顶"));
        const isPof = b.targetCategory === "福点";

        // 检查被围攻的行星是否为高价值宫主星（1/2/10/11宫主）
        let isHighValueLord = false;
        let highValueLordHouses = [];
        if (b.targetCategory === "行星" && b.targetKey) {
            for (const hl of houseLords) {
                if (hl.lordKey === b.targetKey && HIGH_VALUE_HOUSES.includes(hl.house)) {
                    isHighValueLord = true;
                    highValueLordHouses.push(hl.house);
                }
            }
        }

        if (isPfLord || isHighValueAxis || isPof || isHighValueLord) {
            siegeScore = 8;
            siegeLevel = "强力";
            const reasons = [];
            if (isPfLord) reasons.push("福点主星");
            if (isHighValueAxis) reasons.push("四轴（上升/天顶）");
            if (isPof) reasons.push("福点");
            if (isHighValueLord) reasons.push(`${highValueLordHouses.map(h => h + '宫主').join('/')}`);
            upgradeReason = `（${reasons.join(' + ')}被围攻，力量加倍）`;
        }

        // 四轴中 DESC/IC 算中等
        const isMidAxis = (b.targetCategory === "四轴") &&
            (b.target.includes("下降") || b.target.includes("天底"));
        if (isMidAxis) {
            siegeScore = 6;
            siegeLevel = "中强";
            upgradeReason = "（四轴被围攻）";
        }

        besiegementScore += siegeScore;
        besiegementScored.push({
            ...b,
            score: siegeScore,
            level: siegeLevel,
        });

        let desc;
        if (b.type === "ray") {
            desc = `${b.target} 受${b.besiegementName}（光线夹）：${b.starA.name}呈${b.starA.aspect}，${b.starB.name}呈${b.starB.aspect}，格局纯粹，力量强大${upgradeReason}`;
        } else {
            desc = `${b.target} 受${b.besiegementName}（身体夹）：被两星左右夹持，弧宽约${b.arcSize}°，无其他星体干扰${upgradeReason}`;
        }
        besiegementDetails.push(desc);
    }

    // ========== 月亮状态（影响整体财富格局的基础因素） ==========
    const moon = planets.MOON;
    const sun = planets.SUN;

    // 月相：增光（waxing）vs 减光（waning）
    // 月亮在太阳东边（黄经大于太阳）为增光月，力量更强
    const moonMinusSun = ((moon.longitude - sun.longitude + 360) % 360);
    const isWaxingMoon = moonMinusSun > 0 && moonMinusSun < 180;
    const moonPhaseText = isWaxingMoon ? "增光月（盈月）" : "减光月（亏月）";

    // 月亮被火星/土星硬相位刑克（合/刑/冲，度数相位）
    const hardAspectsToMoon = [];
    for (const pkey of ["MARS", "SATURN"]) {
        const p = planets[pkey];
        const diff = getAspectDifference(moon.longitude, p.longitude);
        // 检查合(0°)/刑(90°)/冲(180°)，用古典容许度
        const orb = (PLANET_ORBS.MOON + PLANET_ORBS[pkey]) / 2;
        const isConjunction = diff <= orb;
        const isSquare = Math.abs(diff - 90) <= orb;
        const isOpposition = Math.abs(diff - 180) <= orb;
        if (isConjunction || isSquare || isOpposition) {
            let aspectName = isConjunction ? "合相" : isSquare ? "刑相" : "冲相";
            hardAspectsToMoon.push({ planet: PLANET_NAMES[pkey], planetKey: pkey, aspect: aspectName, orb: diff });
        }
    }

    // 月亮受吉星支持（星座相位层面：木星/金星/太阳）
    const moonBeneficAspects = [];
    const beneficKeys = ["JUPITER", "VENUS", "SUN"];
    for (const bkey of beneficKeys) {
        const b = planets[bkey];
        const signAspects = getWholeSignAspects(moon.signIndex, b.signIndex);
        // 排除不合意
        const goodAspects = signAspects.filter(a => a.type !== "aversion");
        if (goodAspects.length > 0) {
            moonBeneficAspects.push({
                planet: PLANET_NAMES[bkey],
                planetKey: bkey,
                aspects: goodAspects.map(a => a.name),
            });
        }
    }

    // ========== 维度一：福点 ==========
    const pfHouseStrength = partOfFortune.houseType.strengthLevel; // 3=角宫 2=续宫 1=果宫
    const pfLord = partOfFortune.lord;
    const pfLordPlanet = pfLord.planet;
    const pfLordHouseStrength = pfLordPlanet.house;

    // (a) 福点和福点主星是否落在角宫
    const pfInAngular = partOfFortune.houseType.type === "角宫";
    const pfLordInAngular = [1, 4, 7, 10].includes(pfLordPlanet.house);

    // (b) 福点主星能不能看到福点（有无星座相位）
    const pfLordCanSeePoF = !partOfFortune.isLordAversion;
    const pfLordSignAspectList = partOfFortune.lordSignAspects
        .filter(a => a.type !== "aversion")
        .map(a => a.name);

    // (c) 福点主星落在福点的几宫（从福点所在星座起算整宫）
    // 福点星座 = 1宫，依次类推
    const pfLordHouseFromPF = ((pfLordPlanet.signIndex - partOfFortune.signIndex + 12) % 12) + 1;
    const pfLordInGoodHouseFromPF = [1, 2, 11].includes(pfLordHouseFromPF);
    const pfLordInBadHouseFromPF = [6, 8, 12].includes(pfLordHouseFromPF);

    // 福点主星尊贵状态
    const pfLordDignity = pfLordPlanet.dignity;
    const pfLordDignityScore = pfLordPlanet.dignitySummary.score;
    const pfLordIsStrongDignity = pfLordDignity.domicile || pfLordDignity.exaltation;
    const pfLordIsWeakDignity = pfLordDignity.detriment || pfLordDignity.fall;

    // 福点是否合恒星（从fixedStars中查找）
    const pfStarConjs = fixedStars.filter(fs => fs.pointKey === "POF");
    const pfHasStar = pfStarConjs.length > 0;

    // 福点综合评分（满分10分）
    // 基准：中等福点 = 5 分
    // 顶级条件（达到任一即基础分 8 分）：
    //   1. 福点+福点主都落角宫
    //   2. 福点主落福点1/2/11宫
    // 加减分项：恒星+1，主星庙旺+2，主星落陷-2，可视性+1/-1等
    let pfScore = 5; // 基准分
    const pfDetails = [];

    // 判定是否满足顶级条件
    const isTopTierPF = (pfInAngular && pfLordInAngular) || pfLordInGoodHouseFromPF;

    if (pfInAngular && pfLordInAngular) {
        pfDetails.push(`福点与福点主星${pfLord.name}均落角宫（福点第${partOfFortune.house}宫，主星第${pfLordPlanet.house}宫），力量强劲`);
    } else if (pfInAngular) {
        pfScore += 1.5;
        pfDetails.push(`福点落角宫（第${partOfFortune.house}宫），力量强`);
    } else if (partOfFortune.houseType.type === "续宫") {
        pfDetails.push(`福点落续宫（第${partOfFortune.house}宫），力量中等`);
    } else {
        pfScore -= 1.5;
        pfDetails.push(`福点落果宫（第${partOfFortune.house}宫），力量偏弱`);
    }

    if (pfLordInGoodHouseFromPF) {
        pfDetails.push(`福点主星落福点第${pfLordHouseFromPF}宫（财富支持位：1/2/11宫），属良好格局`);
    } else if (pfLordInBadHouseFromPF) {
        pfScore -= 1.5;
        pfDetails.push(`福点主星落福点第${pfLordHouseFromPF}宫（弱位：6/8/12宫），力量受限`);
    }

    // 满足顶级条件 → 基础分拉到 8
    if (isTopTierPF) {
        pfScore = Math.max(pfScore, 8);
    }

    // 福点主星庙旺 +2
    if (pfLordIsStrongDignity) {
        pfScore += 2;
        pfDetails.push(`福点主星${pfLord.name}尊贵有力（${pfLordPlanet.dignitySummary.summaryText}）`);
    }
    // 福点主星落陷 -2
    if (pfLordIsWeakDignity) {
        pfScore -= 2;
        pfDetails.push(`福点主星${pfLord.name}尊贵偏弱（${pfLordPlanet.dignitySummary.summaryText}）`);
    }

    // 福点合恒星 +1
    if (pfHasStar) {
        pfScore += 1;
        const starNames = pfStarConjs.map(s => `${s.starNameZh}（${s.orb.toFixed(2)}°）`).join("、");
        pfDetails.push(`福点合恒星${starNames}，福气加倍`);
    }

    // 福点主星可视性（能看见福点 +1，看不见 -1）
    if (pfLordCanSeePoF) {
        pfScore += 1;
        pfDetails.push(`福点主星${pfLord.name}能"看见"福点（${pfLordSignAspectList.join("、")}），作用顺畅`);
    } else {
        pfScore -= 1;
        pfDetails.push(`福点主星${pfLord.name}与福点不合意（aversion），难以发挥作用`);
    }

    // 福点主星落角宫（单独加，非顶级条件时）
    if (pfLordInAngular && !isTopTierPF) {
        pfScore += 1;
        pfDetails.push(`福点主星${pfLord.name}落角宫（第${pfLordPlanet.house}宫），力量增强`);
    }

    // 获取宫新增规则只修正福点维度；显赫与来源均不直接加财富分
    const fortuneIndicators = calculateFortuneIndicators(partOfFortune, planets, houses, isDayChart);
    pfScore += fortuneIndicators.wealthBonus;
    pfDetails.push(...fortuneIndicators.wealth.map(item => item.text));

    // 限制在 0-10 分范围内
    pfScore = Math.max(0, Math.min(10, pfScore));
    pfScore = Math.round(pfScore * 10) / 10;

    // 福点状态判断（是否需要多参考三分主星）
    const pfIsWeak = pfScore <= 0;

    // ========== 维度二：钱财宫（2宫）==========
    const secondHouseLord = houseLords.find(h => h.house === 2);
    const secondLordPlanet = secondHouseLord.lordPlanet;
    const secondLordHouse = secondHouseLord.lordHouse;
    const secondLordDignityScore = secondLordPlanet.dignitySummary.score;

    // 最大吉星是否在2宫
    const greatBeneficIn2nd = greatBenefic.house === 2;

    let moneyHouseScore = 0;
    const moneyHouseDetails = [];

    if (greatBeneficIn2nd) {
        moneyHouseScore += 4;
        moneyHouseDetails.push(`最大吉星${greatBenefic.name}落在第2宫（钱财宫），财运有强力加持`);
    }

    // 二宫主星落宫力量
    const secondLordHouseType = getHouseType(secondLordHouse);
    if (secondLordHouseType.type === "角宫") {
        moneyHouseScore += 2;
        moneyHouseDetails.push(`二宫主星${secondHouseLord.lordName}落角宫（第${secondLordHouse}宫），力量强`);
    } else if (secondLordHouseType.type === "续宫") {
        moneyHouseScore += 1;
        moneyHouseDetails.push(`二宫主星${secondHouseLord.lordName}落续宫（第${secondLordHouse}宫），力量中等`);
    } else {
        moneyHouseScore -= 1;
        moneyHouseDetails.push(`二宫主星${secondHouseLord.lordName}落果宫（第${secondLordHouse}宫），力量偏弱`);
    }

    // 二宫主星必然尊贵
    if (secondLordDignityScore >= 3) {
        moneyHouseScore += 2;
        moneyHouseDetails.push(`二宫主星${secondHouseLord.lordName}尊贵状态良好（${secondLordPlanet.dignitySummary.summaryText}）`);
    } else if (secondLordDignityScore <= -3) {
        moneyHouseScore -= 2;
        moneyHouseDetails.push(`二宫主星${secondHouseLord.lordName}尊贵状态偏弱（${secondLordPlanet.dignitySummary.summaryText}）`);
    }

    // 二宫主星是否在2宫（入庙/入垣于钱财宫）
    if (secondLordHouse === 2) {
        moneyHouseScore += 2;
        moneyHouseDetails.push(`二宫主星${secondHouseLord.lordName}自守2宫（飞入本宫），财库稳固`);
    }

    // ========== 维度三：三分主星 ==========
    // 先统计三分主星恒星合相
    const allTriplicityLords = [
        ...triplicity.luminaryTriplicityLords.map(l => ({ ...l, group: "发光体三分主" })),
        ...triplicity.secondHouseTriplicityLords.map(l => ({ ...l, group: "二宫三分主" })),
    ];

    // 为每颗三分主星找恒星合相
    const triplicityStarConjunctions = {}; // key: planetKey, value: [{starNameZh, starNameEn, orb}]
    for (const lord of allTriplicityLords) {
        const key = lord.planetKey;
        if (!triplicityStarConjunctions[key]) {
            triplicityStarConjunctions[key] = fixedStars
                .filter(fs => fs.pointKey === key)
                .map(fs => ({
                    starNameZh: fs.starNameZh,
                    starNameEn: fs.starNameEn,
                    orb: fs.orb,
                    nature: fs.starNature,
                }));
        }
    }

    // 三分主星恒星合相详情
    const triplicityStarDetails = [];
    for (const lord of allTriplicityLords) {
        const stars = triplicityStarConjunctions[lord.planetKey] || [];
        for (const star of stars) {
            triplicityStarDetails.push(`${lord.group}·${lord.planetName}合恒星${star.starNameZh}（${star.starNameEn}），容许度${star.orb.toFixed(2)}°`);
        }
    }

    // 三分主星新评分标准：
    // 1. 必然尊贵：入庙/擢升 +3分，三分主 +1分，落陷/失意 -3分
    //    （界、面、外来不计入财富评分）
    // 2. 落宫力量：角宫 +3分，果宫 -3分，续宫 0分
    // 3. 恒星合相：每有一颗重要恒星合相 +3分
    let triplicityScore = 0;
    let triplicityStarBonus = 0;
    const triplicityLordComprehensive = {}; // planetKey -> {score, level, levelClass}
    for (const lord of allTriplicityLords) {
        const d = lord.dignity;
        let lordScore = 0;
        // 必然尊贵
        if (d.domicile) lordScore += 3;
        if (d.exaltation) lordScore += 3;
        if (d.triplicity) lordScore += 1;
        if (d.detriment) lordScore -= 3;
        if (d.fall) lordScore -= 3;
        // 落宫力量
        const houseType = getHouseType(lord.house);
        if (houseType.type === "角宫") lordScore += 3;
        if (houseType.type === "果宫") lordScore -= 3;
        // 恒星合相
        const stars = triplicityStarConjunctions[lord.planetKey] || [];
        if (stars.length > 0) {
            lordScore += 3 * stars.length;
            triplicityStarBonus += 3 * stars.length;
        }
        triplicityScore += lordScore;

        // 记录每颗三分主星的综合力量评分（未压缩）
        let level, levelClass;
        if (lordScore >= 6) { level = "强"; levelClass = "badge-good"; }
        else if (lordScore >= 3) { level = "较强"; levelClass = "badge-good"; }
        else if (lordScore >= 0) { level = "中等"; levelClass = "badge-neutral"; }
        else if (lordScore >= -3) { level = "较弱"; levelClass = "badge-bad"; }
        else { level = "弱"; levelClass = "badge-bad"; }
        triplicityLordComprehensive[lord.planetKey] = {
            score: lordScore,
            level,
            levelClass,
        };
    }
    // 压缩分值：6颗星总分除以5，使三分主星维度与福点维度（满分约12分）量级相当
    triplicityScore = Math.round(triplicityScore / 5 * 10) / 10;
    triplicityStarBonus = Math.round(triplicityStarBonus / 5 * 10) / 10;

    // ========== 月亮状态修正 ==========
    // 月亮代表生活物资、情绪安全感，与财富格局密切相关
    const moonDetails = [];
    let moonBonus = 0;

    // 月相：增光月力量更强
    if (isWaxingMoon) {
        moonBonus += 1.5;
        moonDetails.push(`月相为${moonPhaseText}，月亮力量渐增，对财富积累有利`);
    } else {
        moonBonus -= 0.5;
        moonDetails.push(`月相为${moonPhaseText}，月亮力量渐减，财运上更适合守成`);
    }

    // 月亮被火星/土星硬相位刑克
    for (const h of hardAspectsToMoon) {
        moonBonus -= 2;
        moonDetails.push(`月亮受${h.planet}${h.aspect}刑克，情绪与安全感易受挑战，对财运有消耗`);
    }

    // 月亮受吉星支持（星座相位）
    for (const b of moonBeneficAspects) {
        moonBonus += 1;
        moonDetails.push(`月亮与${b.planet}有${b.aspects.join("、")}，受吉星支持，物资生活较丰沛`);
    }

    // ========== 额外加分/减分项 ==========
    // 这些是独立于五大维度的特殊格局指征，直接加减分
    let extraBonus = 0;
    const extraDetails = [];

    // 4. 四轴合重要恒星
    // 恒星分级：皇家一等星（最高级）、一等大星、其他重要恒星
    const ROYAL_STARS = ["Regulus", "Spica", "Fomalhaut", "Antares"]; // 波斯四大皇家之星 + 角宿一（最吉之星）
    const FIRST_MAGNITUDE = ["Sirius", "Vega", "Rigel", "Arcturus", "Capella", "Procyon",
        "Betelgeuse", "Altair", "Aldebaran", "Deneb Adige"]; // 一等大星
    const IMPORTANT_STARS_SET = new Set([...ROYAL_STARS, ...FIRST_MAGNITUDE,
        "Algol", "Alnilam", "Castor", "Pollux", "Bellatrix", "Alphard"]); // 其他需考虑的凶星
    const axes = [
        { key: "ASC", name: "上升" },
        { key: "MC", name: "天顶" },
        { key: "DESC", name: "下降" },
        { key: "IC", name: "天底" },
    ];
    for (const axis of axes) {
        const starConjs = fixedStars.filter(fs =>
            fs.pointKey === axis.key && IMPORTANT_STARS_SET.has(fs.starNameEn)
        );
        for (const sc of starConjs) {
            const isGood = sc.starNature.includes("吉");
            const isBad = sc.starNature.includes("凶");
            const isRoyal = ROYAL_STARS.includes(sc.starNameEn);
            const isFirstMag = FIRST_MAGNITUDE.includes(sc.starNameEn);
            // 皇家之星吉星 +4，凶星 -3；一等大星吉星 +3，凶星 -2；其他吉星 +2，凶星 -1
            let bonus;
            if (isRoyal) {
                bonus = isGood ? 4 : -3;
            } else if (isFirstMag) {
                bonus = isGood ? 3 : -2;
            } else {
                bonus = isGood ? 2 : isBad ? -1 : 1;
            }
            extraBonus += bonus;
            extraDetails.push(
                `${axis.name}合恒星${sc.starNameZh}（${sc.starNameEn}），容许度${sc.orb.toFixed(2)}°`
            );
        }
    }

    // 5. 金星/木星合四轴
    for (const planetKey of ["VENUS", "JUPITER"]) {
        const planet = planets[planetKey];
        for (const axis of axes) {
            const axisLon = houses[axis.key === "ASC" ? "ascendant" : axis.key === "MC" ? "midheaven" : axis.key === "DESC" ? "descendant" : "imumCoeli"].longitude;
            const diff = getAspectDifference(planet.longitude, axisLon);
            if (diff <= 3) { // 3度以内算作合轴
                extraBonus += 2;
                extraDetails.push(
                    `${PLANET_NAMES[planetKey]}合${axis.name}（${diff.toFixed(2)}°），吉星照临，吉象倍增`
                );
            }
        }
    }

    // 6. 发光体的三分主星2颗及以上落角宫
    const luminaryTriplicityLords = triplicity.luminaryTriplicityLords;
    const angularLuminaryLords = luminaryTriplicityLords.filter(lord =>
        [1, 4, 7, 10].includes(lord.house)
    );
    if (angularLuminaryLords.length >= 2) {
        extraBonus += 2;
        extraDetails.push(
            `发光体的三分主星有 ${angularLuminaryLords.length} 颗落角宫（${angularLuminaryLords.map(l => l.planetName).join("、")}），力量强大`
        );
    }

    // 7. 福点合恒星
    const pofStarConjs = fixedStars.filter(fs =>
        fs.pointKey === "POF" && IMPORTANT_STARS_SET.has(fs.starNameEn)
    );
    for (const sc of pofStarConjs) {
        const isGood = sc.starNature.includes("吉");
        const isBad = sc.starNature.includes("凶");
        const isRoyal = ROYAL_STARS.includes(sc.starNameEn);
        const isFirstMag = FIRST_MAGNITUDE.includes(sc.starNameEn);
        let bonus;
        if (isRoyal) {
            bonus = isGood ? 4 : -3;
        } else if (isFirstMag) {
            bonus = isGood ? 3 : -2;
        } else {
            bonus = isGood ? 2 : isBad ? -1 : 1;
        }
        extraBonus += bonus;
        extraDetails.push(
            `福点合恒星${sc.starNameZh}（${sc.starNameEn}），容许度${sc.orb.toFixed(2)}°`
        );
    }

    // 7b. 日月合恒星（重要恒星与日月合相也加分）
    for (const planetKey of ["SUN", "MOON"]) {
        const planetName = PLANET_NAMES[planetKey];
        const sunMoonStarConjs = fixedStars.filter(fs =>
            fs.pointKey === planetKey && IMPORTANT_STARS_SET.has(fs.starNameEn)
        );
        for (const sc of sunMoonStarConjs) {
            const isGood = sc.starNature.includes("吉");
            const isBad = sc.starNature.includes("凶");
            const isRoyal = ROYAL_STARS.includes(sc.starNameEn);
            const isFirstMag = FIRST_MAGNITUDE.includes(sc.starNameEn);
            let bonus;
            if (isRoyal) {
                bonus = isGood ? 3 : -2.5;
            } else if (isFirstMag) {
                bonus = isGood ? 2 : -1.5;
            } else {
                bonus = isGood ? 1 : isBad ? -0.5 : 0.5;
            }
            extraBonus += bonus;
            extraDetails.push(
                `${planetName}合恒星${sc.starNameZh}（${sc.starNameEn}），容许度${sc.orb.toFixed(2)}°`
            );
        }
    }

    // 8. 日月落宫力量
    const sunInAngular = [1, 4, 7, 10].includes(planets.SUN.house);
    const moonInAngular = [1, 4, 7, 10].includes(planets.MOON.house);
    const sunInCadent = [3, 6, 9, 12].includes(planets.SUN.house);
    const moonInCadent = [3, 6, 9, 12].includes(planets.MOON.house);
    if (moonInAngular) {
        extraBonus += 3;
        extraDetails.push("月亮落角宫，月亮力量强，物资与情绪安全感充足");
    }
    if (sunInAngular) {
        extraBonus += 2;
        extraDetails.push("太阳落角宫，太阳力量强，人生舞台大，易得机遇与表现机会");
    }
    if (sunInCadent) {
        extraBonus -= 1;
        extraDetails.push("太阳落果宫，太阳力量减弱，人生表现与行动力受限");
    }
    if (moonInCadent) {
        extraBonus -= 1;
        extraDetails.push("月亮落果宫，月亮力量减弱，情绪安全感与物资运受限");
    }

    // 9. 月亮合南北交减分
    const moonNodeOrb = 3; // 3度以内算作合相
    const moonNorthNodeDiff = getAspectDifference(planets.MOON.longitude, planets.NORTH_NODE.longitude);
    if (moonNorthNodeDiff <= moonNodeOrb) {
        extraBonus -= 1.5;
        extraDetails.push(
            `月亮合北交（${moonNorthNodeDiff.toFixed(2)}°），情绪与宿命议题相关，人生起伏较大`
        );
    }
    const moonSouthNodeDiff = getAspectDifference(planets.MOON.longitude, planets.SOUTH_NODE.longitude);
    if (moonSouthNodeDiff <= moonNodeOrb) {
        extraBonus -= 1.5;
        extraDetails.push(
            `月亮合南交（${moonSouthNodeDiff.toFixed(2)}°），情绪与过去世习气相关，易有内耗`
        );
    }

    // 10. 日月与吉星（木星/金星）有度数相位
    for (const luminary of [
        { key: "SUN", name: "太阳" },
        { key: "MOON", name: "月亮" },
    ]) {
        for (const beneficKey of ["JUPITER", "VENUS"]) {
            const aspect = checkAspect(
                planets[luminary.key].longitude,
                planets[beneficKey].longitude,
                luminary.key,
                beneficKey
            );
            if (aspect) {
                // 和谐相位（合、拱、六合）加分，硬相位（刑、冲）减分
                if (aspect.nature === "harmonious" || aspect.angle === 0) {
                    extraBonus += 1.5;
                    extraDetails.push(
                        `${luminary.name}与${PLANET_NAMES[beneficKey]}成${aspect.name}（${aspect.exactOrb.toFixed(2)}°），受吉星加持`
                    );
                } else if (aspect.nature === "hard") {
                    extraBonus -= 0.5;
                    extraDetails.push(
                        `${luminary.name}与${PLANET_NAMES[beneficKey]}成${aspect.name}（${aspect.exactOrb.toFixed(2)}°），吉中带摩擦`
                    );
                }
            }
        }
    }

    // ========== 综合评估 ==========
    // 五维度加权评估，各维度先标准化到 0-10 分制，再加权
    // 权重：围攻 35% + 福点/三分主星 30% + 钱财宫 15% + 月亮状态 10% + 额外加分 10%
    // 福点为核心，三分主星为辅助（福点强则不依赖三分主星，福点弱则三分主星弥补）

    // 维度1：围攻（不做标准化压缩，直接用原始分）
    // 基础围攻5分/个，强力围攻8分/个，中强围攻6分/个
    // 分数本身就在 0-16+ 范围，作为标准化分使用（超出10也没关系）
    const besiegementNormalized = besiegementScore;

    // 维度2：福点（已为 0-10 分制，直接使用）
    const pfNormalized = pfScore;

    // 维度3：钱财宫标准化（0-10分），以6分为满分
    const moneyNormalized = Math.round(moneyHouseScore / 6 * 10 * 10) / 10;

    // 维度4：三分主星标准化（0-10分），以12分为满分
    const triplicityNormalized = Math.round(triplicityScore / 12 * 10 * 10) / 10;

    // 维度5：月亮状态标准化（0-10分）
    // 范围约 -3 ~ +3，映射到 0~10
    let moonNormalized = (moonBonus + 3) / 6 * 10;
    moonNormalized = Math.round(moonNormalized * 10) / 10;

    // 维度6：额外加分标准化（0-10分）
    // 范围约 -5 ~ +12，映射到 0~10
    let extraNormalized = (extraBonus + 5) / 17 * 10;
    extraNormalized = Math.round(extraNormalized * 10) / 10;

    // 福点 + 三分主星 合并维度（占 30% 权重）
    // 规则：谁高取谁（福点强则以福点为准，三分主星强则以三分为准，取较高者）
    // 福点是财富第一指征，三分主星是辅助/弥补
    let pfTriplicityCombined;
    let pfTriplicityNote;
    if (pfNormalized >= triplicityNormalized) {
        pfTriplicityCombined = pfNormalized;
        pfTriplicityNote = "以福点为主";
    } else {
        pfTriplicityCombined = triplicityNormalized;
        pfTriplicityNote = "福点偏弱，以三分主星弥补";
    }
    pfTriplicityCombined = Math.round(pfTriplicityCombined * 10) / 10;

    // 加权总分（满分 10 分）
    // 围攻 35% + 福点/三分 30% + 钱财宫 15% + 月亮 10% + 额外 10%
    let totalScore =
        besiegementNormalized * 0.35 +
        pfTriplicityCombined * 0.30 +
        moneyNormalized * 0.15 +
        moonNormalized * 0.10 +
        extraNormalized * 0.10;

    const weightNote = `五维度加权：围攻35% · 福点&三分主星30%（${pfTriplicityNote}） · 钱财宫15% · 月亮10% · 额外10%`;

    totalScore = Math.round(totalScore * 10) / 10;

    // 财富等级
    let wealthLevel = "";
    let wealthClass = "";
    let wealthDesc = "";

    // 档位校准（基于五维度加权总分）
    // 巨富 ≥ 6.5：顶级富豪格局，极为罕见
    // 大富 ≥ 5.0：大富大贵，百里挑一
    // 中富 ≥ 4.0：富裕水平，生活优渥
    // 小康 ≥ 2.5：衣食无忧，中产水平
    // 偏弱 ≥ 1.5：求财较辛苦
    // 较弱 < 1.5：财运阻力大
    if (totalScore >= 6.5) {
        wealthLevel = "巨富之格";
        wealthClass = "badge-good";
        wealthDesc = "财富格局极为罕见，乃万中无一之象。围攻格局、福点力量、恒星吉曜多重顶级吉象叠加，天生资源极为丰沛，财运宏大深远。多主出身不凡或白手兴家，一生财运亨通，易积累巨额财富，名利双收，声名远播。宜深修德行，善用财富，持盈保泰，方得长久。";
    } else if (totalScore >= 5.0) {
        wealthLevel = "大富之格";
        wealthClass = "badge-good";
        wealthDesc = "财富格局宏大，多个维度均呈现强吉之象，天生资源丰沛，赚钱能力出众。或有围攻护身，或有吉星守财，或福点与三分主星得力，配合得当则财源广进，容易积累大量财富。善用资源、保持谦逊则财运绵长，富甲一方。";
    } else if (totalScore >= 4.0) {
        wealthLevel = "中富之格";
        wealthClass = "badge-good";
        wealthDesc = "财富格局良好，有稳定的财富基础和创收能力。福点或钱财宫有得力吉星支持，三分主星亦有吉象，通过自身努力和合理规划可达到较为富裕的生活水平，家境殷实，衣食无忧且有结余。";
    } else if (totalScore >= 2.5) {
        wealthLevel = "小康之格";
        wealthClass = "badge-neutral";
        wealthDesc = "财富格局中等，财运平稳，衣食无忧。部分维度有吉象但整体力量中等，没有明显的大富大贵之兆，但也无重大破财之虞。通过持续努力和稳健理财可以稳步提升生活水平，小富由俭。";
    } else if (totalScore >= 1.5) {
        wealthLevel = "财运偏弱";
        wealthClass = "badge-bad";
        wealthDesc = "财富格局偏弱，求财过程可能较为辛苦，容易有财务压力。或福点力量不足，或钱财宫主星状态欠佳，收入不甚稳定。建议量入为出，培养专业技能，以稳定收入为主，避免投机冒险，稳中求进。";
    } else {
        wealthLevel = "财运较弱";
        wealthClass = "badge-bad";
        wealthDesc = "财富格局多有挑战，财运方面阻力较大。可能多个维度同时呈现凶象，求财多波折，容易有意外破财或财务压力。建议注重节俭，避免借贷和高风险投资，以稳健为主，同时关注精神层面的富足与个人成长，安贫乐道亦是福。";
    }

    return {
        totalScore,
        wealthLevel,
        wealthClass,
        wealthDesc,
        weightNote,
        pfScore,
        pfDetails,
        fortuneIndicators,
        pfIsWeak,
        pfLordHouseFromPF,
        moneyHouseScore,
        moneyHouseDetails,
        greatBeneficIn2nd,
        secondHouseLord: {
            name: secondHouseLord.lordName,
            house: secondLordHouse,
            dignityScore: secondLordDignityScore,
            dignityText: secondLordPlanet.dignitySummary.summaryText,
        },
        triplicityScore,
        triplicityStarBonus,
        triplicityStarDetails,
        triplicityStarConjunctions,
        triplicityLordComprehensive,
        // 围攻
        besiegementScore,
        besiegementDetails,
        besiegementResults,
        besiegementScored,
        // 标准化分（0-10分制）
        normalized: {
            besiegement: besiegementNormalized,
            partOfFortune: pfNormalized,
            triplicity: triplicityNormalized,
            pfTriplicityCombined: pfTriplicityCombined,
            pfTriplicityNote: pfTriplicityNote,
            moneyHouse: moneyNormalized,
            moon: moonNormalized,
            extra: extraNormalized,
        },
        // 月亮状态
        moonPhase: moonPhaseText,
        isWaxingMoon,
        moonBonus,
        moonDetails,
        moonHardAspects: hardAspectsToMoon,
        moonBeneficAspects,
        // 额外加分项
        extraBonus,
        extraDetails,
    };
}

// 主计算函数
export async function calculateBirthChart(birthData) {
    const s = await initSwe();

    const { year, month, day, hour, minute, second, lat, lon, timezone } = birthData;

    // 将时区时间转换为 UTC 时间
    // swe_utc_time_zone(year, month, day, hour, min, sec, timezone) → UTC 时间
    const utcTime = s.swe_utc_time_zone(year, month, day, hour, minute, second, timezone);

    // 使用 swe_utc_to_jd 将 UTC 时间转换为儒略日
    // 最后一个参数 1 = 格里高利历
    const jdResult = s.swe_utc_to_jd(
        utcTime.year, utcTime.month, utcTime.day,
        utcTime.hour, utcTime.minute, utcTime.second,
        1
    );
    const jdEt = jdResult[0];  // Ephemeris Time
    const jdUt = jdResult[1];  // Universal Time

    // 计算行星
    const planets = await calculatePlanets(jdUt);

    // 计算宫位
    const houses = await calculateHouses(jdUt, lat, lon);
    const ascSignIndex = houses.ascendant.signIndex;

    // 判断日生/夜生
    const dayChart = isDayChart(planets.SUN.longitude, houses.ascendant.longitude);

    // 计算每颗行星的落宫、尊贵状态、喜乐宫
    for (const key of Object.keys(planets)) {
        planets[key].house = getHouseNumber(planets[key].longitude, ascSignIndex);
        planets[key].dignity = getDignityStatus(key, planets[key].signIndex, planets[key].degree, dayChart);
        planets[key].dignitySummary = getDignitySummary(planets[key].dignity);
        // 喜乐宫
        if (JOY_HOUSES[key] && JOY_HOUSES[key] === planets[key].house) {
            planets[key].isJoyHouse = true;
        } else {
            planets[key].isJoyHouse = false;
        }
    }

    // 四轴的落宫
    houses.ascendant.house = 1;
    houses.midheaven.house = getHouseNumber(houses.midheaven.longitude, ascSignIndex);
    houses.descendant.house = 7;
    houses.imumCoeli.house = getHouseNumber(houses.imumCoeli.longitude, ascSignIndex);

    // 计算福点
    const partOfFortune = calculatePartOfFortune(
        houses.ascendant.longitude,
        planets.SUN.longitude,
        planets.MOON.longitude,
        dayChart
    );
    partOfFortune.house = getHouseNumber(partOfFortune.longitude, ascSignIndex);
    partOfFortune.houseType = getHouseType(partOfFortune.house);

    // 福点主星
    const pofLordPlanetId = HOUSE_LORDS[partOfFortune.signIndex];
    const pofLordKey = Object.keys(PLANET_IDS).find(k => PLANET_IDS[k] === pofLordPlanetId);
    const pofLordPlanet = planets[pofLordKey];
    partOfFortune.lord = {
        key: pofLordKey,
        name: PLANET_NAMES[pofLordKey],
        planet: pofLordPlanet,
        house: pofLordPlanet.house,
    };

    // 福点主星与福点的星座相位（whole sign aspect）
    const pofLordSignAspects = getWholeSignAspects(partOfFortune.signIndex, pofLordPlanet.signIndex);
    partOfFortune.lordSignAspects = pofLordSignAspects;

    // 福点主星与福点的精确相位（度数容许度，作为参考）
    const pofLordAspect = checkAspect(
        partOfFortune.longitude,
        pofLordPlanet.longitude,
        "SUN",
        pofLordKey
    );
    partOfFortune.lordAspect = pofLordAspect;

    // 福点是否与主星不合意（星座层面判断）
    partOfFortune.isLordAversion = pofLordSignAspects.some(a => a.type === "aversion");

    // 计算普拉西德制宫位（用于资产点）
    const placidusHouses = await calculatePlacidusHouses(jdUt, lat, lon);

    // 计算资产点 (Lot of Assets)
    // 公式：资产点 = 上升 + 二宫头 - 二宫主
    // 用 Placidus 制的二宫头和上升，以及 Placidus 二宫对应的宫主星
    const placidus2ndCusp = placidusHouses.cusps[1]; // 二宫头
    const placidus2ndLordSignIndex = placidus2ndCusp.signIndex;
    const assetsLordPlanetId = HOUSE_LORDS[placidus2ndLordSignIndex];
    const assetsLordKey = Object.keys(PLANET_IDS).find(k => PLANET_IDS[k] === assetsLordPlanetId);
    const assetsLordPlanet = planets[assetsLordKey];

    const lotOfAssets = calculateLotOfAssets(
        placidusHouses.ascendant.longitude,
        placidus2ndCusp.longitude,
        assetsLordPlanet.longitude
    );
    lotOfAssets.house = getHouseNumber(lotOfAssets.longitude, ascSignIndex); // 整宫制落宫
    lotOfAssets.houseType = getHouseType(lotOfAssets.house);
    lotOfAssets.placidus2ndCusp = placidus2ndCusp;
    lotOfAssets.placidus2ndLord = {
        key: assetsLordKey,
        name: PLANET_NAMES[assetsLordKey],
    };

    // 资产点主星 = 资产点所在星座的守护星
    const assetsPointoLordId = HOUSE_LORDS[lotOfAssets.signIndex];
    const assetsPointLordKey = Object.keys(PLANET_IDS).find(k => PLANET_IDS[k] === assetsPointoLordId);
    const assetsPointLordPlanet = planets[assetsPointLordKey];
    lotOfAssets.lord = {
        key: assetsPointLordKey,
        name: PLANET_NAMES[assetsPointLordKey],
        planet: assetsPointLordPlanet,
        house: assetsPointLordPlanet.house,
    };

    // 资产点主星与资产点的星座相位
    const assetsLordSignAspects = getWholeSignAspects(lotOfAssets.signIndex, assetsPointLordPlanet.signIndex);
    lotOfAssets.lordSignAspects = assetsLordSignAspects;
    lotOfAssets.isLordAversion = assetsLordSignAspects.some(a => a.type === "aversion");

    // 计算相位
    const aspects = calculateAllAspects(planets);

    // 计算宫主星表
    const houseLords = calculateHouseLords(planets, ascSignIndex);

    // 最吉/最凶判断
    const greatBeneficKey = dayChart ? "JUPITER" : "VENUS";
    const greatMaleficKey = dayChart ? "MARS" : "SATURN";

    const greatBenefic = planets[greatBeneficKey];
    const greatMalefic = planets[greatMaleficKey];

    // 恒星合相计算（只算星体+四轴，不算南北交等虚点）
    const fixedStarPlanetKeys = ["SUN", "MOON", "MERCURY", "VENUS", "MARS", "JUPITER", "SATURN"];
    const fixedStarPoints = [];
    for (const key of fixedStarPlanetKeys) {
        fixedStarPoints.push({
            key,
            name: PLANET_NAMES[key],
            longitude: planets[key].longitude,
        });
    }
    fixedStarPoints.push({ key: "ASC", name: "上升", longitude: houses.ascendant.longitude });
    fixedStarPoints.push({ key: "MC", name: "天顶", longitude: houses.midheaven.longitude });
    fixedStarPoints.push({ key: "DESC", name: "下降", longitude: houses.descendant.longitude });
    fixedStarPoints.push({ key: "IC", name: "天底", longitude: houses.imumCoeli.longitude });
    fixedStarPoints.push({ key: "POF", name: "福点", longitude: partOfFortune.longitude });

    const fixedStars = await calculateFixedStars(jdUt, fixedStarPoints, 1.5);

    // 三分主星（大财格局）
    // 日生：太阳的三分主星 + 二宫星座的三分主星
    // 夜生：月亮的三分主星 + 二宫星座的三分主星
    // 发光体的三分主星包含星座年限（sign period），二宫的不包含
    const luminaryKey = dayChart ? "SUN" : "MOON";
    const luminaryPlanet = planets[luminaryKey];
    const luminaryTriplicityLords = calculateTriplicityLords(
        luminaryPlanet.signIndex,
        dayChart,
        planets,
        ascSignIndex,
        true,        // includeSignPeriod = true（发光体包含星座年限）
        lat          // 出生地纬度
    );

    // 二宫星座
    const secondHouseSignIndex = (ascSignIndex + 1) % 12;
    const secondHouseTriplicityLords = calculateTriplicityLords(
        secondHouseSignIndex,
        dayChart,
        planets,
        ascSignIndex,
        false        // includeSignPeriod = false（二宫的不包含星座年限）
    );

    return {
        birthData,
        jdUt,
        jdEt,
        planets,
        houses,
        ascSignIndex,
        isDayChart: dayChart,
        dayNightText: dayChart ? "日生盘" : "夜生盘",
        partOfFortune,
        aspects,
        houseLords,
        greatBenefic: {
            key: greatBeneficKey,
            name: PLANET_NAMES[greatBeneficKey],
            planet: greatBenefic,
            house: greatBenefic.house,
        },
        greatMalefic: {
            key: greatMaleficKey,
            name: PLANET_NAMES[greatMaleficKey],
            planet: greatMalefic,
            house: greatMalefic.house,
        },
        fixedStars,
        lotOfAssets,
        placidusHouses,
        triplicity: {
            luminaryKey,
            luminaryName: luminaryKey === "SUN" ? "太阳" : "月亮",
            luminaryTriplicityLords,
            secondHouseSignIndex,
            secondHouseSignName: ZODIAC_SIGNS[secondHouseSignIndex].name,
            secondHouseTriplicityLords,
        },
        wealthAssessment: calculateWealthAssessment(
            partOfFortune,
            houseLords,
            { key: greatBeneficKey, name: PLANET_NAMES[greatBeneficKey], house: greatBenefic.house, planet: greatBenefic },
            { luminaryTriplicityLords, secondHouseTriplicityLords },
            fixedStars,
            dayChart,
            planets,
            houses
        ),
    };
}
