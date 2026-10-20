---
title: Bank statement balance check
h1: Check bank statements for missing transactions
product: bank-statement-reconciler
order: 3
summary: Prove that an MT940 or camt.053 statement adds up, and find statements missing from a series.
description: Check MT940 and camt.053 bank statements to the cent - opening + credits − debits = closing - and detect missing or duplicate statements. Try it free with your own file.
lede: Before closing the month, make sure the statement adds up and nothing is missing. Drop an MT940 or camt file below to see the audit for every statement.
try_intro: "The second sample tab shows a series where one daily statement is missing: each statement adds up on its own, and the gap between them is reported."
steps:
  - "Drop one statement file, or a ZIP with a month or a year of them, into the box above."
  - "Each statement gets a verdict: **VERIFIED**, **DISCREPANCY** with the exact difference, or **UNVERIFIABLE** when the file has no balances."
  - "Statements of the same account are put in date order, so a gap or a duplicate shows up whatever order the files are in."
body_title: What is checked
faq:
  - q: What does VERIFIED mean exactly?
    a: "That opening balance + all credits − all debits equals the closing balance the bank reported in the same statement, to the cent. For MT942 and camt.054, which have no balances, the bank's own control totals are used."
  - q: How is a missing statement found?
    a: "Statements of one account are sorted by date. If one closes at a balance that is different from the next one's opening balance, a statement in between is missing, and the result is DISCREPANCY with a warning that names both statements."
  - q: What about a statement that was sent twice?
    a: "It is reported as a duplicate. Its transactions keep the same transaction IDs, so an import does not count them twice."
  - q: Is this AI?
    a: "No. The audit is plain arithmetic on the amounts in the file, so the same file always gives the same answer, and every number can be traced back to a line in the statement."
  - q: Is my file stored?
    a: "No. It is read in memory and discarded right after the result is sent back. In the demo, names and IBANs are masked by default."
---

| Verdict | Meaning |
|---|---|
| `VERIFIED` | Balances, or the bank's control totals, match the transactions to the cent. |
| `DISCREPANCY` | They do not match (the difference is shown), or a statement is missing between two others. |
| `UNVERIFIABLE` | The file has nothing to check against, or a file inside a ZIP could not be read. |

A damaged or unrelated file inside a ZIP (a PDF, a readme) is reported as a warning; the other statements are still
checked. Amounts are exact decimals in the currency's minor units, never rounded floating-point numbers.
