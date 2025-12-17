# Internal Governance Controls

*Confidential - Internal Use Only*

## 1. Moderation & Weighting Playbook

### Weighting Logic
Our platform prioritizes **corroboration** over **volume**.
*   **Default Weight:** 1.0 (Standard User)
*   **Reduced Weight (0.1 - 0.5):**
    *   New IP address with >3 reports in <10 minutes.
    *   Reporter location >50km from report coordinates (unless "Travel Mode" detected).
*   **Zero Weight (Shadowban):**
    *   Use of profanity or hate speech in descriptions.
    *   Direct targeting of named individuals (e.g., "John Smith did this").

### Delayed Reports
*   **Scenario:** High-risk keyword detected (e.g., "bomb", "gun", explicit threats).
*   **Action:** Report enters `PENDING_REVIEW` queue. Does not appear on map until manual release.

### Access Restriction
*   **Trigger:** 3+ flagged false reports from same device fingerprint.
*   **Action:** 24-hour submission lock.
*   **Escalation:** Permanent ban for bot-like behavior (API abuse).

## 2. Pushback Response Kit

### A. Retailer Complaints
**"Your map says my store has a skimmer. It doesn't. Remove it."**
*   *Response:* "Thank you for reaching out. SkimmerWatch aggregates user observations. If you have inspected your terminals and confirmed they are clear, please reply with a photo of the clear terminal or a statement of inspection. We will mark the report as 'Owner Disputed' or remove it if it violates our specific evidence threshold. Our goal is accurate data, not defamation."

### B. Media Misinterpretation
**"SkimmerWatch shows a 'crime wave' in [City]."**
*   *Response:* "SkimmerWatch visualizes *reports* of potential anomalies, not confirmed crimes. a 'Hot Zone' may indicate a highly vigilant community rather than a crime wave. We caution against using raw report counts as crime statistics without corroborating with local law enforcement data."

### C. "Panic" Claims
**"You are scaring people unnecessarily."**
*   *Response:* "Awareness is not panic; it is preparation. By showing where others have seen issues, we encourage the simple, effective habit of 'checking the reader' before dipping a card. This simple action prevents fraud."

## 3. Incident Escalation Rules

### Law Enforcement Inquiries
*   **Routine Data Request:** "Please refer to our public Transparency page/API. We provide aggregate data publically."
*   **Subpoena/Warrant:** Refer immediately to Legal Counsel. Do not volunteer non-public reporter metadata (IPs, emails) without valid legal process.

### Journalist Inquiries
*   **General Context:** Refer to `Transparency.tsx` and the "Mission" statement.
*   **Specific Incident:** "We cannot comment on individual user submissions. The platform reflects community observations at that point in time."

### Silence Protocol
*   **When to say nothing:**
    *   Social media baiting/trolling.
    *   Competitor disparagement.
    *   Political debates regarding crime rates.
    *   *Action:* Disengage. Do not reply.
