import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { applyEventSchemaFixes } from "./ensure-event-schema";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  lastSchemaErrors: string[] = [];

  async onModuleInit() {
    await this.$connect();
    this.lastSchemaErrors = await applyEventSchemaFixes((sql) => this.$executeRawUnsafe(sql));
    console.log("[prisma] schéma Event aligné", this.lastSchemaErrors.length ? this.lastSchemaErrors : "ok");
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
