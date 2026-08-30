import React, { useState } from 'react';
import { X, Lock, KeyRound, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import { sounds } from '../utils/audio';

interface AdminLoginModalProps {
  onClose: () => void;
  onLoginSuccess: () => void;
}

const ADMIN_PASSWORD_STORAGE_KEY = 'VOYAGE_OF_FAITH_ADMIN_PASSWORD';
export const DEFAULT_ADMIN_PASSWORD = 'faith365';

export function getAdminPassword(): string {
  try {
    return localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY) || DEFAULT_ADMIN_PASSWORD;
  } catch {
    return DEFAULT_ADMIN_PASSWORD;
  }
}

export function setAdminPassword(newPwd: string): void {
  try {
    localStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, newPwd);
  } catch {}
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  onClose,
  onLoginSuccess,
}) => {
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isChangingPwd, setIsChangingPwd] = useState<boolean>(false);
  const [newPwd, setNewPwd] = useState<string>('');
  const [changeSuccess, setChangeSuccess] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentAdminPwd = getAdminPassword();

    if (password.trim() === currentAdminPwd || password.trim() === DEFAULT_ADMIN_PASSWORD) {
      sounds.playCorrect();
      setErrorMsg(null);
      onLoginSuccess();
    } else {
      sounds.playWrong();
      setErrorMsg('비밀번호가 일치하지 않습니다. 다시 확인해 주세요.');
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd.trim().length < 4) {
      setErrorMsg('새 비밀번호는 4자리 이상이어야 합니다.');
      return;
    }
    setAdminPassword(newPwd.trim());
    setChangeSuccess(true);
    setErrorMsg(null);
    sounds.playCorrect();
    setTimeout(() => {
      setIsChangingPwd(false);
      setChangeSuccess(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-slate-950/95 backdrop-blur-md select-none">
      <div className="relative w-full max-w-sm bg-slate-900 border-2 sm:border-4 border-[#b48149] rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base text-amber-300">
                관리자 모드 로그인
              </h2>
              <span className="text-[10px] text-slate-400">
                교회학교 교사 및 보호자 전용
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 cursor-pointer active:scale-95"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        {!isChangingPwd ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300">
              <p className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>선생님 전용 보안 인증</span>
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                학생들의 암송 진행 리포트 확인 및 데이터 관리는 관리자 인증 후 이용 가능합니다.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>관리자 비밀번호</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="비밀번호 입력 (기본: faith365)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono text-white placeholder:text-slate-600 focus:border-amber-400 focus:outline-none pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-2 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-[11px] font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="min-h-[44px] w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-md transition cursor-pointer active:scale-95 mt-1"
            >
              관리자 모드 접속
            </button>

            <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
              <span>초기 비밀번호: <strong className="text-amber-400/80">faith365</strong></span>
              <button
                type="button"
                onClick={() => {
                  sounds.playTap();
                  setIsChangingPwd(true);
                  setErrorMsg(null);
                }}
                className="text-slate-400 hover:text-amber-300 underline cursor-pointer"
              >
                비밀번호 변경
              </button>
            </div>
          </form>
        ) : (
          /* Change Admin Password View */
          <form onSubmit={handleChangePassword} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-300">
                새 관리자 비밀번호 (4자리 이상)
              </label>
              <input
                type="text"
                value={newPwd}
                onChange={(e) => {
                  setNewPwd(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="새 비밀번호 입력"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono text-white placeholder:text-slate-600 focus:border-amber-400 focus:outline-none"
                autoFocus
              />
            </div>

            {changeSuccess && (
              <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-[11px] font-bold">
                ✓ 비밀번호가 성공적으로 변경되었습니다!
              </div>
            )}

            {errorMsg && (
              <div className="p-2 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-[11px] font-medium">
                {errorMsg}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  sounds.playTap();
                  setIsChangingPwd(false);
                }}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-black shadow"
              >
                변경 저장
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
