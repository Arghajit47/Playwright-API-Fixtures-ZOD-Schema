/**
 * Playwright test suite for the TodoMVC application.
 * Tests cover adding, editing, completing, and filtering todo items,
 * as well as persistence and routing behaviors.
 */

import { test, expect, type Page } from "@playwright/test";
import InitializationPage from "../helpers/page";

/** Shared instance of the initialization helper for all tests. */
let initializationPage: InitializationPage;

test.beforeEach(async ({ page }) => {
  initializationPage = new InitializationPage(page);
  const { firstResponse: responseBody } =
    await initializationPage.captureResponseWhenPageLoad(
      initializationPage.goto("https://demo.playwright.dev/todomvc"),
      "/todomvc/"
    );
  console.log(responseBody);
});

/** Default set of todo item titles used across tests. */
const TODO_ITEMS = [
  "buy some cheese",
  "feed the cat",
  "book a doctors appointment",
];

test.describe("New Todo", () => {
  /**
   * Test: Adding new todo items.
   * Validates that items can be added and appear in the list.
   */
  test(
    "should allow me to add todo items",
    { tag: "@UI" },
    async ({ page }) => {
      // create a new todo locator
      const newTodo = page.getByPlaceholder("What needs to be done?");

      // Create 1st todo.
      await newTodo.fill(TODO_ITEMS[0]);
      await newTodo.press("Enter");

      // Make sure the list only has one todo item.
      await expect(page.getByTestId("todo-title")).toHaveText([TODO_ITEMS[0]]);

      // Create 2nd todo.
      await newTodo.fill(TODO_ITEMS[1]);
      await newTodo.press("Enter");

      // Make sure the list now has two todo items.
      await expect(page.getByTestId("todo-title")).toHaveText([
        TODO_ITEMS[0],
        TODO_ITEMS[1],
      ]);

      await checkNumberOfTodosInLocalStorage(page, 2);
    }
  );

  /**
   * Test: Input field clears after adding an item.
   * Ensures the text input is empty following item creation.
   */
  test(
    "should clear text input field when an item is added",
    { tag: "@UI" },
    async ({ page }) => {
      // create a new todo locator
      const newTodo = page.getByPlaceholder("What needs to be done?");

      // Create one todo item.
      await newTodo.fill(TODO_ITEMS[0]);
      await newTodo.press("Enter");

      // Check that input is empty.
      await expect(newTodo).toBeEmpty();
      await checkNumberOfTodosInLocalStorage(page, 1);
    }
  );

  /**
   * Test: New items append to the bottom of the list.
   * Verifies ordering and count visibility.
   */
  test(
    "should append new items to the bottom of the list",
    { tag: "@UI" },
    async ({ page }) => {
      // Create 3 items.
      await createDefaultTodos(page);

      // create a todo count locator
      const todoCount = page.getByTestId("todo-count");

      // Check test using different methods.
      await expect(page.getByText("3 items left")).toBeVisible();
      await expect(todoCount).toHaveText("3 items left");
      await expect(todoCount).toContainText("3");
      await expect(todoCount).toHaveText(/3/);

      // Check all items in one call.
      await expect(page.getByTestId("todo-title")).toHaveText(TODO_ITEMS);
      await checkNumberOfTodosInLocalStorage(page, 3);
    }
  );
});

