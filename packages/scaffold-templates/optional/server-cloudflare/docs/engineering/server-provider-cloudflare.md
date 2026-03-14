# server provider guide: Cloudflare

이 문서는 server가 Cloudflare Worker workspace일 때 먼저 보는 운영 가이드예요.
이 경우 server는 실제 배포되는 HTTP API workspace예요.

## server가 맡는 역할
- Cloudflare account와 Worker 연결
- Worker 로컬 실행, build, typecheck, deploy
- frontend, backoffice가 호출할 API base URL 관리

## 가장 먼저 볼 파일
- `server/wrangler.jsonc`
- `server/src/index.ts`
- `server/package.json`
- `server/.env.local`
- `server/README.md`

## 가장 먼저 쓸 명령
- `cd server && {{packageManagerRunCommand}} dev`
- `cd server && {{packageManagerRunCommand}} build`
- `cd server && {{packageManagerRunCommand}} typecheck`
- `cd server && {{packageManagerRunCommand}} deploy`

## frontend와 backoffice는 어떻게 연결되나요
- `frontend/src/lib/api.ts`
- `backoffice/src/lib/api.ts`
- 각 workspace의 `.env.local`

클라이언트는 API base URL을 읽어서 Worker를 호출해요.
Worker URL이 바뀌면 `.env.local`과 배포 경로를 같이 확인해야 해요.

## 작업할 때 먼저 확인할 것
- `server/.env.local`에 `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_WORKER_NAME`이 있는가
- API URL이 바뀌었으면 frontend/backoffice env도 같이 맞췄는가
- `wrangler.jsonc`와 실제 배포 대상이 일치하는가

자세한 구조와 스크립트는 `server/README.md`를 같이 봐요.
