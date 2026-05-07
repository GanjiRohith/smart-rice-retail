from playwright.sync_api import sync_playwright


class BrowserController:

    def __init__(self):

        self.playwright = sync_playwright().start()

        self.browser = self.playwright.chromium.launch(
            headless=False
        )

        self.page = self.browser.new_page()

        # =========================
    # OPEN URL
    # =========================

    def open(
        self,
        url
    ):

        self.page.goto(
            url,
            wait_until="domcontentloaded",
            timeout=120000
        )

        return f"Opened {url}"

        # =========================
    # CLICK
    # =========================

    def click(self, selector):

        try:

            # Try normal CSS selector first
            self.page.click(selector)

            return f"Clicked {selector}"

        except:

            try:

                # Try button text
                self.page.get_by_text(
                    selector,
                    exact=False
                ).click()

                return f"Clicked text: {selector}"

            except:

                try:

                    # Try role button
                    self.page.get_by_role(
                        "button",
                        name=selector
                    ).click()

                    return f"Clicked button: {selector}"

                except Exception as e:

                    raise Exception(
                        f"Could not click '{selector}': {str(e)}"
                    )

        # =========================
    # TYPE
    # =========================

    def type(
        self,
        selector,
        text
    ):

        try:

            # CSS selector
            self.page.fill(
                selector,
                text
            )

            return f"Typed into {selector}"

        except:

            try:

                # Placeholder support
                self.page.get_by_placeholder(
                    selector
                ).fill(text)

                return f"Typed into placeholder {selector}"

            except Exception as e:

                raise Exception(
                    f"Could not type into '{selector}': {str(e)}"
                )
    # =========================
    # GET PAGE TEXT
    # =========================

    def get_page_text(self):

        return self.page.locator("body").inner_text()

    # =========================
    # SCREENSHOT
    # =========================

    def screenshot(self):

        path = "operator_screen.png"

        self.page.screenshot(path=path)

        return path
    

        # =========================
    # GET INTERACTIVE ELEMENTS
    # =========================

    def get_interactive_elements(self):

        elements = self.page.locator(
            "input, button, a, select"
        ).all()

        results = []

        for e in elements[:50]:

            try:

                tag = e.evaluate(
                    "(el) => el.tagName"
                )

                text = e.inner_text()

                placeholder = e.get_attribute(
                    "placeholder"
                )

                name = e.get_attribute(
                    "name"
                )

                results.append({
                    "tag": tag,
                    "text": text,
                    "placeholder": placeholder,
                    "name": name
                })

            except:

                pass

        return results

    # =========================
    # CLOSE
    # =========================

    def close(self):

        self.browser.close()

        self.playwright.stop()