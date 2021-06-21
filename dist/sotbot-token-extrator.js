"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_1 = __importDefault(require("puppeteer"));
const process_1 = __importDefault(require("process"));
process_1.default.on('SIGINT', () => {
    console.warn('\nGracefully shutting down from SIGINT (Ctrl-C)');
    process_1.default.exit(1);
});
let loginUser = process_1.default.env.MS_USER;
let loginPass = process_1.default.env.MS_PASS;
let isDev = process_1.default.env.IS_DEV;
let reqTimeout = 10000;
const pupLaunchOptions = {
    headless: true,
    devtools: false,
    defaultViewport: {
        width: 640,
        height: 480
    },
    args: ['--disable-gpu'],
};
if (typeof (isDev) === 'undefined') {
    pupLaunchOptions.executablePath = '/usr/bin/chromium-browser';
}
if (typeof (loginUser) === 'undefined' || typeof (loginPass) === 'undefined') {
    console.error("MS_USER and MS_PASS environment variables are required.");
    process_1.default.exit(1);
}
async function main(u, p) {
    const browserObj = await puppeteer_1.default.launch(pupLaunchOptions).catch(errorMsg => {
        console.error(`Unable to start Browser: ${errorMsg}`);
        process_1.default.exit(1);
    });
    const browserCtx = await browserObj.createIncognitoBrowserContext();
    const pageObj = await browserCtx.newPage();
    await pageObj.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Safari/537.36');
    pageObj.on('error', errorObj => {
        console.error(`An error occured: ${errorObj.message}`);
        process_1.default.exit(1);
    });
    pageObj.on('requestfailed', failObj => {
        console.warn(`A requrst to ${failObj.url()} failed: ${failObj.failure().errorText}`);
    });
    console.log("Loading www.seaofthieves.com/login page...");
    const httpResponse = await pageObj.goto('https://www.seaofthieves.com/login', { waitUntil: 'networkidle2' }).catch(errorMsg => {
        console.error(`An error occured during "Page Goto" => ${errorMsg}`);
    });
    if (!httpResponse) {
        console.error("No HTTP response returned by server. Aborting");
        process_1.default.exit(1);
    }
    if (!httpResponse.url().startsWith('https://login.live.com/')) {
        console.error("HTTP response did not redirect to Microsoft login page. Aborting.");
        await browserObj.close();
        process_1.default.exit(1);
    }
    console.log("Waiting for username field...");
    await pageObj.waitForSelector('input[name=loginfmt]', { timeout: reqTimeout });
    await pageObj.$eval('input[name=loginfmt]', (el, u) => {
        let userNameField = el;
        userNameField.value = u;
    }, u);
    await pageObj.click('input[id=idSIButton9]');
    console.log("Waiting for next page...");
    await pageObj.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log("Waiting for password field...");
    await pageObj.waitForSelector('input[name=passwd]', { timeout: reqTimeout });
    await pageObj.$eval('input[name=passwd]', (el, p) => {
        let passwordField = el;
        passwordField.value = p;
    }, p);
    await pageObj.click('input[id=idSIButton9]');
    console.log("Waiting for redirect to SoT website...");
    await pageObj.waitForNavigation({ waitUntil: 'networkidle2', timeout: reqTimeout });
    if (pageObj.url() !== 'https://www.seaofthieves.com/') {
        console.error("Not redirected to SoT. Login failed.");
        await browserObj.close();
        process_1.default.exit(1);
    }
    let cookieObj = await pageObj.cookies();
    let cookieFound = false;
    for (const cookie of cookieObj) {
        if (cookie.name === 'rat') {
            cookieFound = true;
            let responseCookie = {
                Value: cookie.value,
                Expiration: Math.floor(cookie.expires)
            };
            let cookieJSON = JSON.stringify(responseCookie);
            let cookieJSONBuf = Buffer.from(cookieJSON, "utf8");
            let cookieBase64 = cookieJSONBuf.toString('base64');
            console.log(`Your RAT cookie string: ${cookieBase64}`);
            await browserObj.close();
            process_1.default.exit(0);
        }
    }
    if (!cookieFound) {
        console.error("RAT Cookie not found on website. Aborting.");
        await browserObj.close();
        process_1.default.exit(1);
    }
}
main(loginUser, loginPass);
