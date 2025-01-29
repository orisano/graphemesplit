const types = require("./types");
const typeTrieData = require("./typeTrie.json").data;
const extPictData = require("./extPict.json").data;
const inCBData = require("./inCB.json").data;

const UnicodeTrie = require("unicode-trie");
const Base64 = require("js-base64").Base64;

const typeTrie = new UnicodeTrie(Base64.toUint8Array(typeTrieData));
const extPict = new UnicodeTrie(Base64.toUint8Array(extPictData));
const inCB = new UnicodeTrie(Base64.toUint8Array(inCBData));

function is(type, bit) {
  return (type & bit) !== 0;
}

function nextGraphemeClusterSize(s, ts, start) {
  const L = ts.length;

  for (let i = start; i + 1 < L; i++) {
    const curr = ts[i + 0];
    const next = ts[i + 1];

    // GB9c: \p{InCB=Consonant} [ \p{InCB=Extend} \p{InCB=Linker} ]* \p{InCB=Linker} [ \p{InCB=Extend} \p{InCB=Linker} ]* × \p{InCB=Consonant}
    switch (s.gb9c) {
    case 0:
      if (is(curr, types.InCB_Consonant)) s.gb9c = 1;
      break;
    case 1:
      if (is(curr, types.InCB_Extend)) s.gb9c = 1;
      else if (is(curr, types.InCB_Linker)) s.gb9c = 2;
      else s.gb9c = is(curr, types.InCB_Consonant) ? 1 : 0;
      break;
    case 2:
      if (is(curr, types.InCB_Extend | types.InCB_Linker)) s.gb9c = 2;
      else s.gb9c = is(curr, types.InCB_Consonant) ? 1 : 0;
      break;
    }

    // GB11: \p{Extended_Pictographic} Extend* ZWJ x \p{Extended_Pictographic}
    switch (s.gb11) {
    case 0:
      if (is(curr, types.Extended_Pictographic)) s.gb11 = 1;
      break;
    case 1:
      if (is(curr, types.Extend)) s.gb11 = 1;
      else if (is(curr, types.ZWJ)) s.gb11 = 2;
      else s.gb11 = is(curr, types.Extended_Pictographic) ? 1 : 0;
      break;
    case 2:
      s.gb11 = is(curr, types.Extended_Pictographic) ? 1 : 0;
      break;
    }

    // GB12: sot (RI RI)* RI × RI
    switch (s.gb12) {
    case 0:
      if (is(curr, types.Regional_Indicator)) s.gb12 = 1;
      else s.gb12 = -1;
      break;
    case 1:
      if (is(curr, types.Regional_Indicator)) s.gb12 = 0;
      else s.gb12 = -1;
      break;
    }

    // GB13: [^RI] (RI RI)* RI × RI
    switch (s.gb13) {
    case 0:
      if (!is(curr, types.Regional_Indicator)) s.gb13 = 1;
      break;
    case 1:
      if (is(curr, types.Regional_Indicator)) s.gb13 = 2;
      else s.gb13 = 1;
      break;
    case 2:
      s.gb13 = 1;
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
    // GB9c: \p{InCB=Consonant} [ \p{InCB=Extend} \p{InCB=Linker} ]* \p{InCB=Linker} [ \p{InCB=Extend} \p{InCB=Linker} ]* × \p{InCB=Consonant}
    if (is(next, types.InCB_Consonant) && s.gb9c === 2) {
      continue;
    }
    // GB11: \p{Extended_Pictographic} Extend* ZWJ x \p{Extended_Pictographic}
    if (is(next, types.Extended_Pictographic) && s.gb11 === 2) {
      continue;
    }
    // GB12: sot (RI RI)* RI x RI
    if (is(next, types.Regional_Indicator) && s.gb12 === 1) {
      continue;
    }
    // GB13: [^RI] (RI RI)* RI x RI
    if (is(next, types.Regional_Indicator) && s.gb13 === 2) {
      continue;
    }
    // GB999: Any ÷ Any
    return i + 1 - start;
  }
  return L - start;
}

module.exports = function split(str) {
  const graphemeClusters = [];

  const map = [0];
  const ts = [];
  for (let i = 0; i < str.length; ) {
    const code = str.codePointAt(i);
    ts.push(typeTrie.get(code) | extPict.get(code) | inCB.get(code));
    i += code > 65535 ? 2 : 1;
    map.push(i);
  }
  const s = {
    gb9c: 0,
    gb11: 0,
    gb12: 0,
    gb13: 0,
  };
  for (let offset = 0; offset < ts.length; ) {
    const size = nextGraphemeClusterSize(s, ts, offset);
    const start = map[offset];
    const end = map[offset + size];
    graphemeClusters.push(str.slice(start, end));
    offset += size;
  }

  return graphemeClusters;
};
