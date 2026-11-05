import assert from 'node:assert/strict';
import { calculateLotOfSpirit, calculateFortuneIndicators, calculateWealthAssessment, calculateHouseLords, calculateTriplicityLords, getDignityStatus, getDignitySummary, getHouseNumber, getHouseType, getWholeSignAspects, PLANET_NAMES, HOUSE_LORDS, PLANET_IDS } from './js/astrology.js';
import { renderFortuneMatches } from './js/renderer.js';
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
const indicators = f => calculateFortuneIndicators(f.pof, f.planets, f.houses, f.day);
const has = (r, group, id) => r[group].some(x => x.id === id);
assert.equal(calculateLotOfSpirit(10, 350, 20, true).longitude, 340);
assert.equal(calculateLotOfSpirit(10, 350, 20, false).longitude, 40);
// 文稿中的水星巨蟹/月亮处女：严格的双向守护交换
let r = indicators(fixture({MERCURY:100, MOON:160, JUPITER:110},5));
assert(has(r,'wealth','acquisition-reception'));
assert(has(r,'wealth','sect-benefic-acquisition'));
assert.equal(r.wealthBonus,2.5);
assert(!has(indicators(fixture({MERCURY:100, MOON:110},5)),'wealth','acquisition-reception'));
// 昼夜只选各自合昼夜性的吉星
assert(!has(indicators(fixture({JUPITER:110, VENUS:210},5,false)),'wealth','sect-benefic-acquisition'));
// 夜生金星为福点金牛主星，在获取宫双鱼擢升，组合替代基础吉星加分
r = indicators(fixture({VENUS:340},1,false));
assert(has(r,'wealth','layered-acquisition'));
assert.equal(r.wealthBonus,1.5);
// 同一个主星不能伪装成互容
assert(!has(indicators(fixture({},4)),'wealth','acquisition-reception'));
// 精神点主星仅同星座即可命中，度数无需精确合相
r = indicators(fixture({SUN:40, MOON:100, JUPITER:179},5,true)); // 精神点305°水瓶，主星土星
r = indicators(fixture({SUN:40, MOON:100, SATURN:179},5,true));
assert(has(r,'prominence','spirit-lord-fortune'));
// 辅助显赫与核心区分：精神点十宫与精神点主十宫可同时出现
r = indicators(fixture({SUN:40, MOON:100, SATURN:305},1,true));
assert(has(r,'prominence','spirit-tenth'));
assert(has(r,'prominence','spirit-lord-tenth'));
assert.equal(r.prominence.find(x=>x.id==='spirit-tenth').kind,'辅助');
r = indicators(fixture({SUN:40, MOON:100, VENUS:305, SATURN:35},1,true));
assert(has(r,'prominence','fortune-lord-tenth'));
assert(has(r,'prominence','cross-link'));
r = indicators(fixture({SUN:40, MOON:100, SATURN:335, VENUS:210},1,true));
assert(has(r,'wealth','spirit-lord-acquisition'));
assert.equal(r.wealthBonus,0.25);
// 双鱼福点的获取宫为摩羯，验证衍生宫跨过黄道零点
r = indicators(fixture({},11));
assert.equal(r.acquisitionSign,9);
assert.equal(r.tenthSign,8);
// 来源只作线索，不增加财富分
r = indicators(fixture({MOON:200, JUPITER:250},3));
assert(has(r,'sources','family'));
function assess(f) {
    const hl = calculateHouseLords(f.planets,0);
    const triplicity = { luminaryTriplicityLords: calculateTriplicityLords(f.planets.SUN.signIndex,f.day,f.planets,0), secondHouseTriplicityLords: calculateTriplicityLords(1,f.day,f.planets,0) };
    const key = f.day ? 'JUPITER':'VENUS';
    return calculateWealthAssessment(f.pof,hl,{key,name:PLANET_NAMES[key],planet:f.planets[key],house:f.planets[key].house},triplicity,[],f.day,f.planets,f.houses);
}
// 移动/删除三王星：整个财富评估对象必须完全一致（涵盖身体夹与光线夹）
for (let n=0;n<50;n++) {
    const f=fixture(Object.fromEntries(keys.map((k,i)=>[k,(n*17+i*47+5)%360])));
    const before=assess(f);
    for(const k of ['URANUS','NEPTUNE','PLUTO']) delete f.planets[k];
    assert.deepEqual(assess(f),before);
}
// 确认身体夹仍成立，即使三王星位于夹弧之内
const f=fixture({SUN:10,MOON:30,MERCURY:20,VENUS:100,MARS:150,JUPITER:200,SATURN:250,URANUS:15,NEPTUNE:25,PLUTO:18},2);
assert(assess(f).besiegementResults.some(x=>x.targetKey==='MERCURY'&&x.type==='body'&&x.besiegementName==='日月围攻'));
console.log('财富规则测试通过：昼夜公式、获取宫、互容正反例、叠加去重、显赫层次、50组三王星独立性及身体夹。');

// 命中展示：无命中时无占位文案；每条命中都有盘上证据和通俗解释
assert.equal(renderFortuneMatches({wealth:[],prominence:[],sources:[]}), '');
for (let n=0;n<100;n++) {
    const f = fixture(Object.fromEntries(keys.map((k,i)=>[k,(n*29+i*41+5)%360])),n%12,n%2===0);
    const result = assess(f);
    const rules = result.fortuneIndicators;
    for (const item of [...rules.wealth,...rules.prominence,...rules.sources]) {
        assert(item.title && item.reason && item.text, item.id);
        assert([...item.title + item.reason + item.text].length <= 100, `${item.id}: ${[...item.title + item.reason + item.text].length}字`);
        assert(item.reason.includes('你的'), item.id);
    }
    const html = renderFortuneMatches(rules);
    assert(!html.includes('未命中'));
    assert(!html.includes('为什么这张盘符合'));
    assert(!/不单独保证|不能.*换算|不能.*判断|不能.*确定|不代表/.test(html));
    assert(!html.includes('undefined'));
    const expected = Math.round(Math.max(0,Math.min(10,result.baseScore+rules.wealthBonus))*10)/10;
    assert.equal(result.totalScore,expected);
    assert(rules.wealthBonus<=2.5);
}
const strong = assess(fixture({MERCURY:100, MOON:160, JUPITER:110},5));
assert.equal(strong.fortuneIndicators.wealthBonus,2.5);
assert.equal(strong.totalScore,Math.round(Math.min(10,strong.baseScore+2.5)*10)/10);
console.log('新增验证通过：100组总评分专项加分、封顶、每条规则解释与无命中隐藏。');

// 福点已满分时，强财富结构仍然直接作用于总评
const cappedPF = assess(fixture({VENUS:340},1,false));
assert.equal(cappedPF.pfScore,10);
assert(cappedPF.fortuneIndicators.wealthBonus>0);
assert.equal(cappedPF.totalScore,Math.round(Math.min(10,cappedPF.baseScore+cappedPF.fortuneIndicators.wealthBonus)*10)/10);
