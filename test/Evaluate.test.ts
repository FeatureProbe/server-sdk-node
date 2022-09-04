test('Evaluate test one', () => {
  expect(true);
});

interface A {
  a: number;
}

interface B {
  b: A;
}

test('s', () => {
  const s = '{"b":{"a":3}}';
  const aa = JSON.parse(s) as B;

  console.log(aa);
  console.log(aa.b.a);
  console.log(typeof aa);

});