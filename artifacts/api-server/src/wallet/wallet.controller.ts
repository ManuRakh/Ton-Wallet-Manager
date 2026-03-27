import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  async getBalance(@Query('address') address: string) {
    if (!address) throw new BadRequestException('address query param is required');
    const balance = await this.walletService.getBalance(address);
    return { balance };
  }

  @Get('transactions')
  async getTransactions(
    @Query('address') address: string,
    @Query('limit') limit?: string,
  ) {
    if (!address) throw new BadRequestException('address query param is required');
    const txLimit = limit ? Math.min(parseInt(limit, 10) || 50, 100) : 50;
    const transactions = await this.walletService.getTransactions(address, txLimit);
    return { transactions };
  }

  @Get('seqno')
  async getSeqno(@Query('address') address: string) {
    if (!address) throw new BadRequestException('address query param is required');
    const seqno = await this.walletService.getSeqno(address);
    return { seqno };
  }

  @Post('broadcast')
  async broadcast(@Body() body: { boc: string }) {
    if (!body?.boc) throw new BadRequestException('boc is required in request body');
    await this.walletService.broadcastBoc(body.boc);
    return { success: true };
  }
}
