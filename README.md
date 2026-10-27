# PROMISE LAND : 믿음의 항해

예수님과 함께하는 36개 성경 말씀 암송 모바일 RPG 웹 게임.
학생은 **수업 코드(5자리)** 로 입장하고, 교사는 **교사 대시보드**에서 전체 학생의 실시간 현황과 게임 기록을 확인합니다.

## 주요 기능

| 구분 | 내용 |
| --- | --- |
| 모바일 최적화 | 세로 화면: 지도 아래 조작 패널(조이스틱·힌트·A/B 버튼) / 가로 화면: 좌우 조작 패널 / PC: 16:9 화면. 노치·홈바(safe-area), iOS 입력창 확대 방지, 홈 화면 추가(웹앱) 지원 |
| 수업 코드 | 교사가 5자리 코드를 만들고 `https://사이트주소/?code=ABCDE` 링크나 코드를 학생에게 전달 |
| 실시간 현황 | 접속/오프라인 상태, 현재 점수·푼 말씀 수·별·힌트·오답, 도움이 필요한 학생, 말씀별 오답 통계, 프로젝터(빔) 모드 |
| 게임 기록 | 학생이 **완주**하거나 설정에서 **초기화(중도 종료)** 하면 결과가 자동 저장. 학생 현황을 초기화해도 기록은 남고, CSV(엑셀)로 저장 가능 |

교사 대시보드 주소: `https://사이트주소/#/teacher`

## 실시간 연동 방식 (자동 선택)

1. **Firebase 모드 (Vercel 배포 시 권장)** — 구글 Firebase Firestore에 저장. 모든 기기 실시간 동기화 + 영구 기록.
2. **서버 모드** — AI Studio 미리보기 / `npm run dev` 에서 `server.ts`가 동작할 때. 서버가 재시작되면 기록이 사라질 수 있습니다.
3. **로컬 모드** — 위 둘 다 없을 때. 같은 브라우저 안에서만 동작(체험용). 교사 대시보드 상단에 경고가 표시됩니다.

> ⚠️ Vercel은 `server.ts`(Express 서버)를 실행하지 않습니다. Vercel에서 여러 학생을 모니터링하려면 반드시 아래 Firebase 설정을 해 주세요.

## Firebase 설정 (약 5분)

1. https://console.firebase.google.com 에서 프로젝트 생성
2. **빌드 > Firestore Database > 데이터베이스 만들기** (위치: `asia-northeast3 (서울)` 권장)
3. **Firestore > 규칙** 탭에 이 저장소의 `firestore.rules` 내용을 붙여넣고 **게시**
4. **프로젝트 설정(⚙️) > 일반 > 내 앱 > 웹 앱 추가(</>)** 후 표시되는 `firebaseConfig` 값 확인
5. 아래 환경변수를 등록 (API 키는 구글 API 키 `AIza...` 를 그대로 사용)

| 환경변수 | firebaseConfig 항목 | 필수 |
| --- | --- | --- |
| `VITE_FIREBASE_API_KEY` | `apiKey` | ✅ |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` | ✅ |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` | 선택 |
| `VITE_FIREBASE_APP_ID` | `appId` | 선택 |
| `VITE_FIREBASE_DATABASE_ID` | (기본 DB가 아닐 때만) | 선택 |
| `VITE_PUBLIC_APP_URL` | 학생 초대 링크에 쓸 공개 주소 (예: `https://voyage-of-faith.vercel.app`) | 선택 |

Google AI Studio에서 Firebase를 연결해 `firebase-applet-config.json` 파일이 생긴 경우, 환경변수가 없어도 그 파일 값을 자동으로 사용합니다.

## Vercel 배포

1. GitHub 저장소를 Vercel에서 **Import**
2. Framework: **Vite** (자동 인식, `vercel.json` 포함)
3. **Settings > Environment Variables** 에 위 `VITE_FIREBASE_*` 값 등록 (`GEMINI_API_KEY`도 기존처럼 등록 가능)
4. **Deploy** — 환경변수를 바꾼 뒤에는 반드시 **Redeploy** 해야 반영됩니다(빌드 시 포함되는 값).

배포 후 확인: `/#/teacher` 상단 배지가 **"클라우드 실시간"** 이면 Firebase 연결 성공입니다.

## 다른 휴대폰에서 접속이 안 될 때

교사 대시보드 → **초대(공유) 버튼** 또는 **수업 관리** 탭의 **📡 다른 기기 접속 진단**을 누르면 원인을 바로 알려줍니다.

| 증상 | 원인 | 해결 |
| --- | --- | --- |
| 대시보드 상단에 빨간 **로컬 모드** 경고 / 학생 화면에 "수업 서버(Firebase)가 설정되어 있지 않아…" | Vercel에 Firebase 환경변수가 없음 (Vercel은 server.ts를 실행하지 않음) | Vercel 환경변수 등록 → **Redeploy** |
| "수업 코드 [XXXXX]를 찾을 수 없습니다" | 코드 오타이거나, 교사가 만든 수업이 아님 | 대시보드에서 [+]로 수업을 만들고 그 코드를 사용 |
| "접근을 거부했습니다" | Firestore 규칙 미게시 | `firestore.rules` 내용을 Firestore 규칙에 붙여넣고 게시 |
| "응답이 없습니다" | Firestore 데이터베이스 미생성 / 프로젝트 ID 오타 / 네트워크 | Firestore Database 만들기, 환경변수 확인 |
| "API 키가 올바르지 않습니다" / "Cloud Firestore API가 꺼져 있습니다" | Gemini용 키 등 다른 프로젝트의 키를 넣음 | Firebase 콘솔 웹 앱 설정의 `apiKey`를 그대로 사용 |
| 링크를 눌러도 페이지가 안 열림 / 로그인 화면이 나옴 | AI Studio 미리보기 주소나 Vercel **미리보기(Preview)** 주소를 공유함 | `https://프로젝트이름.vercel.app` (Production) 주소에서 대시보드를 열고 링크 복사. 또는 `VITE_PUBLIC_APP_URL` 환경변수에 공개 주소 지정 |

## 로컬 실행

```bash
npm install
npm run dev   # http://localhost:3000 (server.ts + Vite)
```

## 보안 참고

- 학생은 로그인 없이 참여하므로 Firestore 규칙은 인증 대신 데이터 형식/점수 범위를 검증합니다.
- 교사 대시보드 주소(`/#/teacher`)는 학생에게 공유하지 마세요.
