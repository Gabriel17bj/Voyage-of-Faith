import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { initializeFirestore, Firestore } from 'firebase/firestore';

/**
 * Firebase(구글) 설정 로딩 순서
 * 1) Vercel / .env 환경변수 (VITE_FIREBASE_*)  ← 구글 API 키(AIza...)를 그대로 사용
 * 2) Google AI Studio가 만들어 주는 firebase-applet-config.json (있을 때만)
 */
type FirebaseWebConfig = {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  appId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  firestoreDatabaseId?: string;
};

// 파일이 없어도 빌드가 깨지지 않도록 glob으로 선택적 로딩
const appletConfigModules = import.meta.glob<{ default: FirebaseWebConfig }>(
  '/firebase-applet-config.json',
  { eager: true }
);
const appletConfig: FirebaseWebConfig =
  Object.values(appletConfigModules)[0]?.default || {};

const env = import.meta.env;
const config: FirebaseWebConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || appletConfig.apiKey,
  authDomain:
    env.VITE_FIREBASE_AUTH_DOMAIN ||
    appletConfig.authDomain ||
    (env.VITE_FIREBASE_PROJECT_ID ? `${env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com` : undefined),
  projectId: env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId,
  appId: env.VITE_FIREBASE_APP_ID || appletConfig.appId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId,
  firestoreDatabaseId: env.VITE_FIREBASE_DATABASE_ID || appletConfig.firestoreDatabaseId,
};

export const isFirebaseConfigured = (): boolean => {
  // Firestore 접속에는 API 키 + 프로젝트 ID만 있으면 충분합니다.
  return Boolean(config.apiKey && config.projectId);
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured()) {
  try {
    app = !getApps().length
      ? initializeApp({
          apiKey: config.apiKey,
          authDomain: config.authDomain,
          projectId: config.projectId,
          appId: config.appId,
          storageBucket: config.storageBucket,
          messagingSenderId: config.messagingSenderId,
        })
      : getApp();

    auth = getAuth(app);
    // 학교/교회 Wi-Fi, 일부 통신사망에서 실시간 스트림이 막히는 경우 자동으로 long-polling 사용
    const settings = { experimentalAutoDetectLongPolling: true };
    db =
      config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)'
        ? initializeFirestore(app, settings, config.firestoreDatabaseId)
        : initializeFirestore(app, settings);
  } catch (err) {
    console.warn('[Firebase] Initialization failed:', err);
  }
} else {
  console.info('[Firebase] 설정이 없어 서버/로컬 모드로 실행합니다.');
}

/** 교사용 연결 진단 화면에 표시할 설정 요약 (키는 일부만 노출) */
export function getFirebaseConfigSummary() {
  return {
    configured: isFirebaseConfigured(),
    projectId: config.projectId || '',
    apiKeyPreview: config.apiKey ? `${config.apiKey.slice(0, 6)}…${config.apiKey.slice(-4)}` : '',
    databaseId: config.firestoreDatabaseId || '(default)',
    source: env.VITE_FIREBASE_API_KEY ? 'env' : appletConfig.apiKey ? 'firebase-applet-config.json' : 'none',
  };
}

export { app, auth, db };
