<div align="center">

# Oil & Gas Operations Training Portal  
*(Power Apps Code App – Preview)*

</div>

An interactive educational Single Page Application showcasing upstream / midstream / downstream lifecycle concepts, drilling and production pad visuals, and a 3D pump assembly with exploded/assembled animation. Built with **React + TypeScript + Vite + Three.js + GSAP** and integrated as a **Power Apps code app (preview)** via the **Power Apps SDK** and **PAC CLI**.

> **Preview Disclaimer**: Power Apps *code apps* are currently in Preview and not recommended for production workloads. Features and APIs may change. Always validate licensing and environment feature enablement.

---
## Table of Contents
1. Overview
2. Architecture
3. Features
4. Getting Started (Prerequisites & Setup)
5. Development Workflow
6. Deployment / Publishing
7. Project Structure
8. 3D & Animation Notes
9. Preview Limitations & Security Considerations
10. Troubleshooting
11. Scripts Reference
12. Roadmap
13. Reference Documentation

---
## 1. Overview
This portal demonstrates how a traditional front‑end SPA can be enriched with domain‑specific 3D visualizations (mechanical assembly, operational metrics) and deployed through the Power Apps platform using the **code apps** preview capability. Users can:
* Switch among scenes (Production Pad, Drilling Rig, Lifecycle Map, Pump Assembly)
* Toggle between Learn and Quiz modes
* Explore a realistic pump assembly (explode / assemble)
* View simulated live metrics with animated deltas
* (Optional) Interact with an embedded Copilot-style chat assistant (`CopilotChat.tsx` – only include/build if Copilot Studio integration is desired)

The application is powered locally by Vite and—once published—runs inside the Power Apps host with authentication, governance, and policy enforcement handled by the platform.

### 1.1 What Are Code Apps?
Power Apps *code apps* (Preview) let you host a fully custom Single Page Application (React/Vue/etc.) inside the managed Power Apps platform. You retain full control over UI & logic while inheriting:
* Microsoft Entra authentication
* Access to 1,500+ connectors via generated models/services
* Managed environment governance (DLP, sharing limits, conditional access)
* Simplified packaging & publishing through the PAC CLI (`pac code push`)

Your app + SDK + host form three logical runtime layers. Connector calls flow:
`Component → Generated Service Proxy → Power Apps SDK → Connector Backend → Data Source`.

---
## 2. Architecture
Layer | Role | Implementation
-----|------|---------------
UI / SPA | Presentation, scenes, state, routing-by-state | React components in `src/components` + hooks
3D / Visualization | Procedural geometry, lighting, GSAP animation | Three.js + custom groups (`AssemblyExplodedScene`)
Animation Orchestration | Tweens, stagger & highlight pulses | GSAP (`gsap` and helpers in `gsapHelpers`)
Power Apps SDK | Host readiness, future connector models | `@microsoft/power-apps`, `PowerProvider.tsx`
Configuration Metadata | Environment + connectors | `power.config.json` (generated / managed)
Build Tooling | Bundling & HMR | Vite + TypeScript
Publishing / Host Integration | Auth, run, push | PAC CLI (`pac code init`, `pac code run`, `pac code push`)

Runtime (future connector usage): `Component → Generated Service Proxy → Power Apps SDK → Connector Backend → Data Source`.

---
## 3. Features
Category | Details
---------|--------
Multi‑Scene Education | Production pad, drilling rig, lifecycle map, pump assembly
Quiz / Learn Modes | Clue-based identification & animated reveal vs. detail panel
3D Pump Assembly | Explode/assemble sequence, impeller spin group, procedural blur texture
Mechanical Accuracy | Bolt repositioning, shaft length & centerline alignment, seal + housing detail
Metrics Simulation | Smoothly interpolated production metrics with pulse animations
Chat Integration | (Optional) `CopilotChat.tsx` React component for Copilot Studio embedding (omit if not integrating chat)
Brightness & Theme | Adjustable exposure (tone mapping) + dark/light toggle
Focus Highlight | Emissive color & scale pulse on selection

---
## 4. Getting Started
### 4.1 Prerequisites (Tools & Environment)
Install / verify locally:
* **Node.js (LTS)**
* **Git**
* **Visual Studio Code**
* **Power Platform CLI (pac)** (install via MSI, npm global, or VS Code extension)
* *(Optional)* **Power Platform Tools VS Code Extension** for convenience commands
* *(Optional)* **Beast Mode 3.1 VS Code Chat Mode** – opinionated custom chat mode that enforces deep planning, todo-driven execution, recursive web research, and persistent memory for fewer half-finished agent turns (see section 5.1)
* *(Optional)* (Previously listed Copilot Studio integration & Entra registration items removed to streamline scope.)

