# Architecture Overview

## 기술 스택
- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS v4 + Radix UI
- **Backend**: NestJS + TypeORM + MySQL
- **Infra**: Frontend → Vercel, Backend → AWS EC2, DB → AWS Lightsail MySQL

## Frontend 구조 (`src/`)
```
pages/          # 라우트 컴포넌트 (50+ pages: Home, Search, TeaDetail, NoteDetail, MyNotes, Settings,
                #   Login, Register, Community, Cellar, UserProfile, Notifications, Saved,
                #   BlindSession*, TeaCalendar, TagDetail, ShopDetail, SessionHistory, Badges, ...)
components/     # 재사용 UI (Header, TeaCard, NoteCard, FAB, EmptyState, BottomNav, ...)
components/ui/  # shadcn/ui 래퍼 + cn() 유틸
lib/api.ts      # API 클라이언트 (teasApi, notesApi, authApi)
hooks/          # 커스텀 훅 (useAsyncData, useNoteForm, useTeaSearch, useImageUpload, ...)
contexts/       # React Context (AuthContext, AppModeContext, PullToRefreshContext, SidebarContext)
utils/          # 유틸리티 (teaTags, logging, ...)
constants/      # 전역 상수
styles/         # TailwindCSS v4 토큰 (globals.css @theme inline)
```

## Backend 구조 (`backend/src/`)
```
auth/           # 인증 (JWT, OAuth, 이메일 인증)
users/          # 사용자 관리
teas/           # 차 정보
notes/          # 시음 노트
posts/          # 커뮤니티 게시글
comments/       # 댓글
follows/        # 팔로우
cellar/         # 차 보관함
tags/           # 태그
notifications/  # 알림
reports/        # 신고
admin/          # 관리자
tea-sessions/   # 차 세션
blind-tasting/  # 블라인드 테이스팅
mail/           # 메일
common/         # 공통 유틸 (이미지 처리 등)
health/         # 헬스체크
database/       # TypeORM 설정
```
- Global prefix: `/api`

## API 엔드포인트
- **Auth**: POST /api/auth/register, /api/auth/login, /api/auth/profile
- **Teas**: GET /api/teas (search: `?q=`), GET /api/teas/:id, POST /api/teas
- **Notes**: GET /api/notes (`?userId`, `?public=true`, `?teaId`), GET/POST/PATCH/DELETE /api/notes/:id
- **Health**: GET /api/health

## App.tsx 라우트 추가 시 확인할 곳
1. lazy import
2. `<Route>` 추가
3. `OnboardingRouteGuard`의 `publicPaths`와 `EmailVerificationBannerWrapper`의 `hiddenPaths` 영향 여부 확인

## 데이터 흐름
1. `src/lib/api.ts` (apiClient) → HTTP 통신
2. Date 문자열 자동 변환, DECIMAL ratings → number
3. Note 응답 정규화: 백엔드 관계 데이터 → `teaName`, `userName`
4. 에러 메시지: 백엔드 한국어 메시지, 프론트 영어→한국어 번역

## Vite 프록시
- `/api` → `http://localhost:3000` (NestJS)

## 상세 문서
- 전체 아키텍처: `docs/architecture/Architecture.md`
- 서버 아키텍처: `docs/architecture/SERVER_ARCHITECTURE.md`
- 환경변수: `docs/configuration/ENVIRONMENT_VARIABLES.md`
- 배포: `docs/deployment/COMPLETE_DEPLOYMENT_SUMMARY.md`
