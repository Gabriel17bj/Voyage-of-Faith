/**
 * 믿음의 항해 — 구글 스프레드시트 기록 서버 (Google Apps Script)
 *
 * 설치 (자세한 내용은 README 또는 게임의 '선생님 화면' 안내 참고)
 *  1. 새 구글 스프레드시트 > 확장 프로그램 > Apps Script
 *  2. 이 파일 내용을 Code.gs에 전부 붙여넣고 저장
 *  3. 배포 > 새 배포 > 유형: 웹 앱
 *       - 다음 사용자 인증 정보로 실행: 나
 *       - 액세스 권한이 있는 사용자: 모든 사용자
 *  4. 스프레드시트를 새로고침하면 위쪽에 [믿음의 항해] 메뉴가 생김
 *       - 교사 비밀번호 정하기 → 선생님 화면 로그인에 사용
 *       - 새 수업 만들기       → 학생에게 알려 줄 5자리 수업 코드 생성
 *
 * 시트 구성 (자동 생성)
 *  - 수업      : 수업 코드 목록 (이 탭에 직접 코드를 적어도 됨: 영문/숫자 5자리)
 *  - 학생현황  : 학생별 진행 상황 (한 학생 = 한 줄, 계속 갱신)
 *  - 게임기록  : 완주/중간 종료 결과 (추가만 됨 → 영구 기록)
 *
 * 학생은 이름 + 수업 코드만으로 참여하고, 선생님 기능(목록 보기·수업 관리)은 교사 비밀번호가 필요합니다.
 */

var SHEET_DEFS = {
  classrooms: {
    name: '수업',
    cols: [
      ['code', '수업코드', 'str'],
      ['title', '수업명', 'str'],
      ['teacherEmail', '교사', 'str'],
      ['createdAt', '생성시각', 'date'],
      ['isClosed', '입장마감', 'bool'],
    ],
  },
  students: {
    name: '학생현황',
    cols: [
      ['classCode', '수업코드', 'str'],
      ['studentName', '이름', 'str'],
      ['score', '점수', 'num'],
      ['solvedCount', '푼 말씀(36)', 'num'],
      ['totalStars', '별(108)', 'num'],
      ['hintsUsed', '힌트', 'num'],
      ['wrongAnswersCount', '오답', 'num'],
      ['isCompleted', '완주', 'bool'],
      ['isOnline', '접속중', 'bool'],
      ['currentQuestId', '현재 문제', 'num'],
      ['elapsedTimeMs', '진행시간(ms)', 'num'],
      ['joinedAt', '입장시각', 'date'],
      ['lastActiveAt', '마지막 활동', 'date'],
      ['completedAt', '완주시각', 'date'],
      ['famId', '팜', 'str'],
      ['characterId', '캐릭터', 'str'],
      ['solvedQuestIds', '푼 말씀 목록', 'json'],
      ['wrongQuestCounts', '문제별 오답', 'json'],
      ['id', '학생ID', 'str'],
    ],
  },
  results: {
    name: '게임기록',
    cols: [
      ['finishedAt', '기록시각', 'date'],
      ['classCode', '수업코드', 'str'],
      ['studentName', '이름', 'str'],
      ['resultLabel', '결과', 'str'],
      ['score', '점수', 'num'],
      ['solvedCount', '푼 말씀(36)', 'num'],
      ['totalStars', '별(108)', 'num'],
      ['hintsUsed', '힌트', 'num'],
      ['wrongAnswersCount', '오답', 'num'],
      ['elapsedText', '소요시간', 'str'],
      ['elapsedTimeMs', '소요시간(ms)', 'num'],
      ['startedAt', '시작시각', 'date'],
      ['isCompleted', '완주', 'bool'],
      ['reason', '사유', 'str'],
      ['famId', '팜', 'str'],
      ['characterId', '캐릭터', 'str'],
      ['studentId', '학생ID', 'str'],
      ['id', '기록ID', 'str'],
    ],
  },
};

// ---------------------------------------------------------------------------
// HTTP 진입점
// ---------------------------------------------------------------------------

function doGet(e) {
  try {
    ensureAllSheets_();
    return out_({ success: true, ok: true, mode: 'gas', hasPassword: !!getPassword_() });
  } catch (err) {
    return fail_(err);
  }
}

// 선생님만 쓸 수 있는 요청 (교사 비밀번호 필요)
var TEACHER_ACTIONS = {
  teacherLogin: true,
  classrooms: true,
  students: true,
  results: true,
  createClassroom: true,
  setClosed: true,
  resetStudents: true,
  deleteClassroom: true,
};

