import assert from 'node:assert/strict';
import { test } from 'node:test';
import { EIS_PFLICHTSATZ, KI_REGELN } from '../src/utils/kiRegeln.ts';

test('Regeln enthalten den Pflichtsatz wörtlich, wie er in der App steht', () => {
  assert.equal(EIS_PFLICHTSATZ, 'Eisflächen nur nach offizieller Freigabe durch die Gemeinde betreten.');
  assert.ok(KI_REGELN.includes(EIS_PFLICHTSATZ));
});

test('Regeln aus PLANUNG.md, Abschnitt 8, sind enthalten', () => {
  for (const regel of [/nur die Zahlen|ausschließlich die Zahlen/, /schätze ihn nicht/, /nie, dass Eis tragfähig/, /klimatischer Hinweis/]) {
    assert.match(KI_REGELN, regel);
  }
});
