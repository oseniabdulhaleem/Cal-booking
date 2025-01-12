import express, { Request, Response } from "express";
import puppeteer from "puppeteer";

interface BookingRequest {
  calLink: string;
  name: string;
  email: string;
}

interface BookingResponse {
  success: boolean;
  message: string;
  hostEmail: string | null;
}

async function bookAndCancelMeeting(
  calLink: string,
  name: string,
  email: string
): Promise<BookingResponse> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: null,
  });

  const page = await browser.newPage();

  try {
    console.log("Navigating to page...");

    await page.goto(calLink, {
      waitUntil: "networkidle0",
      timeout: 15000,
    });

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Refresh the page
    console.log("Refreshing page...");
    await page.reload({
      waitUntil: "networkidle0",
      timeout: 25000,
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("Page loaded, checking if calendar is visible...");

    try {
      await page.waitForSelector('button[data-testid="day"]', {
        visible: true,
        timeout: 15000,
      });
      console.log("Calendar found!");
    } catch (error) {
      console.log("Current URL:", page.url());
      console.log("Taking error screenshot...");
      await page.screenshot({ path: "calendar-error.png" });
      throw error;
    }

    const dayButtons = await page.$$('button[data-testid="day"]');
    console.log(`Found ${dayButtons.length} day buttons`);

    console.log("Selecting date...");
    await page.evaluate(() => {
      const dateButtons = [
        ...document.querySelectorAll('button[data-testid="day"]'),
      ] as HTMLButtonElement[];
      console.log(`Found ${dateButtons.length} date buttons in evaluate`);
      const firstAvailable = dateButtons.find(
        (button) => button.getAttribute("data-disabled") === "false"
      );
      if (firstAvailable) {
        console.log("Found available date, clicking...");
        firstAvailable.click();
      } else {
        console.log("No available dates found");
        throw new Error("No available dates found");
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("Selecting time slot...");
    await page.waitForSelector('button[data-testid="time"]', {
      visible: true,
      timeout: 15000,
    });

    await page.evaluate(() => {
      const timeSlots = [
        ...document.querySelectorAll('button[data-testid="time"]'),
      ] as HTMLButtonElement[];
      console.log(`Found ${timeSlots.length} time slots`);
      const firstAvailable = timeSlots.find(
        (slot) => slot.getAttribute("data-disabled") === "false"
      );
      if (firstAvailable) {
        console.log("Found available time slot, clicking...");
        firstAvailable.click();
      } else {
        console.log("No available time slots found");
        throw new Error("No available time slots found");
      }
    });

    console.log("Waiting for booking form...");
    await page.waitForSelector('input[name="name"][required]', {
      visible: true,
      timeout: 15000,
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Fill booking details with human-like delays
    console.log("Filling booking details...");

    // Wait for and fill name input using type with human-like speed
    await page.waitForSelector('input[name="name"][required]', {
      visible: true,
    });
    await page.click('input[name="name"][required]');
    // Type name with random delays between keystrokes
    for (const char of name) {
      await page.keyboard.type(char);
      await new Promise((resolve) =>
        setTimeout(resolve, Math.random() * 200 + 100)
      );
    }

    // Small pause before moving to email
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Wait for and fill email input using type
    await page.waitForSelector('input[name="email"]', { visible: true });
    await page.click('input[name="email"]');
    // Type email with random delays
    for (const char of email) {
      await page.keyboard.type(char);
      await new Promise((resolve) =>
        setTimeout(resolve, Math.random() * 150 + 50)
      );
    }

    // Verify the inputs
    const nameValue = await page.$eval(
      'input[name="name"][required]',
      (el) => (el as HTMLInputElement).value
    );
    const emailValue = await page.$eval(
      'input[name="email"]',
      (el) => (el as HTMLInputElement).value
    );
    console.log("Form values before submission:", {
      name: nameValue,
      email: emailValue,
    });

    // Ensure form is valid before clicking confirm
    if (!nameValue || !emailValue) {
      throw new Error("Form values not properly set");
    }

    // Human-like pause before clicking confirm
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Click confirm button and wait for navigation
    console.log("Clicking confirm button...");
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0", timeout: 30000 }),
      page.click('button[data-testid="confirm-book-button"]'),
    ]);

    // Wait for the new page to load and check its content
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Extract the host's email
    const hostEmail = await page.evaluate(() => {
      const hostNameElement = document.querySelector(
        '[data-testid="booking-host-name"]'
      );
      if (hostNameElement) {
        // Get the parent div and then find the p element containing email
        const emailElement = hostNameElement
          .closest(".mb-3")
          ?.querySelector("p.text-default");
        return emailElement?.textContent || "";
      }
      return "";
    });

    console.log("Booking confirmed for email:", hostEmail);

    console.log("Booking Confirmed!!!");
    await new Promise((resolve) => setTimeout(resolve, 15000));

    await page.waitForSelector('button[data-testid="cancel"]', {
      visible: true,
      timeout: 10000,
    });
    await page.click('button[data-testid="cancel"]');

    await page.waitForSelector('textarea[data-testid="cancel_reason"]', {
      visible: true,
      timeout: 10000,
    });
    await page.type(
      'textarea[data-testid="cancel_reason"]',
      "Dao is a good friend"
    );

    console.log("About to cancel meeting");
    await page.waitForSelector('button[data-testid="confirm_cancel"]', {
      visible: true,
      timeout: 10000,
    });
    await page.click('button[data-testid="confirm_cancel"]');

    await new Promise((resolve) => setTimeout(resolve, 13000));
    // await page.screenshot({ path: "cancellation-confirmed.png" });

    return {
      success: true,
      message: "Meeting booked and cancelled successfully",
      hostEmail: hostEmail,
    };
  } catch (error) {
    console.error("Operation failed:", error);
    if (page) {
      // await page.screenshot({ path: "error-screenshot.png" });
      console.log("Error screenshot saved as error-screenshot.png");
    }
    throw error;
  } finally {
    await browser.close();
  }
}

const app = express();

// Configure Express
app.set("view engine", "pug");
app.set("views", "./views");
app.use(express.json());

// Root route renders the Pug template
app.get("/", (req: Request, res: Response) => {
  res.render("index");
});

app.post("/book-and-cancel", async (req: Request, res: Response) => {
  console.log("Route called");
  try {
    const { calLink, name, email } = req.body as BookingRequest;
    const result = await bookAndCancelMeeting(calLink, name, email);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
