// lib/data-loader.ts
// 8종 공공데이터 JSON을 읽어 PublicDataDoc[] 로 변환한다.
// RAG·Citations API가 증언자 답변에 인용할 plain-text content 생성 담당.
//
// 보안: 'server-only'로 서버 전용 강제 (번들에 데이터 누출 방지).
// 데이터 JSON은 정적 import — 빌드 시 번들러가 1회 파싱·검증한다.
// 동적 require/fs 미사용으로 경로 조작(path traversal) 표면을 원천 제거한다.
import 'server-only';
import type { PublicDataDoc } from './types';

// ─── 8종 공공데이터 정적 import ────────────────────────────────────
// 정적 import는 빌드 타임에 경로가 고정되므로 path traversal이 불가능하다.
import schoolinfoData from '@/data/schoolinfo-disclosure.json';
import schoolLocationData from '@/data/school-location.json';
import schoolZoneData from '@/data/school-zone.json';
import closedSchoolsData from '@/data/closed-schools.json';
import privateEduData from '@/data/private-edu-population.json';
import specialEduData from '@/data/special-education.json';
import multiculturalData from '@/data/multicultural-students.json';
import neisScheduleData from '@/data/neis-schedule.json';

// ─── JSON 원본 타입 (필요한 필드만 선언) ───────────────────────────
interface SchoolinfoJson {
  meta: { datasetName: string; source: string; url: string; updateCycle: string };
  records: Array<{
    school_name: string; sido: string; sigungu: string; school_type: string;
    total_students: number; total_classes: number; students_per_class_avg: number;
    full_time_teachers: number; student_teacher_ratio: number;
    annual_budget_million_krw: number; education_expense_per_student_krw: number;
    neulbom_participation: boolean; neulbom_students?: number;
    special_needs_students: number; multicultural_students: number;
    basic_literacy_support_students: number;
    building_age_years: number; facility_area_sqm: number;
    graduation_count_2024: number;
    consolidation_risk?: string; consolidation_note?: string;
    multicultural_ratio_pct?: number; multicultural_note?: string;
  }>;
  summary: Record<string, unknown>;
}

interface SchoolLocationJson {
  meta: { datasetName: string; source: string; url: string; updateCycle: string };
  records: Array<{
    school_name: string; sido_name: string; sigungu_name: string;
    school_type: string; establishment_type: string;
    operation_status: string; founded_year: number;
    closed_year?: number; merged_into?: string;
    lat: number; lng: number;
    consolidation_review?: boolean;
  }>;
  summary: Record<string, unknown>;
}

interface SchoolZoneJson {
  meta: { datasetName: string; source: string; url: string; updateCycle: string };
  records: Array<{
    school_name: string; sido: string; sigungu: string;
    zone_area_sqkm: number; resident_student_count: number;
    commute_avg_min: number; commute_max_min: number;
    road_distance_max_km: number; safe_route_exists?: boolean;
    notes?: string;
    consolidation_commute_impact?: {
      nearest_school: string; distance_km: number;
      new_commute_avg_min: number; bus_required: boolean;
    };
    operation_status?: string; closed_year?: number; merged_into_zone?: string;
  }>;
  summary: Record<string, unknown>;
}

interface ClosedSchoolsJson {
  meta: { datasetName: string; source: string; url: string; updateCycle: string };
  records: Array<{
    closed_school_name: string; sido: string; sigungu: string;
    school_type: string; founded_year: number; closed_year: number;
    peak_students: number; last_students: number; reason: string;
    current_use: string; community_reaction: string; petition_count: number;
    island_school?: boolean; notes?: string;
  }>;
  summary: {
    total_closed_since_1982: number;
    closed_2020_2024: number;
    closed_2024_alone: number;
    projected_closed_2025_2030: number;
    community_opposition_rate_pct: number;
    sido_top3_closures: Array<{ sido: string; count: number }>;
    [key: string]: unknown;
  };
}

