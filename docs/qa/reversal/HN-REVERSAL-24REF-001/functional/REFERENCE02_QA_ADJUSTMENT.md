# Reference02 fixture-dependent QA adjustment

Independent QA visually inspected the approved source image `design/references/Desktop/02_Tao_phieu_Chon_chung_tu_Desktop.png`. It shows nine original documents, including PN-20261023-010 original8, PN-20261024-011 original12 and PN-20261026-013 original6. These are isolated comparison-fixture values, not production records or approval of a real posting contract.

The previous partial-consumption test assumed source011 original10, so consuming3 left a hardcoded7 and a request8 was excessive. Following the reference-backed correction to original12, that same request8 is valid and must not be asserted blocked.

The independent guard now derives remaining as authoritative original minus prior minus the accepted3; it requests remaining+1 to prove the excess guard, verifies original unchanged, repeats the identical key/payload and proves posted prior remains exactly3. This preserves the consumption, retry and excess rules across valid fixture changes.

A separate new test locks the exact nine reference identities, SKU counts and original/prior/remaining totals. It explicitly asserts source011=12, rather than allowing a generic derivation to conceal an incorrect comparison fixture. Source010=8/source013=6 and all earlier rows are also checked.

Result: **22/22 independent guard/time/reference tests PASS** in [raw output](independent-unit-reference02-update.txt). No application source, production data, business guard, image baseline or threshold was changed by this QA worker. Final browser execution awaits the identified frozen build and serialized slot.
