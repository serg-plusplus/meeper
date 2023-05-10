import { createRouter, defineRoute, param } from "type-route";

export const { RouteProvider, useRoute, routes } = createRouter(
  {
    session: { type: "hash" },
  },
  {
    explore: defineRoute(
      {
        recordId: param.path.number,
      },
      (p) => `/explore/${p.recordId}`
    ),
    record: defineRoute(
      {
        tabId: param.path.number,
        recordType: param.query.string,
      },
      (p) => `/record/${p.tabId}`
    ),
  }
);
