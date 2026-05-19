import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Loader2 } from 'lucide-react';
import { AuthPageShell } from '../components/AuthPageShell';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

function getPasswordStrength(pw: string): { level: 'weak' | 'medium' | 'strong'; label: string } {
  const hasLetter = /[A-Za-z]/.test(pw);
  const hasNumber = /\d/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);
  const isLong = pw.length >= 12;

  if (pw.length === 0) return { level: 'weak', label: '' };
  if (pw.length < 8 || !hasLetter || !hasNumber) return { level: 'weak', label: '약함' };
  if (hasLetter && hasNumber && hasSpecial && isLong) return { level: 'strong', label: '강함' };
  return { level: 'medium', label: '보통' };
}

export function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error('모든 필드를 입력해주세요.');
      return;
    }

    if (password.length < 8) {
      toast.error('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      toast.error('비밀번호는 영문자와 숫자를 모두 포함해야 합니다.');
      return;
    }

    if (password.length > 72) {
      toast.error('비밀번호는 최대 72자 이하여야 합니다.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      setIsLoading(true);
      await register(email, name, password);
      navigate('/verify-email', { replace: true });
    } catch (error) {
      // 에러는 AuthContext에서 이미 처리됨
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageShell title="회원가입" description="새로운 계정을 만들어보세요">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/55" />
                <Input
                  id="name"
                  type="text"
                  placeholder="이름을 입력하세요"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 bg-transparent"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/55" />
                <Input
                  id="email"
                  type="email"
                  placeholder="이메일을 입력하세요"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-transparent"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/55" />
                <Input
                  id="password"
                  type="password"
                  placeholder="최소 8자, 영문+숫자 포함"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-transparent"
                  disabled={isLoading}
                />
              </div>
              {password.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {(['weak', 'medium', 'strong'] as const).map((level, i) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          strength.level === 'weak' && i === 0 ? 'bg-foreground/35' :
                          strength.level === 'medium' && i <= 1 ? 'bg-foreground/50' :
                          strength.level === 'strong' ? 'bg-foreground/65' :
                          'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                  {strength.label && (
                    <p className="text-xs font-medium text-muted-foreground">
                      비밀번호 강도: {strength.label}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/55" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="비밀번호를 다시 입력하세요"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 bg-transparent"
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  가입 중...
                </>
              ) : (
                '회원가입'
              )}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">이미 계정이 있으신가요? </span>
            <Link to="/login" className="text-foreground/70 hover:text-foreground hover:underline">
              로그인
            </Link>
          </div>
    </AuthPageShell>
  );
}
