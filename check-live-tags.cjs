const fs = require('fs');

async function test() {
  const res = await fetch("https://habitflow-2a53e.web.app/");
  const html = await res.text();
  const regex = /<link[^>]+(icon|manifest)[^>]*>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    console.log(match[0]);
  }
}
test();
