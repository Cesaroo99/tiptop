import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { applyEventSchemaFixes } from "./ensure-event-schema";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    await applyEventSchemaFixes((sql) => this.$executeRawUnsafe(sql));
    console.log("[prisma] schéma Event aligné");
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