function doPost(e) {
  var body;
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return out_({ success: false, code: 'bad-request', error: '요청 형식이 올바르지 않습니다.' });
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (err) {
    return out_({ success: false, code: 'busy', error: '요청이 많아 잠시 후 다시 시도해 주세요.' });
  }

  try {
    var code = clean_(body.classCode || body.code);

    if (TEACHER_ACTIONS[body.action]) {
      var pw = getPassword_();
      if (!pw) {
        return out_({ success: false, code: 'no-password', error: "아직 교사 비밀번호가 없습니다. 구글 시트 위쪽 메뉴 [믿음의 항해 → 교사 비밀번호 정하기]에서 먼저 정해 주세요." });
      }
      if (String(body.key || '') !== pw) {
        Utilities.sleep(800); // 비밀번호 무작위 대입 방지
        return out_({ success: false, code: 'unauthorized', error: '교사 비밀번호가 맞지 않습니다.' });
      }
    }

    switch (body.action) {
      case 'teacherLogin':
        return out_({ success: true, sheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl() });
      case 'classrooms':
        return out_({ success: true, classrooms: readAll_('classrooms').filter(function (c) { return /^[A-Z0-9]{5}$/.test(c.code); }) });
      case 'students':
        return out_({ success: true, students: readAll_('students').filter(byCode_(code)) });
      case 'results':
        return out_({ success: true, results: readAll_('results').filter(byCode_(code)) });
      case 'createClassroom':
        return out_(createClassroom_(body));
      case 'join':
        return out_(join_(code, body));
      case 'progress':
        return out_(progress_(code, body));
      case 'heartbeat':
        return out_(patchStudent_(code, body.studentId, { lastActiveAt: Date.now(), isOnline: true }));
      case 'offline':
        return out_(patchStudent_(code, body.studentId, { isOnline: false }));
      case 'result':
        return out_(appendResult_(code, body.record || {}));
      case 'setClosed':
        return out_(setClosed_(code, !!body.isClosed));
      case 'resetStudents':
        deleteRowsWhere_('students', byCode_(code));
        return out_({ success: true });
      case 'deleteClassroom':
        // 게임기록 시트는 남겨 둠 (영구 기록)
        deleteRowsWhere_('students', byCode_(code));
        deleteRowsWhere_('classrooms', byCode_(code, 'code'));
        return out_({ success: true });
      default:
        return out_({ success: false, code: 'bad-request', error: '알 수 없는 요청: ' + body.action });
    }
  } catch (err) {
    return fail_(err);
  } finally {
    lock.releaseLock();
  }
}

// ---------------------------------------------------------------------------
// 동작
// ---------------------------------------------------------------------------

function createClassroom_(body) {
  var code = clean_(body.code);
  if (!/^[A-Z0-9]{5}$/.test(code)) return { success: false, code: 'bad-request', error: '수업 코드는 영문/숫자 5자리여야 합니다.' };
  if (findRow_('classrooms', function (r) { return clean_(r.code) === code; })) {
    return { success: false, code: 'exists', error: '이미 사용 중인 수업 코드 [' + code + '] 입니다.' };
  }
  var classroom = {
    code: code,
    title: String(body.title || code + ' 수업').slice(0, 80),
    teacherEmail: String(body.teacherEmail || ''),
    createdAt: Date.now(),
    isClosed: false,
  };
  appendObj_('classrooms', classroom);
  return { success: true, classroom: classroom };
}

function join_(code, body) {
  var cls = findRow_('classrooms', function (r) { return clean_(r.code) === code; });
  if (!cls) {
    return { success: false, code: 'class-not-found', error: '수업 코드 [' + code + ']를 찾을 수 없습니다. 선생님이 알려준 코드를 다시 확인하세요. (0과 O, 1과 I 구분)' };
  }
  if (cls.obj.isClosed) return { success: false, code: 'closed', error: '해당 수업은 입장이 마감되었습니다.' };

  var session = body.session || {};
  if (!session.id) return { success: false, code: 'bad-request', error: '학생 정보가 없습니다.' };
  session.classCode = code;

  var existing = findRow_('students', function (r) { return r.classCode === code && r.id === session.id; });
  var now = Date.now();
  if (existing) {
    var merged = existing.obj;
    merged.studentName = session.studentName || merged.studentName;
    merged.famId = session.famId || merged.famId;
    merged.characterId = session.characterId || merged.characterId;
    merged.lastActiveAt = now;
    merged.isOnline = true;
    writeObj_('students', existing.row, merged);
    return { success: true, session: merged };
  }
  session.joinedAt = session.joinedAt || now;
  session.lastActiveAt = now;
  session.isOnline = true;
  appendObj_('students', session);
  return { success: true, session: session };
}

