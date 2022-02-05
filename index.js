const puppeteer = require("puppeteer/lib/cjs/puppeteer/node-puppeteer-core").default;

(async function () {

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



    const content = await page.$eval('tbody', ele => Array.prototype.slice.call(ele.children,0).map((row) => {

        const data = Array.prototype.slice.call(row.children,0)

        function cellToMedalCount(cell) {
            if(!cell.firstElementChild) {
                return cell.textContent.replaceAll('\n', '')
            }

            return cell.firstElementChild?.textContent.replaceAll('\n', '')
        }

        return {
            country: data[1].getAttribute('data-text'),
            goldMedalCount: cellToMedalCount(data[2]),
            silverMedalCount: cellToMedalCount(data[3]),
            bronzeMedalCount: cellToMedalCount(data[4]),
            total: cellToMedalCount(data[5]),
        }

    }))

    console.log(content)

})()


