# GuardRail Studio — Frontend

React dashboard for GuardRail Studio, bootstrapped with
[Create React App](https://github.com/facebook/create-react-app) and using
[shadcn/ui](https://ui.shadcn.com/) + Tailwind CSS for components.

This project uses **Yarn**, not npm, for dependency management.

## Pages

- **Overview** — proxy/mock upstream health, allow/redact/block counters, decision-rate chart
- **Test a Prompt** — send a message through the live `guardrail-rs` proxy and see the real decision
- **Policy Editor** — edit `guardrail.toml` stages and custom rules, validated before hot-reload
- **Audit Log** — search/filter the proxy's decision history
- **Settings** — switch the active upstream (mock vs. Gemini)

## Available scripts

```bash
yarn install       # install dependencies
yarn start         # run the dev server (hot reload)
yarn build         # production build
```

`REACT_APP_BACKEND_URL` (in `.env`) must point at the FastAPI backend; all
API calls are made to `${REACT_APP_BACKEND_URL}/api/...`.

There is no automated frontend test suite in this project; UI changes are
verified manually and via screenshots (see the root
[`README.md`](../README.md) and [`docs/USER_GUIDE_AND_UI.md`](../docs/USER_GUIDE_AND_UI.md)).

## Learn more

This project was bootstrapped with Create React App — see the
[CRA documentation](https://facebook.github.io/create-react-app/docs/getting-started)
for details on the underlying build tooling.
