import { Module } from '@nestjs/common';
import { WalletModule } from './wallet/wallet.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [WalletModule, HealthModule],
})
export class AppModule {}
