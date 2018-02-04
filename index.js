const types = require('./types')
const { data } = require('./triedata')

const UnicodeTrie = require('unicode-trie')

const typeTrie = new UnicodeTrie(Buffer.from(data, 'base64'))

function nextGraphemeClusterSize(ts, start) {
    const L = ts.length

    let modifierAcceptable = false
    let ri = 0

    // GB1: sot ÷ Any
    for (let i = start; i + 1 < L; i++) {
        const curr = ts[i + 0]
        const next = ts[i + 1]

        // for GB10
        if (curr !== types.Extend) {
            modifierAcceptable = false
        }
        // for GB12, GB13
        if (curr !== types.Regional_Indicator) {
            ri = 0
        }

        // GB3: CR x LF
        if (curr === types.CR && next === types.LF) {
            continue
        }
        // GB4: (Control | CR | LF) ÷
        if ((curr & (types.Control | types.CR | types.LF)) !== 0) {
            return (i + 1) - start
        }
        // GB5: ÷ (Control | CR | LF)
        if ((next & (types.Control | types.CR | types.LF)) !== 0) {
            return (i + 1) - start
        }
        // GB6: L x (L | V | LV | LVT)
        if (curr === types.L && ((next & (types.L | types.V | types.LV | types.LVT)) !== 0)) {
            continue
        }
        // GB7: (LV | V) x (V | T)
        if (((curr & (types.LV | types.V)) !== 0) && ((next & (types.V | types.T)) !== 0)) {
            continue
        }
        // GB8: (LVT | T) x T
        if (((curr & (types.LVT | types.T)) !== 0) && next === types.T) {
            continue
        }
        // GB9: x (Extend | ZWJ)
        if ((next & (types.Extend | types.ZWJ)) !== 0) {
            // for GB10
            if (next === types.Extend && !modifierAcceptable) {
                modifierAcceptable = (curr & (types.E_Base | types.E_Base_GAZ)) !== 0
            }
            continue
        }
        // GB9a: x SpacingMark
        if (next === types.SpacingMark) {
            continue
        }
        // GB9b: Prepend x
        if (curr === types.Prepend) {
            continue
        }
        // GB10: (E_Base | EBG) Extend* x E_Modifier
        if ((((curr & (types.E_Base | types.E_Base_GAZ)) !== 0) || modifierAcceptable) && next === types.E_Modifier){
            continue
        }
        // GB11: ZWJ x (Glue_After_Zwj | EBG)
        if (curr === types.ZWJ && ((next & (types.Glue_After_Zwj | types.E_Base_GAZ)) !== 0)) {
            continue
        }
        // GB12: sot (RI RI)* RI x RI
        // GB13: [^RI] (RI RI)* RI x RI
        if (curr === types.Regional_Indicator && next === types.Regional_Indicator && ri % 2 === 0) {
            ri++
            continue
        }
        // GB999: Any ÷ Any
        return (i + 1) - start
    }
    // GB2: Any ÷ eot
    return L - start
}

module.exports = function split(str) {
    const graphemeClusters = []

    const codePoints = [...str].map(x => x.codePointAt(0))
    const ts = codePoints.map(c => typeTrie.get(c))
    for (let offset = 0; offset < codePoints.length; ) {
        const size = nextGraphemeClusterSize(ts, offset)
        const graphemeCluster = codePoints.slice(offset, offset + size)
        graphemeClusters.push(String.fromCodePoint(...graphemeCluster))
        offset += size
    }
    return graphemeClusters
}