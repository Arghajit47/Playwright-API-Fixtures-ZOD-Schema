import { Page, expect } from "@playwright/test";

export default class InitializationPage {
  pageObjects: any;
  page: Page;
  constructor(page: Page) {
    this.page = page;
  }

  async goto(url: string) {
    await this.page.goto(url);
  }
  async expectHaveURL(value: string) {
    await expect(this.page).toHaveURL(new RegExp(`.*${value}.*`));
  }

  async reload() {
    await this.page.reload({ waitUntil: "domcontentloaded" });
  }

  async closePage() {
    await this.page.close();
  }
  async initialize(session: string, host: string) {
    await this.page.context().addCookies([
      {
        name: "blaize_session",
        value: `${session}`,
        path: "/",
        domain: process.env.ENV === "prod" ? `www.${host}` : `${host}`,
      },
      {
        name: "blaize_prev_anon_session",
        value: `${session}`,
        path: "/",
        domain: process.env.ENV === "prod" ? `www.${host}` : `${host}`,
      },
    ]);
  }

  async clickOnElement(locator: any, index: any = 0) {
    await this.page.waitForLoadState("domcontentloaded");
    const element = this.page.locator(locator).nth(index);
    await element.waitFor({ state: "visible", timeout: 5000 });
    await element.click({ force: true });
  }

  async clickOnTextElementWithIndex(locator: string, text: string, index = 0) {
    await this.page.waitForLoadState("domcontentloaded");
    await this.page
      .locator(locator)
      .filter({ hasText: text })
      .nth(index)
      .click({ force: true });
  }
  async expectText(
    selector: string,
    expectedValue: string,
    index = 0,
    page: any = this.page
  ) {
    const text = await this.getTextContents(selector, index, page);
    expect((text ?? "").trim()).toBe(expectedValue);
  }
  async expectTextContains(selector: string, expectedValue: string, index = 0) {
    const text = await this.getTextContents(selector, index);
    expect(text?.trim()).toContain(expectedValue);
  }

  async expectVisible(selector: string, index = 0, page: any = this.page) {
    const ele = await page.locator(selector).nth(index);
    await expect(ele).toBeVisible();
  }
  async expectEnable(selector: string, index = 0) {
    const ele = await this.page.locator(selector).nth(index);
    await this.expectVisible(selector, index);
    await expect(ele).toBeEnabled();
  }
  async expectNotVisible(selector: string, index = 0) {
    const ele = await this.page.locator(selector).nth(index);
    await expect(ele).not.toBeVisible();
  }
  async expectAttribute(
    selector: string,
    attributeName: string,
    attributevalue: string,
    index = 0
  ) {
    const ele = await this.page.locator(selector).nth(index);
    await expect(ele).toHaveAttribute(attributeName, attributevalue);
  }
  async expectAttributeContains(
    selector: any,
    attributeName: any,
    attributevalue: string,
    index = 0
  ) {
    const ele = this.page.locator(selector).nth(index);
    const actualValue = await ele.getAttribute(attributeName);
    expect(actualValue).toContain(attributevalue);
  }
  async getTextContents(locator: string, index = 0, page = this.page) {
    return await page.locator(locator).nth(index).textContent();
  }
  async domcontentloaded() {
    await this.page.waitForLoadState("domcontentloaded");
  }

  async waitForPageLoad(string = "", page = this.page) {
    await this.domcontentloaded();
    await page.waitForLoadState("networkidle");
    await page.waitForLoadState("load");
    switch (string) {
      case "max":
        await page.waitForTimeout(17000);
        break;
      case "min":
        await page.waitForTimeout(3600);
        break;
      case "":
        await page.waitForTimeout(9000);
        break;
      default:
        break;
    }
  }
  async waitOnlyForPageLoad(page = this.page) {
    await this.domcontentloaded();
    await page.waitForLoadState("networkidle");
    await page.waitForLoadState("load");
  }
  async getElementsCount(locator: string) {
    return await this.page.locator(locator).count();
  }

  async validateElementsCount(locator: string, length: number) {
    const count = await this.getElementsCount(locator);
    await expect(count).toBe(length);
  }

  async captureResponseWhenPageLoad(
    step: any,
    requestUrl: string,
    secondRequestUrl?: string
  ) {
    // Promise for the first API response
    const firstResponsePromise = this.page.waitForResponse(
      (response) =>
        response.url().includes(requestUrl) && response.status() === 200
    );

    // Promise for the second API response (optional)
    let secondResponsePromise: Promise<any> | null = null;
    if (secondRequestUrl) {
      secondResponsePromise = this.page.waitForResponse(
        (response) =>
          response.url().includes(secondRequestUrl) && response.status() === 200
      );
    }

    // Execute the step (page navigation) concurrently with the API wait
    await step;

    // Wait for the first response
    const firstResponse = await firstResponsePromise;
    let firstResponseData = null;
    try {
      firstResponseData = await firstResponse.json();
    } catch (error) {
      console.log(firstResponse);
      console.error(
        `Failed to parse first API response: ${(error as Error).message}`
      );
    }

    // Wait for the second response if provided
    let secondResponseData = null;
    if (secondResponsePromise) {
      const secondResponse = await secondResponsePromise;
      try {
        secondResponseData = await secondResponse.json();
      } catch (error) {
        console.log(secondResponse);
        console.error(
          `Failed to parse second API response: ${(error as Error).message}`
        );
      }
    }

    // Return both responses
    return {
      firstResponse: firstResponseData,
      secondResponse: secondResponseData,
    };
  }

