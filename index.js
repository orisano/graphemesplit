const types = require("./types");
const typeTrieData = require("./typeTrie.json").data;
const extPictData = require("./extPict.json").data;

const UnicodeTrie = require("unicode-trie");
const Base64 = require("js-base64").Base64;

const typeTrie = new UnicodeTrie(Base64.toUint8Array(typeTrieData));
const extPict = new UnicodeTrie(Base64.toUint8Array(extPictData));

function is(type, bit) {
  return (type & bit) !== 0;
}

const GB11State = {
  Initial: 0,
  ExtendOrZWJ: 1,
  NotBoundary: 2,
};

function nextGraphemeClusterSize(ts, start) {
  const L = ts.length;

  let ri = 0;
  let gb11State = GB11State.Initial;

  // GB1: sot ÷ Any
  for (let i = start; i + 1 < L; i++) {
    const curr = ts[i + 0];
    const next = ts[i + 1];

    // for GB12, GB13
    if (!is(curr, types.Regional_Indicator)) {
      ri = 0;
    }

    // for GB11: \p{Extended_Pictographic} Extend* ZWJ x \p{Extended_Pictographic}
    switch (gb11State) {
      case GB11State.NotBoundary:
      case GB11State.Initial:
        if (is(curr, types.Extended_Pictographic)) {
          gb11State = GB11State.ExtendOrZWJ;
        } else {
          gb11State = GB11State.Initial;
        }
        break;
      case GB11State.ExtendOrZWJ:
        if (is(curr, types.Extend)) {
          gb11State = GB11State.ExtendOrZWJ;
        } else if (
          is(curr, types.ZWJ) &&
          is(next, types.Extended_Pictographic)
        ) {
          gb11State = GB11State.NotBoundary;
        } else {
          gb11State = GB11State.Initial;
        }
        break;
    }

    // GB3: CR x LF
    if (is(curr, types.CR) && is(next, types.LF)) {
      continue;
    }
    // GB4: (Control | CR | LF) ÷
    if (is(curr, types.Control | types.CR | types.LF)) {
      return i + 1 - start;
    }
    // GB5: ÷ (Control | CR | LF)
    if (is(next, types.Control | types.CR | types.LF)) {
      return i + 1 - start;
    }
    // GB6: L x (L | V | LV | LVT)
    if (
      is(curr, types.L) &&
      is(next, types.L | types.V | types.LV | types.LVT)
    ) {
      continue;
    }
    // GB7: (LV | V) x (V | T)
    if (is(curr, types.LV | types.V) && is(next, types.V | types.T)) {
      continue;
    }
    // GB8: (LVT | T) x T
    if (is(curr, types.LVT | types.T) && is(next, types.T)) {
      continue;
    }
    // GB9: x (Extend | ZWJ)
    if (is(next, types.Extend | types.ZWJ)) {
      continue;
    }
    // GB9a: x SpacingMark
    if (is(next, types.SpacingMark)) {
      continue;
    }
    // GB9b: Prepend x
    if (is(curr, types.Prepend)) {
      continue;
    }
    // GB11: \p{Extended_Pictographic} Extend* ZWJ x \p{Extended_Pictographic}
    if (gb11State === GB11State.NotBoundary) {
      continue;
    }
    // GB12: sot (RI RI)* RI x RI
    // GB13: [^RI] (RI RI)* RI x RI
    if (
      is(curr, types.Regional_Indicator) &&
      is(next, types.Regional_Indicator) &&
      ri % 2 === 0
    ) {
      ri++;
      continue;
    }
    // GB999: Any ÷ Any
    return i + 1 - start;
  }
  // GB2: Any ÷ eot
  return L - start;
}

module.exports = function split(str) {
  const graphemeClusters = [];

  const map = [0];
  const ts = [];
  for (let i = 0; i < str.length; ) {
    const code = str.codePointAt(i);
    ts.push(typeTrie.get(code) | extPict.get(code));
    i += code > 65535 ? 2 : 1;
    map.push(i);
  }

  for (let offset = 0; offset < ts.length; ) {
    const size = nextGraphemeClusterSize(ts, offset);
    const start = map[offset];
    const end = map[offset + size];
    graphemeClusters.push(str.slice(start, end));
    offset += size;
  }

  return graphemeClusters;
};
