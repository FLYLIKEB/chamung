# Node.js 버전 설정

프런트엔드와 백엔드는 **Node.js 22.x**, 루트 npm은 **10 이상**을 사용합니다.
정본은 루트·백엔드 `package.json`의 `engines`와 루트 `.nvmrc`입니다.
CI 빌드도 Node.js 22를 사용하며, 배포 서버에 다른 주요 버전이 설치되어 있으면 배포를 중단합니다.

## 로컬 설정

nvm이 설치된 터미널에서 저장소 루트로 이동해 실행합니다.

```bash
nvm install
nvm use
node --version  # v22.x.x
npm --version  # 10 이상
npm ci
```

nvm이 없다면 Node.js 공식 배포 또는 운영체제의 버전 관리 도구로 22.x를 설치합니다.
Node.js 20, 23 등 요구 범위 밖의 버전은 지원되는 구성으로 취급하지 않습니다.

## 서버 설정

기존 서버는 배포 전에 Node.js 22로 갱신하고 PM2가 같은 Node 실행 파일을 사용하는지 확인합니다.
배포 스크립트는 Node/npm이 없는 신규 서버에만 Node.js 22를 설치합니다.
기존 서버의 주요 버전을 배포 중에 자동 변경하지 않습니다.

## 확인

```bash
npm run typecheck
npm run lint
npm run test:run
npm run build
npm --workspace backend test -- --runInBand
npm --workspace backend run build
```

`bash scripts/full-release.sh --check-only`는 위 검사와 오프라인 배포 검사 회귀 테스트를 수행하며
Git 커밋·푸시·병합이나 원격 배포를 실행하지 않습니다.
