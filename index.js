const { createCanvas } = require('canvas')
const alea = require('alea')
const { createNoise2D } = require('simplex-noise')
const chroma = require('chroma-js')
const { writeFileSync } = require('fs')

const seed = 1

const generatePlanet = () => {
  const canvas = createCanvas(333, 444)
  const ctx = canvas.getContext('2d')

  const SIZE = 256

  const imageData = ctx.createImageData(SIZE, SIZE)

  const prng = alea(seed)
  const data = imageData.data
  const noise2D = createNoise2D(prng)
  let t = 1

  let am = Math.random()
  for (let x = 0; x < SIZE; x++) {
    for (let y = 0; y < SIZE; y++) {
      let i = x + y * SIZE
      const dx = x - Math.floor(SIZE / 2)
      const dy = y - Math.floor(SIZE / 2)
      const distanceSqrd = dx ** 2 + dy ** 2
      if (distanceSqrd < ((((SIZE / 2) - 4) ** 2))) {
        const nx = x / SIZE - 0.5
        const ny = y / SIZE - 0.5
        let rgba = []
        function fbm_noise(amplitudes, nx, ny) {
          let sum = 0, sumOfAmplitudes = 0
          for (let octave = 0; octave < amplitudes.length; octave++) {
            let frequency = 1 << octave
            sum += amplitudes[octave] * noise2D(nx * frequency, ny * frequency)
            sumOfAmplitudes += amplitudes[octave]
          }
          return sum / sumOfAmplitudes;
        }

        let curAmp = Array(4).fill(1).map((v, i) => {
          return i > 0 ? v * ((0.5) ** i) : v
        })

        const e = fbm_noise(curAmp, nx, ny)
        if (e > 0) {
          rgba = chroma('white').rgba()
        }
        // else if (e > 0.3) {
        //   rgba = chroma('white').darken(0.5).rgba()
        // }
        // else if (e > 0) {
        //   rgba = chroma('white').darken(0.8).rgba()
        // }
        else {
          rgba = chroma('black').rgba()
        }
        data[i * 4 + 0] = rgba[0] // R value
        data[i * 4 + 1] = rgba[1]
        data[i * 4 + 2] = rgba[2]
        data[i * 4 + 3] = 255
      }
      else if (distanceSqrd <= (((SIZE / 2) ** 2))) {
        data[i * 4 + 0] = 0
        data[i * 4 + 1] = 0
        data[i * 4 + 2] = 0
        data[i * 4 + 3] = 255
      }
      else {
        let bg = chroma('#d9d9d9').rgba()
        data[i * 4 + 0] = bg[0]
        data[i * 4 + 1] = bg[1]
        data[i * 4 + 2] = bg[2]
        data[i * 4 + 3] = 255
      }
    }
    t++
  }
  ctx.fillStyle = "#d9d9d9"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // put planet
  ctx.putImageData(imageData, canvas.width / 2 - SIZE / 2, 8 * 8)

  // put NFT ID
  ctx.font = "bold 18px Inconsolata"
  ctx.fillStyle = "black"
  ctx.textAlign = "left"
  ctx.fillText(`#${seed}`, 8 * 3, 8 * 4)

  ctx.textAlign = "right"
  ctx.fillText(`(${Math.floor(Math.random() * 1000)}, ${Math.floor(Math.random() * 1000)})`, canvas.width - (8 * 3), 8 * 4)

  // put Rates
  ctx.font = "18px Inconsolata"
  ctx.fillStyle = "black"
  ctx.textAlign = "center"
  ctx.fillText(`Rates ${Math.floor(Math.random() * 1000)}`, canvas.width / 2, canvas.height - (8 * 8))

  // put materials
  ctx.fillStyle = "black"
  ctx.textAlign = "center"
  ctx.fillText(`Plant ${Math.floor(Math.random() * 1000)}`, canvas.width / 2, canvas.height - (8 * 3))

  ctx.fillStyle = "black"
  ctx.textAlign = "left"
  ctx.fillText(`Mineral ${Math.floor(Math.random() * 1000)}`, (8 * 3), canvas.height - (8 * 3))

  ctx.fillStyle = "black"
  ctx.textAlign = "right"
  ctx.fillText(`Animal ${Math.floor(Math.random() * 1000)}`, canvas.width - (8 * 3), canvas.height - (8 * 3))
  const buf = canvas.toBuffer('image/png', { compressionLevel: 3, filters: canvas.PNG_FILTER_NONE })

  return buf
}
const main = () => {
  const x = generatePlanet()
  writeFileSync('./planet.png', x)
  console.log(x)
}

main()