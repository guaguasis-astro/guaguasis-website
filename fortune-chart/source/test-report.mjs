import assert from 'node:assert/strict';
import { buildAssessmentAspectNarratives, consolidateAssessmentDetails, buildTriplicityStarNarratives } from './js/renderer.js';
const wa = {
    moonHardAspects: [
        {planet:'火星',aspect:'刑相'},
        {planet:'土星',aspect:'冲相'},
    ],
    moonBeneficAspects: [
        {planet:'金星',aspects:['拱相（拱座）']},
        {planet:'木星',aspects:['六合（六合座）']},
    ],
    extraDetails: [
        '月亮与金星成拱相（1.00°），受吉星加持',
        '月亮与木星成六合（2.00°），受吉星加持',
        '太阳与金星成刑相（1.00°），吉中带摩擦',
        '金星合上升（1.00°），吉星照临，吉象倍增',
        '木星合天顶（2.00°），吉星照临，吉象倍增',
    ],
};
const original = structuredClone(wa);
let result = buildAssessmentAspectNarratives(wa);
assert.equal(result.narratives.length,2);
const moon = result.narratives.find(x=>x.target==='月亮');
assert(moon.evidence.includes('火星') && moon.evidence.includes('土星'));
assert(moon.evidence.includes('金星') && moon.evidence.includes('木星'));
assert.equal((moon.evidence.match(/金星/g)||[]).length,1);
assert(moon.conclusion.includes('机会和压力'));
assert(!result.otherDetails.join('').includes('月亮与'));
assert.equal(result.otherDetails.length,1);
assert(result.otherDetails[0].includes('金星合上升')&&result.otherDetails[0].includes('木星合天顶'));
assert.deepEqual(wa,original);
result = buildAssessmentAspectNarratives({...wa,moonHardAspects:[],extraDetails:[]});
assert(!result.narratives[0].conclusion.includes('压力'));
result = buildAssessmentAspectNarratives({...wa,moonBeneficAspects:[],extraDetails:[]});
assert(result.narratives[0].conclusion.includes('周转压力'));
// 同一颗吉星有整宫联系和精确硬相位时，汇总为摩擦，不出现两条冲突结论。
result = buildAssessmentAspectNarratives({moonHardAspects:[],moonBeneficAspects:[{planet:'木星',aspects:['冲相（对宫）']}],extraDetails:['月亮与木星成冲相（2.00°），吉中带摩擦']});
assert(result.narratives[0].evidence.includes('吉星摩擦'));
assert(!result.narratives[0].evidence.includes('吉星联系'));
assert.deepEqual(consolidateAssessmentDetails(['甲，力量强','乙，力量强','甲，力量强']),['甲；乙，力量强']);
const lord = {planetKey:'VENUS',planetName:'金星'};
assert.equal(buildTriplicityStarNarratives({triplicity:{luminaryTriplicityLords:[lord],secondHouseTriplicityLords:[lord]},wealthAssessment:{triplicityStarConjunctions:{VENUS:[{starNameEn:'Spica',starNameZh:'角宿一',orb:0.5}]}}}).length,1);
console.log('报告解读测试通过：混合相位综合、同星去重、精确硬相位摩擦、相同结论合写、跨三分主星组恒星去重、原数据不变。');
