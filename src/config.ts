/**
 * 믿음의 항해 — 연결 설정
 */

/** 기록을 저장하는 선생님의 구글 스프레드시트 */
export const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1aHq_nl4P0pMWBKHdSI_S_BOoFdVs7dZhk03npbWadBc/edit';

/**
 * 구글 시트 Apps Script 웹 앱 주소 (https://script.google.com/macros/s/…/exec)
 *
 * 여기에 넣어 두면 모든 학생이 이름 + 수업 코드만으로 바로 연결됩니다.
 * 비어 있어도 선생님 화면에서 주소를 붙여넣으면 쓸 수 있고,
 * 그때는 선생님이 보낸 초대 링크로 들어온 학생이 연결됩니다.
 *
 * Vercel 환경변수 VITE_GAS_URL 을 설정하면 그 값이 우선 사용됩니다.
 */
export const GAS_WEB_APP_URL = '';
