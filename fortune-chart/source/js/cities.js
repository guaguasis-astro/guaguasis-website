// 主要城市经纬度数据库
// 格式: { city: "城市名", lat: 纬度, lng: 经度, province: "省份", aliases: ["别名"] }

const CITIES = [
    // ===== 直辖市 =====
    { city: "北京", lat: 39.9042, lng: 116.4074, province: "北京市" },
    { city: "上海", lat: 31.2304, lng: 121.4737, province: "上海市" },
    { city: "天津", lat: 39.3434, lng: 117.3616, province: "天津市" },
    { city: "重庆", lat: 29.5630, lng: 106.5516, province: "重庆市" },

    // ===== 河北省 =====
    { city: "石家庄", lat: 38.0428, lng: 114.5149, province: "河北省" },
    { city: "唐山", lat: 39.6308, lng: 118.1802, province: "河北省" },
    { city: "秦皇岛", lat: 39.9425, lng: 119.5965, province: "河北省" },
    { city: "邯郸", lat: 36.6256, lng: 114.5388, province: "河北省" },
    { city: "保定", lat: 38.8671, lng: 115.4847, province: "河北省" },
    { city: "张家口", lat: 40.8129, lng: 114.8844, province: "河北省" },
    { city: "承德", lat: 40.9527, lng: 117.9625, province: "河北省" },
    { city: "沧州", lat: 38.3044, lng: 116.8388, province: "河北省" },
    { city: "廊坊", lat: 39.5380, lng: 116.7080, province: "河北省" },
    { city: "衡水", lat: 37.7371, lng: 115.6732, province: "河北省" },

    // ===== 山西省 =====
    { city: "太原", lat: 37.8706, lng: 112.5489, province: "山西省" },
    { city: "大同", lat: 40.0768, lng: 113.2848, province: "山西省" },
    { city: "阳泉", lat: 37.8574, lng: 113.5816, province: "山西省" },
    { city: "长治", lat: 36.1955, lng: 113.1150, province: "山西省" },
    { city: "晋城", lat: 35.4903, lng: 112.8509, province: "山西省" },
    { city: "朔州", lat: 39.3318, lng: 112.4335, province: "山西省" },
    { city: "晋中", lat: 37.6869, lng: 112.7516, province: "山西省" },
    { city: "运城", lat: 35.0228, lng: 110.9922, province: "山西省" },
    { city: "忻州", lat: 38.4160, lng: 112.7336, province: "山西省" },
    { city: "临汾", lat: 36.0898, lng: 111.5190, province: "山西省" },
    { city: "吕梁", lat: 37.5243, lng: 111.1449, province: "山西省" },

    // ===== 内蒙古 =====
    { city: "呼和浩特", lat: 40.8426, lng: 111.7519, province: "内蒙古自治区" },
    { city: "包头", lat: 40.6573, lng: 109.8346, province: "内蒙古自治区" },
    { city: "乌海", lat: 39.6727, lng: 106.8021, province: "内蒙古自治区" },
    { city: "赤峰", lat: 42.2580, lng: 118.9594, province: "内蒙古自治区" },
    { city: "通辽", lat: 43.6527, lng: 122.2574, province: "内蒙古自治区" },
    { city: "鄂尔多斯", lat: 39.6085, lng: 109.7824, province: "内蒙古自治区" },
    { city: "呼伦贝尔", lat: 49.2126, lng: 119.7673, province: "内蒙古自治区" },
    { city: "巴彦淖尔", lat: 40.7442, lng: 107.3900, province: "内蒙古自治区" },
    { city: "乌兰察布", lat: 40.9977, lng: 113.1274, province: "内蒙古自治区" },

    // ===== 辽宁省 =====
    { city: "沈阳", lat: 41.8057, lng: 123.4315, province: "辽宁省" },
    { city: "大连", lat: 38.9140, lng: 121.6147, province: "辽宁省" },
    { city: "鞍山", lat: 41.1086, lng: 122.9946, province: "辽宁省" },
    { city: "抚顺", lat: 41.8856, lng: 123.9498, province: "辽宁省" },
    { city: "本溪", lat: 41.2982, lng: 123.7686, province: "辽宁省" },
    { city: "丹东", lat: 40.0058, lng: 124.3580, province: "辽宁省" },
    { city: "锦州", lat: 41.0928, lng: 121.1123, province: "辽宁省" },
    { city: "营口", lat: 40.6674, lng: 122.2506, province: "辽宁省" },
    { city: "阜新", lat: 42.0216, lng: 121.6703, province: "辽宁省" },
    { city: "辽阳", lat: 41.2712, lng: 123.2520, province: "辽宁省" },
    { city: "盘锦", lat: 41.1228, lng: 122.0708, province: "辽宁省" },
    { city: "铁岭", lat: 42.2146, lng: 123.8445, province: "辽宁省" },
    { city: "朝阳", lat: 41.5739, lng: 120.4521, province: "辽宁省" },
    { city: "葫芦岛", lat: 40.7110, lng: 120.8361, province: "辽宁省" },

    // ===== 吉林省 =====
    { city: "长春", lat: 43.8171, lng: 125.3235, province: "吉林省" },
    { city: "吉林", lat: 43.8427, lng: 126.5496, province: "吉林省" },
    { city: "四平", lat: 43.1700, lng: 124.3398, province: "吉林省" },
    { city: "辽源", lat: 42.8944, lng: 125.1449, province: "吉林省" },
    { city: "通化", lat: 41.7317, lng: 125.9368, province: "吉林省" },
    { city: "白山", lat: 41.9398, lng: 126.4274, province: "吉林省" },
    { city: "松原", lat: 45.1163, lng: 124.8251, province: "吉林省" },
    { city: "白城", lat: 45.6167, lng: 122.8360, province: "吉林省" },

    // ===== 黑龙江省 =====
    { city: "哈尔滨", lat: 45.8038, lng: 126.5350, province: "黑龙江省" },
    { city: "齐齐哈尔", lat: 47.3328, lng: 123.9464, province: "黑龙江省" },
    { city: "鸡西", lat: 45.2901, lng: 130.9690, province: "黑龙江省" },
    { city: "鹤岗", lat: 47.3365, lng: 130.2935, province: "黑龙江省" },
    { city: "双鸭山", lat: 46.6412, lng: 131.1550, province: "黑龙江省" },
    { city: "大庆", lat: 46.5873, lng: 125.1094, province: "黑龙江省" },
    { city: "伊春", lat: 47.7268, lng: 128.8429, province: "黑龙江省" },
    { city: "佳木斯", lat: 46.8111, lng: 130.3265, province: "黑龙江省" },
    { city: "七台河", lat: 45.7778, lng: 131.0030, province: "黑龙江省" },
    { city: "牡丹江", lat: 44.5523, lng: 129.6313, province: "黑龙江省" },
    { city: "黑河", lat: 50.2475, lng: 127.5238, province: "黑龙江省" },
    { city: "绥化", lat: 46.6377, lng: 126.9947, province: "黑龙江省" },

    // ===== 江苏省 =====
    { city: "南京", lat: 32.0603, lng: 118.7969, province: "江苏省" },
    { city: "无锡", lat: 31.4912, lng: 120.3119, province: "江苏省" },
    { city: "徐州", lat: 34.2044, lng: 117.2857, province: "江苏省" },
    { city: "常州", lat: 31.7727, lng: 119.9469, province: "江苏省" },
    { city: "苏州", lat: 31.2990, lng: 120.5853, province: "江苏省" },
    { city: "南通", lat: 31.9802, lng: 120.8947, province: "江苏省" },
    { city: "连云港", lat: 34.5972, lng: 119.2220, province: "江苏省" },
    { city: "淮安", lat: 33.5966, lng: 119.0232, province: "江苏省" },
    { city: "盐城", lat: 33.3765, lng: 120.1354, province: "江苏省" },
    { city: "扬州", lat: 32.3931, lng: 119.4128, province: "江苏省" },
    { city: "镇江", lat: 32.1880, lng: 119.4211, province: "江苏省" },
    { city: "泰州", lat: 32.4548, lng: 119.9211, province: "江苏省" },
    { city: "宿迁", lat: 33.9583, lng: 118.2757, province: "江苏省" },

    // ===== 浙江省 =====
    { city: "杭州", lat: 30.2741, lng: 120.1551, province: "浙江省" },
    { city: "宁波", lat: 29.8683, lng: 121.5440, province: "浙江省" },
    { city: "温州", lat: 27.9938, lng: 120.6994, province: "浙江省" },
    { city: "嘉兴", lat: 30.7467, lng: 120.7567, province: "浙江省" },
    { city: "湖州", lat: 30.8928, lng: 120.0892, province: "浙江省" },
    { city: "绍兴", lat: 30.0300, lng: 120.5800, province: "浙江省" },
    { city: "金华", lat: 29.0787, lng: 119.6474, province: "浙江省" },
    { city: "衢州", lat: 28.9711, lng: 118.8703, province: "浙江省" },
    { city: "舟山", lat: 30.0161, lng: 122.2075, province: "浙江省" },
    { city: "台州", lat: 28.6560, lng: 121.4206, province: "浙江省" },
    { city: "丽水", lat: 28.4517, lng: 119.9213, province: "浙江省" },

    // ===== 安徽省 =====
    { city: "合肥", lat: 31.8206, lng: 117.2272, province: "安徽省" },
    { city: "芜湖", lat: 31.3528, lng: 118.4325, province: "安徽省" },
    { city: "蚌埠", lat: 32.9276, lng: 117.3886, province: "安徽省" },
    { city: "淮南", lat: 32.6285, lng: 117.0289, province: "安徽省" },
    { city: "马鞍山", lat: 31.6705, lng: 118.5067, province: "安徽省" },
    { city: "淮北", lat: 33.9565, lng: 116.7981, province: "安徽省" },
    { city: "铜陵", lat: 30.9426, lng: 117.8132, province: "安徽省" },
    { city: "安庆", lat: 30.5278, lng: 117.0344, province: "安徽省" },
    { city: "黄山", lat: 29.7131, lng: 118.3379, province: "安徽省" },
    { city: "滁州", lat: 32.3175, lng: 118.3168, province: "安徽省" },
    { city: "阜阳", lat: 32.8901, lng: 115.8155, province: "安徽省" },
    { city: "宿州", lat: 33.6333, lng: 116.9833, province: "安徽省" },
    { city: "六安", lat: 31.7366, lng: 116.5085, province: "安徽省" },
    { city: "亳州", lat: 33.8442, lng: 115.7773, province: "安徽省" },
    { city: "池州", lat: 30.6581, lng: 117.4882, province: "安徽省" },
    { city: "宣城", lat: 30.9414, lng: 118.7585, province: "安徽省" },

    // ===== 福建省 =====
    { city: "福州", lat: 26.0745, lng: 119.2965, province: "福建省" },
    { city: "厦门", lat: 24.4798, lng: 118.0894, province: "福建省" },
    { city: "莆田", lat: 25.4307, lng: 119.0076, province: "福建省" },
    { city: "三明", lat: 26.2652, lng: 117.6379, province: "福建省" },
    { city: "泉州", lat: 24.8741, lng: 118.6758, province: "福建省" },
    { city: "漳州", lat: 24.5114, lng: 117.6535, province: "福建省" },
    { city: "南平", lat: 26.6378, lng: 118.1766, province: "福建省" },
    { city: "龙岩", lat: 25.0917, lng: 117.0315, province: "福建省" },
    { city: "宁德", lat: 26.6592, lng: 119.5355, province: "福建省" },

    // ===== 江西省 =====
    { city: "南昌", lat: 28.6820, lng: 115.8579, province: "江西省" },
    { city: "景德镇", lat: 29.2696, lng: 117.1761, province: "江西省" },
    { city: "萍乡", lat: 27.6176, lng: 113.8530, province: "江西省" },
    { city: "九江", lat: 29.7052, lng: 116.0009, province: "江西省" },
    { city: "新余", lat: 27.8220, lng: 114.9150, province: "江西省" },
    { city: "鹰潭", lat: 28.2386, lng: 117.0334, province: "江西省" },
    { city: "赣州", lat: 25.8311, lng: 114.9350, province: "江西省" },
    { city: "吉安", lat: 27.1114, lng: 114.9929, province: "江西省" },
    { city: "宜春", lat: 27.8128, lng: 114.4160, province: "江西省" },
    { city: "抚州", lat: 27.9833, lng: 116.3583, province: "江西省" },
    { city: "上饶", lat: 28.4555, lng: 117.9430, province: "江西省" },

    // ===== 山东省 =====
    { city: "济南", lat: 36.6512, lng: 117.1201, province: "山东省" },
    { city: "青岛", lat: 36.0671, lng: 120.3826, province: "山东省" },
    { city: "淄博", lat: 36.8131, lng: 118.0552, province: "山东省" },
    { city: "枣庄", lat: 34.8106, lng: 117.3230, province: "山东省" },
    { city: "东营", lat: 37.4344, lng: 118.6758, province: "山东省" },
    { city: "烟台", lat: 37.4638, lng: 121.4480, province: "山东省" },
    { city: "潍坊", lat: 36.7091, lng: 119.1618, province: "山东省" },
    { city: "济宁", lat: 35.4146, lng: 116.5871, province: "山东省" },
    { city: "泰安", lat: 36.2013, lng: 117.0822, province: "山东省" },
    { city: "威海", lat: 37.5127, lng: 122.1183, province: "山东省" },
    { city: "日照", lat: 35.4164, lng: 119.5273, province: "山东省" },
    { city: "临沂", lat: 35.1047, lng: 118.3564, province: "山东省" },
    { city: "德州", lat: 37.4477, lng: 116.3451, province: "山东省" },
    { city: "聊城", lat: 36.4565, lng: 115.9843, province: "山东省" },
    { city: "滨州", lat: 37.3804, lng: 117.9712, province: "山东省" },
    { city: "菏泽", lat: 35.2338, lng: 115.4800, province: "山东省" },
    { city: "莱芜", lat: 36.2134, lng: 117.6787, province: "山东省" },

    // ===== 河南省 =====
    { city: "郑州", lat: 34.7466, lng: 113.6254, province: "河南省" },
    { city: "开封", lat: 34.7971, lng: 114.3075, province: "河南省" },
    { city: "洛阳", lat: 34.6197, lng: 112.4535, province: "河南省" },
    { city: "平顶山", lat: 33.7351, lng: 113.1938, province: "河南省" },
    { city: "安阳", lat: 36.0976, lng: 114.3926, province: "河南省" },
    { city: "鹤壁", lat: 35.7458, lng: 114.2985, province: "河南省" },
    { city: "新乡", lat: 35.3027, lng: 113.9269, province: "河南省" },
    { city: "焦作", lat: 35.2158, lng: 113.2418, province: "河南省" },
    { city: "濮阳", lat: 35.7625, lng: 115.0292, province: "河南省" },
    { city: "许昌", lat: 34.0267, lng: 113.8527, province: "河南省" },
    { city: "漯河", lat: 33.5816, lng: 114.0130, province: "河南省" },
    { city: "三门峡", lat: 34.7748, lng: 111.2002, province: "河南省" },
    { city: "南阳", lat: 32.9909, lng: 112.5283, province: "河南省" },
    { city: "商丘", lat: 34.4145, lng: 115.6551, province: "河南省" },
    { city: "信阳", lat: 32.1289, lng: 114.0911, province: "河南省" },
    { city: "周口", lat: 33.6253, lng: 114.6981, province: "河南省" },
    { city: "驻马店", lat: 32.9802, lng: 114.0254, province: "河南省" },

    // ===== 湖北省 =====
    { city: "武汉", lat: 30.5928, lng: 114.3055, province: "湖北省" },
    { city: "黄石", lat: 30.1930, lng: 115.0420, province: "湖北省" },
    { city: "十堰", lat: 32.6270, lng: 110.7773, province: "湖北省" },
    { city: "宜昌", lat: 30.6917, lng: 111.2865, province: "湖北省" },
    { city: "襄阳", lat: 32.0089, lng: 112.1225, province: "湖北省" },
    { city: "鄂州", lat: 30.3844, lng: 114.8967, province: "湖北省" },
    { city: "荆门", lat: 31.0354, lng: 112.2045, province: "湖北省" },
    { city: "孝感", lat: 30.9259, lng: 113.9246, province: "湖北省" },
    { city: "荆州", lat: 30.3352, lng: 112.2397, province: "湖北省" },
    { city: "黄冈", lat: 30.4536, lng: 114.8740, province: "湖北省" },
    { city: "咸宁", lat: 29.8413, lng: 114.3218, province: "湖北省" },
    { city: "随州", lat: 31.6883, lng: 113.3767, province: "湖北省" },
    { city: "恩施", lat: 30.2808, lng: 109.4866, province: "湖北省" },

    // ===== 湖南省 =====
    { city: "长沙", lat: 28.2282, lng: 112.9388, province: "湖南省" },
    { city: "株洲", lat: 27.8277, lng: 113.1340, province: "湖南省" },
    { city: "湘潭", lat: 27.8291, lng: 112.9443, province: "湖南省" },
    { city: "衡阳", lat: 26.8932, lng: 112.5709, province: "湖南省" },
    { city: "邵阳", lat: 27.2379, lng: 111.4683, province: "湖南省" },
    { city: "岳阳", lat: 29.3577, lng: 113.1289, province: "湖南省" },
    { city: "常德", lat: 29.0402, lng: 111.6963, province: "湖南省" },
    { city: "张家界", lat: 29.1167, lng: 110.4792, province: "湖南省" },
    { city: "益阳", lat: 28.5605, lng: 112.3560, province: "湖南省" },
    { city: "郴州", lat: 25.7705, lng: 113.0122, province: "湖南省" },
    { city: "永州", lat: 26.2270, lng: 111.6083, province: "湖南省" },
    { city: "怀化", lat: 27.5551, lng: 109.9930, province: "湖南省" },
    { city: "娄底", lat: 27.7013, lng: 111.9944, province: "湖南省" },
    { city: "湘西", lat: 28.3137, lng: 109.7397, province: "湖南省" },
    { city: "礼县", lat: 34.1989, lng: 105.1207, province: "甘肃省" },
    { city: "澧县", lat: 29.6477, lng: 111.7577, province: "湖南省" },

    // ===== 广东省 =====
    { city: "广州", lat: 23.1291, lng: 113.2644, province: "广东省" },
    { city: "深圳", lat: 22.5431, lng: 114.0579, province: "广东省" },
    { city: "珠海", lat: 22.2707, lng: 113.5767, province: "广东省" },
    { city: "汕头", lat: 23.3541, lng: 116.6810, province: "广东省" },
    { city: "佛山", lat: 23.0218, lng: 113.1219, province: "广东省" },
    { city: "韶关", lat: 24.8101, lng: 113.5921, province: "广东省" },
    { city: "湛江", lat: 21.2708, lng: 110.3600, province: "广东省" },
    { city: "肇庆", lat: 23.0472, lng: 112.4653, province: "广东省" },
    { city: "江门", lat: 22.5780, lng: 113.0818, province: "广东省" },
    { city: "茂名", lat: 21.6626, lng: 110.9253, province: "广东省" },
    { city: "惠州", lat: 23.1117, lng: 114.4167, province: "广东省" },
    { city: "梅州", lat: 24.2899, lng: 116.1222, province: "广东省" },
    { city: "汕尾", lat: 22.7779, lng: 115.3754, province: "广东省" },
    { city: "河源", lat: 23.7437, lng: 114.6978, province: "广东省" },
    { city: "阳江", lat: 21.8591, lng: 111.9712, province: "广东省" },
    { city: "清远", lat: 23.6817, lng: 113.0561, province: "广东省" },
    { city: "东莞", lat: 23.0489, lng: 113.7447, province: "广东省" },
    { city: "中山", lat: 22.5150, lng: 113.3928, province: "广东省" },
    { city: "潮州", lat: 23.6568, lng: 116.6226, province: "广东省" },
    { city: "揭阳", lat: 23.5493, lng: 116.3729, province: "广东省" },
    { city: "云浮", lat: 22.9161, lng: 112.0424, province: "广东省" },

    // ===== 广西 =====
    { city: "南宁", lat: 22.8170, lng: 108.3665, province: "广西壮族自治区" },
    { city: "柳州", lat: 24.3295, lng: 109.4134, province: "广西壮族自治区" },
    { city: "桂林", lat: 25.2737, lng: 110.2900, province: "广西壮族自治区" },
    { city: "梧州", lat: 23.4758, lng: 111.2799, province: "广西壮族自治区" },
    { city: "北海", lat: 21.4733, lng: 109.1194, province: "广西壮族自治区" },
    { city: "防城港", lat: 21.6900, lng: 108.3318, province: "广西壮族自治区" },
    { city: "钦州", lat: 21.9800, lng: 108.6510, province: "广西壮族自治区" },
    { city: "贵港", lat: 23.1131, lng: 109.6018, province: "广西壮族自治区" },
    { city: "玉林", lat: 22.6333, lng: 110.1500, province: "广西壮族自治区" },
    { city: "百色", lat: 23.8970, lng: 106.6211, province: "广西壮族自治区" },
    { city: "贺州", lat: 24.4035, lng: 111.5670, province: "广西壮族自治区" },
    { city: "河池", lat: 24.6951, lng: 108.0622, province: "广西壮族自治区" },
    { city: "来宾", lat: 23.7414, lng: 109.2280, province: "广西壮族自治区" },
    { city: "崇左", lat: 22.3668, lng: 107.3639, province: "广西壮族自治区" },

    // ===== 海南省 =====
    { city: "海口", lat: 20.0440, lng: 110.1920, province: "海南省" },
    { city: "三亚", lat: 18.2528, lng: 109.5113, province: "海南省" },
    { city: "三沙", lat: 16.8325, lng: 112.3333, province: "海南省" },
    { city: "儋州", lat: 19.5178, lng: 109.5767, province: "海南省" },

    // ===== 四川省 =====
    { city: "成都", lat: 30.5728, lng: 104.0668, province: "四川省" },
    { city: "自贡", lat: 29.3392, lng: 104.7784, province: "四川省" },
    { city: "攀枝花", lat: 26.5801, lng: 101.7128, province: "四川省" },
    { city: "泸州", lat: 28.8725, lng: 105.4415, province: "四川省" },
    { city: "德阳", lat: 31.1268, lng: 104.3981, province: "四川省" },
    { city: "绵阳", lat: 31.4640, lng: 104.7417, province: "四川省" },
    { city: "广元", lat: 32.4356, lng: 105.8446, province: "四川省" },
    { city: "遂宁", lat: 30.5134, lng: 105.5710, province: "四川省" },
    { city: "内江", lat: 29.5827, lng: 105.0573, province: "四川省" },
    { city: "乐山", lat: 29.5523, lng: 103.7609, province: "四川省" },
    { city: "南充", lat: 30.8376, lng: 106.1106, province: "四川省" },
    { city: "眉山", lat: 30.0766, lng: 103.8527, province: "四川省" },
    { city: "宜宾", lat: 28.7636, lng: 104.6390, province: "四川省" },
    { city: "广安", lat: 30.4563, lng: 106.6333, province: "四川省" },
    { city: "达州", lat: 31.2094, lng: 107.4676, province: "四川省" },
    { city: "雅安", lat: 29.9877, lng: 103.0010, province: "四川省" },
    { city: "巴中", lat: 31.8596, lng: 106.7473, province: "四川省" },
    { city: "资阳", lat: 30.1227, lng: 104.6419, province: "四川省" },

    // ===== 贵州省 =====
    { city: "贵阳", lat: 26.6470, lng: 106.6302, province: "贵州省" },
    { city: "六盘水", lat: 26.5912, lng: 104.8310, province: "贵州省" },
    { city: "遵义", lat: 27.7257, lng: 106.9283, province: "贵州省" },
    { city: "安顺", lat: 26.2460, lng: 105.9450, province: "贵州省" },
    { city: "毕节", lat: 27.2995, lng: 105.2870, province: "贵州省" },
    { city: "铜仁", lat: 27.7195, lng: 109.1923, province: "贵州省" },

    // ===== 云南省 =====
    { city: "昆明", lat: 25.0389, lng: 102.7183, province: "云南省" },
    { city: "曲靖", lat: 25.4900, lng: 103.7959, province: "云南省" },
    { city: "玉溪", lat: 24.3519, lng: 102.5446, province: "云南省" },
    { city: "保山", lat: 25.1125, lng: 99.1612, province: "云南省" },
    { city: "昭通", lat: 27.3374, lng: 103.7170, province: "云南省" },
    { city: "丽江", lat: 26.8552, lng: 100.2270, province: "云南省" },
    { city: "普洱", lat: 22.8258, lng: 100.9666, province: "云南省" },
    { city: "临沧", lat: 23.8850, lng: 100.0854, province: "云南省" },
    { city: "楚雄", lat: 25.0385, lng: 101.5455, province: "云南省" },
    { city: "红河", lat: 23.3639, lng: 103.3839, province: "云南省" },
    { city: "文山", lat: 23.3690, lng: 104.2418, province: "云南省" },
    { city: "西双版纳", lat: 22.0031, lng: 100.7978, province: "云南省" },
    { city: "大理", lat: 25.6065, lng: 100.2679, province: "云南省" },
    { city: "德宏", lat: 24.4344, lng: 98.5905, province: "云南省" },
    { city: "怒江", lat: 25.8560, lng: 98.8589, province: "云南省" },
    { city: "迪庆", lat: 27.8284, lng: 99.7070, province: "云南省" },

    // ===== 西藏 =====
    { city: "拉萨", lat: 29.6520, lng: 91.1721, province: "西藏自治区" },
    { city: "日喀则", lat: 29.2674, lng: 88.8824, province: "西藏自治区" },
    { city: "昌都", lat: 31.1391, lng: 97.1756, province: "西藏自治区" },
    { city: "林芝", lat: 29.6486, lng: 94.3608, province: "西藏自治区" },
    { city: "山南", lat: 29.2373, lng: 91.7718, province: "西藏自治区" },
    { city: "那曲", lat: 31.4765, lng: 92.0598, province: "西藏自治区" },
    { city: "阿里", lat: 32.5031, lng: 80.1132, province: "西藏自治区" },

    // ===== 陕西省 =====
    { city: "西安", lat: 34.3416, lng: 108.9398, province: "陕西省" },
    { city: "铜川", lat: 34.8985, lng: 109.0413, province: "陕西省" },
    { city: "宝鸡", lat: 34.3564, lng: 107.2345, province: "陕西省" },
    { city: "咸阳", lat: 34.3422, lng: 108.7069, province: "陕西省" },
    { city: "渭南", lat: 34.4995, lng: 109.4989, province: "陕西省" },
    { city: "延安", lat: 36.5850, lng: 109.4890, province: "陕西省" },
    { city: "汉中", lat: 33.0674, lng: 107.0286, province: "陕西省" },
    { city: "榆林", lat: 38.2901, lng: 109.7330, province: "陕西省" },
    { city: "安康", lat: 32.6850, lng: 109.0290, province: "陕西省" },
    { city: "商洛", lat: 33.8667, lng: 109.9400, province: "陕西省" },

    // ===== 甘肃省 =====
    { city: "兰州", lat: 36.0611, lng: 103.8343, province: "甘肃省" },
    { city: "嘉峪关", lat: 39.7735, lng: 98.2857, province: "甘肃省" },
    { city: "金昌", lat: 38.5200, lng: 102.1830, province: "甘肃省" },
    { city: "白银", lat: 36.5433, lng: 104.1500, province: "甘肃省" },
    { city: "天水", lat: 34.5800, lng: 105.7240, province: "甘肃省" },
    { city: "武威", lat: 37.9334, lng: 102.6417, province: "甘肃省" },
    { city: "张掖", lat: 38.9277, lng: 100.4519, province: "甘肃省" },
    { city: "平凉", lat: 35.5428, lng: 106.6655, province: "甘肃省" },
    { city: "酒泉", lat: 39.7436, lng: 98.4952, province: "甘肃省" },
    { city: "庆阳", lat: 35.9015, lng: 107.6380, province: "甘肃省" },
    { city: "定西", lat: 35.5810, lng: 104.6250, province: "甘肃省" },
    { city: "陇南", lat: 33.3885, lng: 104.9271, province: "甘肃省" },
    { city: "临夏", lat: 35.6015, lng: 103.2083, province: "甘肃省" },
    { city: "甘南", lat: 34.9864, lng: 102.9110, province: "甘肃省" },

    // ===== 青海省 =====
    { city: "西宁", lat: 36.6171, lng: 101.7782, province: "青海省" },
    { city: "海东", lat: 36.5033, lng: 102.1041, province: "青海省" },
    { city: "海北", lat: 36.9588, lng: 100.9019, province: "青海省" },
    { city: "黄南", lat: 35.5167, lng: 102.0167, province: "青海省" },
    { city: "海南", lat: 36.2851, lng: 100.6223, province: "青海省" },
    { city: "果洛", lat: 34.4728, lng: 100.2410, province: "青海省" },
    { city: "玉树", lat: 33.0042, lng: 97.0094, province: "青海省" },
    { city: "海西", lat: 37.3769, lng: 97.3708, province: "青海省" },

    // ===== 宁夏 =====
    { city: "银川", lat: 38.4872, lng: 106.2309, province: "宁夏回族自治区" },
    { city: "石嘴山", lat: 39.0178, lng: 106.3799, province: "宁夏回族自治区" },
    { city: "吴忠", lat: 37.9881, lng: 106.1853, province: "宁夏回族自治区" },
    { city: "固原", lat: 36.0151, lng: 106.2810, province: "宁夏回族自治区" },
    { city: "中卫", lat: 37.5160, lng: 105.1932, province: "宁夏回族自治区" },

    // ===== 新疆 =====
    { city: "乌鲁木齐", lat: 43.8256, lng: 87.6168, province: "新疆维吾尔自治区" },
    { city: "克拉玛依", lat: 45.5925, lng: 84.8870, province: "新疆维吾尔自治区" },
    { city: "吐鲁番", lat: 42.9462, lng: 89.1830, province: "新疆维吾尔自治区" },
    { city: "哈密", lat: 42.8333, lng: 93.5167, province: "新疆维吾尔自治区" },
    { city: "昌吉", lat: 44.0167, lng: 87.3167, province: "新疆维吾尔自治区" },
    { city: "博尔塔拉", lat: 44.9035, lng: 82.0685, province: "新疆维吾尔自治区" },
    { city: "巴音郭楞", lat: 41.7638, lng: 86.1469, province: "新疆维吾尔自治区" },
    { city: "阿克苏", lat: 41.1688, lng: 80.2603, province: "新疆维吾尔自治区" },
    { city: "克孜勒苏", lat: 39.7167, lng: 76.1667, province: "新疆维吾尔自治区" },
    { city: "喀什", lat: 39.4704, lng: 75.9898, province: "新疆维吾尔自治区" },
    { city: "和田", lat: 37.1125, lng: 79.9263, province: "新疆维吾尔自治区" },
    { city: "伊犁", lat: 43.9167, lng: 81.3333, province: "新疆维吾尔自治区" },
    { city: "塔城", lat: 46.7667, lng: 82.9833, province: "新疆维吾尔自治区" },
    { city: "阿勒泰", lat: 47.8460, lng: 88.1401, province: "新疆维吾尔自治区" },
    { city: "石河子", lat: 44.2991, lng: 85.9377, province: "新疆维吾尔自治区" },
    { city: "阿拉尔", lat: 40.5500, lng: 81.2833, province: "新疆维吾尔自治区" },
    { city: "图木舒克", lat: 39.8671, lng: 79.0674, province: "新疆维吾尔自治区" },
    { city: "五家渠", lat: 44.1898, lng: 87.5365, province: "新疆维吾尔自治区" },

    // ===== 港澳台 =====
    { city: "香港", lat: 22.3193, lng: 114.1694, province: "香港特别行政区" },
    { city: "澳门", lat: 22.1987, lng: 113.5439, province: "澳门特别行政区" },
    { city: "台北", lat: 25.0330, lng: 121.5654, province: "台湾省" },
    { city: "高雄", lat: 22.6273, lng: 120.3014, province: "台湾省" },
    { city: "台南", lat: 22.9998, lng: 120.2128, province: "台湾省" },
    { city: "台中", lat: 24.1477, lng: 120.6736, province: "台湾省" },
    { city: "新北", lat: 25.0130, lng: 121.4685, province: "台湾省" },
    { city: "桃园", lat: 24.9936, lng: 121.3009, province: "台湾省" },

    // ===== 国际主要城市 =====
    { city: "纽约", lat: 40.7128, lng: -74.0060, province: "美国" },
    { city: "洛杉矶", lat: 34.0522, lng: -118.2437, province: "美国" },
    { city: "芝加哥", lat: 41.8781, lng: -87.6298, province: "美国" },
    { city: "旧金山", lat: 37.7749, lng: -122.4194, province: "美国" },
    { city: "西雅图", lat: 47.6062, lng: -122.3321, province: "美国" },
    { city: "华盛顿", lat: 38.9072, lng: -77.0369, province: "美国" },
    { city: "波士顿", lat: 42.3601, lng: -71.0589, province: "美国" },
    { city: "伦敦", lat: 51.5074, lng: -0.1278, province: "英国" },
    { city: "巴黎", lat: 48.8566, lng: 2.3522, province: "法国" },
    { city: "柏林", lat: 52.5200, lng: 13.4050, province: "德国" },
    { city: "罗马", lat: 41.9028, lng: 12.4964, province: "意大利" },
    { city: "马德里", lat: 40.4168, lng: -3.7038, province: "西班牙" },
    { city: "莫斯科", lat: 55.7558, lng: 37.6173, province: "俄罗斯" },
    { city: "东京", lat: 35.6762, lng: 139.6503, province: "日本" },
    { city: "大阪", lat: 34.6937, lng: 135.5023, province: "日本" },
    { city: "首尔", lat: 37.5665, lng: 126.9780, province: "韩国" },
    { city: "新加坡", lat: 1.3521, lng: 103.8198, province: "新加坡" },
    { city: "曼谷", lat: 13.7563, lng: 100.5018, province: "泰国" },
    { city: "吉隆坡", lat: 3.1390, lng: 101.6869, province: "马来西亚" },
    { city: "雅加达", lat: -6.2088, lng: 106.8456, province: "印度尼西亚" },
    { city: "马尼拉", lat: 14.5995, lng: 120.9842, province: "菲律宾" },
    { city: "孟买", lat: 19.0760, lng: 72.8777, province: "印度" },
    { city: "新德里", lat: 28.6139, lng: 77.2090, province: "印度" },
    { city: "迪拜", lat: 25.2048, lng: 55.2708, province: "阿联酋" },
    { city: "开罗", lat: 30.0444, lng: 31.2357, province: "埃及" },
    { city: "开普敦", lat: -33.9249, lng: 18.4241, province: "南非" },
    { city: "悉尼", lat: -33.8688, lng: 151.2093, province: "澳大利亚" },
    { city: "墨尔本", lat: -37.8136, lng: 144.9631, province: "澳大利亚" },
    { city: "奥克兰", lat: -36.8485, lng: 174.7633, province: "新西兰" },
    { city: "多伦多", lat: 43.6532, lng: -79.3832, province: "加拿大" },
    { city: "温哥华", lat: 49.2827, lng: -123.1207, province: "加拿大" },
    { city: "蒙特利尔", lat: 45.5017, lng: -73.5673, province: "加拿大" },
    { city: "里约热内卢", lat: -22.9068, lng: -43.1729, province: "巴西" },
    { city: "圣保罗", lat: -23.5505, lng: -46.6333, province: "巴西" },
    { city: "墨西哥城", lat: 19.4326, lng: -99.1332, province: "墨西哥" },
    { city: "布宜诺斯艾利斯", lat: -34.6037, lng: -58.3816, province: "阿根廷" },
];

