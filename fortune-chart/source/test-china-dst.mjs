import assert from 'node:assert/strict';
import { MAINLAND_DST_DATES, resolveMainlandTime, applyMainlandTime, isMainlandPlace } from './js/china-dst.js';
const input = (year, month, day, hour = 12, minute = 0, place = '北京') => ({year,month,day,hour,minute,second:0,place,timezone:8});
for (const place of ['北京','山东省淄博市','上海市','乌鲁木齐','四川省某县','中国广东省某镇']) assert(isMainlandPlace(place),place);
for (const place of ['香港','澳门','台北','台湾省高雄市','东京','新加坡','纽约','未知地点','']) assert(!isMainlandPlace(place),place);
for (const [year, range] of Object.entries(MAINLAND_DST_DATES)) {
    const [sm, sd] = range.start.split('-').map(Number);
    const [em, ed] = range.end.split('-').map(Number);
    assert.equal(resolveMainlandTime(input(+year,sm,sd,1,59)).timezone,8);
    assert.equal(resolveMainlandTime(input(+year,sm,sd,2,0)).mode,'invalid');
    assert.equal(resolveMainlandTime(input(+year,sm,sd,2,59)).mode,'invalid');
    assert.equal(resolveMainlandTime(input(+year,sm,sd,3,0)).timezone,9);
    assert.equal(resolveMainlandTime(input(+year,em,ed,0,59)).timezone,9);
    assert.equal(resolveMainlandTime(input(+year,em,ed,1,0)).mode,'ambiguous');
    assert.equal(resolveMainlandTime({...input(+year,em,ed,1,30),dstOccurrence:'daylight'}).timezone,9);
    assert.equal(resolveMainlandTime({...input(+year,em,ed,1,30),dstOccurrence:'standard'}).timezone,8);
    assert.equal(resolveMainlandTime(input(+year,em,ed,2,0)).timezone,8);
    assert.equal(resolveMainlandTime(input(+year,7,1)).timezone,9);
    assert.equal(resolveMainlandTime(input(+year,12,1)).timezone,8);
}
assert.equal(resolveMainlandTime(input(1986,4,13)).timezone,8);
assert.equal(resolveMainlandTime(input(1986,5,3)).timezone,8);
for (const y of [1935,1952,1974,1979,1985,1992,2026]) assert.equal(resolveMainlandTime(input(y,7,1)).timezone,8);
for (const place of ['台北','香港','澳门','东京','新加坡']) {
    const birth = input(1990,7,1,12,0,place);
    assert.deepEqual(applyMainlandTime(birth),birth);
}
const birth = input(1990,7,1,0,30);
const result = applyMainlandTime(birth);
assert.equal(result.timezone,9);
assert.equal(result.hour,0);
assert.equal(result.minute,30);
assert.equal(result.day,1);
assert.equal(birth.timezone,8);
assert.deepEqual(applyMainlandTime(result),result);
assert.throws(()=>applyMainlandTime(input(1990,4,15,2,30)),/核对/);
assert.throws(()=>applyMainlandTime(input(1990,9,16,1,30)),/两次/);
// 同一出生钟表时间，使用+9比+8得到的UTC时刻早一小时。
const utc = data => Date.UTC(data.year,data.month-1,data.day,data.hour,data.minute)-data.timezone*3600000;
assert.equal(utc(birth)-utc(result),3600000);
console.log('大陆夏令时测试通过：六年起止边界、跳时与重复时刻、地区排除、1986推迟、旧年份不套用、出生时间不变及重复调用。');
