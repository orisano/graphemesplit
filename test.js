const assert = require('assert')
const https = require('https')

const es = require('event-stream')

const graphemesplit = require('./')

https.get('https://www.unicode.org/Public/UNIDATA/auxiliary/GraphemeBreakTest.txt', res => {
    const { statusCode } = res
    if (statusCode !== 200) {
        console.error(`failed to http request: ${statusCode}`)
        res.resume()
        return
    }
    res
        .pipe(es.split())
        .pipe(es.through(function write(line) {
            this.queue(line.split('#')[0].trim())
        }))
        .pipe(es.through(function write(line) {
            if (line.length > 0) {
                this.queue(line)
            }
        }))
        .pipe(es.through(function write(line) {
            const graphemeCluster = line.split('÷')
                .filter(x => x.length > 0)
                .map(x => {
                    const codePoints = x.split('×')
                        .map(y => y.trim())
                        .map(y => parseInt(y, 16))
                    return String.fromCodePoint(...codePoints)
                })
            this.queue(graphemeCluster)
        }))
        .on('data', function (expected) {
            const got = graphemesplit(expected.join(''))
            assert.deepStrictEqual(got, expected, `unexpected grapheme clusters. expected: ${expected}, but got: ${got}`)
        })
})