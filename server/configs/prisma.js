import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
// NOTE: @prisma/adapter-neon@7.x requires @prisma/client@7.x (currently installed: 5.x)
// To use the Neon adapter, upgrade @prisma/client and prisma to matching versions.
// import { PrismaNeon } from '@prisma/adapter-neon';
// import { neonConfig } from '@neondatabase/serverless';
// import ws from 'ws';
// neonConfig.webSocketConstructor = ws;
// neonConfig.poolQueryViaFetch = true;
// const connectionString = `${process.env.DATABASE_URL}`;
// const adapter = new PrismaNeon({ connectionString });
// const prisma = new PrismaClient({ adapter });

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV === 'development') global.prisma = prisma;

export default prisma;