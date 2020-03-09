# graphemesplit
A JavaScript implementation of the Unicode 13.0 grapheme cluster breaking algorithm. ([UAX #29](http://www.unicode.org/reports/tr29/#Grapheme_Cluster_Boundaries))

## Installation
```bash
npm install graphemesplit
```

## How to use
```javascript
const split = require('graphemesplit')

split('Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍A̴̵̜̰͔ͫ͗͢L̠ͨͧͩ͘G̴̻͈͍͔̹̑͗̎̅͛́Ǫ̵̹̻̝̳͂̌̌͘!͖̬̰̙̗̿̋ͥͥ̂ͣ̐́́͜͞') // => ['Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍','A̴̵̜̰͔ͫ͗͢','L̠ͨͧͩ͘','G̴̻͈͍͔̹̑͗̎̅͛́','Ǫ̵̹̻̝̳͂̌̌͘','!͖̬̰̙̗̿̋ͥͥ̂ͣ̐́́͜͞']
```

## Author
Nao YONASHIRO(@orisano)

## License
MIT

## Reference
[devongovett/grapheme-breaker](https://github.com/devongovett/grapheme-breaker)

[Unicode® Standard Annex #29](https://unicode.org/reports/tr29/)

[GraphemeBreakTest.txt](https://www.unicode.org/Public/13.0.0/ucd/auxiliary/GraphemeBreakTest.txt)

[emoji-data.txt](https://www.unicode.org/Public/13.0.0/ucd/emoji/emoji-data.txt)
