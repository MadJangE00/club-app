# Club App 프로젝트 정리

## 기술 스택

| 항목 | 내용 |
|------|------|
| 프레임워크 | Next.js (App Router) |
| 백엔드/DB | Supabase (PostgreSQL + Auth + Storage + RLS) |
| 스타일 | Tailwind CSS |
| 배포 | Vercel |
| 자동화 | Vercel Cron Jobs |
| PWA | next-pwa |

---

## 구현된 기능 목록

### 인증
- 이메일/패스워드 회원가입 · 로그인
- 비밀번호 재설정
- 관리자(`role = 'admin'`) 구분

### 동호회
- 생성 (30P 차감 → 관리자)
- 가입 (3P: 회장 1P + 관리자 1P + 상금 1P)
- 탈퇴 (+1P 환급, 회장에게서)
- 캘린더 뷰
- **갤러리** — 완료된 모임 레포트를 썸네일 카드로 모아보기
- 포인트 바구니 표시 (목록 + 상세)

### 모임 (Events)
- 생성 (5P → 동호회 바구니)
- 참석 / 고민중 / 불참 선택 (참석 시 3P → 모임 바구니)
- **상태 흐름**: `active` → `pending` → `completed`
  - 시간 지남 → 모임장이 "모임 완료" → `pending` (참여 변경 잠금)
  - "참석자 확인 완료" → `completed` → 마켓 업로드 페이지로 이동
- **레포트** — 참석자 명단 + 참석률 + 포인트 결과 + 결과 사진
- 완료 시 모임 바구니 → 동호회 바구니로 자동 이전 (자정 크론)
- `final_point_basket` — 이전 전 최종값 보존

### 포인트 시스템

```
users.points         — 개인 지갑
clubs.point_basket   — 동호회 바구니
events.point_basket  — 모임 바구니 (완료 후 동호회로 이전)
prize_pool.amount    — 상금 풀 (복권용)
point_bank           — 출석 은행
```

| 행동 | 차감 | 목적지 |
|------|------|--------|
| 동호회 개설 | 30P | 관리자 |
| 동호회 가입 | 3P | 회장 1P + 관리자 1P + 상금 1P |
| 모임 개설 | 5P | 동호회 바구니 |
| 모임 참석 | 3P | 모임 바구니 |
| 게시글 작성 | 3P (전체게시판 첫글 무료) | — |
| 댓글 작성 | 1P (본인 글 무료) | — |
| 복권 티켓 | 0→1→2→4→8→16P (누적) | 상금 풀 |
| 사진 구매 | xP (판매자 지정) | 판매자 |
| 탈퇴 | — | 나 +1P |

### 출석 시스템
- 매일 앱 출석 체크 → 포인트 지급
- 연속 출석 일수 카운트 (KST 기준 날짜 문자열 비교)
- 은행 잔액에서 출석자 수만큼 차감
- 남은 포인트 → 상금 풀로 이월
- 자정마다 은행 리셋 (`전체 유저 수 × 10`)
- 관리자 수동 리셋 가능

### 복권
- 하루 1회차, 자정 자동 추첨 (KST 00:02)
- 티켓 구매 비용: 1회 무료, 이후 2배씩 증가
- 많이 살수록 당첨 확률 증가 (가중치)
- 모드: 승자독식 / 커스텀 분배 (관리자 설정)
- 상금 규모: prize_pool의 n% (기본 50%, 관리자 조정)
- 수동 추첨 가능

### 게시판
- 동호회 게시판 (posts) — 동호회 멤버 한정
- 전체 게시판 (board_posts) — 공지 / 자유 / 버그신고
  - 공지 카테고리는 관리자만 작성
  - 하루 첫 게시글 무료

### 마켓 (photos / pixel-market)
- 이미지 업로드 + 가격 설정
- 포인트로 구매 (구매 기록 저장, 중복 방지)
- 모임 완료 시 결과 이미지를 마켓에 연결 (`event_id` FK)
- 모임 레포트에서 구매 링크 표시

### 관리자 페이지 (`/admin`)
- 유저 목록 + 포인트 확인 + 권한/정지 관리
- 동호회/게시글/사진 관리
- 은행 잔액 + 전날 출석률 확인 + 수동 리셋
- 복권 설정 (모드, 분배율, 상금 비율)
- 서비스 설정 (회원가입 허용 / 동호회 개설 허용 / 개설 비용)

### PWA
- `manifest.json` (PNG 아이콘 필수 — SVG 안 됨)
- 홈 화면 추가 지원 (Android Chrome 기준)

---

## DB 테이블 구조