test.describe("Mark all as completed", () => {
  test.beforeEach(async ({ page }) => {
    await createDefaultTodos(page);
    await checkNumberOfTodosInLocalStorage(page, 3);
  });

  test.afterEach(async ({ page }) => {
    await checkNumberOfTodosInLocalStorage(page, 3);
  });

  /**
   * Test: Mark all items as completed.
   * Confirms bulk completion toggles all items.
   */
  test(
    "should allow me to mark all items as completed",
    { tag: "@UI" },
    async ({ page }) => {
      // Complete all todos.
      await page.getByLabel("Mark all as complete").check();

      // Ensure all todos have 'completed' class.
      await expect(page.getByTestId("todo-item")).toHaveClass([
        "completed",
        "completed",
        "completed",
      ]);
      await checkNumberOfCompletedTodosInLocalStorage(page, 3);
    }
  );

  /**
   * Test: Clear complete state of all items.
   * Validates unchecking the master toggle removes completion.
   */
  test(
    "should allow me to clear the complete state of all items",
    { tag: "@UI" },
    async ({ page }) => {
      const toggleAll = page.getByLabel("Mark all as complete");
      // Check and then immediately uncheck.
      await toggleAll.check();
      await toggleAll.uncheck();

      // Should be no completed classes.
      await expect(page.getByTestId("todo-item")).toHaveClass(["", "", ""]);
    }
  );

  /**
   * Test: Master checkbox updates when individual items change.
   * Ensures toggle-all reflects mixed states.
   */
  test(
    "complete all checkbox should update state when items are completed / cleared",
    { tag: "@UI" },
    async ({ page }) => {
      const toggleAll = page.getByLabel("Mark all as complete");
      await toggleAll.check();
      await expect(toggleAll).toBeChecked();
      await checkNumberOfCompletedTodosInLocalStorage(page, 3);

      // Uncheck first todo.
      const firstTodo = page.getByTestId("todo-item").nth(0);
      await firstTodo.getByRole("checkbox").uncheck();

      // Reuse toggleAll locator and make sure its not checked.
      await expect(toggleAll).not.toBeChecked();

      await firstTodo.getByRole("checkbox").check();
      await checkNumberOfCompletedTodosInLocalStorage(page, 3);

      // Assert the toggle all is checked again.
      await expect(toggleAll).toBeChecked();
    }
  );
});

test.describe("Item", () => {
  /**
   * Test: Mark individual items as complete.
   * Checks single-item completion state.
   */
  test(
    "should allow me to mark items as complete",
    { tag: "@UI" },
    async ({ page }) => {
      // create a new todo locator
      const newTodo = page.getByPlaceholder("What needs to be done?");

      // Create two items.
      for (const item of TODO_ITEMS.slice(0, 2)) {
        await newTodo.fill(item);
        await newTodo.press("Enter");
      }

      // Check first item.
      const firstTodo = page.getByTestId("todo-item").nth(0);
      await firstTodo.getByRole("checkbox").check();
      await expect(firstTodo).toHaveClass("completed");

      // Check second item.
      const secondTodo = page.getByTestId("todo-item").nth(1);
      await expect(secondTodo).not.toHaveClass("completed");
      await secondTodo.getByRole("checkbox").check();

      // Assert completed class.
      await expect(firstTodo).toHaveClass("completed");
      await expect(secondTodo).toHaveClass("completed");
    }
  );

  /**
   * Test: Un-mark items as complete.
   * Validates toggling completion off.
   */
  test(
    "should allow me to un-mark items as complete",
    { tag: "@UI" },
    async ({ page }) => {
      // create a new todo locator
      const newTodo = page.getByPlaceholder("What needs to be done?");

      // Create two items.
      for (const item of TODO_ITEMS.slice(0, 2)) {
        await newTodo.fill(item);
        await newTodo.press("Enter");
      }

      const firstTodo = page.getByTestId("todo-item").nth(0);
      const secondTodo = page.getByTestId("todo-item").nth(1);
      const firstTodoCheckbox = firstTodo.getByRole("checkbox");

      await firstTodoCheckbox.check();
      await expect(firstTodo).toHaveClass("completed");
      await expect(secondTodo).not.toHaveClass("completed");
      await checkNumberOfCompletedTodosInLocalStorage(page, 1);

      await firstTodoCheckbox.uncheck();
      await expect(firstTodo).not.toHaveClass("completed");
      await expect(secondTodo).not.toHaveClass("completed");
      await checkNumberOfCompletedTodosInLocalStorage(page, 0);
    }
  );

  /**
   * Test: Edit an existing item.
   * Confirms inline editing updates text.
   */
  test("should allow me to edit an item", { tag: "@UI" }, async ({ page }) => {
    await createDefaultTodos(page);

    const todoItems = page.getByTestId("todo-item");
    const secondTodo = todoItems.nth(1);
    await secondTodo.dblclick();
    await expect(secondTodo.getByRole("textbox", { name: "Edit" })).toHaveValue(
      TODO_ITEMS[1]
    );
    await secondTodo
      .getByRole("textbox", { name: "Edit" })
      .fill("buy some sausages");
    await secondTodo.getByRole("textbox", { name: "Edit" }).press("Enter");

    // Explicitly assert the new text value.
    await expect(todoItems).toHaveText([
      TODO_ITEMS[0],
      "buy some sausages",
      TODO_ITEMS[2],
    ]);
    await checkTodosInLocalStorage(page, "buy some sausages");
  });
});