  async expectVisibleAllElements(selector: string) {
    const elementList = await this.page.$$(selector);
    for (const element of elementList) {
      expect(await element.isVisible()).toBe(true);
    }
  }
  async expectTextAllElements(selector: string, expectedText: string) {
    const elementList = await this.page.$$(selector);

    for (const element of elementList) {
      const actualText = await element.textContent();
      expect(actualText?.trim()).toBe(expectedText);
    }
  }

  async fillDataByLocator(locator: string, index = 0, data: string) {
    await this.page.locator(locator).nth(index).fill(data);
  }
  async typeOnElement(locator: string, text: string, timeout = 0) {
    await this.page.locator(locator).clear();
    await this.page.locator(locator).type(text, { delay: timeout });
  }
  async clearTxtBox(locator: string) {
    await this.page.locator(locator).clear();
  }
  async getCountOfElements(locator: string) {
    return await this.page.locator(locator).count();
  }
  async expectCount(locator: string, number: number) {
    await expect(this.page.locator(locator)).toHaveCount(number);
  }
  async expectCountGreaterThan(locator: string, number: number) {
    expect(number).toBeGreaterThan(await this.getElementsCount(locator));
  }
  async getTextContentOfAllElements(locator: string) {
    const dropdownOptions = await this.page.$$eval(locator, (options) =>
      options.map((option) => option.textContent?.trim() || "")
    );
    return dropdownOptions;
  }
  async expectEqual(expected: any, actual: any) {
    return expect.soft(actual).toStrictEqual(expected);
  }
  async validateTextsBasedOnEnums(
    selectors: string,
    enumNames: Record<string, string>,
    page = this.page
  ) {
    // Fetch all labels once
    await page.waitForSelector(selectors, { timeout: 5000 });
    const labels = await page.locator(selectors).allTextContents();
    const labelSet = new Set(labels);
    for (const [key, expectedText] of Object.entries(enumNames)) {
      if (typeof expectedText === "string" && !labelSet.has(expectedText)) {
        throw new Error(
          `Validation failed for "${key}". Expected text: "${expectedText}" not found. Available labels: ${[
            ...labelSet,
          ].join(", ")}`
        );
      }
    }
  }
  async verifyNotSelected(selector: string) {
    const isSelected = await this.page.locator(selector);
    expect(isSelected).not.toBeChecked();
  }

  async verifySelected(selector: string, index = 0) {
    const isSelected = await this.page.locator(selector).nth(index);
    expect(isSelected).toBeChecked();
  }

  async sendFilesToBrowser(locator: string, path: string) {
    await this.page.waitForSelector(locator, { state: "visible" });
    await this.page.locator(locator).setInputFiles(path);
  }

  async isElementVisible(locator: string, index = 0, page = this.page) {
    return await page.locator(locator).nth(index).isVisible({ timeout: 12000 });
  }
  async isElementHidden(locator: string, index = 0, page = this.page) {
    return await page.locator(locator).nth(index).isHidden({ timeout: 12000 });
  }
  async verifyNewWindow(buttonLocator: string, buttonIndex = 0) {
    // Listen for a new page (popup window/tab)
    const [newPage] = await Promise.all([
      this.page.waitForEvent("popup"),
      this.page.locator(buttonLocator).nth(buttonIndex).click(),
    ]);

    await newPage.waitForLoadState(); // Ensure the new page loads

    // Return the new page context
    return newPage;
  }
  async isAlertDisplayed() {
    let alertTriggered = false;
    try {
      const alert = await this.page
        .waitForEvent("dialog", { timeout: 3000 })
        .catch(() => null);

      if (alert) {
        console.log(`🚨 Alert Triggered: ${alert.message()}`);
        console.log(`Dialog type: ${alert.type()}`);
        alertTriggered = true;
        await alert.dismiss();
      } else {
        console.log(`✅ No Alert Triggered`);
      }
    } catch (e) {
      console.error(`Error handling Alert`, e);
    }
    return alertTriggered;
  }

  async pageScroll() {
    await this.page.evaluate(() => {
      window.scrollBy(0, window.innerHeight);
    });
    await this.waitOnlyForPageLoad();
  }

  async clearNetworkLogs() {
    await this.page.unrouteAll();
  }
}
