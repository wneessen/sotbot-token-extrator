// SoTBot Token Extractor
// (C) 2021 by Winni Neessen <wn@neessen.net>
import Puppeteer from 'puppeteer'
import process, {exit} from 'process'

interface CookieResponse {
    Value: string
    Expiration: number
}

// Signal handler
process.on('SIGINT', () => {
    console.warn('\nGracefully shutting down from SIGINT (Ctrl-C)');
    process.exit(1);
})

// Read environment variables
let loginUser = process.env.MS_USER
let loginPass = process.env.MS_PASS
let isDev = process.env.IS_DEV

// Some defaults
let reqTimeout = 10000

// Some constant variables
const pupLaunchOptions: Puppeteer.LaunchOptions = {
    headless: true,
    devtools: false,
    defaultViewport: {
        width: 640,
        height: 480
    },
    args: ['--disable-gpu'],
}
if (typeof(isDev) === 'undefined') {
    pupLaunchOptions.executablePath = '/usr/bin/chromium-browser'
}

// We need username and password
if(typeof (loginUser) === 'undefined' || typeof (loginPass) === 'undefined') {
    console.error("MS_USER and MS_PASS environment variables are required.")
    process.exit(1)
}

/**
 * The main server loop
 *
 * @returns {Promise<void>}
 * @memberof WebsiteBench
 */
async function main(u: string, p: string): Promise<void> {
    // Initialize browser
    const browserObj = await Puppeteer.launch(pupLaunchOptions).catch(errorMsg => {
        console.error(`Unable to start Browser: ${errorMsg}`)
        process.exit(1)
    })
    const browserCtx = await browserObj.createIncognitoBrowserContext()
    const pageObj = await browserCtx.newPage()
    await pageObj.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Safari/537.36')
    pageObj.on('error', errorObj => {
        console.error(`An error occured: ${errorObj.message}`)
        process.exit(1)
    })
    pageObj.on('requestfailed', failObj => {
        console.warn(`A requrst to ${failObj.url()} failed: ${failObj.failure().errorText}`)
    })

    // Open and process page
    console.log("Loading www.seaofthieves.com/login page...")
    const httpResponse = await pageObj.goto(
        'https://www.seaofthieves.com/login',
        {waitUntil: 'networkidle2'}
    ).catch(errorMsg => {
        console.error(`An error occured during "Page Goto" => ${errorMsg}`)
    });
    if(!httpResponse) {
        console.error("No HTTP response returned by server. Aborting")
        process.exit(1)
    }
    if(!httpResponse.url().startsWith('https://login.live.com/')) {
        console.error("HTTP response did not redirect to Microsoft login page. Aborting.")
        await browserObj.close()
        process.exit(1)
    }

    // Fill in username
    console.log("Waiting for username field...")
    await pageObj.waitForSelector('input[name=loginfmt]', {timeout: reqTimeout})
    await pageObj.$eval('input[name=loginfmt]', (el, u) => {
            let userNameField = el as HTMLInputElement
            userNameField.value = u
        }, u
    )
    await pageObj.click('input[id=idSIButton9]')
    console.log("Waiting for next page...")
    await pageObj.waitForNavigation({waitUntil: 'networkidle0'});

    // Fill in password
    console.log("Waiting for password field...")
    await pageObj.waitForSelector('input[name=passwd]', {timeout: reqTimeout})
    await pageObj.$eval('input[name=passwd]', (el, p) => {
            let passwordField = el as HTMLInputElement
            passwordField.value = p
        }, p
    )
    await pageObj.click('input[id=idSIButton9]')
    console.log("Waiting for redirect to SoT website...")
    await pageObj.waitForNavigation({waitUntil: 'networkidle2', timeout: reqTimeout})
    if (pageObj.url() !== 'https://www.seaofthieves.com/') {
        console.error("Not redirected to SoT. Login failed.")
        await browserObj.close()
        process.exit(1)
    }

    let cookieObj = await pageObj.cookies()
    let cookieFound = false
    for(const cookie of cookieObj) {
        if (cookie.name === 'rat') {
            cookieFound = true
            let responseCookie: CookieResponse = {
                Value: cookie.value,
                Expiration: Math.floor(cookie.expires)
            }
            let cookieJSON = JSON.stringify(responseCookie)
            let cookieJSONBuf = Buffer.from(cookieJSON, "utf8");
            let cookieBase64 = cookieJSONBuf.toString('base64')
            console.log(`Your RAT cookie string: ${cookieBase64}`)
            await browserObj.close()
            process.exit(0)
        }
    }
    if (!cookieFound) {
        console.error("RAT Cookie not found on website. Aborting.")
        await browserObj.close()
        process.exit(1)
    }
}


main(loginUser, loginPass);