interface PrivateEduPopJson {
  meta: { datasetName: string; source: string; url: string; updateCycle: string };
  private_education_costs: {
    survey_year: number;
    total_expenditure_trillion_krw: number;
    total_expenditure_note: string;
    participation_rate_pct: number;
    monthly_avg_per_student_krw: number;
    by_school_level: Array<{
      level: string; participation_rate_pct: number;
      monthly_avg_krw: number; monthly_avg_yoy_change_pct: number;
      neulbom_corr_note?: string;
    }>;
    neulbom_effect: {
      neulbom_participant_monthly_avg_krw: number;
      non_neulbom_monthly_avg_krw: number;
      reduction_pct: number;
      reduction_note: string;
    };
  };
  school_age_population: {
    projections: Array<{
      year: number; age_6_17_total: number;
      elementary_6_11: number; middle_12_14: number; high_15_17: number;
    }>;
    decline_2024_2030_pct: number;
    decline_2024_2040_pct: number;
    rural_decline_2024_2030_pct: number;
    birth_rate_2024: number;
  };
  dual_income_households: {
    dual_income_rate_pct_2024: number;
    dual_income_with_elementary_child_pct: number;
    neulbom_demand_survey_pct: number;
  };
}

interface SpecialEduJson {
  meta: { datasetName: string; source: string; url: string; updateCycle: string };
  national_overview_2025: {
    total_special_ed_students: number;
    yoy_change_pct: number;
    by_school_type: Array<{ type: string; students: number; schools?: number }>;
    disability_types: Array<{ type: string; count: number; pct: number }>;
  };
  support_staff: {
    special_ed_teachers: number;
    special_ed_teacher_student_ratio: number;
    shortage_rate_pct: number;
  };
  inclusion_classroom_data: Array<{
    sido: string; total_special_students: number;
    special_school_pct: number; inclusion_class_pct: number;
    avg_support_hours_per_week: number; assistive_tech_coverage_pct: number;
    rural_access_gap_note?: string;
  }>;
  aidt_special_ed: {
    special_ed_aidt_coverage_pct: number;
    aidt_adaptation_rate_pct: number;
    aidt_adaptation_note: string;
    missing_features: string[];
  };
  teacher_admin_burden_special_ed: {
    iep_hours_per_student_per_year: number;
    iep_note: string;
    admin_to_teaching_ratio: number;
  };
}

interface MulticulturalJson {
  meta: { datasetName: string; source: string; url: string; updateCycle: string };
  gyeonggi_overview_2025: {
    total_multicultural_students: number;
    multicultural_ratio_pct: number;
    yoy_change_pct: number;
    national_multicultural_total_2025: number;
    national_multicultural_ratio_pct: number;
  };
  by_nationality: Array<{ nationality: string; count: number; pct: number }>;
  by_school_level: Array<{
    level: string; count: number; ratio_in_level_pct: number;
    korean_support_coverage_pct: number;
  }>;
  high_density_schools: Array<{
    school_name: string; sigungu: string;
    total_students: number; multicultural_students: number;
    ratio_pct: number; main_nationalities: string[];
  }>;
  korean_language_support: {
    coverage_rate_pct: number;
    unmet_demand_students: number;
    avg_weekly_korean_sessions: number;
  };
  academic_gap: {
    multicultural_basic_literacy_below_std_pct: number;
    general_basic_literacy_below_std_pct: number;
    gap_multiplier: number;
    dropout_rate_multicultural_pct: number;
  };
  neulbom_multicultural: {
    multicultural_neulbom_participation_pct: number;
    general_neulbom_participation_pct: number;
  };
}

