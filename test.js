const render = require('./render')
const { writeFileSync } = require('fs')
const lcg = require('compute-lcg')
const alea = require('alea')

const main = () => {
  const buffer = render.gif(1)
  writeFileSync(`./planets/1.gif`, buffer)
  // for (const i of Array.from(Array(100).keys())) {
  //   const prng = alea(i)
  //   const amp1 = prng()
  //   const amp2 = prng()
  //   const buffer = render(i, amp1 + amp2)
  //   writeFileSync(`./planets/${i}.png`, buffer)
  // }
}

main()