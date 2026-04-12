-- ============================================================
-- 서울특별시 (25개구)
-- ============================================================
INSERT INTO region (code, sido_code, sido, sigungu, center_lat, center_lng, region_type, is_active, created_at, updated_at)
VALUES
    ('11110', '11', '서울특별시', '종로구',    37.5735, 126.9790, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('11140', '11', '서울특별시', '중구',      37.5641, 126.9979, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('11170', '11', '서울특별시', '용산구',    37.5326, 126.9910, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('11200', '11', '서울특별시', '성동구',    37.5634, 127.0369, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('11215', '11', '서울특별시', '광진구',    37.5385, 127.0824, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('11230', '11', '서울특별시', '동대문구',  37.5744, 127.0396, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('11260', '11', '서울특별시', '중랑구',    37.6066, 127.0928, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('11290', '11', '서울특별시', '성북구',    37.5894, 127.0167, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('11305', '11', '서울특별시', '강북구',    37.6398, 127.0255, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('11320', '11', '서울특별시', '도봉구',    37.6688, 127.0472, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('11350', '11', '서울특별시', '노원구',    37.6542, 127.0568, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('11380', '11', '서울특별시', '은평구',    37.6027, 126.9291, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('11410', '11', '서울특별시', '서대문구',  37.5791, 126.9368, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('11440', '11', '서울특별시', '마포구',    37.5663, 126.9014, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('11470', '11', '서울특별시', '양천구',    37.5170, 126.8667, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('11500', '11', '서울특별시', '강서구',    37.5509, 126.8495, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('11530', '11', '서울특별시', '구로구',    37.4955, 126.8878, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('11545', '11', '서울특별시', '금천구',    37.4569, 126.8955, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('11560', '11', '서울특별시', '영등포구',  37.5264, 126.8963, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('11590', '11', '서울특별시', '동작구',    37.5124, 126.9394, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('11620', '11', '서울특별시', '관악구',    37.4784, 126.9516, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('11650', '11', '서울특별시', '서초구',    37.4837, 127.0324, 'REGULATED',     TRUE, NOW(), NOW()),
    ('11680', '11', '서울특별시', '강남구',    37.5172, 127.0473, 'REGULATED',     TRUE, NOW(), NOW()),
    ('11710', '11', '서울특별시', '송파구',    37.5145, 127.1059, 'REGULATED',     TRUE, NOW(), NOW()),
    ('11740', '11', '서울특별시', '강동구',    37.5301, 127.1238, 'REGULATED',     TRUE, NOW(), NOW());

-- ============================================================
-- 경기도 (37개)
-- ============================================================
INSERT INTO region (code, sido_code, sido, sigungu, center_lat, center_lng, region_type, is_active, created_at, updated_at)
VALUES
    ('41111', '41', '경기도', '수원시 장안구',    37.2994, 127.0085, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('41113', '41', '경기도', '수원시 권선구',    37.2573, 126.9716, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('41115', '41', '경기도', '수원시 팔달구',    37.2851, 127.0195, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('41117', '41', '경기도', '수원시 영통구',    37.2596, 127.0464, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('41131', '41', '경기도', '성남시 수정구',    37.4500, 127.1457, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('41133', '41', '경기도', '성남시 중원구',    37.4318, 127.1384, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('41135', '41', '경기도', '성남시 분당구',    37.3825, 127.1199, 'REGULATED',     TRUE, NOW(), NOW()),
    ('41150', '41', '경기도', '의정부시',          37.7381, 127.0337, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('41171', '41', '경기도', '안양시 만안구',    37.3866, 126.9200, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('41173', '41', '경기도', '안양시 동안구',    37.3943, 126.9514, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('41190', '41', '경기도', '부천시',            37.5034, 126.7660, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('41210', '41', '경기도', '광명시',            37.4787, 126.8643, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('41220', '41', '경기도', '평택시',            36.9922, 127.1130, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('41250', '41', '경기도', '동두천시',          37.9034, 127.0605, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('41271', '41', '경기도', '안산시 상록구',    37.3000, 126.8469, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('41273', '41', '경기도', '안산시 단원구',    37.3185, 126.7944, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('41281', '41', '경기도', '고양시 덕양구',    37.6373, 126.8322, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('41285', '41', '경기도', '고양시 일산동구',  37.6586, 126.7743, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('41287', '41', '경기도', '고양시 일산서구',  37.6794, 126.7509, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('41290', '41', '경기도', '과천시',            37.4292, 126.9876, 'REGULATED',     TRUE, NOW(), NOW()),
    ('41310', '41', '경기도', '구리시',            37.5943, 127.1295, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('41360', '41', '경기도', '남양주시',          37.6360, 127.2165, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('41370', '41', '경기도', '오산시',            37.1498, 127.0773, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('41390', '41', '경기도', '시흥시',            37.3800, 126.8028, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('41410', '41', '경기도', '군포시',            37.3617, 126.9352, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('41430', '41', '경기도', '의왕시',            37.3445, 126.9686, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('41450', '41', '경기도', '하남시',            37.5393, 127.2141, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('41461', '41', '경기도', '용인시 처인구',    37.2341, 127.2009, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('41463', '41', '경기도', '용인시 기흥구',    37.2800, 127.1150, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('41465', '41', '경기도', '용인시 수지구',    37.3222, 127.0988, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('41480', '41', '경기도', '파주시',            37.7600, 126.7800, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('41500', '41', '경기도', '이천시',            37.2720, 127.4350, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('41550', '41', '경기도', '안성시',            37.0080, 127.2797, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('41570', '41', '경기도', '김포시',            37.6152, 126.7157, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('41590', '41', '경기도', '화성시',            37.2000, 126.8311, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('41610', '41', '경기도', '광주시',            37.4095, 127.2573, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('41630', '41', '경기도', '양주시',            37.7853, 127.0458, 'NON_REGULATED', TRUE, NOW(), NOW());

-- ============================================================
-- 인천광역시 (10개)
-- ============================================================
INSERT INTO region (code, sido_code, sido, sigungu, center_lat, center_lng, region_type, is_active, created_at, updated_at)
VALUES
    ('28110', '28', '인천광역시', '중구',      37.4737, 126.6216, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('28140', '28', '인천광역시', '동구',      37.4736, 126.6432, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('28177', '28', '인천광역시', '미추홀구',  37.4464, 126.6503, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('28185', '28', '인천광역시', '연수구',    37.4101, 126.6783, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('28200', '28', '인천광역시', '남동구',    37.4488, 126.7316, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('28237', '28', '인천광역시', '부평구',    37.5075, 126.7219, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('28245', '28', '인천광역시', '계양구',    37.5376, 126.7377, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('28260', '28', '인천광역시', '서구',      37.5449, 126.6760, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('28710', '28', '인천광역시', '강화군',    37.7469, 126.4883, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('28720', '28', '인천광역시', '옹진군',    37.4467, 126.6367, 'NON_REGULATED', TRUE, NOW(), NOW());

-- ============================================================
-- 부산광역시 (16개)
-- ============================================================
INSERT INTO region (code, sido_code, sido, sigungu, center_lat, center_lng, region_type, is_active, created_at, updated_at)
VALUES
    ('26110', '26', '부산광역시', '중구',      35.1064, 129.0326, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('26140', '26', '부산광역시', '서구',      35.0977, 129.0243, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('26170', '26', '부산광역시', '동구',      35.1295, 129.0454, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('26200', '26', '부산광역시', '영도구',    35.0912, 129.0688, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('26230', '26', '부산광역시', '부산진구',  35.1629, 129.0533, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('26260', '26', '부산광역시', '동래구',    35.1959, 129.0845, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('26290', '26', '부산광역시', '남구',      35.1368, 129.0849, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('26320', '26', '부산광역시', '북구',      35.1972, 129.0293, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('26350', '26', '부산광역시', '해운대구',  35.1631, 129.1636, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('26380', '26', '부산광역시', '사하구',    35.1046, 128.9747, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('26410', '26', '부산광역시', '금정구',    35.2432, 129.0914, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('26440', '26', '부산광역시', '강서구',    35.2122, 128.9808, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('26470', '26', '부산광역시', '연제구',    35.1760, 129.0798, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('26500', '26', '부산광역시', '수영구',    35.1456, 129.1131, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('26530', '26', '부산광역시', '사상구',    35.1525, 128.9913, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('26710', '26', '부산광역시', '기장군',    35.2445, 129.2224, 'NON_REGULATED', TRUE, NOW(), NOW());

-- ============================================================
-- 대구광역시 (8개)
-- ============================================================
INSERT INTO region (code, sido_code, sido, sigungu, center_lat, center_lng, region_type, is_active, created_at, updated_at)
VALUES
    ('27110', '27', '대구광역시', '중구',    35.8690, 128.6063, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('27140', '27', '대구광역시', '동구',    35.8863, 128.6359, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('27170', '27', '대구광역시', '서구',    35.8718, 128.5592, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('27200', '27', '대구광역시', '남구',    35.8460, 128.5975, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('27230', '27', '대구광역시', '북구',    35.8857, 128.5829, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('27260', '27', '대구광역시', '수성구',  35.8583, 128.6321, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('27290', '27', '대구광역시', '달서구',  35.8500, 128.5327, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('27710', '27', '대구광역시', '달성군',  35.7746, 128.4314, 'NON_REGULATED', TRUE, NOW(), NOW());

-- ============================================================
-- 대전광역시 (5개)
-- ============================================================
INSERT INTO region (code, sido_code, sido, sigungu, center_lat, center_lng, region_type, is_active, created_at, updated_at)
VALUES
    ('30110', '30', '대전광역시', '동구',    36.3120, 127.4550, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('30140', '30', '대전광역시', '중구',    36.3255, 127.4210, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('30170', '30', '대전광역시', '서구',    36.3553, 127.3836, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('30200', '30', '대전광역시', '유성구',  36.3622, 127.3561, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('30230', '30', '대전광역시', '대덕구',  36.3466, 127.4155, 'NON_REGULATED', TRUE, NOW(), NOW());

-- ============================================================
-- 광주광역시 (5개)
-- ============================================================
INSERT INTO region (code, sido_code, sido, sigungu, center_lat, center_lng, region_type, is_active, created_at, updated_at)
VALUES
    ('29110', '29', '광주광역시', '동구',    35.1460, 126.9231, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('29140', '29', '광주광역시', '서구',    35.1518, 126.8895, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('29155', '29', '광주광역시', '남구',    35.1328, 126.9025, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('29170', '29', '광주광역시', '북구',    35.1746, 126.9120, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('29200', '29', '광주광역시', '광산구',  35.1395, 126.7937, 'NON_REGULATED', TRUE, NOW(), NOW());

-- ============================================================
-- 울산광역시 (5개)
-- ============================================================
INSERT INTO region (code, sido_code, sido, sigungu, center_lat, center_lng, region_type, is_active, created_at, updated_at)
VALUES
    ('31110', '31', '울산광역시', '중구',    35.5684, 129.3320, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('31140', '31', '울산광역시', '남구',    35.5444, 129.3300, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('31170', '31', '울산광역시', '동구',    35.5050, 129.4165, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('31200', '31', '울산광역시', '북구',    35.5828, 129.3612, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('31710', '31', '울산광역시', '울주군',  35.5225, 129.2430, 'NON_REGULATED', TRUE, NOW(), NOW());

-- ============================================================
-- 세종특별자치시 (1개)
-- ============================================================
INSERT INTO region (code, sido_code, sido, sigungu, center_lat, center_lng, region_type, is_active, created_at, updated_at)
VALUES
    ('36110', '36', '세종특별자치시', '세종시', 36.4801, 127.2590, 'NON_REGULATED', TRUE, NOW(), NOW());

-- ============================================================
-- 강원특별자치도 (7개)
-- ============================================================
INSERT INTO region (code, sido_code, sido, sigungu, center_lat, center_lng, region_type, is_active, created_at, updated_at)
VALUES
    ('42110', '42', '강원특별자치도', '춘천시', 37.8813, 127.7300, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('42130', '42', '강원특별자치도', '원주시', 37.3422, 127.9202, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('42150', '42', '강원특별자치도', '강릉시', 37.7519, 128.8761, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('42170', '42', '강원특별자치도', '동해시', 37.5247, 129.1143, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('42190', '42', '강원특별자치도', '태백시', 37.1641, 128.9855, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('42210', '42', '강원특별자치도', '속초시', 38.2070, 128.5918, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('42230', '42', '강원특별자치도', '삼척시', 37.4500, 129.1652, 'NON_REGULATED', TRUE, NOW(), NOW());

-- ============================================================
-- 충청북도 (6개)
-- ============================================================
INSERT INTO region (code, sido_code, sido, sigungu, center_lat, center_lng, region_type, is_active, created_at, updated_at)
VALUES
    ('43111', '43', '충청북도', '청주시 상당구', 36.6336, 127.4914, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('43112', '43', '충청북도', '청주시 서원구', 36.6372, 127.4700, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('43113', '43', '충청북도', '청주시 흥덕구', 36.6439, 127.4300, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('43114', '43', '충청북도', '청주시 청원구', 36.6956, 127.4890, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('43130', '43', '충청북도', '충주시',         36.9910, 127.9259, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('43150', '43', '충청북도', '제천시',         37.1326, 128.1910, 'NON_REGULATED', TRUE, NOW(), NOW());

-- ============================================================
-- 충청남도 (8개)
-- ============================================================
INSERT INTO region (code, sido_code, sido, sigungu, center_lat, center_lng, region_type, is_active, created_at, updated_at)
VALUES
    ('44131', '44', '충청남도', '천안시 동남구', 36.8151, 127.1139, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('44133', '44', '충청남도', '천안시 서북구', 36.8800, 127.1400, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('44150', '44', '충청남도', '공주시',         36.4465, 127.1190, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('44180', '44', '충청남도', '보령시',         36.3334, 126.6128, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('44200', '44', '충청남도', '아산시',         36.7898, 127.0018, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('44210', '44', '충청남도', '서산시',         36.7849, 126.4503, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('44230', '44', '충청남도', '논산시',         36.1872, 127.0987, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('44270', '44', '충청남도', '당진시',         36.8897, 126.6464, 'NON_REGULATED', TRUE, NOW(), NOW());

-- ============================================================
-- 전북특별자치도 (7개)
-- ============================================================
INSERT INTO region (code, sido_code, sido, sigungu, center_lat, center_lng, region_type, is_active, created_at, updated_at)
VALUES
    ('45111', '45', '전북특별자치도', '전주시 완산구', 35.8125, 127.1200, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('45113', '45', '전북특별자치도', '전주시 덕진구', 35.8382, 127.1190, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('45130', '45', '전북특별자치도', '군산시',         35.9676, 126.7369, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('45140', '45', '전북특별자치도', '익산시',         35.9483, 126.9577, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('45180', '45', '전북특별자치도', '정읍시',         35.5699, 126.8558, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('45190', '45', '전북특별자치도', '남원시',         35.4164, 127.3903, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('45210', '45', '전북특별자치도', '김제시',         35.8038, 126.8808, 'NON_REGULATED', TRUE, NOW(), NOW());

-- ============================================================
-- 전라남도 (5개)
-- ============================================================
INSERT INTO region (code, sido_code, sido, sigungu, center_lat, center_lng, region_type, is_active, created_at, updated_at)
VALUES
    ('46110', '46', '전라남도', '목포시', 34.8118, 126.3922, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('46130', '46', '전라남도', '여수시', 34.7604, 127.6622, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('46150', '46', '전라남도', '순천시', 34.9506, 127.4872, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('46170', '46', '전라남도', '나주시', 35.0160, 126.7108, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('46230', '46', '전라남도', '광양시', 34.9407, 127.6959, 'NON_REGULATED', TRUE, NOW(), NOW());

-- ============================================================
-- 경상북도 (8개)
-- ============================================================
INSERT INTO region (code, sido_code, sido, sigungu, center_lat, center_lng, region_type, is_active, created_at, updated_at)
VALUES
    ('47111', '47', '경상북도', '포항시 남구', 36.0088, 129.3598, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('47113', '47', '경상북도', '포항시 북구', 36.0439, 129.3660, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('47130', '47', '경상북도', '경주시',       35.8562, 129.2247, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('47150', '47', '경상북도', '김천시',       36.1398, 128.1135, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('47170', '47', '경상북도', '안동시',       36.5684, 128.7294, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('47190', '47', '경상북도', '구미시',       36.1195, 128.3446, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('47210', '47', '경상북도', '영주시',       36.8056, 128.6241, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('47230', '47', '경상북도', '영천시',       35.9733, 128.9385, 'NON_REGULATED', TRUE, NOW(), NOW());

-- ============================================================
-- 경상남도 (11개)
-- ============================================================
INSERT INTO region (code, sido_code, sido, sigungu, center_lat, center_lng, region_type, is_active, created_at, updated_at)
VALUES
    ('48121', '48', '경상남도', '창원시 의창구',     35.2540, 128.6393, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('48123', '48', '경상남도', '창원시 성산구',     35.1990, 128.7100, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('48125', '48', '경상남도', '창원시 마산합포구', 35.1918, 128.5683, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('48127', '48', '경상남도', '창원시 마산회원구', 35.2208, 128.5827, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('48129', '48', '경상남도', '창원시 진해구',     35.1335, 128.7118, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('48170', '48', '경상남도', '진주시',             35.1800, 128.1076, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('48220', '48', '경상남도', '통영시',             34.8544, 128.4330, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('48240', '48', '경상남도', '사천시',             35.0036, 128.0641, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('48250', '48', '경상남도', '김해시',             35.2285, 128.8894, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('48310', '48', '경상남도', '거제시',             34.8806, 128.6210, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('48330', '48', '경상남도', '양산시',             35.3350, 129.0374, 'NON_REGULATED', TRUE, NOW(), NOW());

-- ============================================================
-- 제주특별자치도 (2개)
-- ============================================================
INSERT INTO region (code, sido_code, sido, sigungu, center_lat, center_lng, region_type, is_active, created_at, updated_at)
VALUES
    ('50110', '50', '제주특별자치도', '제주시',   33.4996, 126.5312, 'NON_REGULATED', TRUE, NOW(), NOW()),
    ('50130', '50', '제주특별자치도', '서귀포시', 33.2541, 126.5600, 'NON_REGULATED', TRUE, NOW(), NOW());