interface NeisScheduleJson {
  meta: { datasetName: string; source: string; url: string; updateCycle: string; apiEndpoint?: string };
  sample_records: Array<{
    SCHUL_NM: string; AY: string; AA_YMD: string;
    EVENT_NM: string; SCHOOL_CRSE_SC_NM: string; neulbom_status: string;
    ATPT_OFCDC_SC_NM: string;
  }>;
  school_year_summary: {
    year: number; total_school_days_avg: number;
    neulbom_operating_days_avg: number; neulbom_vacation_operation_days: number;
    neulbom_vacation_note: string;
  };
  neulbom_schedule_analysis: {
    neulbom_daily_start_time: string; neulbom_daily_end_time: string;
    neulbom_max_hours_per_day: number; neulbom_avg_participation_hours: number;
    care_gap_before_neulbom_hours: number; care_gap_note: string;
  };
  teacher_admin_schedule: {
    neis_input_avg_hours_per_week: number; neis_input_note: string;
    schedule_conflict_incidents_per_year: number; schedule_conflict_note: string;
  };
}

// ─── 정적 import JSON → 타입 캐스팅 헬퍼 ──────────────────────────
// 정적 import된 JSON은 빌드 시 검증되므로 런타임 파싱·파일 접근이 없다.
// 구조는 위 인터페이스로 좁혀 캐스팅한다(JSON 모듈은 넓은 추론 타입을 가짐).
function asJson<T>(data: unknown): T {
  return data as T;
}

// ─── 각 데이터셋 → PublicDataDoc 변환 함수 ────────────────────────

function convertSchoolinfo(): PublicDataDoc {
  const data = asJson<SchoolinfoJson>(schoolinfoData);
  const { meta, records, summary } = data;

  const lines: string[] = [
    `[데이터셋] ${meta.datasetName} | 출처: ${meta.source} | 갱신: ${meta.updateCycle}`,
    '',
    '## 학교별 공시 정보 샘플',
  ];

  for (const r of records) {
    lines.push(
      `• ${r.school_name} (${r.sido} ${r.sigungu}, ${r.school_type}): ` +
      `학생 ${r.total_students}명 / ${r.total_classes}학급 / 학급당 ${r.students_per_class_avg}명. ` +
      `교원 ${r.full_time_teachers}명, 교사 1인당 학생 ${r.student_teacher_ratio}명. ` +
      `연간 예산 ${r.annual_budget_million_krw}백만원 (학생 1인당 ${r.education_expense_per_student_krw.toLocaleString()}원). ` +
      `특수교육 ${r.special_needs_students}명, 다문화 ${r.multicultural_students}명, 기초학력 지원 ${r.basic_literacy_support_students}명. ` +
      `늘봄학교 ${r.neulbom_participation ? `운영 (참여 ${r.neulbom_students ?? 0}명)` : '미운영'}. ` +
      `건물 노후도 ${r.building_age_years}년, 연면적 ${r.facility_area_sqm}㎡.` +
      (r.consolidation_risk ? ` [통폐합 위험: ${r.consolidation_risk}] ${r.consolidation_note ?? ''}` : '') +
      (r.multicultural_note ? ` [다문화 주목] ${r.multicultural_note}` : '')
    );
  }

  const s = summary as {
    total_schools_nationwide_2024: number; elementary: number; middle: number; high: number;
    schools_below_60_students: number; neulbom_participating_schools_2025: number;
    neulbom_coverage_pct: number; avg_students_per_class_elementary: number;
  };
  lines.push(
    '',
    '## 전국 요약 (2024)',
    `전국 학교 수 ${s.total_schools_nationwide_2024}개 (초 ${s.elementary} / 중 ${s.middle} / 고 ${s.high}). ` +
    `초등학교 학급당 평균 학생 수 ${s.avg_students_per_class_elementary}명. ` +
    `학생 60명 미만 소규모 학교 ${s.schools_below_60_students}개. ` +
    `늘봄학교 운영 학교 ${s.neulbom_participating_schools_2025}개 (전체의 ${s.neulbom_coverage_pct}%).`
  );

  return {
    id: 'schoolinfo-disclosure',
    title: meta.datasetName,
    source: meta.source,
    url: meta.url,
    updateCycle: meta.updateCycle,
    content: lines.join('\n'),
  };
}

