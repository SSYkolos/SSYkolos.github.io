"""Build the Bank Statement Reconciler demo for the website.

Writes the sample statements to assets/demo/ (downloadable) and the engine's real output
to _data/demos/reconciler.json, which the product page renders. Run it with the
reconciler project's own Python, from anywhere:

    ..\\b2b-statement-reconciler\\.venv\\Scripts\\python _tools\\build_reconciler_demo.py

All names, IBANs and amounts in the samples are fictional.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]
ENGINE = SITE.parent / "b2b-statement-reconciler"
sys.path.insert(0, str(ENGINE))

from reconciler import reconcile_bytes  # noqa: E402
from reconciler.exporters import export_to_csv  # noqa: E402

OUT_FILES = SITE / "assets" / "demo"
OUT_DATA = SITE / "_data" / "demos" / "reconciler.json"

# German savings-bank style MT940: ?20 subfields, a direct debit and its return, Latin-1 umlaut.
SPARKASSE = """\
:20:STARTUMSE
:25:50010517/0648489890
:28C:00012/001
:60F:C260130EUR8420,10
:61:2601300130CR2380,00NTRFNONREF//POS 1
:86:166?00GUTSCHR. UEBERWEISUNG?109310?20EREF+RE-2026-0042?21SVWZ
+Rechnung 2026-0042 vom?22 05.01.2026 Wartungsvertrag?30COBADEFFX
XX?31DE89370400440532013000?32Müller Maschinenbau GmbH
:61:2601300130DR129,90NDDTNONREF//POS 2
:86:105?00FOLGELASTSCHRIFT?109248?20EREF+NT-INV-889123?21MREF+M-0
099-77?22CRED+DE98ZZZ09999999999?23SVWZ+Nordnetz Rechnung Janu?24
ar 2026 Kd-Nr 4455?30DUSSDEDDXXX?31DE65100700000123456789?32Nordn
etz Telekom GmbH
:61:2601300130RD129,90NRTINONREF//POS 3
:86:109?00RUECKLASTSCHRIFT?109248?20EREF+NT-INV-889123?21MREF+M-0
099-77?22CRED+DE98ZZZ09999999999?23SVWZ+Ruecklastschrift?30DUSSDE
DDXXX?31DE65100700000123456789?32Nordnetz Telekom GmbH?34901
:62F:C260130EUR10800,10
-
"""

# Dutch MT940 with three daily statements; statement 00006 is missing.
ING_GAP = """\
:20:P260105000000001
:25:NL69INGB0123456789EUR
:28C:00004
:60F:C260102EUR12500,00
:61:2601050105C2500,00NTRFNONREF//2601050012345678
:86:/EREF/INV-2026-0012//CNTP/NL44RABO0123456789/RABONL2U/Acme Tr
ading B.V./AMSTERDAM//REMI/USTD//Invoice INV-2026-0012 January ho
sting/
:61:2601050105D189,95NDDTEREF//2601050012345679
:86:/EREF/CH-778899//MARF/MNDT-CH-01//CSID/NL12ZZZ123456780000//C
NTP/IE29AIBK93115212345678/AIBKIE2D/Cloudhost Europe Ltd///REMI/U
STD//Hosting invoice 778899/
:62F:C260105EUR14810,05
:64:C260105EUR14810,05
:20:P260106000000001
:25:NL69INGB0123456789EUR
:28C:00005
:60F:C260105EUR14810,05
:61:2601060106D1000,00NTRFNONREF//2601060099
:86:/EREF/NOTPROVIDED//CNTP/NL91ABNA0417164300/ABNANL2A/J. de Vri
es///REMI/USTD//Freelance design week 1/
:62F:C260106EUR13810,05
:64:C260106EUR13810,05
:20:P260108000000001
:25:NL69INGB0123456789EUR
:28C:00007
:60F:C260107EUR13310,05
:61:2601080108C750,00NTRFNONREF//2601080011
:86:/EREF/INV-2026-0019//CNTP/NL44RABO0123456789/RABONL2U/Acme Tr
ading B.V.///REMI/USTD//Invoice INV-2026-0019/
:62F:C260108EUR14060,05
:64:C260108EUR14060,05
"""

SAMPLES = [
    {
        "id": "mt940-de",
        "title": "German MT940",
        "file": "sparkasse-style-mt940.sta",
        "content": SPARKASSE.replace("\n", "\r\n").encode("latin-1"),
        "blurb": "A savings-bank file with ?20 subfields, a direct debit and its return (an RD reversal), "
                 "and a Latin-1 umlaut in a counterparty name.",
    },
    {
        "id": "mt940-gap",
        "title": "Missing statement",
        "file": "ing-style-mt940-gap.sta",
        "content": ING_GAP.replace("\n", "\r\n").encode("ascii"),
        "blurb": "Three daily statements that each add up, but statement 00006 is missing. "
                 "The balance chain shows it.",
    },
    {
        "id": "camt053",
        "title": "ISO 20022 camt.053",
        "file": "camt053-v02.xml",
        "content": (ENGINE / "tests" / "fixtures" / "camt053_v02_de.xml").read_bytes(),
        "blurb": "An XML statement with a batch booking, a returned payment and a pending entry.",
    },
]

MAX_INPUT_LINES = 140


def decode(data: bytes) -> str:
    for enc in ("utf-8", "latin-1"):
        try:
            return data.decode(enc)
        except UnicodeDecodeError:
            continue
    return data.decode("utf-8", "replace")


def main() -> None:
    OUT_FILES.mkdir(parents=True, exist_ok=True)
    OUT_DATA.parent.mkdir(parents=True, exist_ok=True)
    demos = []
    for s in SAMPLES:
        (OUT_FILES / s["file"]).write_bytes(s["content"])
        result = reconcile_bytes(s["content"], source_name=s["file"])
        text = decode(s["content"]).replace("\r\n", "\n")
        lines = text.rstrip("\n").split("\n")
        statements = [{
            "reference": st["statement_reference"],
            "account": st["account_id"],
            "currency": st["currency"],
            "opening": st["opening_balance"],
            "credits": st["total_credits"],
            "debits": st["total_debits"],
            "calculated": st["calculated_closing_balance"],
            "closing": st["closing_balance"],
            "difference": st["discrepancy_amount"],
            "verdict": st["audit_verdict"],
            "method": st["audit_method"],
            "notes": st["audit_notes"],
        } for st in result["statements"]]
        transactions = [{
            "date": tx["booking_date"],
            "direction": tx["direction"],
            "reversal": tx["is_reversal"],
            "status": tx["status"],
            "amount": tx["signed_amount"],
            "currency": tx["currency"],
            "name": tx["counterparty_name"],
            "iban": tx["counterparty_iban"],
            "reference": tx["end_to_end_id"],
            "purpose": tx["purpose"],
        } for st in result["statements"] for tx in st["transactions"]]
        demos.append({
            "id": s["id"],
            "title": s["title"],
            "blurb": s["blurb"],
            "file": s["file"],
            "size": len(s["content"]),
            "input": "\n".join(lines[:MAX_INPUT_LINES]),
            "input_truncated": len(lines) > MAX_INPUT_LINES,
            "detected_format": result["detected_format"],
            "overall_verdict": result["overall_verdict"],
            "statement_count": result["statement_count"],
            "transaction_count": result["transaction_count"],
            "warnings": [{"type": w["type"], "message": w["message"]} for w in result["warnings"]],
            "statements": statements,
            "transactions": transactions,
            "json": json.dumps(result, indent=2, ensure_ascii=False),
            "csv": export_to_csv(result),
        })
        print(f"{s['file']:32} {result['detected_format']:10} {result['overall_verdict']:12} "
              f"{result['statement_count']} st / {result['transaction_count']} tx, {len(result['warnings'])} warnings")
    OUT_DATA.write_text(json.dumps(demos, indent=1, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    main()
