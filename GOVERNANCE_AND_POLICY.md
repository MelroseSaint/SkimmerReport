# SkimmerWatch Governance, Policy, and Positioning Standards

*Version 1.0 - Prepared for DarkStackStudios*

This document establishes the canonical language, policy framework, and strategic positioning for SkimmerWatch. It is designed to ensure consistency across the platform's public interface, internal documentation, and external communications.

---

## 1. Signal Quality & Report Integrity Framework

**Purpose:** To define the methodology used to maintain the credibility of user-submitted data.

SkimmerWatch operates on a **Signal-to-Noise Ratio (SNR)** philosophy. We recognize that in an open reporting system, individual data points are less significant than clusters, trends, and corroborated patterns. Our system employs a multi-tiered approach to preserve signal integrity:

### Time-Based Relevance (Temporal Decay)
Risk information is highly time-sensitive. A report from six months ago does not carry the same weight as a report from yesterday.
*   **Active Decay:** Reports are assigned a "relevance score" that degrades over a proprietary curve (e.g., 30 days).
*   **Automatic Archiving:** Reports exceeding the relevance window are automatically transitioned from "Active" to "Historical/Archived" views. They remain accessible for research but do not trigger active alerts.

### Independent Reporter Weighting
The platform prioritizes diversity of sources over volume of reports.
*   **Cluster Validation:** A "High Activity" indicator is triggered only when multiple *independent* devices or accounts report similar anomalies within a specific geographic radius and timeframe.
*   **Volume Dampening:** Multiple reports from a single source in a short timeframe are treated as a single signal to prevent artificial inflation of risk scores.

### Abuse & Spam Mitigation
To protect the ecosystem from coordination or vandalism:
*   **Velocity Limits:** Rate-limiting prevents rapid-fire submissions from single IP ranges or device fingerprints.
*   **Anomaly Detection:** Heuristic analysis identifies and suppresses reporting patterns that deviate significantly from organic human behavior (e.g., precise regular intervals, impossible travel speeds between locations).

### The Role of Thresholds
Thresholds act as a filter against false positives. A single report is a "Pre-Signal"—it is an unverified observation. It becomes a confirmed "Signal" only when it crosses a threshold of corroboration or specific evidentiary quality. This ensures that the map reflects *consensus* rather than isolated noise.

---

## 2. Public Transparency Page

**Title: Transparency & Methodology**

**Our Mission**
SkimmerWatch provides a community-driven layer of visibility into payment card security risks. We empower individuals to share observations and make informed decisions about where they use their cards.

**Data Collection Policy**
We collect specific, minimal data points necessary to contextualize risk:
*   **Location:** The approximate geospatial coordinates of the observation.
*   **Timestamp:** When the observation occurred.
*   **Observation Type:** The specific anomaly observed (e.g., loose card slot, hidden camera, keypad overlay).
*   **Category:** The type of terminal (ATM, Gas Pump, Point of Sale).

**What We Do Not Collect**
*   We do not collect personal identities of reporters for public display.
*   We do not track users' movements beyond the specific act of reporting.
*   We never collect payment card numbers, PINs, or financial data.

**How Reports Are Processed**
All submissions are treated as "User-Submitted Observations." They are not judgments of guilt or criminality.
1.  **Submission:** A user submits an observation.
2.  **Indexing:** The report is indexed by location and time.
3.  **Display:** The report appears on the public map as an unverified signal.
4.  **Aging:** Reports automatically fade in visual prominence as they age, acknowledging that devices may be inspected or removed by operators over time.

**Status Indicators**
*   **User Reported:** The default status for all incoming community data.
*   **Cluster/Hot Zone:** Indicates a higher volume of recent reports in this specific area.
*   **Historical:** Data older than 30 days, kept for reference but possibly no longer reflecting current conditions.

**Commitment to Neutrality**
SkimmerWatch is a neutral platform. We do not inspect terminals, we do not arrest suspects, and we do not certify devices as safe. We provide the aggregate data so you can assess your own risk tolerance. Errors or outdated reports can be flagged for review through the application interface.

---

## 3. Canonical Platform Glossary

**Authority:** These definitions are binding. Use them in all UI elements, documentation, and external communication.

### Core Terms

*   **Report**: A single, discrete user submission detailing an observation at a specific time and place. *Do not use "Accusation" or "Allegation."*
*   **Location**: The physical venue or coordinate where a Report is attached.
*   **Case**: A collection of Reports or data points related to a specific incident or series of incidents, often used for export or sharing.
*   **Risk Indicator**: Quantifiable data (visual or digital) suggesting a terminal may be compromised.
*   **Hot Zone / High-Density Area**: A geographic radius where the frequency of recent Reports exceeds the standard deviation for that region.
*   **Under Review**: A specialized status applied to a Location or Report that has been flagged for administrative quality checks.
*   **User-Submitted**: The definitive adjective for all raw data on the platform. *Always clarify that data is "User-Submitted" rather than "Verified" unless Platform Admin has explicitly intervened.*
*   **Time Relevance**: The concept that the validity of a risk signal decreases as time passes without corroboration.

