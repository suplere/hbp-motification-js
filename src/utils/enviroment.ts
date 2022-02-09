import Bowser from "bowser";
import { Browser, EnvironmentInfo } from "./types";
import { parseVersionString } from "./utils";

export class EnvironmentInfoHelper {
  public static getEnvironmentInfo(): EnvironmentInfo {
    const browser = Bowser.getParser(window.navigator.userAgent);

    return {
      browserType: this.getBrowser(browser),
      browserVersion: this.getBrowserVersion(browser),
      isHttps: this.isHttps(),
      isBrowserAndSupportsServiceWorkers: this.supportsServiceWorkers(),
      requiresUserInteraction: this.requiresUserInteraction(browser),
      osName: browser.getOSName(),
      osVersion: browser.getOSVersion(),
      canTalkToServiceWorker: this.canTalkToServiceWorker(),
    };
  }

  private static getBrowserVersion(browser: Bowser.Parser.Parser): number {
    return parseVersionString(browser.getBrowserVersion());
  }

  private static getBrowser(browser: Bowser.Parser.Parser): Browser {
    if (browser.isBrowser("chrome", true)) {
      return Browser.Chrome;
    }
    if (browser.isBrowser("msedge", true)) {
      return Browser.Edge;
    }
    if (browser.isBrowser("opera", true)) {
      return Browser.Opera;
    }
    if (browser.isBrowser("firefox", true)) {
      return Browser.Firefox;
    }
    // use existing safari detection to be consistent
    if (browser.isBrowser("safari", true)) {
      return Browser.Safari;
    }
    return Browser.Other;
  }

  private static isHttps(): boolean {
    return window
      ? window.location && window.location.protocol === "https:"
      : false;
  }

  private static supportsServiceWorkers(): boolean {
    return window.navigator && "serviceWorker" in window.navigator;
  }

  private static requiresUserInteraction(
    browser: Bowser.Parser.Parser
  ): boolean {
    // Firefox 72+ requires user-interaction
    if (
      this.getBrowser(browser) === "firefox" &&
      this.getBrowserVersion(browser) >= 72
    ) {
      return true;
    }

    // Safari 12.1+ requires user-interaction
    if (
      this.getBrowser(browser) === "safari" &&
      this.getBrowserVersion(browser) >= 12.1
    ) {
      return true;
    }

    return false;
  }

  private static canTalkToServiceWorker(): boolean {
    return !!window.isSecureContext;
  }
}
