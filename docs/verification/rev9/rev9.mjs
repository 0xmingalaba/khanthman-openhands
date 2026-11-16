// SCRATCH MODEL — PROPOSED Rev-9 design (NOT product code).
// Extends the Revision 8 scratch model: the Revision 8 suite is PRESERVED (section 1) and a new
// Revision 9 suite is ADDED (section 2).
//
// Unique economic events (Rev 9 fixes the duplicated E3 identifier from Rev 8):
//   E1 mispayment  E2 recognition  E3 collection  E4 realization  E5 write-off
//   E6 issuance    E7 reopening    E8 payout      E9 retirement
//
// Corrected issuance treatment (E6), atomic with E7 reopening:
//   j-issue : CreditsIssued D x / (CorrectionReceivable:Bob C a) + (CorrectionWriteOffLoss:M C b) [a+b=x]
//   j-real  : PendingCorrectionClaim:M D x / SettlementCorrection:M C x
//   j-reopen: ClaimUnitsRemaining:M D x/P / UnitsControl:M C x/P   (UNIT)
// The issuance CANCELS the outstanding claim so the obligation is never counted twice and a later
// collection cannot double-fund the same correction.
// Domains: MMK, SHARE, UNIT. Invariants asserted at COMMIT boundaries only.
const P = 100;
let bal = {}, dom = {}, norm = {}, sub = {};
let PAYABLE = 'B';
let WRITEOFF_APPROVED = false;
let ISSUANCE_APPROVED = false;
let CANCEL_ORDER = 'recv-first';   // 'recv-first' = Alternative B; 'loss-first' = Alternative A (proposed recommendation). F28 NOT APPROVED.
let failures = 0, asserts = 0, tests = 0, testFails = 0;

const acct = (n, d, s) => { bal[n] = 0; dom[n] = d; norm[n] = s; };
const has = n => n in dom;
const amt = n => has(n) ? (norm[n] === 'D' ? bal[n] : -bal[n]) : 0;
const USERS = ['Alice', 'Bob', 'Carol'];