function convertSchoolLocation(): PublicDataDoc {
  const data = asJson<SchoolLocationJson>(schoolLocationData);
  const { meta, records, summary } = data;

  const lines: string[] = [
    `[데이터셋] ${meta.datasetName} | 출처: ${meta.source} | 갱신: ${meta.updateCycle}`,
    '',
    '## 학교 위치 및 운영 상태 샘플',
  ];

  for (const r of records) {
    const status = r.operation_status === '통폐합완료'
      ? `통폐합 완료 (${r.closed_year}년, 흡수→${r.merged_into ?? '미상'})`
      : r.operation_status;
    lines.push(
      `• ${r.school_name} (${r.sido_name} ${r.sigungu_name}, ${r.school_type}, ${r.establishment_type}): ` +
      `설립 ${r.founded_year}년. 좌표 (${r.lat}, ${r.lng}). 운영상태: ${status}.` +
      (r.consolidation_review ? ' [통폐합 심의 대상]' : '')
    );
  }

  const s = summary as {
    total_operational_schools_2025: number; total_closed_since_1982: number;
    closed_last_5years_2020_2025: number; rural_schools_below_60_students: number;
    sido_with_highest_closure_rate: string; sido_closure_count_jeonnam_since_1982: number;
  };
  lines.push(
    '',
    '## 전국 요약',
    `2025년 현재 운영 중인 학교 ${s.total_operational_schools_2025}개. ` +
    `1982년 이후 폐교 누적 ${s.total_closed_since_1982}개. ` +
    `최근 5년(2020-2025) 폐교 ${s.closed_last_5years_2020_2025}개. ` +
    `60명 미만 농촌 학교 ${s.rural_schools_below_60_students}개. ` +
    `폐교 최다 시도: ${s.sido_with_highest_closure_rate} (1982년 이후 ${s.sido_closure_count_jeonnam_since_1982}개).`
  );

  return {
    id: 'school-location',
    title: meta.datasetName,
    source: meta.source,
    url: meta.url,
    updateCycle: meta.updateCycle,
    content: lines.join('\n'),
  };
}

function convertSchoolZone(): PublicDataDoc {
  const data = asJson<SchoolZoneJson>(schoolZoneData);
  const { meta, records, summary } = data;

  const lines: string[] = [
    `[데이터셋] ${meta.datasetName} | 출처: ${meta.source} | 갱신: ${meta.updateCycle}`,
    '',
    '## 학구도 및 통학 거리 샘플',
  ];

  for (const r of records) {
    if (r.operation_status === '폐교통합') {
      lines.push(
        `• ${r.school_name}: 폐교 통합 (${r.closed_year}년). ` +
        `학구 면적 ${r.zone_area_sqkm}㎢ → ${r.merged_into_zone ?? '인근 학구'} 흡수. ` +
        (r.notes ?? '')
      );
    } else {
      lines.push(
        `• ${r.school_name} (${r.sido} ${r.sigungu}): ` +
        `학구 면적 ${r.zone_area_sqkm}㎢, 거주 학생 ${r.resident_student_count}명. ` +
        `평균 통학 ${r.commute_avg_min}분 / 최대 ${r.commute_max_min}분 (최대 ${r.road_distance_max_km}km). ` +
        `안전통학로: ${r.safe_route_exists ? '있음' : '없음'}.` +
        (r.notes ? ` ${r.notes}` : '') +
        (r.consolidation_commute_impact
          ? ` [통폐합 시 통학 영향] 최인접 학교 ${r.consolidation_commute_impact.nearest_school} ` +
            `(${r.consolidation_commute_impact.distance_km}km), 평균 통학 ${r.consolidation_commute_impact.new_commute_avg_min}분으로 증가, ` +
            `통학버스 필요: ${r.consolidation_commute_impact.bus_required ? '예' : '아니오'}.`
          : '')
      );
    }
  }

  const s = summary as {
    total_school_zones_nationwide: number; rural_zones_over_30sqkm: number;
    zones_with_no_safe_route: number; avg_commute_urban_min: number;
    avg_commute_rural_min: number; zones_requiring_bus: number;
  };
  lines.push(
    '',
    '## 전국 요약',
    `전국 학구 수 ${s.total_school_zones_nationwide}개. ` +
    `30㎢ 초과 광역 농촌 학구 ${s.rural_zones_over_30sqkm}개. ` +
    `안전통학로 없는 학구 ${s.zones_with_no_safe_route}개. ` +
    `평균 통학시간 도시 ${s.avg_commute_urban_min}분 / 농촌 ${s.avg_commute_rural_min}분. ` +
    `통학버스 필요 학구 ${s.zones_requiring_bus}개.`
  );

  return {
    id: 'school-zone',
    title: meta.datasetName,
    source: meta.source,
    url: meta.url,
    updateCycle: meta.updateCycle,
    content: lines.join('\n'),
  };
}

