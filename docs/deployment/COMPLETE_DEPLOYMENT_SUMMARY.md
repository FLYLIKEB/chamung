# 배포 확인 절차

이 문서는 현재 배포가 성공했다는 증거가 아닙니다. 각 배포 후 아래 검사를 실행하고 결과를 확인합니다.

## 배포 완료 체크리스트

- [ ] GitHub Secrets 설정 완료
- [ ] Docker MySQL 컨테이너 실행 중
- [ ] GitHub Actions 배포 성공
- [ ] PM2 프로세스 실행 중
- [ ] Health check 통과 (포트 3000)
- [ ] Nginx 설정 완료
- [ ] Health check 통과 (Nginx를 통한 접근)
- [ ] API 엔드포인트 정상 작동
- [ ] 데이터베이스 연결 정상
- [ ] 로그에 에러 없음

## 사용 가능한 스크립트

### 배포 준비

```bash
# 배포 준비 체크리스트 확인
./scripts/prepare-deployment.sh
```

### Docker MySQL 확인

```bash
# 브라우저 SSH에서 실행
./scripts/check-docker-mysql.sh
```

### 배포 확인

```bash
# 브라우저 SSH에서 실행
./scripts/verify-deployment.sh YOUR_LIGHTSAIL_IP
```

### 최종 테스트

```bash
# 로컬에서 실행
./scripts/final-test.sh YOUR_LIGHTSAIL_IP
```

헬스 검사는 HTTP 성공과 JSON `status: healthy`를 모두 요구합니다. 실패 시 스크립트도 실패로 종료됩니다.
`/health`는 서버의 DB `SELECT 1`을 포함하지만 인증 API·실제 사용자 흐름을 검증하지는 않습니다.
HTTPS나 프록시 주소가 다르면 `DIRECT_HEALTH_URL`/`PUBLIC_HEALTH_URL`로 실제 검사 URL을 지정합니다.

### 모니터링

```bash
# 브라우저 SSH에서 실행
./scripts/setup-monitoring.sh
```

## 주요 문서

### 배포 관련

- [빠른 배포 시작 가이드](./QUICK_START_DEPLOYMENT.md)
- [배포 체크리스트](./DEPLOYMENT_CHECKLIST.md)
- [GitHub Actions 배포 실행 단계](./GITHUB_ACTIONS_DEPLOY_STEPS.md)
- [배포 실행 가이드](./DEPLOYMENT_EXECUTION_GUIDE.md)

### 설정 관련

- [GitHub Secrets 체크리스트](./GITHUB_SECRETS_CHECKLIST.md)
- [GitHub Secrets 설정 가이드](./GITHUB_SECRETS_SETUP.md)
- [Nginx 설정 가이드](./NGINX_SETUP_GUIDE.md)
- [브라우저 SSH에서 Nginx 설정](./NGINX_BROWSER_SSH_SETUP.md)

### 테스트 및 모니터링

- [테스트 가이드](./TESTING_GUIDE.md)
- [모니터링 가이드](./MONITORING_GUIDE.md)
- [브라우저 SSH 명령어 모음](./BROWSER_SSH_COMMANDS.md)

### 문제 해결

- [SSH 연결 문제 해결](./SSH_CONNECTION_TROUBLESHOOTING.md)

## 다음 단계

### 즉시 확인

1. **Health Check**
   ```bash
   curl http://YOUR_LIGHTSAIL_IP:3000/health
   curl http://YOUR_LIGHTSAIL_IP/health
   ```

2. **브라우저 SSH에서 확인**
   ```bash
   pm2 status
   pm2 logs chalog-backend --lines 50
   docker ps | grep chalog-mysql
   ```

### 정기적인 작업

1. **모니터링**
   - 메모리 사용량 확인 (주 1회)
   - 디스크 사용량 확인 (주 1회)
   - PM2 로그 확인 (일 1회)
   - 애플리케이션 에러 확인 (일 1회)

2. **백업 확인**
   - 자동 백업 스크립트 동작 확인
   - 백업 파일 확인

3. **성능 최적화**
   - 메모리 사용량이 높으면 인스턴스 업그레이드 고려
   - MySQL 쿼리 최적화
   - 인덱스 최적화

### 장기적인 작업

1. **보안**
   - 기본 비밀번호 변경 (프로덕션용)
   - SSL/TLS 인증서 설정 (HTTPS)
   - 정기적인 보안 업데이트

2. **인프라**
   - 인스턴스 업그레이드 고려 (1GB → 2GB RAM)
   - 자동 스케일링 설정 (필요시)
   - 다중 인스턴스 구성 (고가용성)

3. **모니터링 고도화**
   - 외부 모니터링 도구 연동
   - 알림 설정
   - 대시보드 구성

## 문제 발생 시

1. **로그 확인**
   - PM2 로그: `pm2 logs chalog-backend`
   - Nginx 로그: `sudo tail -f /var/log/nginx/chalog-backend-error.log`
   - Docker 로그: `docker logs chalog-mysql`

2. **상태 확인**
   - PM2 상태: `pm2 status`
   - 시스템 리소스: `free -h`, `df -h`
   - 포트 리스닝: `sudo netstat -tlnp | grep -E '(:3000|:80)'`

3. **문서 참고**
   - [문제 해결 가이드](./DEPLOYMENT_EXECUTION_GUIDE.md#문제-해결)
   - [SSH 연결 문제 해결](./SSH_CONNECTION_TROUBLESHOOTING.md)

## 배포 완료 판정

이 문서는 실행 절차이며 현재 서버의 정상 동작을 보증하지 않습니다. 배포 후 HTTP 응답과 health JSON, 실행 프로세스 및 배포 버전을 확인하고 실행 시각과 결과를 기록하세요. 검증 실패가 남아 있으면 배포 완료로 판정하지 않습니다.