function postJournal(label, entries) {
  const ds = new Set(); let D = 0, C = 0;
  for (const [a, s, x] of entries) { ds.add(dom[a]); if (s === 'D') D += x; else C += x; }
  if (ds.size !== 1) throw new Error('MIXED DOMAINS: ' + label);
  if (D !== C) throw new Error('UNBALANCED: ' + label + ' D=' + D + ' C=' + C);
  const delta = {};
  for (const [a, s, x] of entries) delta[a] = (delta[a] || 0) + (s === 'D' ? x : -x);
  for (const a in delta) { const after = amt(a) + (norm[a] === 'D' ? delta[a] : -delta[a]); if (after < 0) throw new Error('NEGATIVE BALANCE: ' + a + ' would be ' + after); }
  for (const [a, s, x] of entries) bal[a] += (s === 'D' ? x : -x);
}
function domainBal(d) { let D = 0, C = 0; for (const a in bal) { if (dom[a] !== d) continue; if (norm[a] === 'D') D += bal[a]; else C += -bal[a]; } return D === C; }
const payExtra = () => PAYABLE === 'A' ? amt('CorrectionPayableMarket:M') : 0;
function C1() { return (amt('CollateralBucket:M') + amt('SettlementPayable:M') + amt('SettlementCorrection:M') + payExtra()) === P * amt('ClaimUnitsRemaining:M'); }
function C1b() { return bal['ClaimUnitsRemaining:M'] === -bal['UnitsControl:M']; }
// C2: complementary outstanding shares — YES and NO outstanding must have equal magnitude.
// Both SharesOutstanding accounts are credit-normal, so their normal-side magnitude is amt().
// (Revision 11 correction: the previous formula `bal[YES] === -bal[NO]` was sign-inverted and
// returned false whenever shares were outstanding; it was only ever evaluated at zero balances.)
function C2() { return amt('SharesOutstanding:M:YES') === amt('SharesOutstanding:M:NO'); }
// S1: per-outcome share conservation — every outstanding share is held (free or escrowed).
// Stated in normal-side magnitudes so the credit-normal SharesOutstanding sign is handled once.
function S1() { let ok = true; for (const o of ['YES', 'NO']) { let s = 0; for (const u of USERS) s += amt('SharesFree:' + u + ':' + o) + amt('SharesEscrowed:' + u + ':' + o); if (s !== amt('SharesOutstanding:M:' + o)) ok = false; } return ok; }
const subSum = () => Object.values(sub).reduce((t, v) => t + v, 0);
function M1() { let D = 0, C = 0; for (const a in bal) { if (norm[a] === 'D') D += amt(a); else C += amt(a); } return D === C; }
function nonNeg() { for (const a in bal) if (amt(a) < 0) return false; return true; }
function subTie() { return PAYABLE === 'A' ? subSum() === amt('CorrectionPayableMarket:M') : subSum() === 0; }
function noDoubleCount() { return amt('PendingCorrectionClaim:M') + amt('SettlementCorrection:M') <= 200 + 1e-9; }
function invariants() { return { MMK: domainBal('MMK'), SHARE: domainBal('SHARE'), UNIT: domainBal('UNIT'), C1: C1(), C1b: C1b(), M1: M1(), C2: C2(), S1: S1(), nonNeg: nonNeg(), subTie: subTie(), noDbl: noDoubleCount() }; }
const allOk = inv => Object.values(inv).every(Boolean);
function test(id, scenario, expected, actual) { tests++; const pass = expected === actual; if (!pass) { testFails++; failures++; } console.log(`${pass ? 'PASS' : 'FAIL'} ${id} ${scenario} | expected=${expected} actual=${actual}`); return pass; }
function report(label) { const inv = invariants(); const ok = allOk(inv); asserts += Object.keys(inv).length; if (!ok) failures += Object.keys(inv).filter(k => !inv[k]).length;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label.padEnd(46)} MMK=${inv.MMK} SH=${inv.SHARE} UN=${inv.UNIT} C1=${inv.C1} C1b=${inv.C1b} M1=${inv.M1} C2=${inv.C2} S1=${inv.S1} nonNeg=${inv.nonNeg} subTie=${inv.subTie} noDbl=${inv.noDbl}`); return ok; }
const snapshot = () => ({ bal: { ...bal }, sub: { ...sub } });
const restore = s => { bal = { ...s.bal }; sub = { ...s.sub }; };
function tx(label, fn, opts = {}) {
  const { expectRollback = false } = opts; const s = snapshot(); let outcome;
  try { fn(); } catch (e) { restore(s); console.log(`   [${label}] REJECTED (${e.message}) -> ROLLBACK`); outcome = 'rolled-back'; }
  if (outcome !== 'rolled-back') {
    const inv = invariants();
    if (!allOk(inv)) { restore(s); console.log(`   [${label}] COMMIT-BOUNDARY invariant failure -> ROLLBACK`); outcome = 'rolled-back'; }
    else { console.log(`   [${label}] COMMITTED (all invariants hold at boundary)`); outcome = 'committed'; }
  }
  const expected = expectRollback ? 'rolled-back' : 'committed';
  if (outcome !== expected) { failures++; console.log(`   [${label}] UNEXPECTED outcome=${outcome} (expected ${expected})`); }
  return outcome;
}
const line = tag => `${tag}: recv=${amt('CorrectionReceivable:Bob')} pending=${amt('PendingCorrectionClaim:M')} corr=${amt('SettlementCorrection:M')} loss=${amt('CorrectionWriteOffLoss:M')} units=${amt('ClaimUnitsRemaining:M')} | AvA=${amt('UserAvailable:Alice')} AvB=${amt('UserAvailable:Bob')} AvC=${amt('UserAvailable:Carol')} issued=${amt('CreditsIssued')}`;

function fresh() {
  bal = {}; dom = {}; norm = {}; sub = {};
  acct('CreditsIssued', 'MMK', 'D');
  acct('CorrectionWriteOffLoss:M', 'MMK', 'D');
  for (const u of USERS) { acct('UserAvailable:' + u, 'MMK', 'C'); acct('UserReserved:' + u, 'MMK', 'C'); acct('CorrectionReceivable:' + u, 'MMK', 'D'); }
  acct('CollateralBucket:M', 'MMK', 'C'); acct('SettlementPayable:M', 'MMK', 'C'); acct('SettlementCorrection:M', 'MMK', 'C');
  acct('PendingCorrectionClaim:M', 'MMK', 'C');
  if (PAYABLE === 'A') acct('CorrectionPayableMarket:M', 'MMK', 'C');
  for (const u of USERS) for (const o of ['YES', 'NO']) { acct('SharesFree:' + u + ':' + o, 'SHARE', 'D'); acct('SharesEscrowed:' + u + ':' + o, 'SHARE', 'D'); }
  for (const o of ['YES', 'NO']) acct('SharesOutstanding:M:' + o, 'SHARE', 'C');
  acct('ClaimUnitsRemaining:M', 'UNIT', 'D'); acct('UnitsControl:M', 'UNIT', 'C');
  for (const u of USERS) postJournal('grant', [['CreditsIssued', 'D', 10000], ['UserAvailable:' + u, 'C', 10000]]);
}
function settledWrong() {
  fresh();
  postJournal('splitA', [['UserAvailable:Alice', 'D', 200], ['CollateralBucket:M', 'C', 200]]);
  for (const o of ['YES', 'NO']) postJournal('splitA-sh', [['SharesFree:Alice:' + o, 'D', 2], ['SharesOutstanding:M:' + o, 'C', 2]]);
  postJournal('splitA-un', [['ClaimUnitsRemaining:M', 'D', 2], ['UnitsControl:M', 'C', 2]]);
  postJournal('recognize', [['CollateralBucket:M', 'D', 200], ['SettlementPayable:M', 'C', 200]]);
  postJournal('E1-v1pay', [['SettlementPayable:M', 'D', 200], ['UserAvailable:Bob', 'C', 200]]);
  postJournal('v1pay-un', [['ClaimUnitsRemaining:M', 'C', 2], ['UnitsControl:M', 'D', 2]]);
  for (const o of ['YES', 'NO']) postJournal('retire', [['SharesOutstanding:M:' + o, 'D', 2], ['SharesFree:Alice:' + o, 'C', 2]]);
}
function jRecognize(x) { postJournal('E2-recognize', [['CorrectionReceivable:Bob', 'D', x], ['PendingCorrectionClaim:M', 'C', x]]); }
function jCollect(x) { postJournal('E3-collect', [['UserAvailable:Bob', 'D', x], ['CorrectionReceivable:Bob', 'C', x]]); }
function jRealize(x) { postJournal('E4-realize', [['PendingCorrectionClaim:M', 'D', x], ['SettlementCorrection:M', 'C', x]]); }
function jWriteOff(x) { if (!WRITEOFF_APPROVED) throw new Error('WRITE-OFF NOT APPROVED'); postJournal('E5-writeoff', [['CorrectionWriteOffLoss:M', 'D', x], ['CorrectionReceivable:Bob', 'C', x]]); }
function jIssue(x) {
  if (!ISSUANCE_APPROVED) throw new Error('ISSUANCE NOT APPROVED');
  const recv = amt('CorrectionReceivable:Bob'), loss = amt('CorrectionWriteOffLoss:M');
  // CANCEL_ORDER selects which outstanding claim component issuance cancels first (F28, NOT APPROVED).
  // 'recv-first': cancel the receivable first, then the write-off loss (Alternative B).
  // 'loss-first': cancel the write-off loss first, then the receivable (Alternative A, proposed recommendation).
  let fromRecv, fromLoss;
  if (CANCEL_ORDER === 'recv-first') { fromRecv = Math.min(x, recv); fromLoss = x - fromRecv; }
  else { fromLoss = Math.min(x, loss); fromRecv = x - fromLoss; }
  if (fromRecv > recv + 1e-9 || fromLoss > loss + 1e-9) throw new Error('ISSUANCE EXCEEDS OUTSTANDING CLAIM (nothing to cancel)');
  const entries = [['CreditsIssued', 'D', x]];
  if (fromRecv > 0) entries.push(['CorrectionReceivable:Bob', 'C', fromRecv]);
  if (fromLoss > 0) entries.push(['CorrectionWriteOffLoss:M', 'C', fromLoss]);
  postJournal('E6-issue', entries);
  jRealize(x);
}
function jReopen(u) { postJournal('E7-reopen', [['ClaimUnitsRemaining:M', 'D', u], ['UnitsControl:M', 'C', u]]); }
function jClose(u) { postJournal('E9-close', [['ClaimUnitsRemaining:M', 'C', u], ['UnitsControl:M', 'D', u]]); }
function jPayB(x) { postJournal('E8-pay', [['SettlementCorrection:M', 'D', x], ['UserAvailable:Alice', 'C', x]]); }
function collectGroup(x) { jCollect(x); jRealize(x); jReopen(x / P); }
function issueGroup(x) { jIssue(x); jReopen(x / P); }

// ================= SECTION 1 — REVISION 8 SUITE (PRESERVED) =================
console.log('############ SECTION 1 — Revision 8 suite (preserved) ############');
PAYABLE = 'B'; ISSUANCE_APPROVED = false; WRITEOFF_APPROVED = false;
console.log('--- R8-01: recognition ---');
settledWrong();
test('R8-01', 'recognize: CorrectionReceivable D 200 / PendingCorrectionClaim C 200', 'committed', tx('E2', () => { jRecognize(200); }));
test('R8-01b', 'receivable 200, pending 200, corr 0, units 0', true, amt('CorrectionReceivable:Bob') === 200 && amt('PendingCorrectionClaim:M') === 200 && amt('SettlementCorrection:M') === 0 && amt('ClaimUnitsRemaining:M') === 0);
report('R8-01 after recognition');
console.log('--- R8-02: full collection ---');
settledWrong(); tx('E2', () => { jRecognize(200); });
test('R8-02', 'full collect+realize+reopen (2 units)', 'committed', tx('R8-02', () => { collectGroup(200); }));
test('R8-02b', 'receivable 0, pending 0, corr 200, units 2', true, amt('CorrectionReceivable:Bob') === 0 && amt('PendingCorrectionClaim:M') === 0 && amt('SettlementCorrection:M') === 200 && amt('ClaimUnitsRemaining:M') === 2);
test('R8-02c', 'pay+close -> all zero', 'committed', tx('R8-02c', () => { jPayB(200); jClose(2); }));
test('R8-02d', 'Bob 10000, Alice 10000', true, amt('UserAvailable:Bob') === 10000 && amt('UserAvailable:Alice') === 10000);
report('R8-02 final');
console.log('--- R8-03: partial collection ---');
settledWrong(); tx('E2', () => { jRecognize(200); }); postJournal('spend', [['UserAvailable:Bob', 'D', 10100], ['UserAvailable:Carol', 'C', 10100]]);
test('R8-03', 'partial: collect+realize+reopen 1 funded unit', 'committed', tx('R8-03', () => { collectGroup(100); }));
test('R8-03b', 'receivable 100, pending 100, funded 100, 1 unit', true, amt('CorrectionReceivable:Bob') === 100 && amt('PendingCorrectionClaim:M') === 100 && amt('SettlementCorrection:M') === 100 && amt('ClaimUnitsRemaining:M') === 1);
test('R8-03c', 'reopening the 2nd (unfunded) unit is rejected', 'rolled-back', tx('R8-03c', () => { jReopen(1); }, { expectRollback: true }));
test('R8-03d', 'collecting the outstanding 100 later commits', 'committed', tx('R8-03d', () => { postJournal('restore', [['UserAvailable:Carol', 'D', 100], ['UserAvailable:Bob', 'C', 100]]); collectGroup(100); }));
test('R8-03e', 'all collected: recv 0, pending 0, corr 200, units 2', true, amt('CorrectionReceivable:Bob') === 0 && amt('PendingCorrectionClaim:M') === 0 && amt('SettlementCorrection:M') === 200 && amt('ClaimUnitsRemaining:M') === 2);
console.log('--- R8-04: zero collection ---');
settledWrong(); tx('E2', () => { jRecognize(200); });
test('R8-04', 'zero collection: no journal; receivable 200 outstanding, corr 0, units 0', true, amt('CorrectionReceivable:Bob') === 200 && amt('SettlementCorrection:M') === 0 && amt('ClaimUnitsRemaining:M') === 0);
report('R8-04 uncollectible-so-far');
console.log('--- R8-05/R8-06: over-collection guards ---');
settledWrong(); tx('E2', () => { jRecognize(200); });
test('R8-05', 'collect 300 > outstanding 200 -> rejected', 'rolled-back', tx('R8-05', () => { collectGroup(300); }, { expectRollback: true }));
settledWrong(); tx('E2', () => { jRecognize(200); }); postJournal('spend2', [['UserAvailable:Bob', 'D', 10150], ['UserAvailable:Carol', 'C', 10150]]);
test('R8-06', 'collect 200 > Bob available 50 -> rejected', 'rolled-back', tx('R8-06', () => { collectGroup(200); }, { expectRollback: true }));
console.log('--- R8-07/R8-08: collection idempotency ---');
const ck = new Map();
function reqCollect(key, payload, amount) { if (ck.has(key)) { if (ck.get(key) !== payload) return 'conflict'; return 'duplicate'; } const r = tx('c', () => { collectGroup(amount); }); if (r === 'committed') { ck.set(key, payload); return 'committed'; } return 'rolled-back'; }
settledWrong(); tx('E2', () => { jRecognize(200); }); postJournal('spend3', [['UserAvailable:Bob', 'D', 10100], ['UserAvailable:Carol', 'C', 10100]]); ck.clear();
test('R8-07a', 'first collection commits (100)', 'committed', reqCollect('C:1', 'h', 100));
test('R8-07', 'duplicate collection is a no-op', 'duplicate', reqCollect('C:1', 'h', 100));
test('R8-08', 'same collection key different payload -> conflict', 'conflict', reqCollect('C:1', 'x', 100));
console.log('--- R8-09/R8-10: write-off ---');
WRITEOFF_APPROVED = false; settledWrong(); tx('E2', () => { jRecognize(200); });
test('R8-09', 'unapproved write-off rejected', 'rolled-back', tx('R8-09', () => { jWriteOff(200); }, { expectRollback: true }));
WRITEOFF_APPROVED = true; settledWrong(); tx('E2', () => { jRecognize(200); });
test('R8-10', 'approved write-off journal balances', 'committed', tx('R8-10', () => { jWriteOff(200); }));
test('R8-10b', 'receivable 0, loss 200; M1 holds', true, amt('CorrectionReceivable:Bob') === 0 && amt('CorrectionWriteOffLoss:M') === 200 && M1());
WRITEOFF_APPROVED = false;
console.log('--- R8-11/R8-12: funding gates reopening ---');
settledWrong(); tx('E2', () => { jRecognize(200); });
test('R8-11', 'unfunded correction cannot reopen claim units', 'rolled-back', tx('R8-11', () => { jReopen(2); }, { expectRollback: true }));
settledWrong(); tx('E2', () => { jRecognize(200); }); postJournal('spend4', [['UserAvailable:Bob', 'D', 10100], ['UserAvailable:Carol', 'C', 10100]]);
test('R8-12', 'funded tranche reopens its 1 backed unit', 'committed', tx('R8-12', () => { collectGroup(100); }));
test('R8-12b', 'C1 holds: corr 100 = 100 x 1 unit', true, C1() && amt('SettlementCorrection:M') === 100 && amt('ClaimUnitsRemaining:M') === 1);
test('R8-12c', 'realize alone (no reopen) rejected: funding without units breaks C1', 'rolled-back', tx('R8-12c', () => { jRealize(100); }, { expectRollback: true }));
console.log('--- R8-13/R8-14: immediate and delayed payout ---');
settledWrong(); tx('E2', () => { jRecognize(200); });
test('R8-13', 'immediate: collect+realize+reopen+pay+close in one transaction', 'committed', tx('R8-13', () => { collectGroup(200); jPayB(200); jClose(2); }));
settledWrong(); tx('E2', () => { jRecognize(200); });
test('R8-14a', 'delayed funding transaction', 'committed', tx('R8-14a', () => { collectGroup(200); }));
test('R8-14b', 'backing preserved between transactions', true, amt('SettlementCorrection:M') === 200 && amt('ClaimUnitsRemaining:M') === 2);
test('R8-14c', 'delayed payment transaction', 'committed', tx('R8-14c', () => { jPayB(200); jClose(2); }));
console.log('--- R8-15/R8-16: duplicate payout and funding ---');
settledWrong(); tx('E2', () => { jRecognize(200); }); tx('f', () => { collectGroup(200); jPayB(200); jClose(2); });
test('R8-15', 'duplicate payout rejected', 'rolled-back', tx('R8-15', () => { jPayB(200); }, { expectRollback: true }));
settledWrong(); tx('E2', () => { jRecognize(200); }); tx('f2', () => { collectGroup(200); jPayB(200); jClose(2); });
test('R8-16', 'duplicate realization rejected (pending exhausted)', 'rolled-back', tx('R8-16', () => { jRealize(200); }, { expectRollback: true }));
console.log('--- R8-17/R8-18: failure and rollback ---');
settledWrong(); tx('E2', () => { jRecognize(200); }); const p17 = snapshot();
test('R8-17', 'failure after collection rolls back', 'rolled-back', tx('R8-17', () => { jCollect(200); jRealize(200); jReopen(2); throw new Error('crash'); }, { expectRollback: true }));
test('R8-17b', 'state byte-identical after rollback', true, JSON.stringify(bal) === JSON.stringify(p17.bal));
settledWrong(); tx('E2', () => { jRecognize(200); }); tx('c2', () => { collectGroup(200); }); const p18 = snapshot();
test('R8-18', 'failure after reopening rolls back reopening', 'rolled-back', tx('R8-18', () => { jPayB(200); jClose(2); throw new Error('crash'); }, { expectRollback: true }));
test('R8-18b', 'corr 200 and units 2 intact', true, amt('SettlementCorrection:M') === 200 && amt('ClaimUnitsRemaining:M') === 2 && JSON.stringify(bal) === JSON.stringify(p18.bal));
console.log('--- R8-19/R8-20: restart retry and reconciliation ---');
settledWrong(); tx('E2', () => { jRecognize(200); }); const ak = new Map();
function applyCorr(key, payload) { if (ak.has(key)) { if (ak.get(key) !== payload) return 'conflict'; return 'duplicate'; } const r = tx('a', () => { collectGroup(200); jPayB(200); jClose(2); }); if (r === 'committed') { ak.set(key, payload); return 'committed'; } return 'rolled-back'; }
test('R8-19a', 'first apply commits', 'committed', applyCorr('A:1', 'h'));
test('R8-19', 'retry is idempotent', 'duplicate', applyCorr('A:1', 'h'));
test('R8-19b', 'Alice paid exactly once', true, amt('UserAvailable:Alice') === 10000);
settledWrong(); tx('E2', () => { jRecognize(200); }); tx('r', () => { collectGroup(200); jPayB(200); jClose(2); });
test('R8-20', 'final reconciliation all zero', true, amt('CorrectionReceivable:Bob') === 0 && amt('PendingCorrectionClaim:M') === 0 && amt('SettlementCorrection:M') === 0 && amt('ClaimUnitsRemaining:M') === 0 && amt('CreditsIssued') === 30000);

// ================= SECTION 2 — REVISION 9 SUITE (NEW) =================
console.log('\n############ SECTION 2 — Revision 9 suite (new) ############');
console.log('--- R9-01..R9-04: corrected E6 issuance (Path B: receivable outstanding) ---');
PAYABLE = 'B'; ISSUANCE_APPROVED = true; settledWrong();
tx('E2', () => { jRecognize(200); });
report('R9-00 after recognition (pending 200)');
test('R9-01', 'corrected E6 issuance+realize+reopen commits atomically', 'committed', tx('R9-01', () => { issueGroup(200); }));
test('R9-01b', 'corr 200 = 100 x 2 units (C1 holds after issuance)', true, C1() && amt('SettlementCorrection:M') === 200 && amt('ClaimUnitsRemaining:M') === 2);
test('R9-02', 'no double-count: pending 0 and corr 200', true, amt('PendingCorrectionClaim:M') === 0 && amt('SettlementCorrection:M') === 200);
test('R9-03', 'issuance cancels the receivable (recv 0)', true, amt('CorrectionReceivable:Bob') === 0);
test('R9-03b', 'CreditsIssued increased by 200 (30000 -> 30200)', true, amt('CreditsIssued') === 30200);
report('R9-01.1 after corrected issuance'); console.log('   ' + line('  '));
test('R9-04', 'later collection after issuance is rejected (receivable gone)', 'rolled-back', tx('R9-04', () => { jCollect(200); }, { expectRollback: true }));
ISSUANCE_APPROVED = false;

console.log('--- R9-05/R9-06: Path A write-off, then issuance ---');
WRITEOFF_APPROVED = true; ISSUANCE_APPROVED = false; settledWrong();
tx('E2', () => { jRecognize(200); });
test('R9-05a', 'write-off records loss and keeps the claim pending', 'committed', tx('R9-05a', () => { jWriteOff(200); }));
test('R9-05b', 'after write-off: recv 0, loss 200, pending 200, corr 0', true, amt('CorrectionReceivable:Bob') === 0 && amt('CorrectionWriteOffLoss:M') === 200 && amt('PendingCorrectionClaim:M') === 200 && amt('SettlementCorrection:M') === 0);
report('R9-05.0 after write-off (loss recognized, correction pending)'); console.log('   ' + line('  '));
ISSUANCE_APPROVED = true;
test('R9-05c', 'issuance after write-off commits; loss reversed; pending cleared', 'committed', tx('R9-05c', () => { issueGroup(200); }));
test('R9-05d', 'final: recv 0, loss 0, pending 0, corr 200, units 2', true, amt('CorrectionReceivable:Bob') === 0 && amt('CorrectionWriteOffLoss:M') === 0 && amt('PendingCorrectionClaim:M') === 0 && amt('SettlementCorrection:M') === 200 && amt('ClaimUnitsRemaining:M') === 2);
report('R9-05.1 after issuance (loss reclassified to issuance cost)'); console.log('   ' + line('  '));
ISSUANCE_APPROVED = false; WRITEOFF_APPROVED = false;

console.log('--- R9-07/R9-08: partial collection then partial issuance ---');
ISSUANCE_APPROVED = true; settledWrong();
tx('E2', () => { jRecognize(200); }); postJournal('spend', [['UserAvailable:Bob', 'D', 10100], ['UserAvailable:Carol', 'C', 10100]]);
test('R9-07', 'partial collection 100 -> pending 100, corr 100, 1 unit', 'committed', tx('R9-07', () => { collectGroup(100); }));
test('R9-07b', 'balances: recv 100, pending 100, corr 100, units 1', true, amt('CorrectionReceivable:Bob') === 100 && amt('PendingCorrectionClaim:M') === 100 && amt('SettlementCorrection:M') === 100 && amt('ClaimUnitsRemaining:M') === 1);
report('R9-07 partial collection'); console.log('   ' + line('  '));
test('R9-08', 'partial issuance 100 for the remainder -> corr 200, units 2', 'committed', tx('R9-08', () => { issueGroup(100); }));
test('R9-08b', 'all funded: recv 0, pending 0, corr 200, units 2', true, amt('CorrectionReceivable:Bob') === 0 && amt('PendingCorrectionClaim:M') === 0 && amt('SettlementCorrection:M') === 200 && amt('ClaimUnitsRemaining:M') === 2);
report('R9-08 partial issuance'); console.log('   ' + line('  '));
ISSUANCE_APPROVED = false;

console.log('--- R9-09/R9-10: delayed payout and duplicate issuance ---');
ISSUANCE_APPROVED = true; settledWrong(); tx('E2', () => { jRecognize(200); }); tx('fund', () => { issueGroup(200); });
test('R9-09a', 'backing preserved between funding and payout', true, amt('SettlementCorrection:M') === 200 && amt('ClaimUnitsRemaining:M') === 2);
test('R9-09b', 'delayed payout commits', 'committed', tx('R9-09b', () => { jPayB(200); jClose(2); }));
test('R9-09c', 'final all-zero; Alice 10000, Bob 10200', true, amt('SettlementCorrection:M') === 0 && amt('ClaimUnitsRemaining:M') === 0 && amt('UserAvailable:Alice') === 10000 && amt('UserAvailable:Bob') === 10200);
report('R9-09 delayed payout');
test('R9-10', 'duplicate issuance rejected (nothing left to cancel)', 'rolled-back', tx('R9-10', () => { issueGroup(200); }, { expectRollback: true }));
ISSUANCE_APPROVED = false;

console.log('--- R9-11/R9-12/R9-13: duplicate guards ---');
settledWrong(); tx('E2', () => { jRecognize(200); }); postJournal('spend2', [['UserAvailable:Bob', 'D', 10100], ['UserAvailable:Carol', 'C', 10100]]);
const ck2 = new Map();
function reqCollect2(key, payload) { if (ck2.has(key)) { if (ck2.get(key) !== payload) return 'conflict'; return 'duplicate'; } const r = tx('c', () => { collectGroup(100); }); if (r === 'committed') { ck2.set(key, payload); return 'committed'; } return 'rolled-back'; }
test('R9-11a', 'first collection commits', 'committed', reqCollect2('C:1', 'h'));
test('R9-11', 'duplicate collection no-op', 'duplicate', reqCollect2('C:1', 'h'));
test('R9-11b', 'same key different payload -> conflict', 'conflict', reqCollect2('C:1', 'x'));
ISSUANCE_APPROVED = true; settledWrong(); tx('E2', () => { jRecognize(200); }); tx('f', () => { issueGroup(200); });
ISSUANCE_APPROVED = false;
test('R9-12', 'duplicate reopening rejected (units already 2, funding 200)', 'rolled-back', tx('R9-12', () => { jReopen(2); }, { expectRollback: true }));
test('R9-13', 'duplicate payout rejected', 'rolled-back', tx('R9-13', () => { jPayB(200); }, { expectRollback: true }));

console.log('--- R9-14/R9-15: crash and retry ---');
ISSUANCE_APPROVED = true; settledWrong(); tx('E2', () => { jRecognize(200); });
test('R9-14', 'crash between funding and payout: funding tx fails and rolls back', 'rolled-back', tx('R9-14', () => { issueGroup(200); throw new Error('crash after funding'); }, { expectRollback: true }));
test('R9-14b', 'state reconciled and resumable (pending 200, corr 0, units 0)', true, amt('PendingCorrectionClaim:M') === 200 && amt('SettlementCorrection:M') === 0 && amt('ClaimUnitsRemaining:M') === 0);
const ak2 = new Map();
function reqIssue(key, payload) { if (ak2.has(key)) { if (ak2.get(key) !== payload) return 'conflict'; return 'duplicate'; } const r = tx('i', () => { issueGroup(200); }); if (r === 'committed') { ak2.set(key, payload); return 'committed'; } return 'rolled-back'; }
test('R9-15a', 'retry: first issuance commits', 'committed', reqIssue('I:1', 'h'));
test('R9-15', 'retry after restart is idempotent', 'duplicate', reqIssue('I:1', 'h'));
ISSUANCE_APPROVED = false;

console.log('--- R9-16/R9-17: declined issuance; insufficient balance ---');
ISSUANCE_APPROVED = false; settledWrong(); tx('E2', () => { jRecognize(200); });
test('R9-16', 'owner declines issuance -> correction stays pending', 'rolled-back', tx('R9-16', () => { issueGroup(200); }, { expectRollback: true }));
test('R9-16b', 'pending 200 outstanding, corr 0, units 0', true, amt('PendingCorrectionClaim:M') === 200 && amt('SettlementCorrection:M') === 0 && amt('ClaimUnitsRemaining:M') === 0);
settledWrong(); tx('E2', () => { jRecognize(200); }); postJournal('spend3', [['UserAvailable:Bob', 'D', 10150], ['UserAvailable:Carol', 'C', 10150]]);
test('R9-17', 'collect 200 > Bob available 50 -> rejected', 'rolled-back', tx('R9-17', () => { collectGroup(200); }, { expectRollback: true }));

console.log('--- R9-18/R9-19: unfunded reopening; negative receivable ---');
settledWrong(); tx('E2', () => { jRecognize(200); });
test('R9-18', 'unfunded reopening rejected', 'rolled-back', tx('R9-18', () => { jReopen(2); }, { expectRollback: true }));
settledWrong();
let neg = false; try { postJournal('neg', [['UserAvailable:Bob', 'D', 200], ['CorrectionReceivable:Bob', 'C', 200]]); } catch { neg = true; }
test('R9-19', 'negative receivable rejected', true, neg);

console.log('--- R9-20..R9-23: final reconciliation and invariant sweep ---');
ISSUANCE_APPROVED = true; settledWrong(); tx('E2', () => { jRecognize(200); });
tx('R9-20', () => { issueGroup(200); jPayB(200); jClose(2); });
test('R9-20', 'issuance-funded final reconciliation (all correction accounts 0)', true, amt('CorrectionReceivable:Bob') === 0 && amt('PendingCorrectionClaim:M') === 0 && amt('SettlementCorrection:M') === 0 && amt('CorrectionWriteOffLoss:M') === 0 && amt('ClaimUnitsRemaining:M') === 0 && amt('CreditsIssued') === 30200 && amt('UserAvailable:Alice') === 10000 && amt('UserAvailable:Bob') === 10200);
report('R9-20 final (issuance-funded)'); console.log('   ' + line('  '));
ISSUANCE_APPROVED = false;
settledWrong(); report('R9-21.0 initial');
tx('E2', () => { jRecognize(200); }); report('R9-21.1 after recognition');
tx('c', () => { collectGroup(200); }); report('R9-21.2 after collection+realize+reopen');
tx('p', () => { jPayB(200); jClose(2); }); report('R9-21.3 after payout+close');
test('R9-21', 'M1/C1/C1b held after every committed transition', true, M1() && C1() && C1b());
ISSUANCE_APPROVED = true; settledWrong(); tx('E2', () => { jRecognize(200); }); const p22 = snapshot();
test('R9-22', 'issuance+reopen rollback on failure', 'rolled-back', tx('R9-22', () => { jIssue(200); jReopen(2); throw new Error('crash'); }, { expectRollback: true }));
test('R9-22b', 'byte-identical after rollback', true, JSON.stringify(bal) === JSON.stringify(p22.bal));
ISSUANCE_APPROVED = false;
ISSUANCE_APPROVED = true; settledWrong(); tx('E2', () => { jRecognize(200); });
let dbl = true;
tx('i', () => { issueGroup(200); if (amt('PendingCorrectionClaim:M') + amt('SettlementCorrection:M') !== 200) dbl = false; });
test('R9-23', 'no double-count: pending+corr == 200 (never 400)', true, dbl && noDoubleCount());
ISSUANCE_APPROVED = false;

// ================= SECTION 3 — REVISION 9 REVIEW-PREP SUITE (NEW) =================
// F28 cancel-order comparison and Option A completeness.
console.log('\n############ SECTION 3 — Revision 9 review-prep suite (new) ############');
console.log('--- R9-24..R9-33: F28 cancel-order — claim states, both orders ---');
// State 1: fully outstanding receivable (recv 200, loss 0)
function stateFullyOutstanding() { settledWrong(); tx('E2', () => { jRecognize(200); }); }
// State 2: fully written-off (recv 0, loss 200)
function stateFullyWrittenOff() { settledWrong(); tx('E2', () => { jRecognize(200); }); WRITEOFF_APPROVED = true; tx('E5', () => { jWriteOff(200); }); WRITEOFF_APPROVED = false; }
// State 3: partially written-off (recv 100, loss 100)
function statePartiallyWrittenOff() { settledWrong(); tx('E2', () => { jRecognize(200); }); WRITEOFF_APPROVED = true; tx('E5', () => { jWriteOff(100); }); WRITEOFF_APPROVED = false; }
// State 4: partly collected (E3 100) then the remainder written off (E5 100).
// After E2 -> E3 100 -> E5 100 the balances are: recv 0, loss 100, pending 100, corr 100, units 1.
// (The receivable is fully consumed by the collection; the write-off consumes the rest of the claim.)
function stateCollectedAndWrittenOff() { settledWrong(); tx('E2', () => { jRecognize(200); }); postJournal('spend', [['UserAvailable:Bob', 'D', 10100], ['UserAvailable:Carol', 'C', 10100]]); tx('E3', () => { collectGroup(100); }); WRITEOFF_APPROVED = true; tx('E5', () => { jWriteOff(100); }); WRITEOFF_APPROVED = false; }

ISSUANCE_APPROVED = true;
// State 1: both orders cancel the receivable identically
CANCEL_ORDER = 'recv-first'; stateFullyOutstanding();
test('R9-24', 'fully outstanding, recv-first: recv 0, loss 0, corr 200', 'committed', tx('R9-24', () => { issueGroup(200); }));
test('R9-24b', 'recv 0, loss 0, pending 0, corr 200, units 2', true, amt('CorrectionReceivable:Bob') === 0 && amt('CorrectionWriteOffLoss:M') === 0 && amt('PendingCorrectionClaim:M') === 0 && amt('SettlementCorrection:M') === 200 && amt('ClaimUnitsRemaining:M') === 2);
CANCEL_ORDER = 'loss-first'; stateFullyOutstanding();
test('R9-25', 'fully outstanding, loss-first: same result (recv 0, loss 0, corr 200)', 'committed', tx('R9-25', () => { issueGroup(200); }));
test('R9-25b', 'recv 0, loss 0, corr 200 (orders agree when only recv exists)', true, amt('CorrectionReceivable:Bob') === 0 && amt('CorrectionWriteOffLoss:M') === 0 && amt('SettlementCorrection:M') === 200);
// State 2: both orders cancel the loss identically
CANCEL_ORDER = 'recv-first'; stateFullyWrittenOff();
test('R9-26', 'fully written-off, recv-first: recv 0, loss 0, corr 200', 'committed', tx('R9-26', () => { issueGroup(200); }));
test('R9-26b', 'recv 0, loss 0, pending 0, corr 200, units 2', true, amt('CorrectionReceivable:Bob') === 0 && amt('CorrectionWriteOffLoss:M') === 0 && amt('PendingCorrectionClaim:M') === 0 && amt('SettlementCorrection:M') === 200 && amt('ClaimUnitsRemaining:M') === 2);
CANCEL_ORDER = 'loss-first'; stateFullyWrittenOff();
test('R9-27', 'fully written-off, loss-first: same result', 'committed', tx('R9-27', () => { issueGroup(200); }));
test('R9-27b', 'recv 0, loss 0, corr 200 (orders agree when only loss exists)', true, amt('CorrectionReceivable:Bob') === 0 && amt('CorrectionWriteOffLoss:M') === 0 && amt('SettlementCorrection:M') === 200);
// State 3: partially written-off (recv 100, loss 100) — the ORDERS DIFFER on the residual
CANCEL_ORDER = 'recv-first'; statePartiallyWrittenOff();
test('R9-28', 'partial write-off (recv 100, loss 100), recv-first: issuance 200 commits', 'committed', tx('R9-28', () => { issueGroup(200); }));
test('R9-28b', 'recv-first residual: recv 0, loss 0 (both fully cancelled)', true, amt('CorrectionReceivable:Bob') === 0 && amt('CorrectionWriteOffLoss:M') === 0 && amt('SettlementCorrection:M') === 200);
report('R9-28 partial write-off, recv-first');
CANCEL_ORDER = 'loss-first'; statePartiallyWrittenOff();
test('R9-29', 'partial write-off, loss-first: issuance 200 commits', 'committed', tx('R9-29', () => { issueGroup(200); }));
test('R9-29b', 'loss-first residual: loss 0, recv 0 (both fully cancelled here too)', true, amt('CorrectionWriteOffLoss:M') === 0 && amt('CorrectionReceivable:Bob') === 0 && amt('SettlementCorrection:M') === 200);
report('R9-29 partial write-off, loss-first');
// State 3b: issuance SMALLER than the outstanding claim -> the orders DO differ
CANCEL_ORDER = 'recv-first'; statePartiallyWrittenOff();
test('R9-30', 'partial write-off, recv-first, issuance 100: cancels recv first', 'committed', tx('R9-30', () => { issueGroup(100); }));
test('R9-30b', 'recv-first residual: recv 0, loss 100 (loss stays outstanding)', true, amt('CorrectionReceivable:Bob') === 0 && amt('CorrectionWriteOffLoss:M') === 100 && amt('SettlementCorrection:M') === 100);
CANCEL_ORDER = 'loss-first'; statePartiallyWrittenOff();
test('R9-31', 'partial write-off, loss-first, issuance 100: cancels loss first', 'committed', tx('R9-31', () => { issueGroup(100); }));
test('R9-31b', 'loss-first residual: loss 0, recv 100 (receivable stays outstanding)', true, amt('CorrectionWriteOffLoss:M') === 0 && amt('CorrectionReceivable:Bob') === 100 && amt('SettlementCorrection:M') === 100);
report('R9-31 partial write-off, loss-first, partial issuance (orders differ)');
// State 4: partly collected (E3 100) then remainder written off (E5 100). Before issuance the
// balances MUST be recv 0, loss 100, pending 100, corr 100, units 1 (receivable fully consumed).
stateCollectedAndWrittenOff();
test('R9-32pre', 'collected+written-off before issuance: recv 0, loss 100, pending 100, corr 100, units 1', true,
  amt('CorrectionReceivable:Bob') === 0 && amt('CorrectionWriteOffLoss:M') === 100 && amt('PendingCorrectionClaim:M') === 100 && amt('SettlementCorrection:M') === 100 && amt('ClaimUnitsRemaining:M') === 1);
CANCEL_ORDER = 'recv-first';
test('R9-32', 'collected+written-off, recv-first: issuance 100 for the remainder', 'committed', tx('R9-32', () => { issueGroup(100); }));
test('R9-32b', 'all funded: recv 0, loss 0, pending 0, corr 200, units 2', true, amt('CorrectionReceivable:Bob') === 0 && amt('CorrectionWriteOffLoss:M') === 0 && amt('PendingCorrectionClaim:M') === 0 && amt('SettlementCorrection:M') === 200 && amt('ClaimUnitsRemaining:M') === 2);
report('R9-32 collected+written-off, recv-first'); console.log('   ' + line('  '));
CANCEL_ORDER = 'loss-first'; stateCollectedAndWrittenOff();
test('R9-32c', 'collected+written-off, loss-first: same final result (recv 0, loss 0, corr 200, units 2)', 'committed', tx('R9-32c', () => { issueGroup(100); }));
test('R9-32d', 'all funded (loss-first): recv 0, loss 0, pending 0, corr 200, units 2', true, amt('CorrectionReceivable:Bob') === 0 && amt('CorrectionWriteOffLoss:M') === 0 && amt('PendingCorrectionClaim:M') === 0 && amt('SettlementCorrection:M') === 200 && amt('ClaimUnitsRemaining:M') === 2);
// M1 check for each F28 state
CANCEL_ORDER = 'recv-first'; statePartiallyWrittenOff(); tx('x', () => { issueGroup(100); });
test('R9-33', 'M1 holds after partial-write-off issuance (recv-first)', true, M1() && C1() && C1b());
CANCEL_ORDER = 'loss-first'; statePartiallyWrittenOff(); tx('x', () => { issueGroup(100); });
test('R9-33b', 'M1 holds after partial-write-off issuance (loss-first)', true, M1() && C1() && C1b());
ISSUANCE_APPROVED = false;
CANCEL_ORDER = 'recv-first';

console.log('--- R9-34..R9-38: Option A completeness (CorrectionPayableMarket) ---');
// Option A: recognition moves corr -> CorrectionPayableMarket; payout moves market -> user.
// Prove no double-count: after recognition, SettlementCorrection = 0 and CorrectionPayableMarket = x,
// so the funded total in C1 is CorrectionPayableMarket alone (SettlementCorrection contributes 0).
PAYABLE = 'A'; ISSUANCE_APPROVED = true; settledWrong(); tx('E2', () => { jRecognize(200); });
test('R9-34', 'Option A: issuance-funded reopen then recognize', 'committed', tx('R9-34', () => { issueGroup(200); jRecognizeA(200); }));
function jRecognizeA(x) { postJournal('E8-rec-A', [['SettlementCorrection:M', 'D', x], ['CorrectionPayableMarket:M', 'C', x]]); sub['Alice'] = (sub['Alice'] || 0) + x; }
test('R9-34b', 'Option A after recognition: corr 0, corrPayableMarket 200, units 2, C1 holds', true, amt('SettlementCorrection:M') === 0 && amt('CorrectionPayableMarket:M') === 200 && amt('ClaimUnitsRemaining:M') === 2 && C1());
test('R9-35', 'Option A: no double-count (corr + corrPayableMarket = 200, not 400)', true, amt('SettlementCorrection:M') + amt('CorrectionPayableMarket:M') === 200);
test('R9-36', 'Option A payout: market control -> Alice, then close', 'committed', tx('R9-36', () => { jPayAFromMarket(200); jClose(2); }));
function jPayAFromMarket(x) { postJournal('E8-pay-A', [['CorrectionPayableMarket:M', 'D', x], ['UserAvailable:Alice', 'C', x]]); sub['Alice'] = (sub['Alice'] || 0) - x; }
test('R9-36b', 'Option A final: corr 0, corrPayableMarket 0, units 0, Alice 10000', true, amt('SettlementCorrection:M') === 0 && amt('CorrectionPayableMarket:M') === 0 && amt('ClaimUnitsRemaining:M') === 0 && amt('UserAvailable:Alice') === 10000);
test('R9-37', 'Option A subledger ties to market control at every step', true, subTie());
report('R9-37 Option A reconciliation');
test('R9-38', 'Option A: double recognition rejected (corr already 0)', 'rolled-back', tx('R9-38', () => { jRecognizeA(200); }, { expectRollback: true }));
PAYABLE = 'B'; ISSUANCE_APPROVED = false;

// ================= SECTION 4 — SHARE-LEDGER INVARIANTS C2 / S1 (REVISION 11, NEW) =================
// Corrects and independently exercises the C2 sign defect from Revision 10.
// Conventions: SharesFree/SharesEscrowed are debit-normal (raw bal positive);
// SharesOutstanding is credit-normal (raw bal negative; magnitude = amt() = -bal).
// tx() rolls back on any invariant failure, so invariant-BREAKING states are forced with
// postJournal directly (then restored) to prove C2 actually detects asymmetry.
console.log('\n############ SECTION 4 — Share-ledger invariants C2 / S1 (Revision 11) ############');

const raw = n => bal[n];
const freeAmt = (u, o) => amt('SharesFree:' + u + ':' + o);
const escAmt = (u, o) => amt('SharesEscrowed:' + u + ':' + o);
const outAmt = o => amt('SharesOutstanding:M:' + o);
const outstandingAmt = () => outAmt('YES') + outAmt('NO');

// --- Journal helpers for the share lifecycle (single-domain SHARE journals). ---
function jSplit(u, n) { for (const o of ['YES', 'NO']) postJournal('split-sh', [['SharesFree:' + u + ':' + o, 'D', n], ['SharesOutstanding:M:' + o, 'C', n]]); }
function jMerge(u, n) { for (const o of ['YES', 'NO']) postJournal('merge-sh', [['SharesOutstanding:M:' + o, 'D', n], ['SharesFree:' + u + ':' + o, 'C', n]]); }
function jEscrow(u, o, n) { postJournal('escrow-sh', [['SharesEscrowed:' + u + ':' + o, 'D', n], ['SharesFree:' + u + ':' + o, 'C', n]]); }
function jRelease(u, o, n) { postJournal('release-sh', [['SharesFree:' + u + ':' + o, 'D', n], ['SharesEscrowed:' + u + ':' + o, 'C', n]]); }
function jRetire(u, o, n) { postJournal('retire-sh', [['SharesOutstanding:M:' + o, 'D', n], ['SharesFree:' + u + ':' + o, 'C', n]]); }
function jTransfer(from, to, o, n) { postJournal('transfer-sh', [['SharesFree:' + to + ':' + o, 'D', n], ['SharesFree:' + from + ':' + o, 'C', n]]); }
function freshShares() { PAYABLE = 'B'; ISSUANCE_APPROVED = false; WRITEOFF_APPROVED = false; settledWrong(); }
const C2_OLD = () => bal['SharesOutstanding:M:YES'] === -bal['SharesOutstanding:M:NO'];

console.log('--- S4-01: C2/S1 at zero outstanding shares ---');
freshShares();
test('S4-01', 'C2 holds at zero outstanding (both sides 0)', true, C2());
test('S4-01b', 'S1 holds at zero outstanding', true, S1());
test('S4-01c', 'outstanding magnitudes are 0', true, outstandingAmt() === 0);

console.log('--- S4-02: C2 evaluated at NON-ZERO outstanding after one split ---');
freshShares();
tx('S4-02-split', () => { jSplit('Alice', 3); });
test('S4-02', 'C2 holds with 3 YES and 3 NO outstanding (NON-ZERO)', true, C2());
test('S4-02b', 'outstanding magnitudes are YES 3 and NO 3', true, outAmt('YES') === 3 && outAmt('NO') === 3);
test('S4-02c', 'raw balances are both negative (credit-normal): -3 and -3', true, raw('SharesOutstanding:M:YES') === -3 && raw('SharesOutstanding:M:NO') === -3);
test('S4-02d', 'S1 holds: Alice free 3 = outstanding 3 per outcome', true, S1() && freeAmt('Alice', 'YES') === 3 && freeAmt('Alice', 'NO') === 3);
// Regression guard: the Revision-10 formula must now be FALSE here, proving C2 is genuinely
// exercised at non-zero balances (not merely true-because-zero).
test('S4-02e', 'old sign-inverted formula returns FALSE at non-zero outstanding (defect regression)', false, C2_OLD());
test('S4-02f', 'corrected C2 TRUE where the old formula is FALSE', true, C2() === true && C2_OLD() === false);

console.log('--- S4-03: multiple complete-set splits ---');
freshShares();
tx('S4-03-splitA', () => { jSplit('Alice', 2); });
tx('S4-03-splitB', () => { jSplit('Bob', 5); });
test('S4-03', 'C2 holds after two splits (7 YES, 7 NO)', true, C2() && outAmt('YES') === 7 && outAmt('NO') === 7);
test('S4-03b', 'S1 holds: Alice free 2, Bob free 5 per outcome', true, S1() && freeAmt('Alice', 'YES') === 2 && freeAmt('Bob', 'NO') === 5);

console.log('--- S4-04: merge of complete sets ---');
freshShares();
tx('S4-04-split', () => { jSplit('Alice', 6); });
tx('S4-04-merge', () => { jMerge('Alice', 2); });
test('S4-04', 'C2 holds after merge (4 YES, 4 NO outstanding)', true, C2() && outAmt('YES') === 4 && outAmt('NO') === 4);
test('S4-04b', 'S1 holds after merge (Alice free 4 per outcome)', true, S1() && freeAmt('Alice', 'YES') === 4);

console.log('--- S4-05: escrow and release (no outstanding change) ---');
freshShares();
tx('S4-05-split', () => { jSplit('Alice', 5); });
tx('S4-05-escrow', () => { jEscrow('Alice', 'YES', 3); });
test('S4-05', 'C2 holds while 3 YES escrowed (outstanding unchanged at 5)', true, C2() && outAmt('YES') === 5 && outAmt('NO') === 5);
test('S4-05b', 'S1 holds: free 2 + escrowed 3 = outstanding 5 (YES)', true, S1() && freeAmt('Alice', 'YES') === 2 && escAmt('Alice', 'YES') === 3);
tx('S4-05-release', () => { jRelease('Alice', 'YES', 3); });
test('S4-05c', 'C2/S1 hold after release (free 5, escrowed 0)', true, C2() && S1() && freeAmt('Alice', 'YES') === 5 && escAmt('Alice', 'YES') === 0);

console.log('--- S4-06: retirement of shares ---');
freshShares();
tx('S4-06-split', () => { jSplit('Alice', 4); });
tx('S4-06-retire2', () => { for (const o of ['YES', 'NO']) jRetire('Alice', o, 2); });
test('S4-06', 'C2 holds after retiring a complete set (2 YES, 2 NO outstanding)', true, C2() && outAmt('YES') === 2 && outAmt('NO') === 2);
// Prove C2 detects asymmetry: force an unbalanced retire with postJournal (bypassing the tx guard),
// then restore. This shows C2 is meaningful at non-zero balances, not true-by-zero.
const s6 = snapshot();
postJournal('S4-06-asym', [['SharesOutstanding:M:YES', 'D', 2], ['SharesFree:Alice:YES', 'C', 2]]);
test('S4-06b', 'C2 FAILS after an unbalanced YES-only retire (0 YES, 2 NO)', false, C2());
test('S4-06c', 'C2 asymmetry is exactly YES 0 vs NO 2; S1 still holds per outcome', true, outAmt('YES') === 0 && outAmt('NO') === 2 && S1());
restore(s6);
test('S4-06d', 'C2/S1 hold again after restoring the balanced state', true, C2() && S1() && outAmt('YES') === 2);
// And the tx() guard rejects an unbalanced retire at a commit boundary:
test('S4-06e', 'unbalanced retire is rolled back by the commit-boundary guard', 'rolled-back', tx('S4-06-guard', () => { jRetire('Alice', 'YES', 2); }, { expectRollback: true }));

console.log('--- S4-07: intermediate states before full retirement ---');
freshShares();
tx('S4-07-split', () => { jSplit('Alice', 10); });
tx('S4-07-merge', () => { jMerge('Alice', 3); });
test('S4-07', 'intermediate (after merge 3 of 10): C2 holds, 7 outstanding', true, C2() && outAmt('YES') === 7);
tx('S4-07-xfer', () => { jTransfer('Alice', 'Bob', 'YES', 3); });
test('S4-07b', 'transfer keeps totals: Alice 4, Bob 3 YES; C2/S1 hold', true, C2() && S1() && freeAmt('Alice', 'YES') === 4 && freeAmt('Bob', 'YES') === 3);
const s7 = snapshot();
postJournal('S4-07-asym', [['SharesOutstanding:M:YES', 'D', 3], ['SharesFree:Bob:YES', 'C', 3]]);
postJournal('S4-07-asym2', [['SharesOutstanding:M:YES', 'D', 4], ['SharesFree:Alice:YES', 'C', 4]]);
test('S4-07c', 'C2 detects asymmetry mid-lifecycle (0 YES, 7 NO outstanding)', false, C2());
restore(s7);
test('S4-07d', 'C2/S1 restored (7 YES, 7 NO)', true, C2() && S1() && outAmt('YES') === 7);

console.log('--- S4-08: C2/S1 across correction-lifecycle boundaries (shares + correction) ---');
ISSUANCE_APPROVED = true; settledWrong();
tx('S4-08-split', () => { jSplit('Carol', 2); });
test('S4-08a', 'C2/S1 hold at correction start with 2 shares outstanding', true, C2() && S1() && outAmt('YES') === 2);
tx('S4-08-recognize', () => { jRecognize(200); });
test('S4-08b', 'C2/S1 hold after recognition (shares unaffected)', true, C2() && S1() && outAmt('YES') === 2);
tx('S4-08-issue', () => { issueGroup(200); });
test('S4-08c', 'C2/S1 hold after issuance+reopen (shares unaffected, units 2)', true, C2() && S1() && outAmt('YES') === 2 && amt('ClaimUnitsRemaining:M') === 2);
test('S4-08d', 'C1, C2 and S1 all hold together at the funded boundary', true, C1() && C2() && S1());
tx('S4-08-pay', () => { jPayB(200); jClose(2); });
test('S4-08e', 'C2/S1 hold after payout+close (correction complete)', true, C2() && S1() && amt('ClaimUnitsRemaining:M') === 0);
ISSUANCE_APPROVED = false;

console.log('--- S4-09: C2 evaluated with NON-ZERO outstanding at every commit boundary ---');
ISSUANCE_APPROVED = true; settledWrong();
tx('S4-09-split', () => { jSplit('Alice', 4); });
tx('S4-09-recognize', () => { jRecognize(200); });
let c2NonZero = 0;
report('S4-09 boundary 1 (recognized, 4 shares outstanding)'); if (outstandingAmt() > 0 && C2()) c2NonZero++;
tx('S4-09-collect', () => { collectGroup(200); });
report('S4-09 boundary 2 (funded, 4 shares outstanding)'); if (outstandingAmt() > 0 && C2()) c2NonZero++;
tx('S4-09-pay', () => { jPayB(200); jClose(2); });
report('S4-09 boundary 3 (paid, 4 shares outstanding)'); if (outstandingAmt() > 0 && C2()) c2NonZero++;
test('S4-09', 'C2 true at all 3 non-zero boundaries (not a zero-balance false positive)', true, c2NonZero === 3 && outstandingAmt() === 8);
ISSUANCE_APPROVED = false;

console.log('\n================ SUMMARY ================');
console.log(`test cases: ${tests} (${tests - testFails} passed, ${testFails} failed)`);
console.log(`invariant assertions at commit boundaries: ${asserts}`);
console.log(failures === 0 ? '>>> ALL CHECKS PASSED (scratch)' : `>>> ${failures} CHECK(S) FAILED`);
process.exitCode = failures === 0 ? 0 : 1;
