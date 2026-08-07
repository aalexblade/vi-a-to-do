import type { Config } from '@prisma/migrate/dist/engine-core/schema-engine'

const config: Config = {
  // For Prisma Migrate
  // The connection URL for Migrate is read from the DATABASE_URL environment variable.
  // You can override it here if needed.
  // For Prisma Client, the connection URL is passed to the PrismaClient constructor.
  // Example: new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } })
  // Or use the prisma.config.ts file to configure the client:
  // datasource: {
  //   db: {
  //     url: process.env.DATABASE_URL
  //   }
  // },
}

export default config
