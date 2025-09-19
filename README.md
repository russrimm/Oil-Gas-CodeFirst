<div align="center">

# Energy Operations Learning Portal  
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
6. Deployment / Publishing to Power Apps
7. Project Structure
8. 3D & Animation Implementation Notes
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
* Interact with an embedded Copilot-style chat assistant

The application is powered locally by Vite and—once published—runs inside the Power Apps host with authentication, governance, and policy enforcement handled by the platform.

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

Extended architectural commentary lives in `docs/END_TO_END_TRANSCRIPT.md`.

---
## 3. Features
Category | Details
---------|--------
Multi‑Scene Education | Production pad, drilling rig, lifecycle map, pump assembly
Quiz / Learn Modes | Clue-based identification & animated reveal vs. detail panel
3D Pump Assembly | Explode/assemble sequence, impeller spin group, procedural blur texture
Mechanical Accuracy | Bolt repositioning, shaft length & centerline alignment, seal + housing detail
Metrics Simulation | Smoothly interpolated production metrics with pulse animations
Chat Integration | Copilot-style embedded chat component
Brightness & Theme | Adjustable exposure (tone mapping) + dark/light toggle
Focus Highlight | Emissive color & scale pulse on selection

---
## 4. Getting Started
### 4.1 Prerequisites
Install / verify:
* **Node.js** (LTS)
* **Git**
* **Power Platform CLI** (`pac`)
* **Visual Studio Code**
* (Optional) Power Platform Tools VS Code extension

Environment (Admin):
1. Enable *Power Apps code apps* feature in target environment (Admin Center → Environment → Settings → Product → Features).
2. Ensure intended users have a Power Apps Premium license (trial acceptable for evaluation).

### 4.2 Clone & Install
```powershell
git clone <your-repo-url>
cd AppFromScratch
npm install
```

### 4.3 Authenticate & Initialize (first time)
```powershell
pac auth create --environment <ENVIRONMENT_GUID>
pac code init --displayName "Energy Operations Learning Portal"
```

> `pac code init` creates/updates `power.config.json`. Do **not** hand-edit this file.

---
## 5. Development Workflow
Local development uses Vite for the SPA and `pac code run` to emulate host integration (especially once connectors are added).

Add (or confirm) a `dev` script in `package.json` that runs both:
```json
{
  "scripts": {
    "dev": "concurrently \"vite\" \"pac code run\"",
    "build": "tsc -b && vite build"
  }
}
```
Run:
```powershell
npm run dev
```
Navigate to the local Vite URL (commonly http://localhost:5173) for live reload.

---
## 6. Deployment / Publishing
Build and push the compiled assets to the Power Apps host:
```powershell
npm run build
pac code push
```
The CLI returns a URL to open the hosted app inside Power Apps. You can also find it at https://make.powerapps.com (Apps list). Share it with licensed users.

Re-publish whenever you change production code. (Preview: No Git pipeline or solution packaging integration yet.)

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
`src/components/CopilotChat.tsx` | Chat assistant component
`src/gsapHelpers.ts` | Animation helper utilities (stagger & pulse)
`src/types/gsap-local.d.ts` | Minimal GSAP type declarations (shim)
`docs/END_TO_END_TRANSCRIPT.md` | Detailed transcript & architectural narration

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

---
## 10. Troubleshooting
Issue | Resolution
-----|-----------
Host “App timed out” | Confirm `PowerProvider.tsx` calls SDK `initialize()` and you ran `npm run build` before `pac code push`.
Port collision (local) | Free the port or change Vite’s port (`vite --port 5174`).
Connector models stale | Re-run `pac code run` after adding/removing connectors.
Missing highlight reset | Ensure effect clearing emissive values runs on `focus` change (already implemented).
3D performance dips | Reduce geometry segment counts; pause animation when tab hidden.

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
Connectors | Introduce Dataverse or REST connector for real metric data
Guided Assembly | Step-by-step overlay & progress tracker
Accessibility | Keyboard navigation through parts, ARIA live region for selection
Performance | Geometry instancing for repeating hardware, animation pause on blur
Telemetry | Custom Application Insights events (scene changes, quiz success)
Internationalization | Externalize concept strings for multi-language support

---
## 13. Reference Documentation
* Architecture: https://learn.microsoft.com/en-us/power-apps/developer/code-apps/architecture
* Overview: https://learn.microsoft.com/en-us/power-apps/developer/code-apps/overview
* Quickstart: https://learn.microsoft.com/en-us/power-apps/developer/code-apps/quickstart
* PAC CLI Reference: https://learn.microsoft.com/en-us/power-platform/developer/cli/reference/code
* Extended transcript: `docs/END_TO_END_TRANSCRIPT.md`

---
### License / Preview Notice
This repository illustrates a Power Apps *code app* in Preview. Validate licensing, preview caveats, and governance policies before any production deployment.

---
### Contributing
Open issues / PRs for: performance, accessibility, or adding connector-based data examples. Please describe reproduction steps for any visual or mechanical alignment issues.

---
### Acknowledgements
Built with React, Vite, Three.js, GSAP, and the Power Apps SDK in a code-first learning scenario.