function convertClosedSchools(): PublicDataDoc {
  const data = asJson<ClosedSchoolsJson>(closedSchoolsData);
  const { meta, records, summary } = data;

  const lines: string[] = [
    `[데이터셋] ${meta.datasetName} | 출처: ${meta.source} | 갱신: ${meta.updateCycle}`,
    '',
    '## 폐교 사례 샘플',
  ];

  for (const r of records) {
    lines.push(
      `• ${r.closed_school_name} (${r.sido} ${r.sigungu}, ${r.school_type}): ` +
      `설립 ${r.founded_year}년, 폐교 ${r.closed_year}년. ` +
      `최고 학생 수 ${r.peak_students}명 → 폐교 당시 ${r.last_students}명. ` +
      `폐교 사유: "${r.reason}". ` +
      `현재 활용: ${r.current_use}. ` +
      `지역사회 반응: ${r.community_reaction} (반대 청원 ${r.petition_count}건).` +
      (r.island_school ? ' [도서 지역 학교]' : '') +
      (r.notes ? ` ${r.notes}` : '')
    );
  }

  lines.push(
    '',
    '## 전국 폐교 요약',
    `1982년 이후 누적 폐교 ${summary.total_closed_since_1982}개. ` +
    `2020-2024년 폐교 ${summary.closed_2020_2024}개 (2024년만 ${summary.closed_2024_alone}개). ` +
    `2025-2030년 추가 폐교 예상 약 ${summary.projected_closed_2025_2030}개. ` +
    `지역사회 반대 비율 ${summary.community_opposition_rate_pct}%. ` +
    `폐교 상위 3개 시도: ${summary.sido_top3_closures.map(s => `${s.sido} ${s.count}개`).join(', ')}.`
  );

  return {
    id: 'closed-schools',
    title: meta.datasetName,
    source: meta.source,
    url: meta.url,
    updateCycle: meta.updateCycle,
    content: lines.join('\n'),
  };
}

