# 全球城市与历史时区数据

- 城市：GeoNames `cities500.zip`（2026-11-13下载），237,004条城市/城镇记录；包括人口大于500的居民点及部分行政中心，不保证收录每一个小村落。
- 地区名：GeoNames `admin1CodesASCII.txt`。
- 来源：https://download.geonames.org/export/dump/ （https://www.geonames.org/）。
- 授权：Creative Commons Attribution 4.0，https://creativecommons.org/licenses/by/4.0/ 。本站对名称做归一化并按首字母拆分为静态搜索分片，保留名称、地区、坐标、GeoNames ID、IANA时区和部分别名。
- 时区：IANA TZDB 2026f，https://www.iana.org/time-zones 。从IANA官方2026f源文件经系统zic编译的TZif数据生成，保存历史UTC秒偏移、夏令时标记、缩写和转换时刻，支持1900—2100年的出生日期，包含TZif尾部未来规则展开。IANA时区数据库为公有领域：https://data.iana.org/time-zones/tzdb-2026f/LICENSE 。
- IANA主要保障1970年后的代表地区规则；更早的地方历史记录可能不完整，界面提示核对。未来日期沿用当前已知规则，法规变化后需要更新数据。
- 用户选择城市后才使用其时区，绝不按经度估算时区；同名城市通过国家和行政区区分。没有收录的地点可显式手动输入坐标及出生当天UTC偏移。
- 搜索和时区计算均在访客浏览器本地执行，不向地理编码第三方发送城市搜索或出生资料。

重新生成：`python3 fortune-chart/source/scripts/build-global-data.py /path/cities500.zip /path/admin1CodesASCII.txt fortune-chart/data /path/compiled-zoneinfo`。需要Python 3.9+，编译后的TZif目录带`+VERSION`（内容为IANA版本号）；省略第四个参数时读取系统目录`/usr/share/zoneinfo`；版本写入manifest。更新数据时同步界面的版本标注。

城市行格式：`[GeoNames ID, 名称, ISO国家码, 行政区名称, 纬度, 经度, IANA时区, 人口, 当前分片的检索别名]`。时区行格式：`[转换UTC秒时间戳, UTC偏移秒数, 是否夏令时, 缩写]`。