Environment (Admin actions):
1. Open **Power Platform admin center** → target environment.
2. Go to **Settings → Product → Features**.
3. Enable **Power Apps code apps** toggle.
4. Confirm target users have **Power Apps Premium** licenses (trial acceptable for evaluation).

> Re-check official docs before onboarding new developers—preview requirements may shift.

### 4.2 Initialization & Installation (Single Source)
Use this one ordered list—no duplicate command list appears elsewhere.

1. (Create) If starting from scratch: `npm create vite@latest` (choose React + TypeScript) OR clone this repo (already configured).
2. (Auth) Authenticate the Power Platform CLI to your target environment:
	```powershell
	pac auth create --environment <ENVIRONMENT_GUID>
	```
	Optional alternative: `pac auth create` then `pac env select -env <ENV_URL>`.
3. (Initialize) Generate / update code app metadata (creates `power.config.json`):
	```powershell
	pac code init --displayName "Oil & Gas Operations Training Portal"
	```
4. (SDK Dependency) Ensure the Power Apps SDK is installed (skip if already in `package.json`):
	```powershell
	npm install @microsoft/power-apps
	```
5. (Provider) Confirm `src/PowerProvider.tsx` calls the SDK `initialize()` before rendering children and that `main.tsx` wraps `<App />` with `<PowerProvider>`.
6. (Dev Script) Verify `package.json` contains a dev script that starts both the local host bridge and Vite. Example:
	```json
	{
	  "scripts": {
		 "dev": "start pac code run && vite",
		 "build": "tsc -b && vite build"
	  }
	}
	```
	If you prefer concurrency tooling you can replace with `concurrently "pac code run" "vite"`.
7. (Install) Install all project dependencies:
	```powershell
	npm install
	```
8. (Run Locally) Start the development environment:
	```powershell
	npm run dev
	```
	This should spin up Vite AND the `pac code run` local server (for connector model loading once connectors are added).
9. (Build) Produce an optimized build:
	```powershell
	npm run build
	```
10. (Publish) Push compiled assets to the Power Apps host:
	 ```powershell
	 pac code push
	 ```
	 The command returns a URL; you can also open https://make.powerapps.com to run/share the app.
11. (Enhancements Added Post-Quickstart) Add or verify optional libraries introduced by this solution:
	 * Three.js (`three`) for procedural 3D scenes.
	 * GSAP (`gsap`) for tweening & highlight pulses (lightweight shim types used locally).
	 * (Optional) Copilot chat integration component (`CopilotChat.tsx`) for Copilot Studio (exclude if chat not required).
	 * (Optional) Beast Mode 3.1 custom chat mode for structured AI pairing.

Environment Validation:
The `dev` / `build` scripts run `scripts/validateEnv.mjs` first. If required variables (for enabled features) are missing, the command exits with an error so you discover misconfiguration early.

> Note: This ordered list is the canonical, single location for setup commands to avoid duplication and drift.

---
## 5. Development Workflow
1. Run `npm run dev` for hot reload; ensure the script starts both Vite and (optionally) `pac code run` for connector model loading (future use).
2. Adjust scenes / components; Three.js and GSAP changes reflect live via HMR.
3. Commit changes; repeat until feature stable.
4. Execute `npm run build` to validate type & production build output.

### 5.1 (Optional) Agentic Pairing: Beast Mode 3.1 Chat Mode
If you use GitHub Copilot Chat in VS Code or compatible agentic VS Code wrapper, consider adding "Beast Mode 3.1" custom chat mode to increase agent reliability.

Benefits observed:
* Enforces an explicit plan & markdown todo list (higher task completion).
* Prompts deeper self‑questioning (expected behavior, edge cases, dependencies).
* Requires recursive web/documentation retrieval before coding (reduces hallucinated APIs).
* Maintains lightweight memory file to avoid repeating past mistakes.

Install (summary):
1. Open the article: https://burkeholland.github.io/posts/beast-mode-3-1/
2. Open the linked gist ("Get Beast Mode") and copy the raw markdown.
3. In VS Code Chat: choose the chat mode dropdown → "Configure Modes" → "Create new custom chat mode file".
4. Select the *User Data Folder* target (makes it global) and paste the prompt.
5. Activate the new mode from the chat mode dropdown.

Usage Tips:
* Let it run through its todo list—interrupt only if it goes off track.
* Provide concrete goals ("Add Playwright screenshot capture for all scenes").
* When satisfied with a change batch, request a concise diff review before committing.
* Treat it as a structured co‑pilot; still run local builds/tests to validate.

Disclaimer: Beast Mode is an opinionated community workflow prompt, not an official Microsoft feature. Review contents before pasting and adapt to your org’s security & contribution guidelines.


---
## 6. Deployment / Publishing
Steps to push updated version to Power Apps environment:
```powershell
npm run build
pac code push
```
If successful, the console lists a Power Apps URL. Open it or navigate in the maker portal, then share with licensed users. Re-run after each release-worthy change.

