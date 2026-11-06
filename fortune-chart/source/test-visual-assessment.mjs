import assert from 'node:assert/strict';
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
for(let n=0;n<40;n++) {
    const chart=chartOf(fixture(Object.fromEntries(keys.map((k,i)=>[k,(n*17+i*47+5)%360]))));
    const before=structuredClone(chart);
    const factors=getAssessmentFactors(chart.wealthAssessment);
    assert(factors.every(f=>f.width>=0&&f.width<=100));
    const relations=getAssessmentRelations(chart);
    const rules=[...chart.wealthAssessment.fortuneIndicators.wealth,...chart.wealthAssessment.fortuneIndicators.prominence];
    assert(relations.paths.every(path=>rules.some(rule=>rule.id===path.id)));
    const html=buildVisualAssessmentHTML(chart,buildAssessmentAspectNarratives(chart.wealthAssessment));
    assert(html.includes(chart.wealthAssessment.wealthDesc));
    assert(html.includes(chart.wealthAssessment.totalScore.toFixed(1)));
    assert(html.includes('你的人生支持系统'));
    assert.equal((html.match(/class="va-star-strength"/g)||[]).length,6);
    assert.equal(html.includes('id="va-tab-relations"'),!!(relations.paths.length||relations.sources.length));
    assert(!html.includes('让优势有分量'));
    assert(!html.includes('加权分'));
    assert.deepEqual(chart,before);
}
const layered=chartOf(fixture({VENUS:340},1,false));
const paths=getAssessmentRelations(layered).paths;
assert(paths.some(p=>p.id==='layered-acquisition'&&p.links[1].includes('擢升')));
assert(!paths.some(p=>['fortune-lord-acquisition','sect-benefic-acquisition'].includes(p.id)));
layered.wealthAssessment.fortuneIndicators.wealth=[];
layered.wealthAssessment.fortuneIndicators.prominence=[];
layered.wealthAssessment.fortuneIndicators.sources=[];
assert(!buildVisualAssessmentHTML(layered,buildAssessmentAspectNarratives(layered.wealthAssessment)).includes('id="va-tab-relations"'));
const contacts=buildAssessmentAspectNarratives({moonHardAspects:[{planet:'火星',aspect:'刑相'}],moonBeneficAspects:[{planet:'金星',aspects:['拱相（拱座）']}],extraDetails:[]}).narratives[0];
assert.deepEqual(contacts.supportContacts.map(c=>c.name),['金星']);
assert.deepEqual(contacts.pressureContacts.map(c=>c.name),['火星']);
console.log('可视化综合评估测试通过：月相边界与评语、档位、真实规则路径、无命中隐藏、三枚星芒、结构化相位、40组评分不变。');
