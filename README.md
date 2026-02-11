## AI Loan Eligibility & Risk Assessment Bot

### Background Study

Traditional loan evaluation methods in banking often suffer from slow approval cycles,
subjective decision-making, and high operational workloads for credit officers. As digital lending
grows, institutions require intelligent systems that can evaluate applications objectively while
providing full transparency to applicants. This creates a necessity for an AI-powered compliance
engine that assesses eligibility and risk through structured, explainable logic, ensuring that
decisions are consistent, policy-compliant, and adaptable to changing applicant data.
Problem Statement
The objective is to design and implement an AI-powered Loan Eligibility & Risk Assessment
Compliance Bot. The bot must enforce dataset-driven lending policies, track application states
throughout the evaluation lifecycle, and assess risk using transparent logic. It is required to
generate explainable approval or rejection decisions and fail safely by escalating cases to human
officers when data is missing or contradictory, strictly avoiding discretionary approvals or
financial guarantees.

### Mandatory Features

1. Stateful Loan Application Processing: Maintains the applicant's state across
submission, eligibility, risk assessment, and final decision stages.
2. Dataset-Driven Eligibility Enforcement: Applies age, income, and credit score rules
directly from datasets to prevent threshold violations.
3. Loan Eligibility Scoring Engine: Processes income, employment, and liabilities to
output statuses of Approved, Review, or Rejected.
4. Approval Probability Estimation: Generates a 0–100% probability score based strictly
on rule-driven and dataset-backed logic.
5. Risk & Affordability Assessment: Calculates EMI affordability ratios and compares
total liabilities against income to adjust risk scores.
6. Explainable Decision Generation: Provides precise, non-generic justifications
explaining exactly which rules influenced the outcome.
7. Rule-Based Improvement Suggestions: Suggests actionable changes (e.g., tenure
adjustment) for "Review" or "Rejected" cases without offering guarantees.
8. Re-Evaluation & Scenario Simulation: Supports "what-if" simulations to recalculate
eligibility without altering the original application state.
9. Bias & Fairness Safeguards: Detects anomalous decisions and ensures irrelevant
attributes do not influence the assessment.
10. Fail-Safe & Escalation Control: Halts automation and routes cases to human credit
officers when data is ambiguous or contradictory.

### Absolute Restrictions

Prohibited
1. No Loan Guarantees: The system must never guarantee loan approval or final success.
2. No Financial Promises: Prohibits providing financial assurances or promises to the
applicant.
3. No Data Inference: The bot must not guess or infer missing applicant data; it must flag
it as incomplete.
4. No Hardcoded Logic: Approval logic must be derived from datasets rather than being
hardcoded.

5. No Opaque Reasoning: Reasoning behind AI decisions must never be hidden or "black-
box."

### Mandatory Constraints

1. Strict Policy Enforcement: All lending rules must be enforced exactly as defined in the
provided datasets.
2. Contextual State Maintenance: The system must maintain a consistent state throughout
the lifecycle: dataset → risk → decisions.
3. Rule-Based Justification: Every refusal or approval must be accompanied by a clear,
data-backed justification.

### Expected Outcome

• Objective Evaluation: Evaluating loan eligibility consistently using structured, dataset-
driven logic.

• Transparent Quantification: Quantifying approval probabilities and risk levels in a
defensible manner.

• Defensible Explanations: Explaining every decision clearly to reduce applicant
uncertainty and improve trust.

• Dynamic Adaptation: Adapting to scenario changes and "what-if" simulations in real-
time.

• Operational Efficiency: Reducing manual workload for credit officers while improving
fairness and policy compliance.
