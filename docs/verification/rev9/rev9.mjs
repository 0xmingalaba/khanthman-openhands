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
function C2() { return bal['SharesOutstanding:M:YES'] === -bal['SharesOutstanding:M:NO']; }
function S1() { let ok = true; for (const o of ['YES', 'NO']) { let s = 0; for (const u of USERS) s += amt('SharesFree:' + u + ':' + o) + amt('SharesEscrowed:' + u + ':' + o); if (s !== -bal['SharesOutstanding:M:' + o]) ok = false; } return ok; }
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

console.log('\n================ SUMMARY ================');
console.log(`test cases: ${tests} (${tests - testFails} passed, ${testFails} failed)`);
console.log(`invariant assertions at commit boundaries: ${asserts}`);
console.log(failures === 0 ? '>>> ALL CHECKS PASSED (scratch)' : `>>> ${failures} CHECK(S) FAILED`);
process.exitCode = failures === 0 ? 0 : 1;
