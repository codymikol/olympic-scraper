const puppeteer = require("puppeteer/lib/cjs/puppeteer/node-puppeteer-core").default;

'use strict';

const VESTA_CODE_MAP = {
    ' ': 0,
    'A': 1,
    'B': 2,
    'C': 3,
    'D': 4,
    'E': 5,
    'F': 6,
    'G': 7,
    'H': 8,
    'I': 9,
    'J': 10,
    'K': 11,
    'L': 12,
    'M': 13,
    'N': 14,
    'O': 15,
    'P': 16,
    'Q': 17,
    'R': 18,
    'S': 19,
    'T': 20,
    'U': 21,
    'V': 22,
    'W': 23,
    'X': 24,
    'Y': 25,
    'Z': 26,
    '1': 27,
    '2': 28,
    '3': 29,
    '4': 30,
    '5': 31,
    '6': 32,
    '7': 33,
    '8': 34,
    '9': 35,
    '0': 36,
    '!': 37,
    '@': 38,
    '#': 39,
    '$': 40,
    '(': 41,
    ')': 42,
    '-': 44,
    '+': 46,
    '&': 47,
    '=': 48,
    ';': 49,
    ':': 50,
    '\'': 52,
    '"': 53,
    '%': 54,
    ',': 55,
    '.': 56,
    '/': 59,
    '?': 60,
    '°': 62,
}

const GOLD = 65
const SILVER = 69
const BRONZE = 64

function toVestaCodes(str) {
    return str.split('').map((char) => VESTA_CODE_MAP[char] ?? VESTA_CODE_MAP['?'])
}

function rightPaddedDouble(num) {
    const number = num.toString()
    if (number.length === 1) return number + " "
    if (number.length === 2) return number
    return "??"
}

function leftPaddedDouble(num) {
    const number = num.toString()
    if (number.length === 1) return " " + number
    if (number.length === 2) return number
    return "??"
}

function leftPaddedTriple(num) {
    const number = num.toString()
    if (number.length === 1) return "  " + number
    if (number.length === 2) return " " + number
    if (number.length === 3) return number
    return "???"
}

function paddedCountry(countryName) {

    let ret = '        '.split('')

    for (let i = 0; i <= 7; i++) {
        ret[i] = countryName[i] ?? ' ';
    }

    if (ret[7] !== ' ') {
        ret[7] = '.'
    }

    return ret.join('');

}


(async function () {

    'use strict';

    class CountryStanding {

        constructor(
            country,
            goldMedalCount,
            silverMedalCount,
            bronzeMedalCount,
            place,
        ) {
            this.country = country;
            this.goldMedalCount = goldMedalCount;
            this.silverMedalCount = silverMedalCount;
            this.bronzeMedalCount = bronzeMedalCount;
            this.totalMedalCount = (parseInt(goldMedalCount) + parseInt(silverMedalCount) + parseInt(bronzeMedalCount)).toString();
            this.place = place;
        }

        toVestaString() {

            const placeText = rightPaddedDouble(this.place)

            const countryText = paddedCountry(this.country)

            const goldMedalsText = leftPaddedDouble(this.goldMedalCount)
            const silverMedalText = leftPaddedDouble(this.silverMedalCount)
            const bronzeMedalCount = leftPaddedDouble(this.bronzeMedalCount)

            const totalCountText = leftPaddedTriple(this.totalMedalCount)

            return [
                placeText,
                countryText,
                goldMedalsText,
                silverMedalText,
                bronzeMedalCount,
                totalCountText
            ].join('')

        }

        toVestaCodes() {
            return toVestaCodes(this.toVestaString());
        }

    }


    const browser = await puppeteer.launch({
        ignoreHTTPSErrors: true,
        headless: true,
        devtools: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36")

    await page.goto('https://olympics.com/beijing-2022/olympic-games/en/results/all-sports/medal-standings.htm', {
        waitUntil: 'networkidle0',
    })


    const countryStandingPromise = await page.$eval('tbody', ele => Array.prototype.slice.call(ele.children, 0).map((row, index) => {

        const data = Array.prototype.slice.call(row.children, 0)

        function cellToMedalCount(cell) {
            if (!cell.firstElementChild) {
                return cell.textContent.replaceAll('\n', '')
            }

            return cell.firstElementChild?.textContent.replaceAll('\n', '')
        }

        const country = data[1].getAttribute('data-text').toUpperCase()

        const goldMedalCount = cellToMedalCount(data[2])
        const silverMedalCount = cellToMedalCount(data[3])
        const bronzeMedalCount = cellToMedalCount(data[4])

        const place = index + 1;

        return {
            country,
            goldMedalCount,
            silverMedalCount,
            bronzeMedalCount,
            place
        }

    }))

    // todo(mikol): The class CountryStandings cannot be used in the context of $eval leading to this mess

    const countryStandings = countryStandingPromise
        .map(({
                  country,
                  goldMedalCount,
                  silverMedalCount,
                  bronzeMedalCount,
                  place
              }) => {
            return new CountryStanding(
                country,
                goldMedalCount,
                silverMedalCount,
                bronzeMedalCount,
                place
            )
        })

    console.log(countryStandings.map(it => it.toVestaString()))

    function getVestaHeader() {

        let header = toVestaCodes("MEDALS    GG SS BB TOT")

        header[11] = GOLD
        header[14] = SILVER
        header[17] = BRONZE

        return header

    }

    const vestaRequest = [
        getVestaHeader(),
        countryStandings[0].toVestaCodes(),
        countryStandings[1].toVestaCodes(),
        countryStandings[2].toVestaCodes(),
        countryStandings[3].toVestaCodes(),
        countryStandings[4].toVestaCodes(),
    ]

    console.log(vestaRequest)

})()


