const http = require('http')
const split = require('split')
const through = require('through')
const sort = require('sort-stream')
const fs = require('fs')

http.get('http://www.unicode.org/Public/UCD/latest/ucd/auxiliary/GraphemeBreakProperty.txt', res => {
    const { statusCode } = res
    if (statusCode !== 200) {
        console.error(`failed to request: ${statusCode}`)
        res.resume()
        return
    }

    const kindMap = {
        CR: 0,
        LF: 1,
        Control: 2,
        Extend: 3,
        ZWJ: 4,
        Regional_Indicator: 5,
        Prepend: 6,
        SpacingMark: 7,
        L: 8,
        V: 9,
        T: 10,
        LV: 11,
        LVT: 12,
        E_Base: 13,
        E_Modifier: 14,
        Glue_After_Zwj: 15,
        E_Base_GAZ: 16,
    }

    res.setEncoding('utf8')
    res
        .pipe(split())
        .pipe(through(function write(data) {
            this.queue(data.split('#')[0])
        }))
        .pipe(through(function write(data) {
            if (data.trim().length > 0) {
                this.queue(data)
            }
        }))
        .pipe(through(function write(data) {
            const [key, value] = data.split(';').map(x => x.trim())
            const range = key.split('..').map(x => parseInt(x, 16))
            const kind = kindMap[value]
            if (range.length > 1) {
                this.queue({low: range[0], high: range[1] + 1, kind})
            } else {
                this.queue({low: range[0], high: range[0] + 1, kind})
            }
        }))
        .pipe(sort((a, b) => a.low - b.low))
})