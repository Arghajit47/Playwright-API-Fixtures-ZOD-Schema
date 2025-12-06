import { test as base } from "@playwright/test";
import { ApiHelper } from "../helpers/api-helper";
import loginData from "../testData/loginUser.json";

type ApiFixtures = {
  apiHelper: ApiHelper;
  authenticatedApiHelper: {
    helper: ApiHelper;
    accessToken: string;
    refreshToken: string;
    response: any;
  };
};

export const test = base.extend<ApiFixtures>({
  apiHelper: async ({}, use) => {
    const apiHelper = new ApiHelper();
    await use(apiHelper);
  },

  authenticatedApiHelper: async ({}, use) => {
    const apiHelper = new ApiHelper();
    const response = await apiHelper.postRequest(
      "https://dummyjson.com/auth/login",
      { "Content-Type": "application/json" },
      loginData
    );

    await use({
      helper: apiHelper,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      response: response,
    });
  },
});

export { expect } from "@playwright/test";
