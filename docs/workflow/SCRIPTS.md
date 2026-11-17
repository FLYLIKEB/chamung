# 스크립트 사용 가이드

ChaLog 프로젝트에서 사용하는 스크립트들의 역할과 사용법입니다.

## 크로스 플랫폼 지원

### Windows 사용자

Windows에서 스크립트를 실행하려면 다음 중 하나의 방법을 사용하세요:

**방법 1: Git Bash 사용 (권장)**
- Git for Windows와 함께 설치되는 Git Bash를 사용하세요.
- Git Bash에서 위의 모든 스크립트 명령어를 그대로 사용할 수 있습니다.

**방법 2: WSL (Windows Subsystem for Linux) 사용**
- WSL을 설치하고 Linux 환경에서 스크립트를 실행하세요.
- WSL에서는 모든 스크립트가 정상적으로 작동합니다.

**PowerShell/cmd에서 npm을 사용하는 경우**
- `npm run dev`, `npm run build`처럼 Node 프로그램을 실행하는 명령은 사용할 수 있습니다.
- `npm run dev:local`, `npm run dev:stop`은 `.sh`를 호출하므로 npm으로 감싸도 Bash가 필요합니다.
- 로컬 전체 스택 및 SSH 터널 스크립트는 Git Bash 또는 WSL 터미널에서 실행하세요.
- WSL에서는 Node.js 22, npm, SSH 등 필요한 도구를 WSL 환경에 별도로 설치해야 합니다.

## Git 워크플로우

### plan-from-issue.sh

GitHub 이슈 기반으로 .plan.md 파일을 생성함. Cursor Agent Plan 모드에서 사용.

```bash
./scripts/plan-from-issue.sh <이슈번호>

# 예시
./scripts/plan-from-issue.sh 42
```

**동작:** `gh issue view`로 이슈 조회 → docs/plans/issue-{번호}.plan.md 생성 → Agent 탭에서 Plan 모드로 해당 파일 내용 붙여넣어 실행

**옵션:**
- `--print`: 프롬프트 본문만 출력
- `--run`: Cursor CLI(agent)로 Plan 즉시 실행

**의존성:**
- GitHub CLI (`gh`): `brew install gh` 후 `gh auth login`
- python3: 프롬프트 구성용 (macOS 기본 포함)

**참고:** [`.cursor/rules/github-issue-workflow.mdc`](../../.cursor/rules/github-issue-workflow.mdc) 규칙 준수. Agent 탭에서 Shift+Tab으로 Plan 모드 전환 후 실행

---

### quick-commit.sh

빠른 커밋 및 푸시 자동화

```bash
./scripts/quick-commit.sh [브랜치명] [커밋메시지]

# 예시
./scripts/quick-commit.sh feature/new-feature "feat: 새로운 기능 추가"
```

**동작:** 변경사항 스테이징 → 커밋 → 푸시 (main 브랜치인 경우 새 브랜치 생성)

---

### full-release.sh

릴리스 전 필수 검사 및 명시적인 커밋·푸시·병합·태그 생성 도구. 배포 성공은 별도 원격 헬스 검증으로 확인합니다.

```bash
./scripts/full-release.sh "<commit-message>" "<version-tag>" [feature-branch]

# 예시
./scripts/full-release.sh "Release v1.2.3" "v1.2.3" feature/new-feature
```

**검사만 실행 (Git/원격 변경 없음):** `bash scripts/full-release.sh --check-only`

**필수 검사:** 프런트 타입검사·린트·테스트·빌드, 백엔드 단위 테스트·빌드, 오프라인 배포 검사 회귀 테스트.
누락되거나 실패한 검사는 즉시 실패로 끝납니다. DB 스키마 변경의 E2E 테스트는 별도 테스트 DB에서 실행해야 합니다.

**릴리스 동작:** 필수 검사 → feature 커밋·푸시 → 확인 후 main 병합 → 병합 결과 필수 검사 → 태그·푸시.
이 명령은 브랜치/원격을 변경하므로 로컬 검증에는 `--check-only`를 사용합니다.

**요구사항:** feature 브랜치는 `feature/*` 패턴, 버전 태그는 `v1.2.3` 형식

---

## 데이터베이스 관리

### start-ssh-tunnel.sh

SSH 터널을 통한 원격 DB(Lightsail Docker MySQL) 연결 시작

```bash
cd backend
./scripts/start-ssh-tunnel.sh
```

**환경 변수 (`.env`):**
```env
SSH_KEY_PATH=~/.ssh/your-key.pem
EC2_HOST=YOUR_LIGHTSAIL_IP
EC2_USER=ubuntu
SSH_TUNNEL_LOCAL_PORT=3307
```

