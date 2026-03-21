# create-rn-miniapp

![example](https://raw.githubusercontent.com/jingjing2222/create-rn-miniapp/main/example.gif)

`create-rn-miniapp`은 AppInToss MiniApp을 만들고, 생성 직후부터 바로 작업을 시작할 수 있게 문서와 Skill까지 함께 준비해주는 CLI예요.

공식 scaffold 위에 필요한 운영 문서와 Skill을 함께 준비해줘요. 그래서 앱을 만든 직후 "이제 어디부터 보면 되지?"를 줄여줘요.

## 이런 경우에 잘 맞아요

- 공식 scaffold는 유지하고, 팀이 바로 쓸 작업 문맥만 얹고 싶을 때
- 사람과 에이전트가 같은 문서와 Skill을 보면서 바로 작업하고 싶을 때
- frontend만이 아니라 optional `server`, `backoffice`까지 한 번에 시작하고 싶을 때

## 빠른 시작

대화형으로 생성:

```bash
npm create rn-miniapp
pnpm create rn-miniapp
yarn create rn-miniapp
bun create rn-miniapp
```

어떤 `create` 커맨드로 시작했는지에 따라 package manager가 자동으로 맞춰져요. 감지하지 못할 때만 `--package-manager`를 직접 넣으면 돼요.

옵션으로 한 번에 생성:

```bash
pnpm dlx create-rn-miniapp \
  --package-manager yarn \
  --name my-miniapp \
  --display-name "내 미니앱" \
  --server-provider cloudflare \
  --trpc \
  --with-backoffice
```

생성이 끝나면 선택한 package manager로 한 번 확인해보면 돼요:

```bash
cd my-miniapp
pnpm verify
# 또는 yarn verify / npm run verify / bun run verify
```

## 생성하면 바로 준비돼요

- `frontend`는 Granite + `@apps-in-toss/framework` 기반으로 시작해요.
- 필요하면 `server`, `backoffice`도 같이 만들 수 있어요.
- 루트에는 `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, `docs/*`, `.agents/skills`, `.claude/skills`가 같이 들어가요.
- `verify` 흐름도 함께 맞춰줘서 초반 설정이 쉽게 흐트러지지 않아요.

자세한 생성 구조와 운영 방식은 생성된 repo 문서를 보면 돼요.

## 생성한 다음엔 이렇게 보면 돼요

생성한 뒤에는 루트 `AGENTS.md`의 `Start Here`부터 보면 돼요.

그 흐름을 따라가면 지금 확인할 문서와 Skill이 자연스럽게 이어져요. 그래서 README에서 모든 작업 순서를 길게 외울 필요는 없어요.

## 자주 쓰는 옵션

- `--package-manager <pnpm|yarn|npm|bun>`: 생성과 루트 monorepo에 쓸 package manager를 직접 고를 때
- `--name`: 생성 디렉터리 이름이자 Granite `appName`을 정할 때
- `--display-name`: 사용자에게 보이는 앱 이름을 정할 때
- `--server-provider <supabase|cloudflare|firebase>`: `server` workspace를 같이 만들 때
- `--with-backoffice`: `backoffice` workspace를 같이 만들 때
- `--trpc`: `cloudflare` 위에 tRPC 경계를 같이 둘 때

## 필요할 때만 보는 옵션

- `--add`: 이미 만든 루트에 `server`나 `backoffice`를 나중에 붙일 때
- `--root-dir <dir>`: `--add` 대상을 다른 경로로 지정할 때
- `--output-dir <dir>`: 새 repo를 다른 상위 경로에 만들 때
- `--server-project-mode <create|existing>`: 기존 원격 리소스를 연결할지 새로 만들지 정할 때
- `--no-git`: 마지막 `git init`을 생략할 때
- `--skip-install`: 마지막 install과 정리를 건너뛸 때
- `--yes`: 선택형 질문을 기본값으로 진행할 때
- `--help`, `--version`: 도움말이나 버전을 확인할 때

## server provider 고르기

- `supabase`: DB와 Functions를 같이 빠르게 시작하고 싶을 때
- `cloudflare`: edge runtime과 binding 중심으로 가고 싶을 때
- `firebase`: Functions, Firestore, Web SDK 흐름이 익숙할 때

상세 연결 순서와 운영 방식은 생성된 repo의 `server/README.md`와 루트 문서를 보면 돼요.

## 기존 워크스페이스에 나중에 붙이기

이미 만든 루트에서 빠진 workspace만 나중에 붙이고 싶다면 `--add`를 쓰면 돼요.

현재 디렉터리 기준:

```bash
create-miniapp --add --server-provider supabase
create-miniapp --add --with-backoffice
```

다른 경로의 기존 루트를 수정하려면:

```bash
create-miniapp --add --root-dir /path/to/existing-miniapp --server-provider cloudflare --with-backoffice
```

`--add`는 기존 워크스페이스 정보를 읽고, 아직 없는 workspace만 추가해줘요.

## 생성 기준

- `frontend`: [AppInToss React Native tutorial](https://developers-apps-in-toss.toss.im/tutorials/react-native.html)
- `server`: [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started), [Cloudflare C3](https://developers.cloudflare.com/workers/get-started/guide/), [Firebase CLI](https://firebase.google.com/docs/cli)
- `backoffice`: [Vite](https://vite.dev/guide/)
