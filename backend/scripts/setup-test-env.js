#!/usr/bin/env node

/**
 * 테스트 환경 변수 설정 스크립트
 * DATABASE_URL을 기반으로 TEST_DATABASE_URL을 자동 생성
 */

const { config } = require('dotenv');
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '../.env');
const envTestPath = path.join(__dirname, '../.env.test');
const envExamplePath = path.join(__dirname, '../.env.example');

if (fs.existsSync(envPath)) {
  config({ path: envPath });
}

if (fs.existsSync(envTestPath)) {
  config({ path: envTestPath, override: true });
}

const configuredTestDatabaseUrl = process.env.TEST_DATABASE_URL;
const databaseUrl = process.env.DATABASE_URL;

if (!configuredTestDatabaseUrl && !databaseUrl) {
  console.error('❌ TEST_DATABASE_URL 또는 DATABASE_URL이 설정되지 않았습니다.');

  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    console.error('   다음 명령어를 실행하세요:');
    console.error('   cp backend/.env.example backend/.env');
    console.error('   그 후 DATABASE_URL 또는 TEST_DATABASE_URL을 설정해주세요.');
  } else {
    console.error('   backend/.env 또는 backend/.env.test에 TEST_DATABASE_URL을 설정해주세요.');
  }
  process.exit(1);
}

try {
  const testDatabaseUrl = configuredTestDatabaseUrl
    ? configuredTestDatabaseUrl
    : (() => {
        const url = new URL(databaseUrl);
        const dbName = url.pathname.slice(1);
        const testDbName = dbName.includes('_test') ? dbName : `${dbName}_test`;
        url.pathname = `/${testDbName}`;
        return url.toString();
      })();

  process.env.TEST_DATABASE_URL = testDatabaseUrl;
  process.env.NODE_ENV = 'test';


  // Jest 실행
  const { spawn } = require('child_process');
  const jestArgs = process.argv.slice(2); // 추가 인자 전달 (예: --testPathPatterns)
  
  const jestProcess = spawn('jest', ['--config', './test/jest-e2e.json', ...jestArgs], {
    stdio: 'inherit',
    env: process.env,
    cwd: path.join(__dirname, '..'),
  });
  
  jestProcess.on('exit', (code) => {
    process.exit(code || 0);
  });
} catch (error) {
  console.error('❌ DATABASE_URL 파싱 오류:', error.message);
  process.exit(1);
}

