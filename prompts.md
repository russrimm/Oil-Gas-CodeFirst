## User Prompts & Task Requests (Chronological Compilation)

This file catalogs the user’s prompts and explicit feature / change requests issued during the project to date. 
Where original wording was very brief (e.g., a single sentence like “make X more realistic”), the exact phrase is preserved. 
Some earlier prompts are reconstructed from the session summary and commit/patch context; those are marked with *(reconstructed)*.

### 1. Visual / Realism Enhancement Requests

    1. *(Reconstructed)* "Make the flare flame look more realistic."  
    2. *(Reconstructed)* "Improve the separator, manifold, and knockout drum realism."  
    3. *(Reconstructed)* "Adjust / rotate the KO drum ladder orientation."  
    4. *(Explicit)* "Make the vapor recovery unit look more realistic."  
    5. *(Explicit)* "Make the storage tanks look more realistic."  
    6. *(Explicit)* "Make the pumpjack look more realistic."  
    7. *(Explicit)* "I dont think the ladders on these crude tanks are supposed to look like this?" (Triggered ladder geometry rework.)  
    8. *(Explicit)* "The cage hoops dont look correct." (Led to cage hoop redesign.)  
    9. *(Explicit)* "Get rid of the cage hoops." (Result: hoops removed, open ladder retained.)

### 2. Inquiry / Ideation Prompts

10. *(Explicit)* "Are there any other cool features that I should consider adding?" (Result: roadmap & feature suggestions provided.)

### 3. Meta / Documentation Prompts

11. *(Explicit)* "Add all of the prompts I've given since the beginning to a prompts.md" (This file.)

### 4. Derived / Implicit Tasks (Inferred from context & prior summaries)

These were not necessarily phrased as direct user sentences in the preserved context but were acted upon or listed as pending:  
- Enhance wellhead assemblies realism.  
- Add catwalk and stair details between crude tanks.  
- Add VRU aftercooler, panel lights, compressor details.  
- Refine pumpjack kinematics (beam pivot, crank, pitman arms, polished rod stroke).  
- Smooth production metrics & integrate flare / recovered vapor coupling.  
- Provide focus highlight and educational quiz mode.  
- Remove square flare glow planes (aesthetic request).  

### 5. Pending / Suggested Future Features (Returned in response to prompt #10)

Condensed list (see session response for full rationale):  
- Dynamic tank & KO drum fluid level animation.  
- Valve wheel & gauge interactivity.  
- VRU compressor state machine (OFF / STARTING / RUN / TRIP).  
- Process flow overlay (animated arrows).  
- Emissions avoided cumulative counter (CO2e equivalence).  
- Camera tour / bookmarks.  
- Weather & day/night cycle affecting flame sway & lighting.  
- Time-series playback & snapshot bundle export.  
- Performance overlay & instanced geometry optimization.  
- Postprocessing (SSAO + emissive bloom) toggle.  
- WebXR exploration (stretch).  

### 6. Assumptions & Reconstruction Notes

- Items marked *(Reconstructed)* were not explicitly quoted in the currently visible fragments but are strongly implied by the chronological summary of changes already completed.  
- If you would like only verbatim prompts (excluding reconstructed), we can prune those entries—just request an updated version.  

### 7. Maintenance Guidance

When new prompts arrive, append them to Section 1 (if an enhancement), 2 (if ideation), or 3 (if meta). If a prompt spawns a significant internal task not directly quoted, log it in Section 4 for traceability.

---
Generated on: (auto) latest session timestamp.
