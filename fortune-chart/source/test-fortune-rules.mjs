import assert from 'node:assert/strict';
import { calculateLotRelationSupport, calculateMoneyReceptions, getSupportCapacity, calculateLotOfSpirit, calculateFortuneIndicators, calculateWealthAssessment, calculateHouseLords, calculateTriplicityLords, getDignityStatus, getDignitySummary, getHouseNumber, getHouseType, getWholeSignAspects, PLANET_NAMES, HOUSE_LORDS, PLANET_IDS } from './js/astrology.js';
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
assert.equal(r.wealthBonus,0); // 精神点获取宫支持移至取高后的关系评分
// 双鱼福点的获取宫为摩羯，验证衍生宫跨过黄道零点
r = indicators(fixture({},11));
assert.equal(r.acquisitionSign,9);
assert.equal(r.tenthSign,8);
// 来源只作线索，不增加财富分
r = indicators(fixture({MOON:200, JUPITER:250},3));
assert(has(r,'sources','family'));
function assess(f, stars = []) {
    const hl = calculateHouseLords(f.planets,0);
    const triplicity = { luminaryTriplicityLords: calculateTriplicityLords(f.planets.SUN.signIndex,f.day,f.planets,0), secondHouseTriplicityLords: calculateTriplicityLords(1,f.day,f.planets,0) };
    const key = f.day ? 'JUPITER':'VENUS';
    return calculateWealthAssessment(f.pof,hl,{key,name:PLANET_NAMES[key],planet:f.planets[key],house:f.planets[key].house},triplicity,stars,f.day,f.planets,f.houses);
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
    const expected = Math.round(Math.max(0,Math.min(10,result.baseScore))*10)/10;
    assert.equal(result.totalScore,expected);
    assert(rules.wealthBonus<=2.5);
}
const strong = assess(fixture({MERCURY:100, MOON:160, JUPITER:110},5));
assert.equal(strong.fortuneIndicators.wealthBonus,2.5);
assert.equal(strong.totalScore,Math.round(Math.min(10,strong.baseScore)*10)/10);
console.log('新增验证通过：100组总评分五维度加权、封顶、每条规则解释与无命中隐藏。');

// 福点已满分时，财富获取支持也受维度上限约束，不再直加总评
const cappedPF = assess(fixture({MARS:10,JUPITER:305},0,true));
assert.equal(cappedPF.pfScore,10);
assert(cappedPF.fortuneIndicators.wealthBonus>0);
assert.equal(cappedPF.totalScore,Math.round(Math.min(10,cappedPF.baseScore)*10)/10);

