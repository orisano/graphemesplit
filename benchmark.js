const { performance } = require("perf_hooks");
const split = require("./index");

// when a Javascript engine notices a function being called frequently,
// it will pass it through the optimizer. For consistency, we'd like to make
// sure that happens before we start measuring.
for (let i = 0; i < 1000; i++) {
  split("warm up");
}

// benchmark a simple string, with no unicode combining characters
const simpleStart = performance.now();
for (let i = 0; i < 10000; i++) {
  split("hello world");
}
const simpleEnd = performance.now();

console.log(`simple string: ${simpleEnd - simpleStart}ms`);

// benchmark a complex string with several unicode combining characters
const complexStart = performance.now();
for (let i = 0; i < 10000; i++) {
  split("Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍A̴̵̜̰͔ͫ͗͢L̠ͨͧͩ͘G̴̻͈͍͔̹̑͗̎̅͛́Ǫ̵̹̻̝̳͂̌̌͘!͖̬̰̙̗̿̋ͥͥ̂ͣ̐́́͜͞");
}
const complexEnd = performance.now();

console.log(`complex string: ${complexEnd - complexStart}ms`);
