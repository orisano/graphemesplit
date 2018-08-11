# graphemesplit
A JavaScript implementation of the Unicode 11.0 grapheme cluster breaking algorithm. ([UAX #29](http://www.unicode.org/reports/tr29/#Grapheme_Cluster_Boundaries))

## Installation
```bash
npm install graphemesplit
```

## How to Use
```javascript
const split = require('graphemesplit')

split('Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍A̴̵̜̰͔ͫ͗͢L̠ͨͧͩ͘G̴̻͈͍͔̹̑͗̎̅͛́Ǫ̵̹̻̝̳͂̌̌͘!͖̬̰̙̗̿̋ͥͥ̂ͣ̐́́͜͞') // => ['Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍','A̴̵̜̰͔ͫ͗͢','L̠ͨͧͩ͘','G̴̻͈͍͔̹̑͗̎̅͛́','Ǫ̵̹̻̝̳͂̌̌͘','!͖̬̰̙̗̿̋ͥͥ̂ͣ̐́́͜͞']
```

## License
MIT

## Reference
[devongovett/grapheme-breaker](https://github.com/devongovett/grapheme-breaker)

[Unicode® Standard Annex #29](https://unicode.org/reports/tr29/)

[GraphemeBreakTest.txt](https://www.unicode.org/Public/UNIDATA/auxiliary/GraphemeBreakTest.txt)