### TERMS TO AVOID

*   **"Safe" / "Clean"**: *Never use these terms.* We cannot certify that a terminal is safe, only that no reports have been filed recently. Use "No Recent Reports" instead.
*   **"Fraud" / "Crime"**: *Avoid in UI.* These are legal determinations. Use "Suspicious Activity" or "Anomaly."
*   **"Verified"**: *Use with extreme caution.* Only use if a verified operator or law enforcement official has formally confirmed the status. Otherwise, use "Corroborated."

---

## 4. Last Activity & Data Freshness Statement

**Title: Understanding "Last Activity" and Data Relevance**

When viewing the SkimmerWatch map, you will see a "Last Activity" timestamp for Locations. It is crucial to interpret this correctly.

**What "Last Activity" Means**
This timestamp indicates the most recent user-submitted report received for that specific location or zone. It reflects the last time a community member observed and logged a potential issue.

**Why Freshness Matters**
Physical skimming devices are often transient; criminals may plant them for a few hours and remove them. Therefore:
*   **Recent Activity (< 24 hours):** Suggests a potentially active or highly relevant risk.
*   **Older Activity (> 7 days):** Suggests a historical risk pattern, though the specific device reported may have been removed or discovered.

**Important Limitation**
**"No Recent Reports" does not mean "Safe."**
The absence of activity simply means no one has submitted a report recently. A zero-report location could still have a compromised device that has gone unnoticed. Always inspect the card reader yourself (`Self-Check`) regardless of what the map indicates.

---

## 5. Pushback & Criticism Response Playbook (Internal)

**Scenario 1: Business owner claims "This harms my business."**
*Response:* "We understand your concern. SkimmerWatch functions like a neighborhood watch for digital safety. Our platform records user observations to help the community stay alert. We do not verify these reports but provide transparency so customers can practice better self-security. If you believe a report is factually impossible or spam, please flag it for review, and we will assess it against our integrity framework."

**Scenario 2: "This causes unnecessary fear."**
*Response:* "Awareness is the antidote to victimization. Skimmer fraud costs consumers millions annually. Our goal is not to induce fear, but to foster a habit of vigilance. By visualizing where people are spotting anomalies, we encourage checking card slots everywhere—a habit that ultimately protects your customers and reduces fraud."

**Scenario 3: "Anyone can submit fake reports."**
*Response:* "We take data integrity seriously. While we are an open platform, we employ velocity limits, anomaly detection, and 'independent reporter' weighting to filter out noise and spam. We prioritize clusters of reports from diverse sources over isolated data points."

**Scenario 4: "You’re not law enforcement."**
*Response:* "Correct. We are a civilian risk-intelligence platform. We do not enforce laws or seize evidence. We aggregate public-interest data that can be helpful to individuals, banks, and yes, potentially law enforcement, but our primary duty is to the informed consumer."

**Scenario 5: "Why isn't this verified?"**
*Response:* "Real-time wide-scale verification is physically impossible for any centralized body. We rely on the 'waze-model' of distributed observation. We believe that an unverified signal is better than zero signal, provided users understand it is user-submitted data and use it as a prompt to check for themselves."

---

## 6. Data-As-Intelligence Positioning Brief (Internal)

**Strategic Frame: From "App" to "Intelligence Layer"**

**Current Perception:** A consumer app for reporting bad ATMs.
**Desired Positioning:** A decentralized sensor network for payment fraud signals.

**The Pivot**
We are not just building a map; we are building a *signal fire*. Traditional fraud prevention relies on trailing indicators (fraudulent charges appearing days later). SkimmerWatch captures the *leading indicator*—the physical presence of the device itself.

**Key Value Pillars:**
1.  **Early-Signal Provider:** We detect the physical compromise before the financial data hits the dark web.
2.  **Trend Observatory:** We can visualize the migration of skimming crews across cities by tracking the chronological bloom of reports along highway corridors.
3.  **Risk Context:** For financial institutions, our "Hot Zones" provide geospatial risk context that transaction headers cannot. A card dip in a "Red Zone" carries a different risk profile than one in a "Green Zone."

**Conclusion**
SkimmerWatch is a public-interest intelligence layer. We do not compete with banks or police; we supply the messy, human-level ground truth that their digital systems cannot see.
