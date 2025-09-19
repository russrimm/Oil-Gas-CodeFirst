## Oil & Gas Operations Training Portal – 

> NOTE: Power Apps *code apps* are in Preview. Don’t use in production without validating limitations and licensing. Links below point to official Microsoft Learn pages (always treat those as the authoritative source):
> - Architecture: https://learn.microsoft.com/en-us/power-apps/developer/code-apps/architecture
> - Overview & prerequisites: https://learn.microsoft.com/en-us/power-apps/developer/code-apps/overview
> - Quickstart (auth, init, run, push): https://learn.microsoft.com/en-us/power-apps/developer/code-apps/quickstart

---
### 1. What Are Code Apps?
Code apps let you host a fully custom Single Page App (SPA) built with a framework (React) inside the managed Power Apps platform so you inherit authentication, governance (DLP, sharing limits, conditional access), and access to 1,500+ connectors while retaining total control of UI and logic.

---
### 2. Layered Architecture
Layer | Role | In This Project
------|------|---------------
Your React/TypeScript Code | UI, rendering, 3D scenes, quiz logic | Components under `src/components/*`
Power Apps SDK | Initialization & connector model plumbing | `@microsoft/power-apps`, `PowerProvider.tsx`
`power.config.json` | Generated metadata (environment + connectors) | Root file (auto-managed)
Host (Power Apps) | Entra Authentication, application load lifecycle | Active after `pac code push`
PAC CLI | Auth profiles, init, local proxy, publish | Developer tooling (`pac auth`, `pac code init/run/push`)

Runtime data call path (once connectors added): Component → Generated Service Proxy → SDK → Connector Backend → Data Source.

---
### 3. Prerequisites
Tools: VS Code, Node.JS (LTS version), Git, Power Platform Tools VSCode Extension. For non-coders, I also highly recommend using Github Copilot with Beast Mode and GPT-5 along with a few MCPs like Context7, Memory, SequentialThinking, Github, and MS Learn.
Environment: Power Platform or Global admin needs to enable “Power Apps code apps” feature; users require a Power Apps Premium license (trial OK for evaluation).

---
### 4. Initialization Flow (From Quickstart → Customized App)
1. Create or clone a Vite + React + TypeScript project.
2. Add the Power Apps SDK dependency (see README for exact command syntax).
3. Authenticate the PAC CLI to the target environment (refer to README command section).
4. Initialize code app metadata with an appropriate display name.
5. Implement `PowerProvider.tsx` so it calls the SDK `initialize()` before rendering the React tree.
6. Add UI scenes, GSAP animation helpers, and Three.js 3D visualization modules.
7. Start local development (dual run of Vite and the local host proxy). See README for the development command.
8. Produce a production build (build command documented in README).
9. Publish the compiled bundle to the Power Apps environment (push command in README) and note the returned URL.

---
### 5. Repository Structure (Key Files)
Path | Purpose
-----|--------
`power.config.json` | SDK/CLI metadata (don’t hand edit)
`src/PowerProvider.tsx` | Signals readiness to host
`src/components/SupportPortal.tsx` | Scene switcher, quiz/learn logic, brightness/theme
`src/components/AssemblyExplodedScene.tsx` | GSAP + Three.js exploded / assembled pump visualization
`src/components/DrillingRigScene.tsx`, `ThreeDashboard.tsx` | Additional 3D scenes
`src/components/LifecycleMap.tsx` | Upstream → Midstream → Downstream visual
`src/components/CopilotChat.tsx` | Embedded conversational assistant
`src/types/gsap-local.d.ts` | Lightweight GSAP declaration shim

---
### 6. Feature Highlights Implemented
- Multi‑scene educational portal (Production Pad, Drilling Rig, Lifecycle Map, Pump Assembly)
- Quiz vs Learn modes with animated transitions
- 3D mechanical assembly (impeller spin group, exploded/assembled GSAP timeline, procedural radial texture)
- Copilot Studio agent chat integration
- Adjustable scene brightness + theme toggle

---
### 7. Command Reference Location
All shell commands have been consolidated into **README.md** (see Getting Started, Development Workflow, and Deployment sections). This transcript intentionally omits direct command blocks to avoid duplication.

---
### 8. Animation & 3D Implementation Notes
- Three.js & GSAP

---
### 9. Preview Limitations

Limitation | Impact
-----------|-------
No CSP support yet | Evaluate external scripts carefully
No Git integration / pipelines for code apps | Manual `pac code push` ALM path presently
No Dataverse solution packaging | Can’t use solution-based pipelines yet
No native App Insights wiring | Add manually; limited platform event telemetry
Some advanced security features (e.g., SAS IP restriction) not yet supported | Review risk profile before production-like use

---
### 10. Security & Compliance Notes
- Authentication: Delegated to Power Apps host after publish.
- DLP Policies: Must be verified *before* adding connectors.
- Conditional Access & tenant isolation applied similar to canvas apps.
- External API usage should be reviewed since CSP is not enforced (preview).

---
### 11. Troubleshooting Quick Table
Issue | Check / Fix
-----|------------
Can't start due to port 8080 in use | Terminate any lingering pac/Vite processes (process termination guidance in README)
Stuck "fetching your app" | Ensure a build was produced and `PowerProvider.tsx` initializes the SDK without errors

---
### 12. Reference Links (Canonical Sources)
- Architecture: https://learn.microsoft.com/en-us/power-apps/developer/code-apps/architecture
- Overview: https://learn.microsoft.com/en-us/power-apps/developer/code-apps/overview
- Quickstart: https://learn.microsoft.com/en-us/power-apps/developer/code-apps/quickstart
- PAC CLI reference: https://learn.microsoft.com/en-us/power-platform/developer/cli/reference/code

---
### 13. License / Preview Reminder
All usage subject to Power Apps licensing. Preview capabilities may change or deprecate; re-check Microsoft Learn before production rollout.

---
Document version: 1.0 (seeded from Github Copilot chat transcript). Update as architecture or platform features evolve.
