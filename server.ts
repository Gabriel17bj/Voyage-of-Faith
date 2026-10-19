import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// In-Memory Data Store with Persistence File
interface Classroom {
  code: string;
  title: string;
  teacherEmail: string;
  createdAt: number;
  isClosed?: boolean;
}

interface StudentSession {
  id: string;
  classCode: string;
  studentName: string;
  famId: 'agape' | 'shalom' | 'wisdom';
  characterId?: string;
  score: number;
  solvedCount: number;
  solvedQuestIds: number[];
  totalStars: number;
  hintsUsed: number;
  wrongAnswersCount: number;
  wrongQuestCounts?: { [questId: string]: number };
  currentQuestId: number | null;
  elapsedTimeMs: number;
  joinedAt?: number;
  lastActiveAt: number;
  isOnline: boolean;
  isCompleted: boolean;
  completedAt?: number;
}

const DATA_DIR = path.resolve(__dirname, '.data');
const CLASSROOMS_FILE = path.join(DATA_DIR, 'classrooms.json');
const STUDENTS_FILE = path.join(DATA_DIR, 'students.json');

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('[Server] Failed to create .data dir:', e);
}

// Initial Classrooms Seed
const DEFAULT_CLASSROOMS: Classroom[] = [
  {
    code: 'FAITH',
    title: '2026 초등부 성경탐험대',
    teacherEmail: 'teacher@promise.land',
    createdAt: Date.now() - 3600000 * 2,
    isClosed: false,
  },
  {
    code: 'GRACE',
    title: '중고등부 믿음의 항해',
    teacherEmail: 'teacher@promise.land',
    createdAt: Date.now() - 86400000,
    isClosed: false,
  },
];

// Initial Students Seed for FAITH
const DEFAULT_FAITH_STUDENTS: StudentSession[] = [
  {
    id: 'demo-st-1',
    classCode: 'FAITH',
    studentName: '다윗',
    famId: 'agape',
    characterId: 'sailor_boy',
    score: 17200,
    solvedCount: 36,
    solvedQuestIds: Array.from({ length: 36 }, (_, i) => i + 1),
    totalStars: 106,
    hintsUsed: 2,
    wrongAnswersCount: 1,
    wrongQuestCounts: { 14: 1 },
    currentQuestId: null,
    elapsedTimeMs: 384000,
    joinedAt: Date.now() - 600000,
    lastActiveAt: Date.now(),
    isOnline: true,
    isCompleted: true,
  },
  {
    id: 'demo-st-2',
    classCode: 'FAITH',
    studentName: '에스더',
    famId: 'shalom',
    characterId: 'bible_girl',
    score: 16400,
    solvedCount: 35,
    solvedQuestIds: Array.from({ length: 35 }, (_, i) => i + 1),
    totalStars: 101,
    hintsUsed: 3,
    wrongAnswersCount: 2,
    wrongQuestCounts: { 7: 1, 14: 1 },
    currentQuestId: 36,
    elapsedTimeMs: 420000,
    joinedAt: Date.now() - 500000,
    lastActiveAt: Date.now() - 10000,
    isOnline: true,
    isCompleted: false,
  },
  {
    id: 'demo-st-3',
    classCode: 'FAITH',
    studentName: '요셉',
    famId: 'wisdom',
    characterId: 'adventurer_boy',
    score: 15100,
    solvedCount: 32,
    solvedQuestIds: Array.from({ length: 32 }, (_, i) => i + 1),
    totalStars: 92,
    hintsUsed: 5,
    wrongAnswersCount: 3,
    wrongQuestCounts: { 14: 2, 22: 1 },
    currentQuestId: 33,
    elapsedTimeMs: 495000,
    joinedAt: Date.now() - 400000,
    lastActiveAt: Date.now() - 25000,
    isOnline: true,
    isCompleted: false,
  },
  {
    id: 'demo-st-4',
    classCode: 'FAITH',
    studentName: '사무엘',
    famId: 'shalom',
    characterId: 'explorer_boy',
    score: 14200,
    solvedCount: 30,
    solvedQuestIds: Array.from({ length: 30 }, (_, i) => i + 1),
    totalStars: 87,
    hintsUsed: 4,
    wrongAnswersCount: 4,
    wrongQuestCounts: { 7: 2, 14: 2 },
    currentQuestId: 31,
    elapsedTimeMs: 512000,
    joinedAt: Date.now() - 350000,
    lastActiveAt: Date.now() - 5000,
    isOnline: true,
    isCompleted: false,
  },
  {
    id: 'demo-st-5',
    classCode: 'FAITH',
    studentName: '마리아',
    famId: 'agape',
    characterId: 'jesus_lantern',
    score: 13500,
    solvedCount: 28,
    solvedQuestIds: Array.from({ length: 28 }, (_, i) => i + 1),
    totalStars: 82,
    hintsUsed: 6,
    wrongAnswersCount: 2,
    wrongQuestCounts: { 14: 1, 18: 1 },
    currentQuestId: 29,
    elapsedTimeMs: 480000,
    joinedAt: Date.now() - 300000,
    lastActiveAt: Date.now() - 180000,
    isOnline: false,
    isCompleted: false,
  },
];

