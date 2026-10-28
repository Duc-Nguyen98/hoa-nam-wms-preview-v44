# Sidebar release report

- Candidate branch: `DEV`.
- Candidate source commit: assigned after evidence commit; current source was tested from the working tree.
- Public Preview before this task: Site version 61, deployment `appgdep_6ae21fff8aa081918448306a00900581`, source commit `73bf351083efb48af360f3ad2512addb8b028560`.
- New Preview deployment: Site version `62`, deployment `appgdep_6ae25a63759c8191a72fb4a7c49a1aca`.
- Preview URL: `https://hoa-nam-wms-b17-candidate-20261024.wholetide18.chatgpt.site`.
- Site source commit: `94611d2ad614b464541b64ca9d2d80df2950af50`.
- Verified `/build-info.json`: `sourceCommit=a617604dc722f5e34fd528940c865a4fec2db109`, build ID `62275b2e3577b99f1338f4e021ba0f0858c6da509aa4dfc31184edf511868e5b`.
- Verified direct `#/preview/S10` document response: HTTP 200.
- Production merge/deploy: not authorized by this task and not performed.
- Rollback target: previous Site version 61 / deployment `appgdep_6ae21fff8aa081918448306a00900581`.

Release provenance is fail-closed: local PASS is not treated as hosted CI or deployed-SHA PASS.