> `.env.example` 파일을 참고하여 실제 값으로 설정하세요.

**터널 확인:** `ps aux | grep "ssh.*3307"`

---

### stop-ssh-tunnel.sh

실행 중인 SSH 터널 종료

```bash
cd backend
./scripts/stop-ssh-tunnel.sh
```

---

### check-database.sh

데이터베이스 연결 확인 및 생성

```bash
cd backend
./scripts/check-database.sh
```

**주의:** SSH 터널이 실행 중이어야 함 (`start-ssh-tunnel.sh` 실행 필요)

---

### insert-sample-data.js

샘플 데이터 삽입 (개발/테스트용)

```bash
cd backend
node scripts/insert-sample-data.js
```

**환경 변수:**
- `DATABASE_URL`: `mysql://user:password@host:port/database`
- 또는 개별 설정: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`

**동작:**
1. 3명의 샘플 사용자 생성 (비밀번호: `password123`)
2. 5개의 샘플 차 데이터 생성
3. 5개의 샘플 노트 데이터 생성 (사용자-차 관계 포함)

**주의사항:**
- **ID는 자동 생성됩니다**: `users`, `teas`, `notes` 테이블의 `id` 필드는 `INT AUTO_INCREMENT`이므로 스크립트에서 명시하지 않습니다
- 기존 데이터가 있는 경우 중복 오류가 발생할 수 있습니다
- 개발/테스트 환경에서만 사용하세요

**생성되는 데이터:**
- 사용자: 김차인, 이다원, 박녹차
- 차: 정산소종, 대홍포, 용정, 백호은침, 철관음
- 노트: 각 차에 대한 평가 및 메모

---

## 빠른 참조

### 개발 시작 시
```bash
cd backend
./scripts/start-ssh-tunnel.sh    # SSH 터널 시작
./scripts/check-database.sh      # DB 확인
npm run start:dev                # 백엔드 실행
```

### 개발 종료 시
```bash
cd backend
./scripts/stop-ssh-tunnel.sh     # SSH 터널 종료
```

### 이슈 기반 개발 시작
```bash
./scripts/plan-from-issue.sh 42    # Plan 생성
git checkout -b feature/issue-42-add-filter
# ... 구현 후 ...
```

### 커밋 및 릴리스
```bash
./scripts/quick-commit.sh feature/my-feature "feat: 기능 추가"
# PR 생성 후 승인되면:
./scripts/full-release.sh "Release v1.0.0" "v1.0.0" feature/my-feature
```

---

## 문제 해결

**스크립트 실행 권한 오류:**
```bash
chmod +x scripts/*.sh backend/scripts/*.sh
```

**SSH 터널 자동 종료:**
- 네트워크 연결 확인
- 터널 재시작: `./scripts/start-ssh-tunnel.sh`

**데이터베이스 연결 실패:**
- SSH 터널 확인: `ps aux | grep "ssh.*3307"`
- `.env` 파일의 `DATABASE_URL` 확인

---

## 관련 문서

- [`docs/infrastructure/DATABASE.md`](../infrastructure/DATABASE.md) - 데이터베이스 구조 및 사용 가이드
- [`docs/security/SECURITY.md`](../security/SECURITY.md) - 보안 가이드
- [`.cursor/rules/workflow/git.md`](../../.cursor/rules/workflow/git.md) - Git 전략 및 워크플로우
- [`.cursor/rules/workflow/pr.md`](../../.cursor/rules/workflow/pr.md) - PR 워크플로우

## 배포 상태 검증

- `bash scripts/final-test.sh <host>`: 직접 접근과 공개 `/health`의 HTTP 성공 및 JSON `status: healthy`를 모두 검사합니다. 인증 API/브라우저 흐름 검사는 포함하지 않습니다.
- `bash scripts/verify-deployment.sh <host>`: 배포 서버에서 실행하며 PM2 online, 배포 파일, 내부·공개 헬스를 검사합니다. 실패 시 0이 아닌 종료 코드를 반환합니다.
- 프록시/HTTPS 주소가 다르면 `DIRECT_HEALTH_URL`, `PUBLIC_HEALTH_URL`로 실제 주소를 지정합니다. 배포 폴더는 `BACKEND_DIR`로 지정할 수 있습니다.
- `bash scripts/test-deployment-checks.sh`: curl/PM2/npm을 임시 fixture로 대체하는 오프라인 회귀 테스트입니다. 실제 서버나 DB에 접근하지 않습니다.
