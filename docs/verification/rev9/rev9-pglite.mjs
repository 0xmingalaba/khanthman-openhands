// SCRATCH — PROPOSED Rev-9 mechanism test in PGlite (single-connection; NOT multi-session).
// Verifies: corrected issuance atomic group (E6+E4+E7) across MMK+UNIT; PendingCorrectionClaim
// cleared; write-off then issuance; rollback; unique issuance/collection/payout keys; non-negative.
import { PGlite } from '@electric-sql/pglite';
const db = new PGlite();
await db.exec(`
  create table accounts(
    account text primary key, domain text not null check (domain in ('MMK','SHARE','UNIT')),
    normal char(1) not null check (normal in ('D','C')),
    balance bigint not null check (balance >= 0)
  );
  create table ledger_entries(
    id serial primary key, txn_id text not null,
    domain text not null check (domain in ('MMK','SHARE','UNIT')),
    account text not null, side char(1) not null check (side in ('D','C')), amount bigint not null check (amount > 0)
  );
  create table issuance(
    market_id text not null, resolution_version int not null, seq int not null,
    idempotency_key text not null,
    primary key (market_id, resolution_version, seq), unique (idempotency_key)
  );
  create table collections(market_id text not null, user_id text not null, seq int not null,
    idempotency_key text not null, primary key (market_id, user_id, seq), unique (idempotency_key));
  create table payouts(market_id text not null, resolution_version int not null, user_id text not null,
    idempotency_key text not null, primary key (market_id, resolution_version, user_id), unique (idempotency_key));
  insert into accounts(account,domain,normal,balance) values
    ('CreditsIssued','MMK','D',30000),('CorrectionReceivable:Bob','MMK','D',0),
    ('CorrectionWriteOffLoss:M','MMK','D',0),('PendingCorrectionClaim:M','MMK','C',0),
    ('SettlementCorrection:M','MMK','C',0),('UserAvailable:Bob','MMK','C',10200),
    ('UserAvailable:Alice','MMK','C',9800),('ClaimUnitsRemaining:M','UNIT','D',0),('UnitsControl:M','UNIT','C',0);
`);
async function applyTxn(txnId, journals, { forceFail = false } = {}) {
  try {
    await db.transaction(async tx => {
      for (const j of journals) {
        const ds = new Set(j.entries.map(e => e.domain));
        if (ds.size !== 1) throw new Error('MIXED DOMAINS');
        const D = j.entries.filter(e => e.side === 'D').reduce((t, e) => t + e.amount, 0);
        const C = j.entries.filter(e => e.side === 'C').reduce((t, e) => t + e.amount, 0);
        if (D !== C) throw new Error('UNBALANCED ' + j.label);
        for (const e of j.entries) {
          await tx.query(`insert into ledger_entries(txn_id,domain,account,side,amount) values ($1,$2,$3,$4,$5)`, [txnId, e.domain, e.account, e.side, e.amount]);
          const delta = e.side === 'D' ? e.amount : -e.amount;
          const row = (await tx.query(`select normal from accounts where account=$1`, [e.account])).rows[0];
          await tx.query(`update accounts set balance = balance + $1 where account=$2`, [row.normal === 'D' ? delta : -delta, e.account]);
        }
      }
      if (forceFail) throw new Error('injected failure after journals');
    });
    return 'committed';
  } catch (e) { return 'rolled-back: ' + e.message; }
}
const bal = async () => (await db.query(`select account,balance from accounts order by account`)).rows;
const get = (rows, a) => rows.find(r => r.account === a).balance;

// E2 recognize, then the CORRECTED atomic issuance group E6+E4+E7
const recognize = [{ label: 'E2-recognize', entries: [{ domain: 'MMK', account: 'CorrectionReceivable:Bob', side: 'D', amount: 200 }, { domain: 'MMK', account: 'PendingCorrectionClaim:M', side: 'C', amount: 200 }] }];
const issueGroup = [
  { label: 'E6-issue', entries: [{ domain: 'MMK', account: 'CreditsIssued', side: 'D', amount: 200 }, { domain: 'MMK', account: 'CorrectionReceivable:Bob', side: 'C', amount: 200 }] },
  { label: 'E4-realize', entries: [{ domain: 'MMK', account: 'PendingCorrectionClaim:M', side: 'D', amount: 200 }, { domain: 'MMK', account: 'SettlementCorrection:M', side: 'C', amount: 200 }] },
  { label: 'E7-reopen', entries: [{ domain: 'UNIT', account: 'ClaimUnitsRemaining:M', side: 'D', amount: 2 }, { domain: 'UNIT', account: 'UnitsControl:M', side: 'C', amount: 2 }] },
];
console.log('P1 recognize:', await applyTxn('T-REC', recognize));
console.log('   after recognition:', JSON.stringify(await bal()));
const before = JSON.stringify(await bal());
console.log('P2 issuance rollback:', await applyTxn('T-ISS-FAIL', issueGroup, { forceFail: true }));
console.log('   state unchanged after rollback:', JSON.stringify(await bal()) === before);
console.log('P3 issuance commit:', await applyTxn('T-ISS', issueGroup));
console.log('   balances:', JSON.stringify(await bal()));
console.log('P4 corrected E6: issued 30200, recv 0, pending 0, corr 200, units 2:',
  get(await bal(), 'CreditsIssued') === 30200 && get(await bal(), 'CorrectionReceivable:Bob') === 0 &&
  get(await bal(), 'PendingCorrectionClaim:M') === 0 && get(await bal(), 'SettlementCorrection:M') === 200 &&
  get(await bal(), 'ClaimUnitsRemaining:M') === 2);
