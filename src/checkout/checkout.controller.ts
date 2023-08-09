import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CreateCheckoutDto } from './dto/checkout.dto';
import { User, userType } from 'src/user/decorators/user.decrator';
import { Roles } from 'src/decoratores/role.decorator';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}
  @Roles('USER')
  @Post(':storeId')
  async checkout(
    @Body() data: CreateCheckoutDto,
    @User() user: userType,
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
  ) {
    // passing static storeId for now but in future we will get it from user
    return await this.checkoutService.createCheckout(
      data,
      user.userId,
      storeId,
    );
  }
}
