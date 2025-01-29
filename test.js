const assert = require("assert");
const https = require("https");
const stream = require("stream");

const linesStream = require("@orisano/lines-stream");

const graphemesplit = require("./");

https.get(
  "https://www.unicode.org/Public/16.0.0/ucd/auxiliary/GraphemeBreakTest.txt",
  (res) => {
    const { statusCode } = res;
    if (statusCode !== 200) {
      console.error(`failed to http request: ${statusCode}`);
      res.resume();
      return;
    }
    res
      .pipe(linesStream())
      .pipe(
        new stream.Transform({
          decodeStrings: false,
          readableObjectMode: true,

          transform(line, encoding, callback) {
            callback();

            if (line.trim().length === 0) return;
            const [body, description] = line.split("#");
            const test = body.trim();
            if (test.length === 0) return;
            const graphemeClusters = test
              .split("÷")
              .filter((x) => x.length > 0)
              .map((x) => {
                const codePoints = x
                  .split("×")
                  .map((y) => parseInt(y.trim(), 16));
                return String.fromCodePoint(...codePoints);
              });
            this.push({ expected: graphemeClusters, description });
          },
        })
      )
      .on("data", ({ expected, description }) => {
        const got = graphemesplit(expected.join(""));
        assert.deepStrictEqual(
          got,
          expected,
          `unexpected grapheme clusters. expected: ${expected}, but got: ${got} # ${description}`
        );
      });
  }
);
