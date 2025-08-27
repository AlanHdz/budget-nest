import { Prisma, PrismaClient } from "../../generated/prisma"

export type ExtendedPrismaClient = ReturnType<typeof getExtendedClient>

export function getExtendedClient() {

  const prisma = new PrismaClient()

  return prisma.$extends({
    query: {
      $allModels: {
        async delete({ model, args }) {
          const Model = Prisma.dmmf.datamodel.models.find((m) => m.name === model);
          if (!Model) throw new Error(`Model ${model} not found`);
          return (prisma as any)[model].update({ ...args, data: { deletedAt: new Date() } });
        },
        async deleteMany({ model, args }) {
          const Model = Prisma.dmmf.datamodel.models.find((m) => m.name === model);
          if (!Model) {
            throw new Error(`Model ${model} not found`);
          }
          return (prisma as any)[model].updateMany({
            ...args,
            data: { deletedAt: new Date() }
          })
        },
        async findUnique({ args, query }) {
          args.where = { ...args.where, deletedAt: null };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, deletedAt: null };
          return query(args);
        },
        async findMany({ args, query }) {
          args.where = { ...args.where, deletedAt: null };
          return query(args);
        },
        async count({ args, query }) {
          if (args.where) {
            args.where = { ...args.where, deletedAt: null };
          } else {
            args.where = { deletedAt: null };
          }
          return query(args);
        },
        async aggregate({ args, query }) {
          if (args.where) {
            args.where = { ...args.where, deletedAt: null }
          } else {
            args.where = { deletedAt: null };
          }
          return query(args);
        }
      }
    }
  })
}