function convertPrivateEduPopulation(): PublicDataDoc {
  const data = asJson<PrivateEduPopJson>(privateEduData);
  const { meta, private_education_costs: pec, school_age_population: sap, dual_income_households: dih } = data;

  const lines: string[] = [
    `[데이터셋] ${meta.datasetName} | 출처: ${meta.source} | 갱신: ${meta.updateCycle}`,
    '',
    `## 사교육비 현황 (${pec.survey_year}년 기준)`,
    `${pec.survey_year}년 사교육비 총액 ${pec.total_expenditure_trillion_krw}조원. ${pec.total_expenditure_note} ` +
    `참여율 ${pec.participation_rate_pct}%, 학생 1인당 월평균 ${pec.monthly_avg_per_student_krw.toLocaleString()}원.`,
    '',
    '### 학교급별 사교육비',
  ];

  for (const l of pec.by_school_level) {
    lines.push(
      `• ${l.level}: 참여율 ${l.participation_rate_pct}%, 월평균 ${l.monthly_avg_krw.toLocaleString()}원 (전년 대비 +${l.monthly_avg_yoy_change_pct}%).` +
      (l.neulbom_corr_note ? ` [늘봄 상관] ${l.neulbom_corr_note}` : '')
    );
  }

  lines.push(
    '',
    `## 늘봄학교 사교육비 절감 효과`,
    `늘봄학교 참여 학생 월 ${pec.neulbom_effect.neulbom_participant_monthly_avg_krw.toLocaleString()}원 vs ` +
    `미참여 ${pec.neulbom_effect.non_neulbom_monthly_avg_krw.toLocaleString()}원 → ${pec.neulbom_effect.reduction_pct}% 감소. ` +
    `※ ${pec.neulbom_effect.reduction_note}`,
    '',
    '## 학령인구 추계',
  );

  for (const p of sap.projections) {
    lines.push(
      `• ${p.year}년: 학령인구(6-17세) ${(p.age_6_17_total / 10000).toFixed(1)}만명 ` +
      `(초 ${(p.elementary_6_11 / 10000).toFixed(1)}만 / 중 ${(p.middle_12_14 / 10000).toFixed(1)}만 / 고 ${(p.high_15_17 / 10000).toFixed(1)}만명).`
    );
  }

  lines.push(
    `2024→2030년 학령인구 ${sap.decline_2024_2030_pct}% 감소, 2040년까지 ${sap.decline_2024_2040_pct}% 감소 전망. ` +
    `농촌 감소율 ${sap.rural_decline_2024_2030_pct}%로 더욱 가파름. 2024년 합계출산율 ${sap.birth_rate_2024}.`,
    '',
    '## 맞벌이 가구 돌봄 수요',
    `맞벌이 비율 ${dih.dual_income_rate_pct_2024}% (초등 자녀 가구 ${dih.dual_income_with_elementary_child_pct}%). ` +
    `맞벌이 가구의 ${dih.neulbom_demand_survey_pct}%가 늘봄학교 확대 필요 응답.`
  );

  return {
    id: 'private-edu-population',
    title: meta.datasetName,
    source: meta.source,
    url: meta.url,
    updateCycle: meta.updateCycle,
    content: lines.join('\n'),
  };
}

function convertSpecialEducation(): PublicDataDoc {
  const data = asJson<SpecialEduJson>(specialEduData);
  const { meta, national_overview_2025: no, support_staff: ss, inclusion_classroom_data: inc, aidt_special_ed: aidt, teacher_admin_burden_special_ed: tab } = data;

  const lines: string[] = [
    `[데이터셋] ${meta.datasetName} | 출처: ${meta.source} | 갱신: ${meta.updateCycle}`,
    '',
    '## 특수교육 대상자 현황 (2025년)',
    `전국 특수교육 대상 학생 ${no.total_special_ed_students.toLocaleString()}명 (전년 대비 +${no.yoy_change_pct}%).`,
    '학교 유형별:',
  ];

  for (const t of no.by_school_type) {
    lines.push(`  • ${t.type}: ${t.students.toLocaleString()}명${t.schools ? ` (${t.schools}개 학교)` : ''}`);
  }

  lines.push('장애 유형별 상위 4:');
  for (const d of no.disability_types.slice(0, 4)) {
    lines.push(`  • ${d.type}: ${d.count.toLocaleString()}명 (${d.pct}%)`);
  }

  lines.push(
    '',
    '## 지원 인력',
    `특수교사 ${ss.special_ed_teachers.toLocaleString()}명 (교사 1인당 ${ss.special_ed_teacher_student_ratio}명). ` +
    `법정 정원 대비 ${ss.shortage_rate_pct}% 부족.`,
    '',
    '## 시도별 통합교육 현황',
  );

  for (const r of inc) {
    lines.push(
      `• ${r.sido}: 특수학교 ${r.special_school_pct}% / 특수학급 ${r.inclusion_class_pct}% / 완전통합 ${(100 - r.special_school_pct - r.inclusion_class_pct).toFixed(1)}%. ` +
      `주당 지원시간 ${r.avg_support_hours_per_week}h, 보조공학 보급률 ${r.assistive_tech_coverage_pct}%.` +
      (r.rural_access_gap_note ? ` ※ ${r.rural_access_gap_note}` : '')
    );
  }

  lines.push(
    '',
    '## AI 디지털교과서(AIDT) 특수교육 적용 현황',
    `AIDT 시범 학교 특수교육 적용률 ${aidt.special_ed_aidt_coverage_pct}%, ` +
    `특수교육 맞춤 기능 적용률 ${aidt.aidt_adaptation_rate_pct}%. ` +
    `${aidt.aidt_adaptation_note} ` +
    `미비 기능: ${aidt.missing_features.join(', ')}.`,
    '',
    '## 교원 행정 부담 (특수교육)',
    `IEP(개별화교육계획) 작성 학생 1인당 연 ${tab.iep_hours_per_student_per_year}시간 소요. ` +
    `특수교사 업무 중 행정 비중 ${tab.admin_to_teaching_ratio * 100}%. ${tab.iep_note}`
  );

  return {
    id: 'special-education',
    title: meta.datasetName,
    source: meta.source,
    url: meta.url,
    updateCycle: meta.updateCycle,
    content: lines.join('\n'),
  };
}