// 国家/地区到时区的映射（标准时区，不考虑夏令时）
const COUNTRY_TIMEZONE = {
    "美国": -5,       // 默认东部时间（纽约/华盛顿/波士顿）
    "英国": 0,
    "法国": 1,
    "德国": 1,
    "意大利": 1,
    "西班牙": 1,
    "俄罗斯": 3,      // 莫斯科时间
    "日本": 9,
    "韩国": 9,
    "新加坡": 8,
    "泰国": 7,
    "马来西亚": 8,
    "印度尼西亚": 7,
    "菲律宾": 8,
    "印度": 5.5,
    "阿联酋": 4,
    "埃及": 2,
    "南非": 2,
    "澳大利亚": 10,   // 悉尼/墨尔本（东部时间）
    "新西兰": 12,
    "加拿大": -5,     // 默认东部时间（多伦多/蒙特利尔）
    "巴西": -3,
    "墨西哥": -6,
    "阿根廷": -3,
};

// 特殊城市的时区（覆盖国家默认值）
const CITY_TIMEZONE_OVERRIDE = {
    // 美国
    "洛杉矶": -8,     // 太平洋时间
    "旧金山": -8,
    "西雅图": -8,
    "芝加哥": -6,     // 中部时间
    // 加拿大
    "温哥华": -8,     // 太平洋时间
    // 澳大利亚
    // 悉尼/墨尔本是 +10（与国家默认一致，夏令时 +11，此处用标准时）
    // 印度
    "孟买": 5.5,
    "新德里": 5.5,
};