---
---
## 7. Project Structure
Path | Description
-----|------------
`power.config.json` | Generated code app metadata
`vite.config.ts` | Vite build configuration
`src/PowerProvider.tsx` | Host readiness handshake (calls SDK initialize)
`src/components/SupportPortal.tsx` | Core scene & mode controller
`src/components/AssemblyExplodedScene.tsx` | Pump assembly 3D + GSAP tweens
`src/components/DrillingRigScene.tsx` | Drilling rig visualization
`src/components/ThreeDashboard.tsx` | Production pad 3D scene
`src/components/LifecycleMap.tsx` | Value-chain animated map
`src/components/CopilotChat.tsx` | (Optional) Copilot Studio chat assistant component (safe to remove if not using chat)
`src/gsapHelpers.ts` | Animation helper utilities (stagger & pulse)
`src/types/gsap-local.d.ts` | Minimal GSAP type declarations (shim)

---
## 8. 3D & Animation Notes
* **Three.js**: Uses groups to isolate transform concerns (e.g., impeller spin vs. assembly translation).
* **Shaft & Impeller Alignment**: Centerline constant ensures vertical congruence; shaft midpoint and length adjusted for mechanical realism.
* **Procedural Texture**: Canvas-generated radial streak map for impeller creates a motion-blur illusion (opacity + gradient fade).
* **Explode / Assemble**: Each part stores `finalPos` and `explodedPos`. GSAP interpolates `group.position` with a slight stagger for dramatization.
* **Focus Highlight**: Emissive color override + temporary scale tween for user-selected component.

---
## 9. Preview Limitations & Security Considerations
Limitation | Impact / Action
----------|-----------------
No CSP support yet | Review external scripts; minimize untrusted sources
No Git pipelines / solution packaging for code apps | Manual `pac code push` for ALM currently
No native App Insights binding | Add instrumentation manually if needed
No Dataverse solution packaging | Pipelines & managed solutions unsupported for now
SAS IP restriction not supported | Evaluate network-level constraints separately

Security Checklist:
* Validate DLP policies **before** adding connectors.
* Least-privilege for custom APIs.
* Consider feature toggles for experimental 3D performance features.

### 9.1 Security & Compliance Notes
* **Authentication**: Delegated to the Power Apps host after publish (Entra ID). Local dev uses your existing auth context.
* **DLP & Conditional Access**: Enforced similarly to canvas apps at launch time; connector consent dialogs appear unless suppressed by admin policy.
* **Tenant Isolation / External Users**: Behavior matches canvas apps; ensure guest access policies align with data exposure.
* **Telemetry**: Native platform app event telemetry limited for code apps (preview). Add custom Application Insights manually if required.
* **External APIs**: Because CSP isn’t enforced yet, audit any third-party script or endpoint usage.

---
## 10. Troubleshooting
Issue | Resolution
-----|-----------
Host “App timed out” | Confirm `PowerProvider.tsx` calls SDK `initialize()` and you ran `npm run build` before `pac code push`.
Stuck on "fetching your app" screen | Ensure a production build exists, `PowerProvider.tsx` succeeds, and no uncaught runtime errors appear in dev tools.
Port collision (local dev) | Another process is using the Vite or `pac code run` port (commonly 5173 / 6000 range). Terminate lingering processes (e.g. `pac`), or change Vite port with `--port`.
Connector models stale | Restart `pac code run` after adding/removing connectors; re-run build if generation artifacts changed.

---
## 11. Scripts Reference
Script | Purpose
------|--------
`npm run dev` | Concurrent Vite + `pac code run` (local dev)
`npm run build` | Type check (project references) + production bundle
`pac code push` | Publish compiled bundle to environment
`pac auth list` | View current auth profiles

---
## 12. Roadmap
Area | Planned Enhancement
-----|--------------------
Connectors | Data Sources or REST API for real-time data
Telemetry | Application Insights events
---
## 13. Reference Documentation
* Architecture: https://learn.microsoft.com/en-us/power-apps/developer/code-apps/architecture
* Overview: https://learn.microsoft.com/en-us/power-apps/developer/code-apps/overview
* Quickstart: https://learn.microsoft.com/en-us/power-apps/developer/code-apps/quickstart
* PAC CLI Reference: https://learn.microsoft.com/en-us/power-platform/developer/cli/reference/code
* Historical extended transcript content has been merged here (the separate transcript file was removed to avoid duplication).

---
### License / Preview Notice
This repository illustrates a Power Apps *code app* in Preview. Validate licensing, preview caveats, and governance policies before any production deployment.

---
### Contributing
Open issues / PRs for: performance, accessibility, or adding connector-based data examples. Please describe reproduction steps for any visual or mechanical alignment issues.

---
### Acknowledgements
Built with React, Vite, Three.js, GSAP, and the Power Apps SDK in a code-first learning scenario.