function convertMulticulturalStudents(): PublicDataDoc {
  const data = asJson<MulticulturalJson>(multiculturalData);
  const { meta, gyeonggi_overview_2025: go, by_nationality, by_school_level, high_density_schools, korean_language_support: kls, academic_gap: ag, neulbom_multicultural: nm } = data;

  const lines: string[] = [
    `[데이터셋] ${meta.datasetName} | 출처: ${meta.source} | 갱신: ${meta.updateCycle}`,
    '',
    '## 경기도 다문화 학생 현황 (2025년)',
    `경기도 다문화 학생 ${go.total_multicultural_students.toLocaleString()}명 (전체의 ${go.multicultural_ratio_pct}%, 전년 대비 +${go.yoy_change_pct}%). ` +
    `전국 다문화 학생 ${go.national_multicultural_total_2025.toLocaleString()}명 (비율 ${go.national_multicultural_ratio_pct}%).`,
    '',
    '### 국적별 분포 (상위 5):',
  ];

  for (const n of by_nationality.slice(0, 5)) {
    lines.push(`  • ${n.nationality}: ${n.count.toLocaleString()}명 (${n.pct}%)`);
  }

  lines.push('', '### 학교급별:');
  for (const l of by_school_level) {
    lines.push(
      `  • ${l.level}: ${l.count.toLocaleString()}명 (해당 학교급 내 ${l.ratio_in_level_pct}%). ` +
      `한국어 지원 커버율 ${l.korean_support_coverage_pct}%.`
    );
  }

  lines.push('', '### 고밀집 학교:');
  for (const s of high_density_schools) {
    lines.push(
      `  • ${s.school_name} (${s.sigungu}): 전체 ${s.total_students}명 중 다문화 ${s.multicultural_students}명 (${s.ratio_pct}%). ` +
      `주요 국적: ${s.main_nationalities.join(', ')}.`
    );
  }

  lines.push(
    '',
    '## 한국어 지원 현황',
    `한국어 교육 커버율 ${kls.coverage_rate_pct}%. ` +
    `지원 미적용 학생 약 ${kls.unmet_demand_students.toLocaleString()}명. ` +
    `주당 평균 한국어 수업 ${kls.avg_weekly_korean_sessions}회 (이상적 10회 대비 부족).`,
    '',
    '## 학력 격차',
    `다문화 학생 기초학력 미달 비율 ${ag.multicultural_basic_literacy_below_std_pct}% (일반 학생 ${ag.general_basic_literacy_below_std_pct}%의 ${ag.gap_multiplier}배). ` +
    `다문화 학생 학업중단율 ${ag.dropout_rate_multicultural_pct}%.`,
    '',
    '## 늘봄학교와 다문화',
    `다문화 학생 늘봄 참여율 ${nm.multicultural_neulbom_participation_pct}% (일반 학생 ${nm.general_neulbom_participation_pct}%보다 높음). 돌봄 공백 해소 효과.`
  );

  return {
    id: 'multicultural-students',
    title: meta.datasetName,
    source: meta.source,
    url: meta.url,
    updateCycle: meta.updateCycle,
    content: lines.join('\n'),
  };
}