// 关系测试使用明确的宫主星映射，隔离其他宫位关系。
const roles = [2, 5, 10, 11].map(house => ({ house, lordKey: house === 2 ? 'MERCURY' : 'VENUS' }));
const money = lons => calculateMoneyReceptions(fixture(lons).planets, roles, true);
// 水星金牛、金星双子：守护互容，无相位也成立；三个宫主身份只计一次。
const noAspect = money({ MERCURY: 45, VENUS: 75 });
assert.equal(noAspect.relations.length, 1);
assert(noAspect.relations[0].mutual);
assert.equal(noAspect.relations[0].aspect, null);
assert.deepEqual(noAspect.relations[0].roles, [5, 10, 11]);
assert(noAspect.score > 0);
// 接纳者有力与落陷时，围攻/接纳支持能力不同。
const capacityFixture = fixture({ VENUS: 45 });
const beforeCapacity = getSupportCapacity('VENUS', capacityFixture.planets, true);
capacityFixture.planets.VENUS.dignity = { detriment: true };
assert(getSupportCapacity('VENUS', capacityFixture.planets, true) < beforeCapacity);
// 水星45°与金星315°，形成刑相；搜索其他度数以验证单向规则与方向。
let received, unsupported;
const outgoing = money({ MERCURY: 60, VENUS: 150 }).relations.find(r => r.direction === 'outgoing');
for (let lon = 0; lon < 360; lon++) {
    const result = money({ MERCURY: 45, VENUS: lon });
    received ||= result.relations.find(r => r.direction === 'received');
    const p = fixture({ MERCURY: 45, VENUS: lon }).planets;
    const d = getDignityStatus('VENUS', p.MERCURY.signIndex, p.MERCURY.degree, true);
    if (d.domicile && !result.relations.length) unsupported = true;
}
assert(received && received.aspect && received.score > 0);
assert(outgoing && outgoing.aspect && outgoing.score === 0);
assert(unsupported, '只有尊贵关系、没有相位的单向接纳不得加分');
const sameLord = calculateMoneyReceptions(fixture().planets, roles.map(r => ({ ...r, lordKey: 'MERCURY' })), true);
assert.equal(sameLord.score, 0);
for (let n = 0; n < 100; n++) {
    const result = assess(fixture(Object.fromEntries(keys.map((k,i) => [k, (n*29+i*41+5)%360])), n%12, n%2===0));
    const v = result.normalized;
    assert(Object.values(v).filter(x => typeof x === 'number').every(x => x >= 0 && x <= 10));
    assert(!result.besiegementResults.some(r => r.targetKey === 'POF'));
    assert.equal(result.totalScore, Math.round((v.besiegement*.25 + v.pfTriplicityCombined*.30 + v.moneyHouse*.25 + v.moon*.10 + v.extra*.10)*10)/10);
    assert.equal(result.pfScore, Math.round(Math.max(0,Math.min(10,result.pfBaseScore+result.fortuneIndicators.wealthBonus))*10)/10);
    assert(result.calibrationPending);
    assert(!result.wealthLevel.includes('富'));
    assert.equal(result.scoringVersion, 'neutral-5-experiment');
}
const dedup = assess(f);
const perTarget = new Map();
for (const siege of dedup.besiegementScored) perTarget.set(siege.targetKey, Math.max(perTarget.get(siege.targetKey)||0, siege.score));
assert.equal(dedup.besiegementScore, Math.round(Math.min(10, 5 + [...perTarget.values()].reduce((a,b)=>a+b,0))*10)/10);
console.log('新规则验证通过：权重、维度封顶、福点排除、围攻状态及去重、接纳方向、无相位互容、多宫主去重、中性尺度与待校准标记。');

// 混合庙旺互容按较弱的旺接纳力度处理，仍不以相位作为成立门槛。
const mixed = money({ MERCURY: 335, VENUS: 155 }).relations[0];
assert(mixed.mutual);
assert.equal(mixed.received.name, '擢升');
assert.equal(mixed.reverse.name, '入庙');
// 同一星位下弱化围攻星尊贵，必须降低实际围攻评分。
const siegeFixture = fixture({SUN:10,MOON:30,MERCURY:20,VENUS:100,MARS:150,JUPITER:200,SATURN:250},2);
const strongSiege = assess(siegeFixture).besiegementScored.find(r=>r.targetKey==='MERCURY'&&r.type==='body');
siegeFixture.planets.SUN.dignity = { detriment: true };
siegeFixture.planets.MOON.dignity = { fall: true };
const weakSiege = assess(siegeFixture).besiegementScored.find(r=>r.targetKey==='MERCURY'&&r.type==='body');
assert(weakSiege.score < strongSiege.score);

