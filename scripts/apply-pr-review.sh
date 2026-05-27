#!/bin/bash

set -e
set -u

# 사용법: ./scripts/apply-pr-review.sh <PR_URL_OR_NUMBER>
# 예시: ./scripts/apply-pr-review.sh https://github.com/FLYLIKEB/chamung/pull/73
# 예시: ./scripts/apply-pr-review.sh 73

PR_URL_OR_NUMBER=${1:-}
if [ -z "$PR_URL_OR_NUMBER" ]; then
  echo "❌ Usage: $0 <PR_URL_OR_NUMBER>"
  echo "   예시: $0 https://github.com/FLYLIKEB/chamung/pull/73"
  echo "   예시: $0 73"
  exit 1
fi

# PR 번호 추출
if [[ $PR_URL_OR_NUMBER =~ ^https:// ]]; then
  PR_NUMBER=$(echo $PR_URL_OR_NUMBER | grep -oP '/pull/\K\d+' || echo "")
  if [ -z "$PR_NUMBER" ]; then
    echo "❌ PR 번호를 추출할 수 없습니다. 올바른 GitHub PR URL을 입력해주세요."
    exit 1
  fi
else
  PR_NUMBER=$PR_URL_OR_NUMBER
fi

echo "📋 Processing PR #$PR_NUMBER..."

# GitHub CLI 확인
if ! command -v gh &> /dev/null; then
  echo "❌ GitHub CLI (gh)가 설치되어 있지 않습니다."
  echo "   설치: brew install gh"
  exit 1
fi

# GitHub 인증 확인
if ! gh auth status &> /dev/null; then
  echo "❌ GitHub 인증이 필요합니다."
  echo "   실행: gh auth login"
  exit 1
fi

# 리뷰 스레드 가져오기
echo "🔍 Fetching review threads..."
REPO_OWNER="FLYLIKEB"
REPO_NAME="chamung"

REVIEW_THREADS=$(gh api graphql -f query="
query {
  repository(owner: \"$REPO_OWNER\", name: \"$REPO_NAME\") {
    pullRequest(number: $PR_NUMBER) {
      id
      title
      reviewThreads(first: 100) {
        nodes {
          id
          isResolved
          path
          line
          originalLine
          comments(first: 10) {
            nodes {
              bodyText
              author {
                login
              }
            }
          }
        }
      }
    }
  }
}" 2>/dev/null || echo "")

if [ -z "$REVIEW_THREADS" ]; then
  echo "❌ PR #$PR_NUMBER을 찾을 수 없거나 접근 권한이 없습니다."
  exit 1
fi

# 해결되지 않은 리뷰 스레드 확인
UNRESOLVED_THREADS=$(echo "$REVIEW_THREADS" | jq -r '.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false) | .id' 2>/dev/null || echo "")

if [ -z "$UNRESOLVED_THREADS" ]; then
  echo "✅ 해결되지 않은 리뷰 스레드가 없습니다."
  
  # 변경사항이 있으면 커밋 및 푸시
  if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "📝 변경사항이 있습니다. 커밋 및 푸시를 진행합니다..."
    CURRENT_BRANCH=$(git branch --show-current)
    git add .
    git commit -m "fix: [PR #$PR_NUMBER 리뷰 반영] 리뷰 반영 완료" || echo "⚠️  커밋할 변경사항이 없습니다."
    git push origin "$CURRENT_BRANCH" || echo "⚠️  푸시 실패"
    echo "✅ 변경사항 커밋 및 푸시 완료"
  fi
  exit 0
fi

# 리뷰 스레드 정보 출력
echo ""
echo "📝 해결되지 않은 리뷰 스레드:"
echo "$REVIEW_THREADS" | jq -r '.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false) | "  - \(.path):\(.line // .originalLine // "?") - \(.comments.nodes[0].bodyText[:80] // "")..."' 2>/dev/null || echo "  (파싱 실패)"

echo ""
echo "💡 리뷰 내용을 확인한 후, 코드를 수정해주세요."
echo "   코드 수정이 완료되면 이 스크립트를 다시 실행하거나,"
echo "   직접 커밋/푸시 후 리뷰 스레드를 resolve하세요."
echo ""

# 변경사항 확인 및 커밋/푸시
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "📝 변경사항이 감지되었습니다."
  echo "📋 변경된 파일:"
  git diff --name-only
  
  read -p "커밋 및 푸시를 진행하시겠습니까? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    CURRENT_BRANCH=$(git branch --show-current)
    
    # 커밋 메시지 생성
    COMMIT_MSG="fix: [PR #$PR_NUMBER 리뷰 반영] 리뷰 반영"
    
    git add .
    git commit -m "$COMMIT_MSG" || {
      echo "⚠️  커밋 실패. 변경사항이 없거나 이미 커밋되었을 수 있습니다."
      exit 0
    }
    
    echo "🚀 Pushing to origin/$CURRENT_BRANCH..."
    git push origin "$CURRENT_BRANCH" || {
      echo "❌ 푸시 실패"
      exit 1
    }
    
    echo "✅ 커밋 및 푸시 완료"
    
    # 리뷰 스레드 resolve 여부 확인
    read -p "리뷰 스레드를 자동으로 resolve하시겠습니까? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      echo "🔧 Resolving review threads..."
      RESOLVED_COUNT=0
      for THREAD_ID in $UNRESOLVED_THREADS; do
        RESULT=$(gh api graphql -f query="
        mutation {
          resolveReviewThread(input: { threadId: \"$THREAD_ID\" }) {
            thread {
              id
              isResolved
            }
          }
        }" 2>/dev/null || echo "")
        
        if [ ! -z "$RESULT" ]; then
          RESOLVED=$(echo "$RESULT" | jq -r '.data.resolveReviewThread.thread.isResolved' 2>/dev/null || echo "false")
          if [ "$RESOLVED" = "true" ]; then
            RESOLVED_COUNT=$((RESOLVED_COUNT + 1))
            echo "  ✅ Resolved thread: $THREAD_ID"
          else
            echo "  ⚠️  Failed to resolve thread: $THREAD_ID"
          fi
        fi
      done
      
      echo "✅ $RESOLVED_COUNT개의 리뷰 스레드가 resolve되었습니다."
    fi
  else
    echo "❌ 취소되었습니다."
  fi
else
  echo "ℹ️  변경사항이 없습니다. 코드를 수정한 후 다시 실행해주세요."
fi

echo ""
echo "✅ PR 리뷰 처리 완료"