```
users               — 유저 (points, role, consecutive_days 등)
clubs               — 동호회 (point_basket)
club_members        — 동호회 멤버
events              — 모임 (status, point_basket, final_point_basket)
attendance          — 참석 여부 (points_paid)
posts               — 동호회 게시글
comments            — 댓글
post_likes          — 좋아요
photo_posts         — 마켓 이미지 (price, event_id)
photo_votes         — 투표/좋아요
photo_purchases     — 구매 기록
board_posts         — 전체게시판
point_bank          — 출석 은행
prize_pool          — 상금 풀
lottery_config      — 복권 설정
lottery_rounds      — 복권 회차
lottery_tickets     — 복권 티켓
lottery_winners     — 당첨 결과
site_settings       — 서비스 전역 설정
```

---

## Supabase SQL 파일 실행 순서

처음부터 새로 구축할 때 순서:

1. `schema.sql` — 기본 테이블 생성
2. `add-points.sql` — users에 points, role 등 추가
3. `fix-rls.sql` — RLS 정책 보완
4. `fix-attendance.sql` — attendance 정책
5. `fix-users-select.sql` — users 조회 정책
6. `add-delete-policies.sql` — 삭제 정책
7. `point-bank.sql` — 출석 은행 + 상금 풀
8. `lottery.sql` — 복권 시스템
9. `board.sql` — 전체 게시판
10. `deduct-points.sql` — 게시글/댓글 포인트 차감 RPC
11. `event-points.sql` — 모임 포인트 바구니
12. `event-status.sql` — 모임 상태 흐름 + 마켓 구매
13. `club-creation-cost.sql` — 동호회 개설 비용
14. `club-membership-points.sql` — 가입/탈퇴 포인트

---

## Vercel 환경변수

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY   (크론/관리자 API용)
CRON_SECRET                 (크론 인증)
```

---

## 배운 점 / 다음엔 이렇게

### 잘 된 것
- **SECURITY DEFINER RPC** — 포인트 차감 로직을 DB 함수로 처리해서 클라이언트에서 조작 불가능
- **ISR (revalidate)** — 서버 컴포넌트 + 캐시 전략으로 불필요한 실시간 쿼리 줄임
- **상태 흐름 설계** — 모임 active→pending→completed로 명확하게 단계 분리

### 아쉬운 점 / 개선 방향

1. **스키마를 처음부터 완성하지 못함**
   - ALTER TABLE로 컬럼을 계속 추가하는 방식이 됨
   - 다음엔: 기획 단계에서 포인트 흐름 전체를 먼저 설계하고 schema.sql에 반영

2. **SQL 파일이 너무 많이 쪼개짐**
   - 14개의 SQL 파일이 생김 → 관리 어려움
   - 다음엔: `schema.sql` (테이블) + `functions.sql` (RPC 모음) + `rls.sql` (정책) 3개로 통합

3. **TypeScript 타입 `as any` 남용**
   - Supabase 타입 자동생성(`supabase gen types`) 활용하면 타입 안전성 확보 가능

4. **포인트 흐름 문서화**
   - 포인트가 오가는 경로가 많아서 버그 추적이 어려움
   - 다음엔: 포인트 트랜잭션 로그 테이블(`point_logs`) 만들어서 모든 이동 기록

5. **관리자 설정 테이블**
   - `site_settings`에 컬럼을 계속 추가하는 방식
   - 다음엔: `key-value` 구조(`settings_key TEXT, value JSONB`)로 유연하게

6. **모임 상태 관리**
   - 자정 크론에서 자동으로 `active → pending`으로 바꾸는 것도 고려할 수 있음
   - 현재는 모임장이 수동으로 눌러야 함

7. **이미지 저장소**
   - Supabase Storage bucket 설정을 코드로 관리하지 않음
   - 다음엔: 버킷 생성 SQL/스크립트도 포함

---

## 페이지 구조 한눈에 보기

```
/                       — 홈 (출석 체크 위젯)
/clubs                  — 동호회 목록
/clubs/[id]             — 동호회 상세 (멤버, 모임, 갤러리)
/clubs/new              — 동호회 생성
/events                 — 모임 목록
/events/[id]            — 모임 상세 (참석, 상태 관리)
/events/[id]/report     — 모임 레포트 (인쇄 가능)
/events/[id]/market     — 결과 이미지 마켓 업로드
/events/new             — 모임 생성
/posts/[id]             — 동호회 게시글 상세
/board                  — 전체 게시판
/board/[id]             — 게시글 상세
/photos                 — 마켓 (pixel-market)
/photos/[id]            — 사진 상세 (구매/투표)
/lottery                — 복권
/profile                — 내 프로필
/admin                  — 관리자 대시보드
/login                  — 로그인
```
