import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Client generation does not connect to a database. Database commands still
    // require DIRECT_URL to be explicitly supplied by the operator.
    url: process.env.DIRECT_URL ?? "",
  },
});
