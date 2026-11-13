import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { getCityLatLng } from './js/cities.js';
import { resolveMainlandTime } from './js/china-dst.js';
import { calculateLotOfSpirit, calculateFortuneIndicators, calculateWealthAssessment, calculateHouseLords, calculateTriplicityLords, getDignityStatus, getDignitySummary, getHouseNumber, getHouseType, getWholeSignAspects, PLANET_NAMES, HOUSE_LORDS, PLANET_IDS } from './js/astrology.js';
import { buildAssessmentAspectNarratives } from './js/renderer.js';
import { getAssessmentMoonPhase, getWealthBand, getAssessmentFactors, getAssessmentRelations } from './js/assessment-model.js';
import { buildVisualAssessmentHTML } from './js/assessment-view.js';
const keys = Object.keys(PLANET_NAMES);
function fixture(lons = {}, pfSign = 5, day = true) {
    const planets = Object.fromEntries(keys.map((key, i) => {
        const longitude = lons[key] ?? (i * 33 + 5) % 360;
        const signIndex = Math.floor(longitude / 30);
        const dignity = getDignityStatus(key, signIndex, longitude % 30, day);
        return [key, { longitude, signIndex, degree: longitude % 30, house: getHouseNumber(longitude, 0), dignity, dignitySummary: getDignitySummary(dignity), isRetrograde: false }];
    }));
    planets.NORTH_NODE = { longitude: 40 }; planets.SOUTH_NODE = { longitude: 220 };
    const axis = longitude => ({longitude, signIndex: Math.floor(longitude/30)});
    const houses = { ascendant: axis(5), midheaven: axis(275), descendant: axis(185), imumCoeli: axis(95) };
    const key = keys.find(k => PLANET_IDS[k] === HOUSE_LORDS[pfSign]);
    const lord = planets[key];
    const pof = { longitude: pfSign*30+5, signIndex: pfSign, house: pfSign+1, houseType: getHouseType(pfSign+1), lord: { key, name: PLANET_NAMES[key], planet: lord, house: lord.house }, lordSignAspects: getWholeSignAspects(pfSign,lord.signIndex) };
    pof.isLordAversion = pof.lordSignAspects.some(a=>a.type === 'aversion');
    return {planets, houses, pof, day};
}
function assess(f) {
    const hl = calculateHouseLords(f.planets,0);
    const triplicity = { luminaryTriplicityLords: calculateTriplicityLords(f.planets.SUN.signIndex,f.day,f.planets,0), secondHouseTriplicityLords: calculateTriplicityLords(1,f.day,f.planets,0) };
    const key = f.day ? 'JUPITER':'VENUS';
    return calculateWealthAssessment(f.pof,hl,{key,name:PLANET_NAMES[key],planet:f.planets[key],house:f.planets[key].house},triplicity,[],f.day,f.planets,f.houses);
}

for (let i=0;i<8;i++) {
    assert.equal(getAssessmentMoonPhase(20,20+i*45).index,i);
    assert.equal(getAssessmentMoonPhase(20,20+i*45+44.999).index,i);
}
assert.equal(getAssessmentMoonPhase(350,35).name,'峨眉月');
assert.equal(getAssessmentMoonPhase(0,0).growth,null);
assert.equal(getAssessmentMoonPhase(0,180).growth,null);
assert.equal(getAssessmentMoonPhase(0,179.99).growth,'增光');
assert.equal(getAssessmentMoonPhase(0,180.01).growth,'减光');
assert.equal(getAssessmentMoonPhase(0,135).reading,'专注熟练、内省、做有价值的实事');
assert.deepEqual([0,1.5,2.5,4,5,6.5,10].map(getWealthBand),[0,1,2,3,4,5,5]);
function chartOf(f) {
    const wa=assess(f);
    return {planets:f.planets,partOfFortune:f.pof,isDayChart:f.day,wealthAssessment:wa,
        triplicity:{luminaryKey:'SUN',luminaryName:'太阳',secondHouseSignIndex:1,secondHouseSignName:'金牛座',
            luminaryTriplicityLords:calculateTriplicityLords(f.planets.SUN.signIndex,f.day,f.planets,0),
            secondHouseTriplicityLords:calculateTriplicityLords(1,f.day,f.planets,0)}};
}

// 只模拟语言模块加载环境；不依赖浏览器，也不改变计算数据。
const translationRoot = process.argv[2] || new URL('../../assets/i18n/', import.meta.url).pathname;
const context = { window: { alert() {} }, location: { pathname: '/fortune-chart/index.html', search: '?lang=en' },
    URLSearchParams, document: { addEventListener() {} }, localStorage: { getItem() {} } };
vm.createContext(context);
for (const file of ['en.js', 'language.js']) vm.runInContext(fs.readFileSync(translationRoot + '/' + file, 'utf8'), context);
const english = context.window.GuaguaI18n.english;
for (let n = 0; n < 100; n++) {
    const chart = chartOf(fixture(Object.fromEntries(keys.map((key, i) => [key, (n * 17 + i * 47 + 5) % 360])), n % 12, n % 2 === 0));
    const before = structuredClone(chart);
    const html = buildVisualAssessmentHTML(chart, buildAssessmentAspectNarratives(chart.wealthAssessment));
    for (const text of html.split(/<[^>]*>/)) assert(!/[\u3400-\u9fff]/.test(english(text)), `未翻译: ${text}`);
    assert.deepEqual(chart, before, '翻译不可改变星盘与财富评分');
}
for (const [en, zh] of [['Beijing', '北京'], ['London', '伦敦'], ['New York, USA', '纽约'], ['Hong Kong', '香港']]) {
    assert.deepEqual(getCityLatLng(en), getCityLatLng(zh));
}
assert.equal(resolveMainlandTime({year:1990,month:6,day:1,hour:12,place:'Beijing'}).timezone,9);
assert.equal(resolveMainlandTime({year:1990,month:6,day:1,hour:12,place:'Hong Kong'}).mode,'unmanaged');
assert.equal(english('1990年1月1日 12:00'), '1990-1-1 12:00');
assert.equal(english('入庙'), 'Domicile');
assert.equal(english('落陷'), 'Detriment');
console.log('双语验证通过：100组综合评估无中文残留、评分数据不变、英文城市别名、大陆夏令时和英文日期。');
