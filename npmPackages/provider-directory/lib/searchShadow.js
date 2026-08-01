// npmPackages/provider-directory/lib/searchShadow.js
//
// nameLower shadow field for index-bounded directory search.
//
// Why: omniSearch needs case-insensitive prefix matching over millions of
// rows, but `$regex ^X i` cannot use a B-tree index and Mongo collation does
// not apply to $regex at all. So we maintain a lowercased shadow of the name
// field (`nameLower` — scalar everywhere, multikey ARRAY on Practitioner),
// index it, and query it with a CASE-SENSITIVE ^prefix regex, which is
// index-bounded.
//
// ⚠ Every writer that replaces whole Directory/Endpoint documents MUST stamp
// the shadow (stampNameShadow) or the index goes stale for those rows:
//   - npmPackages/provider-directory/server/methods.directory.js
//     installResource() — the NPPES national install uses replaceOne
//   - extensions/lantern/server/methods.js bulkUpsertEndpoints() +
//     lantern.seedSandboxEndpoint (inline one-liner; lantern has no import
//     path into this package)
// Backfill for existing rows: providerDirectory.backfillSearchIndex
// (server/methods.searchIndex.js) runs nameLowerPipeline() via updateMany.
//
// Pure and dependency-free: node --test via
// tests/unit/npmPackages/provider-directory/searchShadow.test.mjs
// (npm run test:search-shadow).

export function toNameLower(value) {
  if (typeof value !== 'string' || value.length === 0) {
    return undefined;
  }
  return value.toLowerCase();
}

// Per-document stamping for writers (mutates doc). Practitioner gets the
// multikey array of every name[].text and name[].family; everything else is
// a scalar of doc.name. Nameless docs get NO field (absent, never null), so
// backfillFilter and the readiness check stay consistent.
export function stampNameShadow(resourceName, doc) {
  if (!doc || typeof doc !== 'object') {
    return doc;
  }
  if (resourceName === 'Practitioner') {
    const names = Array.isArray(doc.name) ? doc.name : [];
    const values = [];
    for (const humanName of names) {
      if (!humanName || typeof humanName !== 'object') {
        continue;
      }
      const text = toNameLower(humanName.text);
      if (text !== undefined) {
        values.push(text);
      }
      const family = toNameLower(humanName.family);
      if (family !== undefined && family !== text) {
        values.push(family);
      }
    }
    if (values.length) {
      doc.nameLower = values;
    }
    return doc;
  }
  const lowered = toNameLower(doc.name);
  if (lowered !== undefined) {
    doc.nameLower = lowered;
  }
  return doc;
}

// updateMany aggregation pipeline for the backfill — server-side, one pass
// per collection, no document round-trips. $type guard + $$REMOVE keeps
// nameless/junk docs field-free instead of null.
export function nameLowerPipeline(resourceName) {
  if (resourceName === 'Practitioner') {
    return [{
      $set: {
        nameLower: {
          $let: {
            vars: { arr: { $cond: [{ $isArray: '$name' }, '$name', []] } },
            in: {
              $let: {
                vars: {
                  collected: {
                    $filter: {
                      input: {
                        $concatArrays: [
                          {
                            $map: {
                              input: '$$arr',
                              as: 'n',
                              in: {
                                $cond: [
                                  { $eq: [{ $type: '$$n.text' }, 'string'] },
                                  { $toLower: '$$n.text' },
                                  ''
                                ]
                              }
                            }
                          },
                          {
                            $map: {
                              input: '$$arr',
                              as: 'n',
                              in: {
                                $cond: [
                                  { $eq: [{ $type: '$$n.family' }, 'string'] },
                                  { $toLower: '$$n.family' },
                                  ''
                                ]
                              }
                            }
                          }
                        ]
                      },
                      as: 'v',
                      cond: { $ne: ['$$v', ''] }
                    }
                  }
                },
                in: {
                  $cond: [
                    { $gt: [{ $size: '$$collected' }, 0] },
                    '$$collected',
                    '$$REMOVE'
                  ]
                }
              }
            }
          }
        }
      }
    }];
  }
  return [{
    $set: {
      nameLower: {
        $cond: [
          { $eq: [{ $type: '$name' }, 'string'] },
          { $toLower: '$name' },
          '$$REMOVE'
        ]
      }
    }
  }];
}

// Which docs still need the shadow — drives both the backfill updateMany and
// the omniSearch readiness probe (ready when this matches zero docs).
export function backfillFilter(resourceName) {
  if (resourceName === 'Practitioner') {
    return { name: { $type: 'array', $ne: [] }, nameLower: { $exists: false } };
  }
  return { name: { $type: 'string' }, nameLower: { $exists: false } };
}