let classrooms: Map<string, Classroom> = new Map();
let students: Map<string, Map<string, StudentSession>> = new Map(); // classCode -> (studentId -> StudentSession)

// Load from disk if exists
try {
  if (fs.existsSync(CLASSROOMS_FILE)) {
    const raw = JSON.parse(fs.readFileSync(CLASSROOMS_FILE, 'utf-8'));
    if (Array.isArray(raw)) {
      raw.forEach((c: Classroom) => classrooms.set(c.code.toUpperCase(), c));
    }
  }
} catch (e) {
  console.warn('[Server] Could not read classrooms from disk:', e);
}

if (classrooms.size === 0) {
  DEFAULT_CLASSROOMS.forEach((c) => classrooms.set(c.code, c));
}

try {
  if (fs.existsSync(STUDENTS_FILE)) {
    const raw = JSON.parse(fs.readFileSync(STUDENTS_FILE, 'utf-8'));
    if (typeof raw === 'object' && raw !== null) {
      Object.keys(raw).forEach((code) => {
        const studentMap = new Map<string, StudentSession>();
        const list = raw[code];
        if (Array.isArray(list)) {
          list.forEach((st: StudentSession) => studentMap.set(st.id, st));
        }
        students.set(code.toUpperCase(), studentMap);
      });
    }
  }
} catch (e) {
  console.warn('[Server] Could not read students from disk:', e);
}

if (!students.has('FAITH') || students.get('FAITH')!.size === 0) {
  const faithMap = new Map<string, StudentSession>();
  DEFAULT_FAITH_STUDENTS.forEach((st) => faithMap.set(st.id, st));
  students.set('FAITH', faithMap);
}

