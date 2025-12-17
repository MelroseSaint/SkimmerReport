# Canonical Navigation & Language Authority

*Version 1.0 - LOCKED*

## 1. Governance Overview
This document serves as the single source of truth for the SkimmerWatch platform's navigation structure and approved terminology. 
**No changes** may be made to the menu hierarchy, naming conventions, or user-facing labels without a formal governance review and update to this document.

## 2. Navigation Hierarchy (LOCKED)

### A. Top Navigation (Desktop)
*Visibility:* Always visible on PC/Tablet (excluding "Full Map" mode).
1.  **Home** (`/`)
2.  **Transparency** (`/transparency`)
    *   *Rationale:* Primary trust artifact. Must be top-level.
3.  **Privacy** (`/privacy`)
4.  **Full Map** (Action Button)
    *   *Label:* "Full Map" or "Full Map View"

### B. Side Navigation / Mobile Menu
*Visibility:* Accessible via Hamburger menu on all devices; primary nav on Mobile.
1.  **Home** (`/`)
2.  **Full Map View** (Action Button)
3.  **Transparency** (`/transparency`)
4.  **Privacy** (`/privacy`)
5.  **Locations** (`#locations`)
    *   *Context:* Opens the "Reported Locations" panel.
6.  **Reports** (`#reports`)
    *   *Context:* Opens the "Reports" list panel.

### C. Footer Navigation
*Visibility:* Present on logical page ends (Static pages) or map overlay (Map view).
1.  **Attribution:** "Developed by DarkStackStudios Inc."
2.  **Transparency:** Link to `/transparency`
3.  **Privacy:** Link to `/privacy`

---

## 3. Approved Terminology (LOCKED)

### Core Nouns
| Term | Definition | Context |
| :--- | :--- | :--- |
| **Report** | A single user submission. | *Never "Accusation"* |
| **Observation** | The act of seeing/recording an anomaly. | *UI Label: "Submit Observation"* |
| **Location** | A physical venue (Gas Station, ATM). | *UI Label: "Reported Locations"* |
| **Hotspot** | A geographic cluster of reports. | *UI Label: "Hotspots"* |

### Status Indicators
| Term | Definition |
| :--- | :--- |
| **User Reported** | Default status. Unverified. |
| **Under Review** | Flagged for admin check. |
| **Historical** | > 30 days old. |

### Forbidden Terms
*   ❌ **Safe / Verified:** Implies a guarantee we cannot make.
*   ❌ **Criminal / Fraudster:** Legal determinations we cannot make.
*   ❌ **Clean:** Implies a physical state we cannot confirm.

## 4. Change Control
Any proposed deviation from this structure requires:
1.  Justification brief.
2.  Update to `CANONICAL_NAVIGATION_AND_LANGUAGE.md`.
3.  Update to `GOVERNANCE_AND_POLICY.md` (if glossary is affected).
