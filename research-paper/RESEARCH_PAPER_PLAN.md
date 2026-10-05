# Research Paper Plan

## Proposed title

**AgriConnect: A Digital Agricultural Marketplace with Field Coordinator Support for Farmer–Buyer Connectivity**

Alternative: **A Digital Agriculture Marketplace for Direct Farmer–Buyer Connectivity with Field-Level Coordination Support**.

## Problem and research questions

Digital listing systems can assume farmers directly use online tools. AgriConnect includes an assisted pathway in which a field coordinator records a farmer and creates a crop listing attached to that collected-farmer record. Whether this improves participation, usability, or market outcomes is empirical; the repository contains no such measurements.

1. How can direct and coordinator-assisted listings preserve correct farmer attribution?
2. What role and ownership controls are needed for farmer, buyer, and coordinator operations?
3. How usable and acceptable is the assisted flow for farmers and coordinators in a defined pilot?
4. Against a declared baseline, what differences occur in task completion, errors, time, or participation?

## Objectives and proposed contribution

Describe a role-based marketplace prototype; model collected farmer records separately from accounts; associate assisted crops with the collected farmer and display that farmer; evaluate functional correctness, security, usability, and field feasibility. The proposed contribution is an architecture/workflow and, only after evaluation, evidence for declared measures. Novelty must be checked in literature before claiming it.

## Research gap to investigate

Investigate whether prior agricultural marketplace work addresses together: direct farmer-buyer discovery, field-level assistance, separate coordinator-collected farmer records, attribution of assisted listings, and role/ownership security. Do not assert prior work lacks these features until the review is done.

## Literature review themes

- Digital agriculture and e-agriculture.
- Farmer-to-buyer marketplaces and agricultural supply chains.
- Market information services.
- Digital inclusion and ICT adoption among farmers.
- Assisted digital services, extension workers, field agents/intermediaries.
- Access control and privacy in agricultural systems.
- Usability and field evaluation in rural/low-connectivity contexts.

Search Springer, IEEE, ACM, ScienceDirect and other verified academic publishers/indexes, plus official agriculture sources. Record search strategy, inclusion criteria, metadata/DOI and relevant study evidence. No references are created here; verify publisher/authoritative records before citation.

## Methodology

1. Scoping/systematic literature search with documented databases, queries, dates, inclusion/exclusion rules.
2. Requirements and privacy/threat analysis for the roles.
3. Design-science/software description based on repository artifacts.
4. Functional/security verification, including cross-owner isolation and correct collected-farmer attribution.
5. Human evaluation only with an appropriate approved protocol, consent, defined recruitment, and documented instrument.
6. Analyze observed data only; report setting, sample, limitations and uncertainty.

## Evaluation methodology

- Functional endpoint and end-to-end test outcomes.
- Security role matrix, cross-owner attempts, privilege-escalation prevention, DTO privacy and upload checks.
- Usability tasks with farmers/coordinators: completion, time, errors and suitable validated questionnaire.
- Field feasibility: connectivity/device limitations and coordinator workload in a specified pilot.
- Comparative claims require a predeclared baseline and fair procedure.

Quantitative results: **To be evaluated**. Income or market benefits: **Not measured in the current implementation**.

## Expected results (planned, not current)

A verified prototype and reproducible functional/security findings; if a study is conducted, measured usability/feasibility observations. No numerical results are available now. Do not claim improved adoption, income, prices, or reduced intermediaries without study evidence.

## Limitations and future work

Core API flows have previously been exercised and focused backend tests exist; the read-only Admin module now has service and role-authorization tests. Interactive browser testing, real Admin account/login, full coordinator cross-account runtime scenarios, and persistent image upload remain unverified. There are no user studies, deployment data, baseline, performance metrics, or outcome data. Local image storage and the absence of an order flow constrain claims. Pilot with consent, refine assisted workflow/privacy, evaluate mobile/low-bandwidth behavior, and add transactions only with defined requirements.

## Required references

None asserted yet. Build a verified bibliography during literature review with DOI/publisher URL, context, methods, findings and relevance. Do not cite unverified search snippets or invent citations.

## Springer-style paper roadmap

1. Title and authors/affiliations (confirm details)
2. Abstract (write after results)
3. Keywords
4. Introduction
5. Background/related work
6. Problem statement and research gap
7. Objectives and research questions
8. Proposed system
9. Architecture and methodology
10. System modules and field coordinator model
11. Farmer-buyer marketplace
12. Security architecture
13. Implementation
14. Experimental/testing methodology
15. Results (only measured; otherwise explicitly pending)
16. Discussion
17. Limitations/threats to validity
18. Future work
19. Conclusion
20. Verified references

## UML diagrams recommended (not generated)

- **Use Case:** farmer register/login/manage own crops; buyer browse/search/details; coordinator manage farmer records and assisted crops; admin view overview statistics, accounts, and crop listings (read-only).
- **Class/ER:** Role, User, Crop, CollectedFarmer; show optional linked account separately from crop ownership.
- **Component:** React pages/services, REST controllers, services, repositories, JPA entities, MySQL and upload handler.
- **Deployment:** browser, development Vite proxy, Spring server, MySQL and local upload directory; production topology unknown.
- **Sequence:** login/protected JWT request; farmer crop creation; coordinator crop creation and marketplace attribution.