function convertNeisSchedule(): PublicDataDoc {
  const data = asJson<NeisScheduleJson>(neisScheduleData);
  const { meta, sample_records, school_year_summary: sys, neulbom_schedule_analysis: nsa, teacher_admin_schedule: tas } = data;

  const lines: string[] = [
    `[데이터셋] ${meta.datasetName} | 출처: ${meta.source} | 갱신: ${meta.updateCycle}`,
    `API 엔드포인트: ${meta.apiEndpoint ?? 'https://open.neis.go.kr/hub/SchoolSchedule'}`,
    '',
    '## 학사일정 샘플 레코드',
  ];

  for (const r of sample_records.slice(0, 6)) {
    lines.push(
      `• [${r.ATPT_OFCDC_SC_NM}] ${r.SCHUL_NM} ${r.AY}학년도 ${r.AA_YMD}: ${r.EVENT_NM}. ` +
      `늘봄 상태: ${r.neulbom_status}.`
    );
  }

  lines.push(
    '',
    `## ${sys.year}학년도 학사 요약`,
    `평균 수업일수 ${sys.total_school_days_avg}일. ` +
    `늘봄학교 연간 운영일수 ${sys.neulbom_operating_days_avg}일 (방학 중 ${sys.neulbom_vacation_operation_days}일 포함). ` +
    sys.neulbom_vacation_note,
    '',
    '## 늘봄 일정 분석',
    `늘봄 운영 시간 ${nsa.neulbom_daily_start_time}~${nsa.neulbom_daily_end_time} (최대 ${nsa.neulbom_max_hours_per_day}h). ` +
    `학생 평균 참여 ${nsa.neulbom_avg_participation_hours}h/일. ` +
    nsa.care_gap_note,
    '',
    '## 교원 행정 (NEIS 입력 부담)',
    `교사 1인당 NEIS 입력 주 ${tas.neis_input_avg_hours_per_week}시간. ` +
    tas.neis_input_note + ' ' +
    `전국 연간 학사일정 입력 오류 ${tas.schedule_conflict_incidents_per_year.toLocaleString()}건. ` +
    tas.schedule_conflict_note
  );

  return {
    id: 'neis-schedule',
    title: meta.datasetName,
    source: meta.source,
    url: meta.url,
    updateCycle: meta.updateCycle,
    content: lines.join('\n'),
  };
}

// ─── 메인 export ──────────────────────────────────────────────────

// 모듈 레벨 캐시 (performance 리뷰 [P0]).
// 8종 데이터는 정적 import된 불변값이므로 변환 결과는 프로세스 생애 동안 동일하다.
// 첫 호출 시 1회 변환하고 이후 요청은 캐시를 재사용해 매 요청 8종 재가공을 제거한다.
let cache: PublicDataDoc[] | null = null;

/**
 * 8종 공공데이터를 PublicDataDoc[] 로 반환한다.
 * Next.js 서버 컴포넌트 / API Route에서 import 가능.
 * 첫 호출에서만 변환을 수행하고, 이후 호출은 모듈 캐시를 반환한다(불변 데이터).
 */
export function loadAllData(): PublicDataDoc[] {
  if (cache) return cache;
  cache = [
    convertSchoolinfo(),
    convertSchoolLocation(),
    convertSchoolZone(),
    convertClosedSchools(),
    convertPrivateEduPopulation(),
    convertSpecialEducation(),
    convertMulticulturalStudents(),
    convertNeisSchedule(),
  ];
  return cache;
}