// Persistence Helper
function persistData() {
  try {
    const classArr = Array.from(classrooms.values());
    fs.writeFileSync(CLASSROOMS_FILE, JSON.stringify(classArr, null, 2), 'utf-8');

    const stObj: { [code: string]: StudentSession[] } = {};
    students.forEach((map, code) => {
      stObj[code] = Array.from(map.values());
    });
    fs.writeFileSync(STUDENTS_FILE, JSON.stringify(stObj, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[Server] Failed to persist data to disk:', e);
  }
}

// SSE Connection Management
type SSEClient = {
  id: string;
  classCode: string;
  res: express.Response;
};

const sseClients: SSEClient[] = [];

function broadcastToClass(classCode: string, payload: any) {
  const clean = classCode.trim().toUpperCase();
  const dataString = `data: ${JSON.stringify(payload)}\n\n`;

  for (let i = sseClients.length - 1; i >= 0; i--) {
    const client = sseClients[i];
    if (client.classCode === clean || client.classCode === '*') {
      try {
        client.res.write(dataString);
        (client.res as any).flush?.();
      } catch (err) {
        sseClients.splice(i, 1);
      }
    }
  }
}

// Keep-alive ping for SSE
setInterval(() => {
  for (let i = sseClients.length - 1; i >= 0; i--) {
    const client = sseClients[i];
    try {
      client.res.write(':keep-alive\n\n');
    } catch (e) {
      sseClients.splice(i, 1);
    }
  }
}, 15000);

// Helper to format student list
function getStudentsForClass(classCode: string): StudentSession[] {
  const clean = classCode.trim().toUpperCase();
  const map = students.get(clean);
  if (!map) return [];

  const now = Date.now();
  return Array.from(map.values())
    .map((st) => ({
      ...st,
      isOnline: now - (st.lastActiveAt || 0) < 90 * 1000,
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.totalStars !== a.totalStars) return b.totalStars - a.totalStars;
      return a.elapsedTimeMs - b.elapsedTimeMs;
    });
}

// ============================================================================
// API ROUTES
// ============================================================================

// 1. Get all classrooms
app.get('/api/classrooms', (_req, res) => {
  const list = Array.from(classrooms.values()).sort((a, b) => b.createdAt - a.createdAt);
  res.json({ success: true, classrooms: list });
});

// 2. Create classroom
app.post('/api/classrooms', (req, res) => {
  const { code, title, teacherEmail } = req.body;
  const cleanCode = (code || '').trim().toUpperCase();

  if (cleanCode.length !== 5) {
    return res.status(400).json({ success: false, error: '수업 코드는 5자리여야 합니다.' });
  }

  if (classrooms.has(cleanCode)) {
    return res.status(400).json({ success: false, error: `이미 존재하는 수업 코드 [${cleanCode}] 입니다.` });
  }

  const newClass: Classroom = {
    code: cleanCode,
    title: (title || `${cleanCode} 성경탐험대`).trim(),
    teacherEmail: (teacherEmail || 'teacher@promise.land').trim(),
    createdAt: Date.now(),
    isClosed: false,
  };

  classrooms.set(cleanCode, newClass);
  if (!students.has(cleanCode)) {
    students.set(cleanCode, new Map());
  }

  persistData();
  broadcastToClass('*', { type: 'CLASSROOM_CREATED', classroom: newClass });

  res.json({ success: true, classroom: newClass });
});

// 3. Get single classroom info
app.get('/api/classrooms/:code', (req, res) => {
  const cleanCode = req.params.code.trim().toUpperCase();
  const classroom = classrooms.get(cleanCode);

  if (!classroom) {
    return res.status(404).json({ success: false, error: '수업을 찾을 수 없습니다.' });
  }

  res.json({ success: true, classroom });
});

// 4. Student joins classroom (CRITICAL REAL-TIME RECORDING)
app.post('/api/classrooms/:code/join', (req, res) => {
  const cleanCode = req.params.code.trim().toUpperCase();
  const { studentId, studentName, famId, characterId, initialScore = 0 } = req.body;

  if (!cleanCode) {
    return res.status(400).json({ success: false, error: '수업 코드가 필요합니다.' });
  }

  // Auto create class if not exists yet so student is never blocked
  if (!classrooms.has(cleanCode)) {
    const autoClass: Classroom = {
      code: cleanCode,
      title: `${cleanCode} 성경탐험대`,
      teacherEmail: 'teacher@promise.land',
      createdAt: Date.now(),
      isClosed: false,
    };
    classrooms.set(cleanCode, autoClass);
    broadcastToClass('*', { type: 'CLASSROOM_CREATED', classroom: autoClass });
  }

  const currentClass = classrooms.get(cleanCode)!;
  if (currentClass.isClosed) {
    return res.status(403).json({ success: false, error: '해당 수업은 입장이 마감되었습니다.' });
  }

  if (!students.has(cleanCode)) {
    students.set(cleanCode, new Map());
  }

  const classMap = students.get(cleanCode)!;
  const uid = studentId || `st_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const now = Date.now();

  let session: StudentSession;
  if (classMap.has(uid)) {
    const existing = classMap.get(uid)!;
    session = {
      ...existing,
      studentName: (studentName || existing.studentName || '믿음의 용사').trim(),
      famId: famId || existing.famId || 'agape',
      characterId: characterId || existing.characterId || 'sailor_boy',
      lastActiveAt: now,
      isOnline: true,
    };
  } else {
    session = {
      id: uid,
      classCode: cleanCode,
      studentName: (studentName || '믿음의 용사').trim(),
      famId: famId || 'agape',
      characterId: characterId || 'sailor_boy',
      score: initialScore,
      solvedCount: 0,
      solvedQuestIds: [],
      totalStars: 0,
      hintsUsed: 0,
      wrongAnswersCount: 0,
      wrongQuestCounts: {},
      currentQuestId: null,
      elapsedTimeMs: 0,
      joinedAt: now,
      lastActiveAt: now,
      isOnline: true,
      isCompleted: false,
    };
  }

  classMap.set(uid, session);
  persistData();

  const allUpdated = getStudentsForClass(cleanCode);
  broadcastToClass(cleanCode, {
    type: 'STUDENT_JOIN',
    student: session,
    students: allUpdated,
  });

  console.log(`[Realtime Join] Student '${session.studentName}' (${session.id}) connected to class [${cleanCode}]`);

  res.json({ success: true, session, students: allUpdated });
});

// 5. Update student progress in real-time
app.post('/api/classrooms/:code/progress', (req, res) => {
  const cleanCode = req.params.code.trim().toUpperCase();
  const { studentId, updates } = req.body;

  if (!cleanCode || !studentId) {
    return res.status(400).json({ success: false, error: '필수 정보가 누락되었습니다.' });
  }

  const classMap = students.get(cleanCode);
  if (!classMap || !classMap.has(studentId)) {
    return res.status(404).json({ success: false, error: '학생 기록을 찾을 수 없습니다.' });
  }

  const current = classMap.get(studentId)!;
  const now = Date.now();

  const updated: StudentSession = {
    ...current,
    ...(updates || {}),
    lastActiveAt: now,
    isOnline: true,
  };

  classMap.set(studentId, updated);
  persistData();

  const allUpdated = getStudentsForClass(cleanCode);
  broadcastToClass(cleanCode, {
    type: 'STUDENT_PROGRESS',
    studentId,
    updates,
    students: allUpdated,
  });

  res.json({ success: true, session: updated });
});

// 6. Heartbeat
app.post('/api/classrooms/:code/heartbeat', (req, res) => {
  const cleanCode = req.params.code.trim().toUpperCase();
  const { studentId } = req.body;

  const classMap = students.get(cleanCode);
  if (classMap && studentId && classMap.has(studentId)) {
    const current = classMap.get(studentId)!;
    current.lastActiveAt = Date.now();
    current.isOnline = true;
  }

  res.json({ success: true });
});

// 7. Get live students list for classroom
app.get('/api/classrooms/:code/students', (req, res) => {
  const cleanCode = req.params.code.trim().toUpperCase();
  const list = getStudentsForClass(cleanCode);
  res.json({ success: true, students: list });
});

// 8. Server-Sent Events (SSE) Stream for real-time live pushing
app.get('/api/classrooms/:code/stream', (req, res) => {
  const cleanCode = req.params.code.trim().toUpperCase();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const clientId = `sse_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const client: SSEClient = { id: clientId, classCode: cleanCode, res };
  sseClients.push(client);

  // Send initial data immediately
  const initialStudents = getStudentsForClass(cleanCode);
  res.write(`data: ${JSON.stringify({ type: 'INITIAL_STATE', classCode: cleanCode, students: initialStudents })}\n\n`);
  (res as any).flush?.();

  req.on('close', () => {
    const idx = sseClients.findIndex((c) => c.id === clientId);
    if (idx >= 0) sseClients.splice(idx, 1);
  });
});

// 9. Reset classroom students
app.post('/api/classrooms/:code/reset', (req, res) => {
  const cleanCode = req.params.code.trim().toUpperCase();
  if (students.has(cleanCode)) {
    students.get(cleanCode)!.clear();
    persistData();
    broadcastToClass(cleanCode, { type: 'STUDENTS_RESET', students: [] });
  }
  res.json({ success: true });
});

// 10. Close / Reopen classroom
app.post('/api/classrooms/:code/close', (req, res) => {
  const cleanCode = req.params.code.trim().toUpperCase();
  const { isClosed } = req.body;
  const classroom = classrooms.get(cleanCode);
  if (classroom) {
    classroom.isClosed = Boolean(isClosed);
    persistData();
    broadcastToClass('*', { type: 'CLASSROOM_UPDATED', classroom });
  }
  res.json({ success: true, isClosed: classroom?.isClosed });
});

// 11. Delete classroom
app.delete('/api/classrooms/:code', (req, res) => {
  const cleanCode = req.params.code.trim().toUpperCase();
  classrooms.delete(cleanCode);
  students.delete(cleanCode);
  persistData();
  broadcastToClass('*', { type: 'CLASSROOM_DELETED', classCode: cleanCode });
  res.json({ success: true });
});

// ============================================================================
// VITE OR STATIC SERVING
// ============================================================================
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Promise Land Server] Running on http://0.0.0.0:${PORT} (Production: ${isProduction})`);
  });
}

startServer().catch((err) => {
  console.error('[Server Error] Failed to start server:', err);
});