function progress_(code, body) {
  var updates = body.updates || {};
  var identity = body.identity || {};
  var existing = findRow_('students', function (r) { return r.classCode === code && r.id === body.studentId; });
  if (existing) {
    var merged = existing.obj;
    for (var k in updates) merged[k] = updates[k];
    merged.lastActiveAt = Date.now();
    merged.isOnline = updates.isOnline === false ? false : true;
    writeObj_('students', existing.row, merged);
    return { success: true };
  }
  // 교사가 현황을 초기화한 뒤에도 학생이 계속 플레이 중이면 다시 등록
  if (identity.id && identity.studentName) {
    var obj = {};
    for (var a in identity) obj[a] = identity[a];
    for (var b in updates) obj[b] = updates[b];
    obj.classCode = code;
    obj.joinedAt = obj.joinedAt || Date.now();
    obj.lastActiveAt = Date.now();
    obj.isOnline = true;
    appendObj_('students', obj);
    return { success: true };
  }
  return { success: false, code: 'not-found', error: '학생 기록을 찾을 수 없습니다.' };
}

function patchStudent_(code, studentId, patch) {
  var existing = findRow_('students', function (r) { return r.classCode === code && r.id === studentId; });
  if (!existing) return { success: false, code: 'not-found', error: '학생 기록을 찾을 수 없습니다.' };
  var merged = existing.obj;
  for (var k in patch) merged[k] = patch[k];
  writeObj_('students', existing.row, merged);
  return { success: true };
}

function appendResult_(code, record) {
  if (!record.id || !record.studentName) return { success: false, code: 'bad-request', error: '기록 정보가 올바르지 않습니다.' };
  if (findRow_('results', function (r) { return r.id === record.id; })) return { success: true, duplicate: true };
  record.classCode = code;
  record.resultLabel = record.isCompleted ? '완주' : '중도 종료';
  var sec = Math.floor((Number(record.elapsedTimeMs) || 0) / 1000);
  record.elapsedText = Math.floor(sec / 60) + '분 ' + (sec % 60) + '초';
  appendObj_('results', record);
  return { success: true };
}

function setClosed_(code, isClosed) {
  var cls = findRow_('classrooms', function (r) { return clean_(r.code) === code; });
  if (!cls) return { success: false, code: 'class-not-found', error: '수업을 찾을 수 없습니다.' };
  cls.obj.isClosed = isClosed;
  writeObj_('classrooms', cls.row, cls.obj);
  return { success: true };
}

// ---------------------------------------------------------------------------
// 시트 유틸
// ---------------------------------------------------------------------------

function sheet_(key) {
  var def = SHEET_DEFS[key];
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(def.name);
  if (!sh) {
    sh = ss.insertSheet(def.name);
    sh.getRange(1, 1, 1, def.cols.length)
      .setValues([def.cols.map(function (c) { return c[1]; })])
      .setFontWeight('bold')
      .setBackground('#fff2cc');
    sh.setFrozenRows(1);
  }
  return sh;
}

function ensureAllSheets_() {
  sheet_('classrooms');
  sheet_('students');
  sheet_('results');
}

function readAll_(key) {
  var def = SHEET_DEFS[key];
  var sh = sheet_(key);
  var last = sh.getLastRow();
  if (last < 2) return [];
  var values = sh.getRange(2, 1, last - 1, def.cols.length).getValues();
  var list = [];
  for (var i = 0; i < values.length; i++) {
    if (values[i].join('') === '') continue;
    list.push(rowToObj_(def, values[i]));
  }
  return list;
}

function findRow_(key, pred) {
  var def = SHEET_DEFS[key];
  var sh = sheet_(key);
  var last = sh.getLastRow();
  if (last < 2) return null;
  var values = sh.getRange(2, 1, last - 1, def.cols.length).getValues();
  for (var i = 0; i < values.length; i++) {
    var obj = rowToObj_(def, values[i]);
    if (pred(obj)) return { row: i + 2, obj: obj };
  }
  return null;
}

function appendObj_(key, obj) {
  var def = SHEET_DEFS[key];
  sheet_(key).appendRow(objToRow_(def, obj));
}

function writeObj_(key, row, obj) {
  var def = SHEET_DEFS[key];
  sheet_(key).getRange(row, 1, 1, def.cols.length).setValues([objToRow_(def, obj)]);
}

function deleteRowsWhere_(key, pred) {
  var def = SHEET_DEFS[key];
  var sh = sheet_(key);
  var last = sh.getLastRow();
  if (last < 2) return;
  var values = sh.getRange(2, 1, last - 1, def.cols.length).getValues();
  for (var i = values.length - 1; i >= 0; i--) {
    if (pred(rowToObj_(def, values[i]))) sh.deleteRow(i + 2);
  }
}