// 获取城市时区
function getCityTimezone(cityObj) {
    // 优先用城市级覆盖
    if (CITY_TIMEZONE_OVERRIDE[cityObj.city] !== undefined) {
        return CITY_TIMEZONE_OVERRIDE[cityObj.city];
    }
    // 中国（含港澳台）统一 +8
    const prov = cityObj.province;
    if (prov.includes("省") || prov.includes("市") ||
        prov === "北京市" || prov === "上海市" || prov === "天津市" || prov === "重庆市" ||
        prov === "香港特别行政区" || prov === "澳门特别行政区" || prov === "台湾省" ||
        prov.includes("自治区")) {
        return 8;
    }
    // 按国家查
    if (COUNTRY_TIMEZONE[prov] !== undefined) {
        return COUNTRY_TIMEZONE[prov];
    }
    // 默认按经度估算：Math.round(lng / 15)
    return Math.round(cityObj.lng / 15);
}

// 搜索城市
export function searchCity(query) {
    if (!query || !query.trim()) return null;
    const q = query.trim();

    // 精确匹配城市名
    let result = CITIES.find(c => c.city === q);
    if (result) return result;

    // 精确匹配含省份的格式（如 "山东省淄博市"）
    // 先去掉"市""县""区"后缀再匹配
    const cleanQ = q.replace(/[市区县盟自治州省]$/, '');
    result = CITIES.find(c => c.city === cleanQ);
    if (result) return result;

    // 匹配 "XX省XX市" 格式
    const provMatch = q.match(/^(.+?)[省](.+)$/);
    if (provMatch) {
        const prov = provMatch[1];
        const cityName = provMatch[2].replace(/[市区县]$/, '');
        result = CITIES.find(c =>
            (c.province.includes(prov) || c.province.startsWith(prov)) &&
            c.city === cityName
        );
        if (result) return result;
    }

    // 模糊匹配（城市名包含查询词）
    result = CITIES.find(c => c.city.includes(q) || q.includes(c.city));
    if (result) return result;

    return null;
}

// 获取城市完整信息
export function getCityLatLng(query) {
    const city = searchCity(query);
    if (city) {
        return {
            lat: city.lat,
            lng: city.lng,
            city: city.city,
            province: city.province,
            timezone: getCityTimezone(city),
        };
    }
    return null;
}
