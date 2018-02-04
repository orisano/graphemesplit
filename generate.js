const https = require('https')

const es = require('event-stream')
const UnicodeTrieBuilder = require('unicode-trie/builder')

const types = require('./types')

https.get('https://www.unicode.org/Public/UCD/latest/ucd/auxiliary/GraphemeBreakProperty.txt', res => {
    const { statusCode } = res
    if (statusCode !== 200) {
        console.error(`failed to request: ${statusCode}`)
        res.resume()
        return
    }

    const trie = new UnicodeTrieBuilder(types.Other)
    res
        .pipe(es.split())
        .pipe(es.through(function write(data) {
            this.queue(data.split('#')[0])
        }))
        .pipe(es.through(function write(data) {
            if (data.trim().length > 0) {
                this.queue(data)
            }
        }))
        .pipe(es.through(function write(data) {
            const [key, value] = data.split(';').map(x => x.trim())
            const range = key.split('..').map(x => parseInt(x, 16))
            const type = types[value]
            if (range.length > 1) {
                this.queue({start: range[0], end: range[1], type})
            } else {
                this.queue({start: range[0], end: range[0], type})
            }
        }))
        .on('data', ({start, end, type}) => {
            trie.setRange(start, end, type)
        })
        .on('end', () => {
            process.stdout.write(JSON.stringify({
                data: trie.toBuffer().toString('base64'),
            }))
        })
})