function rowToObj_(def, row) {
  var obj = {};
  for (var i = 0; i < def.cols.length; i++) {
    var key = def.cols[i][0];
    var type = def.cols[i][2];
    var v = row[i];
    if (type === 'date') obj[key] = v instanceof Date ? v.getTime() : v === '' ? null : Number(v) || null;
    else if (type === 'num') obj[key] = v === '' ? (key === 'currentQuestId' ? null : 0) : Number(v);
    else if (type === 'bool') obj[key] = v === true || v === 'TRUE' || v === 'true';
    else if (type === 'json') {
      try {
        obj[key] = v ? JSON.parse(v) : key === 'solvedQuestIds' ? [] : {};
      } catch (e) {
        obj[key] = key === 'solvedQuestIds' ? [] : {};
      }
    } else obj[key] = v === null || v === undefined ? '' : String(v);
    if (key === 'code' || key === 'classCode') obj[key] = clean_(obj[key]);
  }
  return obj;
}

function objToRow_(def, obj) {
  return def.cols.map(function (c) {
    var v = obj[c[0]];
    if (v === undefined || v === null) return '';
    if (c[2] === 'date') return v ? new Date(Number(v)) : '';
    if (c[2] === 'json') return JSON.stringify(v);
    if (c[2] === 'bool') return !!v;
    if (c[2] === 'str') {
      var s = String(v);
      // 앞에 ' 를 붙여 항상 '텍스트'로 저장 (3E456 같은 코드가 숫자로 바뀌거나 =수식이 실행되는 것 방지)
      return s === '' ? '' : "'" + s;
    }
    return v;
  });
}

// ---------------------------------------------------------------------------
// 구글 시트 메뉴 (시트 소유자인 선생님만 사용)
// ---------------------------------------------------------------------------

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('믿음의 항해')
    .addItem('새 수업 만들기', 'menuCreateClass')
    .addItem('교사 비밀번호 정하기', 'menuSetPassword')
    .addSeparator()
    .addItem('웹 앱 주소 보기', 'menuShowUrl')
    .addToUi();
  ensureAllSheets_();
}

function menuCreateClass() {
  var ui = SpreadsheetApp.getUi();
  var res = ui.prompt('새 수업 만들기', '수업 이름을 적어 주세요. (예: 초등부 3반)', ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  var title = String(res.getResponseText() || '').trim() || '새 수업';
  var code = '';
  for (var i = 0; i < 20 && !code; i++) {
    var c = randomCode_();
    if (!findRow_('classrooms', function (r) { return clean_(r.code) === c; })) code = c;
  }
  appendObj_('classrooms', { code: code, title: title.slice(0, 80), teacherEmail: Session.getActiveUser().getEmail() || '', createdAt: Date.now(), isClosed: false });
  ui.alert('수업을 만들었어요', '수업 코드: ' + code + '\n\n학생들은 게임 첫 화면에서 이름과 이 코드를 입력하면 들어올 수 있어요.', ui.ButtonSet.OK);
}

function menuSetPassword() {
  var ui = SpreadsheetApp.getUi();
  var res = ui.prompt('교사 비밀번호 정하기', '선생님 화면에 로그인할 비밀번호를 적어 주세요. (4자 이상)', ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  var pw = String(res.getResponseText() || '').trim();
  if (pw.length < 4) {
    ui.alert('비밀번호는 4자 이상이어야 해요.');
    return;
  }
  PropertiesService.getScriptProperties().setProperty('TEACHER_PASSWORD', pw);
  ui.alert('비밀번호를 저장했어요. 게임의 [선생님 화면]에서 이 비밀번호로 로그인하세요.');
}

function menuShowUrl() {
  var url = '';
  try {
    url = ScriptApp.getService().getUrl() || '';
  } catch (e) {}
  SpreadsheetApp.getUi().alert(
    '웹 앱 주소',
    url ? url + '\n\n이 주소를 게임의 src/config.ts 에 넣어 주세요.' : "아직 배포하지 않았어요. Apps Script 화면에서 [배포 → 새 배포 → 웹 앱]으로 먼저 배포해 주세요.",
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function getPassword_() {
  return PropertiesService.getScriptProperties().getProperty('TEACHER_PASSWORD') || '';
}

function randomCode_() {
  var chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  var out = '';
  for (var i = 0; i < 5; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
  return out;
}

function byCode_(code, field) {
  var c = clean_(code);
  var f = field || 'classCode';
  return function (r) {
    return r[f] === c;
  };
}

function clean_(code) {
  return String(code || '').trim().toUpperCase();
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function fail_(err) {
  return out_({ success: false, code: 'server-error', error: String((err && err.message) || err) });
}