console.log('   ledger rows T-ISS:', (await db.query(`select count(*)::int n from ledger_entries where txn_id='T-ISS'`)).rows[0].n,
  '| T-ISS-FAIL:', (await db.query(`select count(*)::int n from ledger_entries where txn_id='T-ISS-FAIL'`)).rows[0].n);
// write-off then issuance (Path A): loss reversed — clean setup
await db.exec(`update accounts set balance=0 where account in ('CorrectionReceivable:Bob','CorrectionWriteOffLoss:M','PendingCorrectionClaim:M','SettlementCorrection:M','ClaimUnitsRemaining:M','UnitsControl:M');
  update accounts set balance=30000 where account='CreditsIssued';`);
await applyTxn('T-REC2', recognize);
await applyTxn('T-WO', [{ label: 'E5-writeoff', entries: [{ domain: 'MMK', account: 'CorrectionWriteOffLoss:M', side: 'D', amount: 200 }, { domain: 'MMK', account: 'CorrectionReceivable:Bob', side: 'C', amount: 200 }] }]);
console.log('P5a after write-off: loss 200, recv 0:', get(await bal(), 'CorrectionWriteOffLoss:M') === 200 && get(await bal(), 'CorrectionReceivable:Bob') === 0);
await applyTxn('T-ISS-A', [
  { label: 'E6-issue', entries: [{ domain: 'MMK', account: 'CreditsIssued', side: 'D', amount: 200 }, { domain: 'MMK', account: 'CorrectionWriteOffLoss:M', side: 'C', amount: 200 }] },
  { label: 'E4-realize', entries: [{ domain: 'MMK', account: 'PendingCorrectionClaim:M', side: 'D', amount: 200 }, { domain: 'MMK', account: 'SettlementCorrection:M', side: 'C', amount: 200 }] },
  { label: 'E7-reopen', entries: [{ domain: 'UNIT', account: 'ClaimUnitsRemaining:M', side: 'D', amount: 2 }, { domain: 'UNIT', account: 'UnitsControl:M', side: 'C', amount: 2 }] },
]);
console.log('P5 Path A: loss reversed after issuance:', get(await bal(), 'CorrectionWriteOffLoss:M') === 0, '| pending 0:', get(await bal(), 'PendingCorrectionClaim:M') === 0, '| corr 200:', get(await bal(), 'SettlementCorrection:M') === 200);
// idempotency keys
async function ins(key) { try { await db.query(`insert into issuance(market_id,resolution_version,seq,idempotency_key) values ('M',2,1,$1)`, [key]); return 'committed'; } catch (e) { return 'rejected: ' + e.message.split('\n')[0]; } }
console.log('P6 issuance:', await ins('I:1'));
console.log('P6 duplicate issuance:', await ins('I:1'));
async function col(key) { try { await db.query(`insert into collections(market_id,user_id,seq,idempotency_key) values ('M','Bob',1,$1)`, [key]); return 'committed'; } catch (e) { return 'rejected: ' + e.message.split('\n')[0]; } }
console.log('P9 collection:', await col('C:1'));
console.log('P9 duplicate collection:', await col('C:1'));
async function pay(key) { try { await db.query(`insert into payouts(market_id,resolution_version,user_id,idempotency_key) values ('M',2,'Alice',$1)`, [key]); return 'committed'; } catch (e) { return 'rejected: ' + e.message.split('\n')[0]; } }
console.log('P7 payout:', await pay('P:1'));
console.log('P7 duplicate payout:', await pay('P:1'));
// non-negative
console.log('P8 negative claim cancel rejected:', await applyTxn('T-NEG', [{ label: 'neg', entries: [{ domain: 'MMK', account: 'UserAvailable:Bob', side: 'D', amount: 99999 }, { domain: 'MMK', account: 'CorrectionReceivable:Bob', side: 'C', amount: 99999 }] }]));
console.log('   receivable non-negative:', get(await bal(), 'CorrectionReceivable:Bob') >= 0);