// 中性起点、强恒星单列、风险保留、三分直接平均、另一颗吉星二宫。
const neutral = Array.from({length:100},(_,n)=>assess(fixture(Object.fromEntries(keys.map((k,i)=>[k,(n*29+i*41+5)%360]))))).find(r=>!r.besiegementResults.length);
assert(neutral);
assert.equal(neutral.normalized.besiegement,5);
assert(neutral.besiegementDetails.includes('未见围攻强化，按中性支持处理'));
const royalStars = [
 {pointKey:'ASC',pointName:'上升',starNameEn:'Regulus',starNameZh:'轩辕十四',starNature:'吉（火星/木星）',orb:0.88},
 {pointKey:'MC',pointName:'天顶',starNameEn:'Algol',starNameZh:'大陵五',starNature:'凶（土星/木星）',orb:1.08},
];
const royal = assess(fixture(),royalStars);
assert(royal.prominencePatterns.some(p=>p.title==='上升合轩辕十四'));
assert(royal.normalized.extra>=9.5);
assert(royal.extraDetails.some(s=>s.includes('大陵五')));
assert.equal(assess(fixture(),[{...royalStars[0],orb:1.51}]).prominencePatterns.length,0);
assert(!assess(fixture(),[{...royalStars[0],pointKey:'DESC',pointName:'下降'}]).prominencePatterns.length);
assert.equal(royal.triplicityScore,Math.round((royal.triplicityGroups.luminary+royal.triplicityGroups.money)/2*10)/10);
const otherBenefic = assess(fixture({JUPITER:40,VENUS:200},5,false));
assert(otherBenefic.moneyHouseDetails.some(s=>s.startsWith('木星落在第2宫')));
assert(otherBenefic.moonBeneficAspects.every(a=>a.planetKey!=='SUN'));
assert(otherBenefic.moonFrictionAspects.every(a=>!otherBenefic.moonBeneficAspects.some(b=>a.planet===b.planet)));
console.log('尺度试验验证通过：中性起点、重要恒星与风险并列、三分直接平均、昼夜另一吉星支持、月亮摩擦去重。');

// 精神点关系必须参与30%维度；双向替代单向、同主星同位置去重。
const linkedFixture = fixture({SUN:40,MOON:100,VENUS:305,SATURN:35},1,true);
const linkedResult = assess(linkedFixture);
const linkedSupport = linkedResult.lotRelationSupport;
assert(linkedSupport.items.find(i=>i.id==='cross-link').counted);
assert.equal(linkedSupport.items.find(i=>i.id==='spirit-lord-fortune').counted,false);
const sharedResult = assess(fixture({SUN:40,MOON:335,MERCURY:75},5,true));
const sharedItems = sharedResult.lotRelationSupport.items.filter(i=>['spirit-lord-tenth','fortune-lord-tenth'].includes(i.id));
assert.equal(sharedItems.length,2);
assert.equal(sharedItems.filter(i=>i.counted).length,1);
assert(sharedItems.find(i=>i.id==='spirit-lord-tenth').counted);
// 本命二宫与福点起算的第二宫分别检测。
const natalSecond = assess(fixture({MERCURY:40},5,true));
assert(natalSecond.lotRelationSupport.items.some(i=>i.id==='fortune-lord-natal-second'&&i.counted));
assert.notEqual(natalSecond.pfLordHouseFromPF,2);
const derivedSecond = assess(fixture({MERCURY:190},5,true));
assert.equal(derivedSecond.pfLordHouseFromPF,2);
assert(!derivedSecond.lotRelationSupport.items.some(i=>i.id==='fortune-lord-natal-second'));
// 精神点与福点主星同一颗且落获取宫，不再重复加精神点获取宫分。
const sharedAcquisition = assess(fixture({SUN:40,MOON:335,MERCURY:100},5,true));
assert(sharedAcquisition.lotRelationSupport.items.some(i=>i.id==='spirit-lord-acquisition'&&!i.counted));
for(let n=0;n<100;n++) {
 const result=assess(fixture(Object.fromEntries(keys.map((k,i)=>[k,(n*29+i*41+5)%360])),n%12,n%2===0));
 assert(result.lotRelationSupport.score<=3);
 const expected=Math.round(Math.min(10,Math.max(result.pfScore,result.triplicityScore)+result.lotRelationSupport.score)*10)/10;
 assert.equal(result.normalized.pfTriplicityCombined,expected);
}
console.log('点位关系计分通过：精神点核心与辅助条件、本命二宫区分、同主星去重、双向替代、3分支持上限与30%维度封顶。');
