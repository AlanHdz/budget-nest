import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { getExtendedClient } from './extended-client';

const prismaServiceProvider = {
  provide: PrismaService,
  useFactory: () => {

    const extendedClient = getExtendedClient();

    const proxy = new Proxy(extendedClient, {
      get: (target, property) => {
        return Reflect.get(target, property)
      }
    })

    return proxy
  }
}


@Module({
  providers: [prismaServiceProvider],
  exports: [PrismaService]
})
export class PrismaModule {}