test.describe("Editing", () => {
  test.beforeEach(async ({ page }) => {
    await createDefaultTodos(page);
    await checkNumberOfTodosInLocalStorage(page, 3);
  });

  /**
   * Test: Controls hidden while editing.
   * Ensures UI enters edit mode cleanly.
   */
  test(
    "should hide other controls when editing",
    { tag: "@UI" },
    async ({ page }) => {
      const todoItem = page.getByTestId("todo-item").nth(1);
      await todoItem.dblclick();
      await expect(todoItem.getByRole("checkbox")).not.toBeVisible();
      await expect(
        todoItem.locator("label", {
          hasText: TODO_ITEMS[1],
        })
      ).not.toBeVisible();
      await checkNumberOfTodosInLocalStorage(page, 3);
    }
  );

  /**
   * Test: Save edits on blur.
   * Validates de-focusing triggers save.
   */
  test("should save edits on blur", { tag: "@UI" }, async ({ page }) => {
    const todoItems = page.getByTestId("todo-item");
    await todoItems.nth(1).dblclick();
    await todoItems
      .nth(1)
      .getByRole("textbox", { name: "Edit" })
      .fill("buy some sausages");
    await todoItems
      .nth(1)
      .getByRole("textbox", { name: "Edit" })
      .dispatchEvent("blur");

    await expect(todoItems).toHaveText([
      TODO_ITEMS[0],
      "buy some sausages",
      TODO_ITEMS[2],
    ]);
    await checkTodosInLocalStorage(page, "buy some sausages");
  });

  /**
   * Test: Trim whitespace from edited text.
   * Ensures clean text after editing.
   */
  test("should trim entered text", { tag: "@UI" }, async ({ page }) => {
    const todoItems = page.getByTestId("todo-item");
    await todoItems.nth(1).dblclick();
    await todoItems
      .nth(1)
      .getByRole("textbox", { name: "Edit" })
      .fill("    buy some sausages    ");
    await todoItems
      .nth(1)
      .getByRole("textbox", { name: "Edit" })
      .press("Enter");

    await expect(todoItems).toHaveText([
      TODO_ITEMS[0],
      "buy some sausages",
      TODO_ITEMS[2],
    ]);
    await checkTodosInLocalStorage(page, "buy some sausages");
  });

  /**
   * Test: Remove item if empty text entered.
   * Validates deletion on blank edit submission.
   */
  test(
    "should remove the item if an empty text string was entered",
    { tag: "@UI" },
    async ({ page }) => {
      const todoItems = page.getByTestId("todo-item");
      await todoItems.nth(1).dblclick();
      await todoItems.nth(1).getByRole("textbox", { name: "Edit" }).fill("");
      await todoItems
        .nth(1)
        .getByRole("textbox", { name: "Edit" })
        .press("Enter");

      await expect(todoItems).toHaveText([TODO_ITEMS[0], TODO_ITEMS[2]]);
    }
  );

  /**
   * Test: Cancel edits on Escape.
   * Ensures Escape key reverts changes.
   */
  test("should cancel edits on escape", { tag: "@UI" }, async ({ page }) => {
    const todoItems = page.getByTestId("todo-item");
    await todoItems.nth(1).dblclick();
    await todoItems
      .nth(1)
      .getByRole("textbox", { name: "Edit" })
      .fill("buy some sausages");
    await todoItems
      .nth(1)
      .getByRole("textbox", { name: "Edit" })
      .press("Escape");
    await expect(todoItems).toHaveText(TODO_ITEMS);
  });
});

