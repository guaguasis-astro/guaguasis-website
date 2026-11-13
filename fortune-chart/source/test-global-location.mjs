import assert from 'node:assert/strict';
import fs from 'node:fs';
import { resolveZonedTime, formatUTC, offsetAt } from './js/global-time.js';
import { findCities, cityShard } from './js/global-cities.js';
import { applyMainlandTime } from './js/china-dst.js';
const root = process.argv[2] || new URL('../data/', import.meta.url).pathname;
const db = JSON.parse(fs.readFileSync(root + '/timezones.json', 'utf8'));
const local = (zone, date, time, choice = '') => {
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);
    return resolveZonedTime({year,month,day,hour,minute}, zone, db, choice);
};
for (const [zone,date,time,offset,dst] of [
    ['Europe/London','1990-01-01','12:00',0,false], ['Europe/London','1990-07-01','12:00',1,true],
    ['America/New_York','1990-01-01','12:00',-5,false], ['America/New_York','1990-07-01','12:00',-4,true],
    ['Australia/Sydney','1990-01-01','12:00',11,true], ['Australia/Sydney','1990-07-01','12:00',10,false],
    ['Asia/Shanghai','1986-05-03','12:00',8,false], ['Asia/Shanghai','1986-05-04','03:00',9,true],
    ['Asia/Shanghai','1990-07-01','12:00',9,true], ['Asia/Shanghai','1992-07-01','12:00',8,false],
    ['Asia/Kathmandu','2020-01-01','12:00',5.75,false], ['Asia/Kathmandu','1980-01-01','12:00',5.5,false],
    ['America/Phoenix','2020-07-01','12:00',-7,false], ['America/Havana','2026-11-13','12:00',-4,true],
    ['Pacific/Auckland','2020-01-01','12:00',13,true], ['Pacific/Auckland','2020-07-01','12:00',12,false],
]) {
    const r = local(zone,date,time);
    assert.equal(r.mode,'resolved',`${zone} ${date}`); assert.equal(r.timezone,offset); assert.equal(r.daylight,dst);
}
// 春季跳时、秋季重复，以及非一小时拨表和跨越一整天的政治变更。
assert.equal(local('America/New_York','2024-03-10','02:30').mode,'invalid');
assert.equal(local('Europe/London','2024-03-31','01:30').mode,'invalid');
assert.equal(local('Asia/Shanghai','1986-05-04','02:30').mode,'invalid');
assert.equal(local('Pacific/Apia','2011-12-30','12:00').mode,'invalid');
for (const [zone,date,time,difference] of [
    ['America/New_York','2024-11-03','01:30',3600], ['Europe/London','2024-10-27','01:30',3600],
    ['Australia/Lord_Howe','2024-04-07','01:45',1800], ['Asia/Shanghai','1990-09-16','01:30',3600],
]) {
    assert.equal(local(zone,date,time).mode,'ambiguous');
    const first=local(zone,date,time,'earlier'),last=local(zone,date,time,'later');
    assert.equal(last.instant-first.instant,difference); assert(first.repeated&&last.repeated);
}
assert.equal(local('Australia/Lord_Howe','2024-10-06','02:15').mode,'invalid');
assert.equal(local('Europe/Dublin','2024-01-01','12:00').daylight,true,'保留IANA负夏令时标记，不用一月/七月偏移猜测');
assert.equal(local('Europe/London','1899-12-31','12:00').mode,'out-of-range');
assert.equal(local('Europe/London','2100-07-01','12:00').timezone,1,'展开TZif尾部未来规则');
assert.equal(local('Not/A_Zone','1990-01-01','12:00').mode,'unsupported');
assert.equal(formatUTC(20476/3600),'UTC+05:41:16','历史偏移保留秒');
assert.equal(local('Asia/Kathmandu','1900-01-01','12:00').seconds,20476);
const birth={year:1990,month:7,day:1,hour:12,place:'北京',timezone:8,timezoneResolved:true};
assert.deepEqual(applyMainlandTime(birth),birth,'已解析的历史时区/手动偏移不能被旧大陆规则再次覆盖');
for(const [query,zone] of [['London','Europe/London'],['New York','America/New_York'],['北京','Asia/Shanghai'],['São Paulo','America/Sao_Paulo'],['Kathmandu','Asia/Kathmandu']]) {
    const rows=JSON.parse(fs.readFileSync(root+'/cities/'+cityShard(query)+'.json','utf8'));
    const result=findCities(rows,query);
    assert(result.length&&result.some(row=>row[6]===zone),query);
    for(const row of result) assert(db.zones[row[6]],'每个结果必须具有配套时区规则');
}
const springfields=JSON.parse(fs.readFileSync(root+'/cities/s.json','utf8'));
const results=findCities(springfields,'Springfield');
assert(results.length>1); assert(new Set(results.map(row=>row[3])).size>1,'显示同名城市的不同地区');
assert(findCities(springfields,'Springfield, United States').every(row=>row[2]==='US'));
assert(findCities(springfields,'Springfield, USA').length);
assert(findCities(springfields,'Springfield, USA').every(row=>row[2]==='US'));
assert.equal(findCities(springfields,'Not A Real City 1234').length,0);
// 分片内只保留实际参与检索的别名，检查所有城市均有时区，坐标合法。
const manifest=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
const ids=new Set();
for(const shard of manifest.shards) {
    for(const row of JSON.parse(fs.readFileSync(root+'/cities/'+shard+'.json','utf8'))) {
        ids.add(row[0]); assert(db.zones[row[6]],row[6]); assert(Math.abs(row[4])<=90&&Math.abs(row[5])<=180);
    }
}
assert.equal(ids.size,manifest.cityCount);
console.log(`全球地点测试通过：${ids.size}座城市、${Object.keys(db.zones).length}个时区、历史秒级偏移、南北半球夏令时、跳时/重复、同名筛选与2100年规则。`);

const html=fs.readFileSync(root+'/../index.html','utf8');
assert(html.includes('value="earlier"')&&html.includes('value="later"'),'重复时刻选择值须与解析器一致');
