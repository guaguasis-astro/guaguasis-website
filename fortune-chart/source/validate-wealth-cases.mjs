import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { calculateBirthChart, ZODIAC_SIGNS, PLANET_NAMES } from './js/astrology.js';
import { resolveZonedTime, formatUTC } from './js/global-time.js';
const website = process.argv[3] || fileURLToPath(new URL('../../', import.meta.url));
const ephemerisRoot = fileURLToPath(new URL('./ephe/', import.meta.resolve('sweph-wasm')));
const database = JSON.parse(fs.readFileSync(path.join(website, 'fortune-chart/data/timezones.json')));
// 与网站使用相同的三个瑞士星历文件，验证脚本从已安装包读取，避免依赖外网。
const nativeFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
    const value = String(url);
    if (value.startsWith('file:') && value.endsWith('/swisseph.wasm')) return new Response(fs.readFileSync(new URL(value)), {status:200,headers:{'Content-Type':'application/wasm'}});
    if (value.startsWith('https://ptprashanttripathi.github.io/sweph-wasm/ephe/')) {
        const filename = path.basename(new URL(value).pathname);
        return new Response(fs.readFileSync(path.join(ephemerisRoot, filename)), {status:200});
    }
    return nativeFetch(url, options);
};
const cases = [
 ['特朗普','1946-06-14','10:54','Queens','US','New York'],
 ['马斯克','1971-06-28','07:30','Pretoria','ZA','Gauteng'],
 ['妮可基德曼','1967-06-20','15:15','Honolulu','US','Hawaii'],
 ['金卡戴珊','1980-10-21','10:46','Los Angeles','US','California'],
 ['肯豆','1995-11-03','15:38','Los Angeles','US','California'],
 ['比尔盖茨','1955-10-28','22:00','Seattle','US','Washington'],
 ['梅西','1987-06-24','20:30','Rosario','AR','Santa Fe'],
 ['小李子','1974-11-11','02:47','Los Angeles','US','California'],
 ['乔丹','1963-02-17','13:40','Brooklyn','US','New York'],
 ['比伯','1994-03-01','00:56','London','CA','Ontario'],
];
const results = [];
for (const [name,date,time,city,country,region] of cases) {
 const rows = JSON.parse(fs.readFileSync(path.join(website,'fortune-chart/data/cities',city[0].toLowerCase()+'.json')));
 const row = rows.find(r=>r[1]===city && r[2]===country && r[3]===region);
 if (!row) throw Error('Missing city: '+city);
 const [year,month,day] = date.split('-').map(Number);
 const [hour,minute] = time.split(':').map(Number);
 const zoned=resolveZonedTime({year,month,day,hour,minute},row[6],database);
 if(zoned.mode!=='resolved') throw Error(`${name}: ${zoned.mode}`);
 const birth={year,month,day,hour,minute,second:0,lat:row[4],lon:row[5],place:`${city}, ${region}, ${country}`,timezone:zoned.timezone,timezoneResolved:true};
 const chart=await calculateBirthChart(birth);
 const wa=chart.wealthAssessment;
 const v=wa.normalized;
 const contributions={围攻:v.besiegement*.25,福点与三分:v.pfTriplicityCombined*.30,二宫:v.moneyHouse*.25,月亮:v.moon*.10,其他:v.extra*.10};
 const position=p=>`${ZODIAC_SIGNS[p.signIndex].name}${p.degree.toFixed(2)}°／${p.house}宫／${p.dignitySummary?.summaryText||''}${p.isRetrograde?'／逆行':''}`;
 const report={name,date,time,city:row.slice(0,8),timezone:formatUTC(zoned.timezone),abbreviation:zoned.abbreviation,daylight:zoned.daylight,utc:new Date(zoned.instant*1000).toISOString(),birth,
 score:wa.totalScore,level:wa.wealthLevel,dayNight:chart.dayNightText,ascendant:`${ZODIAC_SIGNS[chart.ascSignIndex].name}${chart.houses.ascendant.degree.toFixed(2)}°`,
 contributions,normalized:wa.normalized,
 planets:Object.fromEntries(Object.entries(chart.planets).filter(([k])=>PLANET_NAMES[k]).map(([key,p])=>[key,position(p)])),
 fortune:`${ZODIAC_SIGNS[chart.partOfFortune.signIndex].name}${chart.partOfFortune.degree.toFixed(2)}°／${chart.partOfFortune.house}宫`,
 fortuneLord:chart.partOfFortune.lord.name,
 assessment:wa,
 triplicity:{luminary:chart.triplicity.luminaryTriplicityLords.map(l=>({name:l.planetName,score:wa.triplicityLordComprehensive[l.planetKey].score,position:position(l.planet)})),money:chart.triplicity.secondHouseTriplicityLords.map(l=>({name:l.planetName,score:wa.triplicityLordComprehensive[l.planetKey].score,position:position(l.planet)}))},
 fixedStars:chart.fixedStars.map(s=>`${s.pointName}合${s.starNameZh} ${s.orb.toFixed(2)}°`)};
 results.push(report);
 console.log(JSON.stringify({name,score:wa.totalScore,level:wa.wealthLevel,tz:report.timezone,asc:report.ascendant,contributions}));
}
if (process.argv[2]) fs.writeFileSync(process.argv[2],JSON.stringify(results,null,2));