test.describe("Counter", () => {
  /**
   * Test: Display current number of todo items.
   * Validates counter updates correctly.
   */
  test(
    "should display the current number of todo items",
    { tag: "@UI" },
    async ({ page }) => {
      // create a new todo locator
      const newTodo = page.getByPlaceholder("What needs to be done?");

      // create a todo count locator
      const todoCount = page.getByTestId("todo-count");

      await newTodo.fill(TODO_ITEMS[0]);
      await newTodo.press("Enter");

      await expect(todoCount).toContainText("1");

      await newTodo.fill(TODO_ITEMS[1]);
      await newTodo.press("Enter");
      await expect(todoCount).toContainText("2");

      await checkNumberOfTodosInLocalStorage(page, 2);
    }
  );
});

test.describe("Clear completed button", () => {
  test.beforeEach(async ({ page }) => {
    await createDefaultTodos(page);
  });

  /**
   * Test: Display correct text for clear button.
   * Validates visibility after completing items.
   */
  test("should display the correct text", { tag: "@UI" }, async ({ page }) => {
    await page.locator(".todo-list li .toggle").first().check();
    await expect(
      page.getByRole("button", { name: "Clear completed" })
    ).toBeVisible();
  });

  /**
   * Test: Remove completed items on click.
   * Ensures only active items remain.
   */
  test(
    "should remove completed items when clicked",
    { tag: "@UI" },
    async ({ page }) => {
      const todoItems = page.getByTestId("todo-item");
      await todoItems.nth(1).getByRole("checkbox").check();
      await page.getByRole("button", { name: "Clear completed" }).click();
      await expect(todoItems).toHaveCount(2);
      await expect(todoItems).toHaveText([TODO_ITEMS[0], TODO_ITEMS[2]]);
    }
  );

  /**
   * Test: Hide clear button when no completed items.
   * Validates conditional visibility.
   */
  test(
    "should be hidden when there are no items that are completed",
    { tag: "@UI" },
    async ({ page }) => {
      await page.locator(".todo-list li .toggle").first().check();
      await page.getByRole("button", { name: "Clear completed" }).click();
      await expect(
        page.getByRole("button", { name: "Clear completed" })
      ).toBeHidden();
    }
  );
});

test.describe("Persistence", () => {
  /**
   * Test: Persist data across reloads.
   * Confirms localStorage retains state.
   */
  test("should persist its data", { tag: "@UI" }, async ({ page }) => {
    // create a new todo locator
    const newTodo = page.getByPlaceholder("What needs to be done?");

    for (const item of TODO_ITEMS.slice(0, 2)) {
      await newTodo.fill(item);
      await newTodo.press("Enter");
    }

    const todoItems = page.getByTestId("todo-item");
    const firstTodoCheck = todoItems.nth(0).getByRole("checkbox");
    await firstTodoCheck.check();
    await expect(todoItems).toHaveText([TODO_ITEMS[0], TODO_ITEMS[1]]);
    await expect(firstTodoCheck).toBeChecked();
    await expect(todoItems).toHaveClass(["completed", ""]);

    // Ensure there is 1 completed item.
    await checkNumberOfCompletedTodosInLocalStorage(page, 1);

    // Now reload.
    await page.reload();
    await expect(todoItems).toHaveText([TODO_ITEMS[0], TODO_ITEMS[1]]);
    await expect(firstTodoCheck).toBeChecked();
    await expect(todoItems).toHaveClass(["completed", ""]);
  });
});

