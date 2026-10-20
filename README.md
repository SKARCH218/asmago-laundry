# 아스마고 세탁실

기숙사 세탁기·건조기(삼성, SmartThings 연동)의 실시간 사용 상태를 보여주는 웹앱.
"세탁기가 이미 사용중인지 모른 채 갔다가 헛걸음", "다 됐는데 안 가져가서 못 쓰는 상황"을 줄이기 위해 만듦.

## 기능

- 세탁기/건조기별 실시간 상태(대기중 / 사용중 / 완료 / 연결 끊김) 및 남은 시간 표시
- 완료 시 Web Push 알림 신청 (기기별로 구독 가능, 탭을 닫아도 옴)
- 완료 후 5분 지나면 자동으로 대기중 처리 (도어/무게 센서가 없어 실제 수거 여부는 확인 불가 — `src/lib/store.ts`의 `COMPLETION_TIMEOUT_MS`)
- 완료 예정 시각이 10분 이상 지났는데도 "사용중"이면 통신 두절로 보고 "연결 끊김"으로 표시 (와이파이 차단 시간대 등)
- 세탁실 도면대로 세탁기·건조기를 위치별로 배치한 화면 (도면 등록된 방만, `src/lib/floorplans.ts`)

## 준비물

1. SmartThings 앱에서 세탁기/건조기를 등록해둔 삼성 계정

2. [SmartThings Developer Workspace](https://smartthings.developer.samsung.com)에서 SmartApp(OAuth-In) 등록
   - "Register SmartApp" → "OAuth-In App" 선택
   - Redirect URI: `http://localhost:3000/api/auth/smartthings/callback` (배포 시엔 실제 도메인으로 추가 등록)
   - Scope: `r:devices:*`, `x:devices:*`
   - 등록 후 발급되는 **Client ID / Client Secret**을 기록해둘 것

   > PAT(Personal Access Token)는 만료가 짧아 매번 재발급해야 해서 쓰지 않습니다. OAuth는 refresh token으로
   > access token을 서버가 자동 갱신하므로 한 번만 로그인하면 계속 유지됩니다.

3. `.env.local` 생성 후 Client ID/Secret 입력 (`.env.local.example` 참고)

```bash
cp .env.local.example .env.local
# SMARTTHINGS_CLIENT_ID=... , SMARTTHINGS_CLIENT_SECRET=... 입력
```

4. 서버 실행 후 `/connect` 페이지에서 "SmartThings 계정 연결하기"를 눌러 로그인/권한 승인
   (성공하면 토큰이 `.data/smartthings-tokens.json`에 저장되고 이후 자동 갱신됨)

5. SmartThings 앱에서 각 기기 이름을 아래 규칙대로 변경
   `{위치코드}-{W|D}-{번호}` (W=세탁기, D=건조기)

   | 위치코드 | 위치 |
   |---|---|
   | B-2 | B동 2층 |
   | C-1 | C동 1층 |
   | C-3A | C동 3층 (엘레베이터 앞) |
   | C-3B | C동 3층 휴게실 앞 |

   예: `C-1-W-1`(C동 1층 세탁기 1번), `C-3A-D-1`(C동 3층 엘리베이터 앞 건조기 1번)

   **B동 2층 9~12번처럼 세탁기 없이 건조기만 위/아래로 쌓인 라인**은 위치코드는 그대로 `B-2`이고,
   번호에 `A`(하단)/`B`(상단)를 붙여서 구분합니다.
   예: `B-2-D-9A`(9번 라인 하단 건조기), `B-2-D-9B`(9번 라인 상단 건조기)

   이름 규칙에 맞지 않는 기기(A동 등)는 자동으로 화면에서 제외됩니다.
   위치를 추가/변경하려면 `src/lib/locations.ts`의 `ROOMS`, 도면 배치는 `src/lib/floorplans.ts`를 수정하면 됩니다.

## 실행

```bash
npm install
npm run dev
```

`.env.local`에 `MOCK_DEVICES=1`을 추가하면 SmartThings 연동 없이 가짜 데이터로 화면을 확인할 수 있습니다.

## Web Push 알림

세탁실 페이지에서 "완료되면 알림받기"를 누르면 브라우저 알림 권한을 요청하고, 서비스 워커([public/sw.js](public/sw.js))를 등록해 구독 정보를 서버에 저장합니다. 완료를 감지하는 시점(`/api/devices` 폴링)에 서버가 구독자에게 직접 푸시를 보내므로 탭을 닫아도 알림이 옵니다.

- 필요: `.env.local`에 `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` (이미 생성되어 있음, 재생성하려면 `npx web-push generate-vapid-keys --json`)
- iOS Safari는 홈 화면에 "추가"(PWA 설치)한 상태에서만 푸시가 옵니다 (Safari 16.4+). 안드로이드/데스크톱 크롬은 바로 동작합니다.
- **중요:** 알림은 누군가 `/api/devices`를 호출(=폴링)할 때만 감지·발송됩니다. 아무도 페이지를 안 보고 있으면 완료를 감지 못 합니다. Vercel Hobby(무료) 플랜은 Cron이 하루 1회로 제한되어 있어, 실사용 정확도를 높이려면 (1) 외부 무료 크론(cron-job.org 등)으로 `/api/devices`를 1~5분마다 호출하거나 (2) Vercel Pro의 짧은 주기 Cron을 쓰는 걸 권장합니다.

## 알아두면 좋은 점

- 완료 시각/수거 확인 여부, 푸시 구독 정보, **SmartThings OAuth 토큰**은 모두 `.data/`(로컬 파일)에 저장됩니다. 서버리스 배포(Vercel 등) 시에는 파일시스템이 휘발성이므로 `src/lib/store.ts`의 함수들을 Vercel KV, Upstash Redis, Firebase Firestore 등으로 교체해야 합니다. 토큰이 유실되면 `/connect`에서 다시 연결하면 됩니다.
- SmartThings 기기의 capability 속성명(`washerJobState`, `machineState`, `remainingTime` 등)은 모델/펌웨어에 따라 다를 수 있습니다. 실제 기기 연결 후 `src/lib/smartthings.ts`의 매핑을 점검하세요.
