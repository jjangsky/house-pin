/** 시/도 목록 */
export const SIDO_LIST: { name: string; code: string }[] = [
  { name: '서울특별시', code: '11' },
  { name: '경기도', code: '41' },
  { name: '인천광역시', code: '28' },
  { name: '부산광역시', code: '26' },
  { name: '대구광역시', code: '27' },
  { name: '대전광역시', code: '30' },
  { name: '광주광역시', code: '29' },
  { name: '울산광역시', code: '31' },
  { name: '세종특별자치시', code: '36' },
  { name: '강원특별자치도', code: '42' },
  { name: '충청북도', code: '43' },
  { name: '충청남도', code: '44' },
  { name: '전북특별자치도', code: '45' },
  { name: '전라남도', code: '46' },
  { name: '경상북도', code: '47' },
  { name: '경상남도', code: '48' },
  { name: '제주특별자치도', code: '50' },
];

/** 구/군 목록 (시/도 코드별) */
export const SIGUNGU_MAP: Record<string, { name: string; code: string }[]> = {
  // 서울특별시 (25개 구 전부)
  '11': [
    { name: '종로구', code: '11110' },
    { name: '중구', code: '11140' },
    { name: '용산구', code: '11170' },
    { name: '성동구', code: '11200' },
    { name: '광진구', code: '11215' },
    { name: '동대문구', code: '11230' },
    { name: '중랑구', code: '11260' },
    { name: '성북구', code: '11290' },
    { name: '강북구', code: '11305' },
    { name: '도봉구', code: '11320' },
    { name: '노원구', code: '11350' },
    { name: '은평구', code: '11380' },
    { name: '서대문구', code: '11410' },
    { name: '마포구', code: '11440' },
    { name: '양천구', code: '11470' },
    { name: '강서구', code: '11500' },
    { name: '구로구', code: '11530' },
    { name: '금천구', code: '11545' },
    { name: '영등포구', code: '11560' },
    { name: '동작구', code: '11590' },
    { name: '관악구', code: '11620' },
    { name: '서초구', code: '11650' },
    { name: '강남구', code: '11680' },
    { name: '송파구', code: '11710' },
    { name: '강동구', code: '11740' },
  ],

  // 경기도 (주요 시/구 28개)
  '41': [
    { name: '수원시 장안구', code: '41111' },
    { name: '수원시 권선구', code: '41113' },
    { name: '수원시 팔달구', code: '41115' },
    { name: '수원시 영통구', code: '41117' },
    { name: '성남시 수정구', code: '41131' },
    { name: '성남시 중원구', code: '41133' },
    { name: '성남시 분당구', code: '41135' },
    { name: '의정부시', code: '41150' },
    { name: '안양시 만안구', code: '41171' },
    { name: '안양시 동안구', code: '41173' },
    { name: '부천시', code: '41190' },
    { name: '광명시', code: '41210' },
    { name: '평택시', code: '41220' },
    { name: '동두천시', code: '41250' },
    { name: '안산시 상록구', code: '41271' },
    { name: '안산시 단원구', code: '41273' },
    { name: '고양시 덕양구', code: '41281' },
    { name: '고양시 일산동구', code: '41285' },
    { name: '고양시 일산서구', code: '41287' },
    { name: '과천시', code: '41290' },
    { name: '구리시', code: '41310' },
    { name: '남양주시', code: '41360' },
    { name: '오산시', code: '41370' },
    { name: '시흥시', code: '41390' },
    { name: '군포시', code: '41410' },
    { name: '의왕시', code: '41430' },
    { name: '하남시', code: '41450' },
    { name: '용인시 처인구', code: '41461' },
    { name: '용인시 기흥구', code: '41463' },
    { name: '용인시 수지구', code: '41465' },
    { name: '파주시', code: '41480' },
    { name: '이천시', code: '41500' },
    { name: '안성시', code: '41550' },
    { name: '김포시', code: '41570' },
    { name: '화성시', code: '41590' },
    { name: '광주시', code: '41610' },
    { name: '양주시', code: '41630' },
  ],

  // 인천광역시
  '28': [
    { name: '중구', code: '28110' },
    { name: '동구', code: '28140' },
    { name: '미추홀구', code: '28177' },
    { name: '연수구', code: '28185' },
    { name: '남동구', code: '28200' },
    { name: '부평구', code: '28237' },
    { name: '계양구', code: '28245' },
    { name: '서구', code: '28260' },
    { name: '강화군', code: '28710' },
    { name: '옹진군', code: '28720' },
  ],

  // 부산광역시
  '26': [
    { name: '중구', code: '26110' },
    { name: '서구', code: '26140' },
    { name: '동구', code: '26170' },
    { name: '영도구', code: '26200' },
    { name: '부산진구', code: '26230' },
    { name: '동래구', code: '26260' },
    { name: '남구', code: '26290' },
    { name: '북구', code: '26320' },
    { name: '해운대구', code: '26350' },
    { name: '사하구', code: '26380' },
    { name: '금정구', code: '26410' },
    { name: '강서구', code: '26440' },
    { name: '연제구', code: '26470' },
    { name: '수영구', code: '26500' },
    { name: '사상구', code: '26530' },
    { name: '기장군', code: '26710' },
  ],

  // 대구광역시
  '27': [
    { name: '중구', code: '27110' },
    { name: '동구', code: '27140' },
    { name: '서구', code: '27170' },
    { name: '남구', code: '27200' },
    { name: '북구', code: '27230' },
    { name: '수성구', code: '27260' },
    { name: '달서구', code: '27290' },
    { name: '달성군', code: '27710' },
  ],

  // 대전광역시
  '30': [
    { name: '동구', code: '30110' },
    { name: '중구', code: '30140' },
    { name: '서구', code: '30170' },
    { name: '유성구', code: '30200' },
    { name: '대덕구', code: '30230' },
  ],

  // 광주광역시
  '29': [
    { name: '동구', code: '29110' },
    { name: '서구', code: '29140' },
    { name: '남구', code: '29155' },
    { name: '북구', code: '29170' },
    { name: '광산구', code: '29200' },
  ],

  // 울산광역시
  '31': [
    { name: '중구', code: '31110' },
    { name: '남구', code: '31140' },
    { name: '동구', code: '31170' },
    { name: '북구', code: '31200' },
    { name: '울주군', code: '31710' },
  ],

  // 세종특별자치시
  '36': [
    { name: '세종시', code: '36110' },
  ],

  // 강원특별자치도
  '42': [
    { name: '춘천시', code: '42110' },
    { name: '원주시', code: '42130' },
    { name: '강릉시', code: '42150' },
    { name: '동해시', code: '42170' },
    { name: '태백시', code: '42190' },
    { name: '속초시', code: '42210' },
    { name: '삼척시', code: '42230' },
  ],

  // 충청북도
  '43': [
    { name: '충주시', code: '43130' },
    { name: '제천시', code: '43150' },
    { name: '청주시 상당구', code: '43111' },
    { name: '청주시 서원구', code: '43112' },
    { name: '청주시 흥덕구', code: '43113' },
    { name: '청주시 청원구', code: '43114' },
  ],

  // 충청남도
  '44': [
    { name: '천안시 동남구', code: '44131' },
    { name: '천안시 서북구', code: '44133' },
    { name: '공주시', code: '44150' },
    { name: '보령시', code: '44180' },
    { name: '아산시', code: '44200' },
    { name: '서산시', code: '44210' },
    { name: '논산시', code: '44230' },
    { name: '당진시', code: '44270' },
  ],

  // 전북특별자치도
  '45': [
    { name: '전주시 완산구', code: '45111' },
    { name: '전주시 덕진구', code: '45113' },
    { name: '군산시', code: '45130' },
    { name: '익산시', code: '45140' },
    { name: '정읍시', code: '45180' },
    { name: '남원시', code: '45190' },
    { name: '김제시', code: '45210' },
  ],

  // 전라남도
  '46': [
    { name: '목포시', code: '46110' },
    { name: '여수시', code: '46130' },
    { name: '순천시', code: '46150' },
    { name: '나주시', code: '46170' },
    { name: '광양시', code: '46230' },
  ],

  // 경상북도
  '47': [
    { name: '포항시 남구', code: '47111' },
    { name: '포항시 북구', code: '47113' },
    { name: '경주시', code: '47130' },
    { name: '김천시', code: '47150' },
    { name: '안동시', code: '47170' },
    { name: '구미시', code: '47190' },
    { name: '영주시', code: '47210' },
    { name: '영천시', code: '47230' },
  ],

  // 경상남도
  '48': [
    { name: '창원시 의창구', code: '48121' },
    { name: '창원시 성산구', code: '48123' },
    { name: '창원시 마산합포구', code: '48125' },
    { name: '창원시 마산회원구', code: '48127' },
    { name: '창원시 진해구', code: '48129' },
    { name: '진주시', code: '48170' },
    { name: '통영시', code: '48220' },
    { name: '사천시', code: '48240' },
    { name: '김해시', code: '48250' },
    { name: '거제시', code: '48310' },
    { name: '양산시', code: '48330' },
  ],

  // 제주특별자치도
  '50': [
    { name: '제주시', code: '50110' },
    { name: '서귀포시', code: '50130' },
  ],
};

/** 시/도 코드로 시/도 이름 조회 */
export function getSidoName(code: string): string {
  return SIDO_LIST.find((s) => s.code === code)?.name ?? '';
}

/** 구/군 코드로 시/도 + 구/군 정보 조회 */
export function getRegionBySigunguCode(code: string): {
  sido: string;
  sigungu: string;
} | null {
  const sidoCode = code.substring(0, 2);
  const sido = getSidoName(sidoCode);
  const sigunguList = SIGUNGU_MAP[sidoCode];
  if (!sido || !sigunguList) return null;

  const sigungu = sigunguList.find((s) => s.code === code);
  if (!sigungu) return null;

  return { sido, sigungu: sigungu.name };
}

/** 최대 선택 가능 지역 수 */
export const MAX_REGION_COUNT = 5;