test.describe("Routing", () => {
  test.beforeEach(async ({ page }) => {
    await createDefaultTodos(page);
    // make sure the app had a chance to save updated todos in storage
    // before navigating to a new view, otherwise the items can get lost :(
    // in some frameworks like Durandal
    await checkTodosInLocalStorage(page, TODO_ITEMS[0]);
  });

  /**
   * Test: Display only active items.
   * Validates Active filter route.
   */
  test(
    "should allow me to display active items",
    { tag: "@UI" },
    async ({ page }) => {
      const todoItem = page.getByTestId("todo-item");
      await page.getByTestId("todo-item").nth(1).getByRole("checkbox").check();

      await checkNumberOfCompletedTodosInLocalStorage(page, 1);
      await page.getByRole("link", { name: "Active" }).click();
      await expect(todoItem).toHaveCount(2);
      await expect(todoItem).toHaveText([TODO_ITEMS[0], TODO_ITEMS[2]]);
    }
  );

  /**
   * Test: Browser back button respects filters.
   * Ensures history navigation works correctly.
   */
  test("should respect the back button", { tag: "@UI" }, async ({ page }) => {
    const todoItem = page.getByTestId("todo-item");
    await page.getByTestId("todo-item").nth(1).getByRole("checkbox").check();

    await checkNumberOfCompletedTodosInLocalStorage(page, 1);

    await test.step("Showing all items", async () => {
      await page.getByRole("link", { name: "All" }).click();
      await expect(todoItem).toHaveCount(3);
    });

    await test.step("Showing active items", async () => {
      await page.getByRole("link", { name: "Active" }).click();
    });

    await test.step("Showing completed items", async () => {
      await page.getByRole("link", { name: "Completed" }).click();
    });

    await expect(todoItem).toHaveCount(1);
    await page.goBack();
    await expect(todoItem).toHaveCount(2);
    await page.goBack();
    await expect(todoItem).toHaveCount(3);
  });

  /**
   * Test: Display only completed items.
   * Validates Completed filter route.
   */
  test(
    "should allow me to display completed items",
    { tag: "@UI" },
    async ({ page }) => {
      await page.getByTestId("todo-item").nth(1).getByRole("checkbox").check();
      await checkNumberOfCompletedTodosInLocalStorage(page, 1);
      await page.getByRole("link", { name: "Completed" }).click();
      await expect(page.getByTestId("todo-item")).toHaveCount(1);
    }
  );

  /**
   * Test: Display all items via All filter.
   * Ensures All route shows every todo.
   */
  test(
    "should allow me to display all items",
    { tag: "@UI" },
    async ({ page }) => {
      await page.getByTestId("todo-item").nth(1).getByRole("checkbox").check();
      await checkNumberOfCompletedTodosInLocalStorage(page, 1);
      await page.getByRole("link", { name: "Active" }).click();
      await page.getByRole("link", { name: "Completed" }).click();
      await page.getByRole("link", { name: "All" }).click();
      await expect(page.getByTestId("todo-item")).toHaveCount(3);
    }
  );

  /**
   * Test: Highlight currently applied filter.
   * Validates UI indicates active filter.
   */
  test(
    "should highlight the currently applied filter",
    { tag: "@UI" },
    async ({ page }) => {
      await expect(page.getByRole("link", { name: "All" })).toHaveClass(
        "selected"
      );

      //create locators for active and completed links
      const activeLink = page.getByRole("link", { name: "Active" });
      const completedLink = page.getByRole("link", { name: "Completed" });
      await activeLink.click();

      // Page change - active items.
      await expect(activeLink).toHaveClass("selected");
      await completedLink.click();

      // Page change - completed items.
      await expect(completedLink).toHaveClass("selected");
    }
  );
});

/**
 * Helper: Create the default set of todo items.
 * @param page - Playwright page object.
 */
async function createDefaultTodos(page: Page) {
  // create a new todo locator
  const newTodo = page.getByPlaceholder("What needs to be done?");

  for (const item of TODO_ITEMS) {
    await newTodo.fill(item);
    await newTodo.press("Enter");
  }
}

/**
 * Helper: Wait until localStorage contains the expected number of todos.
 * @param page - Playwright page object.
 * @param expected - Expected number of todos.
 */
async function checkNumberOfTodosInLocalStorage(page: Page, expected: number) {
  return await page.waitForFunction((e) => {
    return JSON.parse(localStorage["react-todos"]).length === e;
  }, expected);
}

/**
 * Helper: Wait until localStorage contains the expected number of completed todos.
 * @param page - Playwright page object.
 * @param expected - Expected number of completed todos.
 */
async function checkNumberOfCompletedTodosInLocalStorage(
  page: Page,
  expected: number
) {
  return await page.waitForFunction((e) => {
    return (
      JSON.parse(localStorage["react-todos"]).filter(
        (todo: any) => todo.completed
      ).length === e
    );
  }, expected);
}

/**
 * Helper: Wait until localStorage contains a todo with the given title.
 * @param page - Playwright page object.
 * @param title - Expected todo title.
 */
async function checkTodosInLocalStorage(page: Page, title: string) {
  return await page.waitForFunction((t) => {
    return JSON.parse(localStorage["react-todos"])
      .map((todo: any) => todo.title)
      .includes(t);
  }, title);
}
