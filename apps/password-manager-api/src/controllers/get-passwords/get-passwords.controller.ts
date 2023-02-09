import { Controller, HttpCode, Get, Param, UseInterceptors, Inject } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common/enums';
import { PasswordManagerResponseInterceptor } from '@password-manager:api:interceptors';
import { IPasswordRepository } from '@password-manager:api:interfaces';
import { CRYPTO } from '@password-manager:api:providers';
import { PASSWORD_REPOSITORY } from '@password-manager:api:repositories';
import { Crypto } from '@password-manager:crypto';
import { APIUrlsEnum, GetPasswordsResponse } from '@password-manager:types';

@Controller(APIUrlsEnum.GetPasswords)
@UseInterceptors(PasswordManagerResponseInterceptor<GetPasswordsResponse>)
export class GetPasswordsController {
    constructor(
        @Inject(PASSWORD_REPOSITORY)
        private readonly passwordRepository: IPasswordRepository,
        @Inject(CRYPTO)
        private readonly crypto: Crypto,
    ) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    public async handler(@Param('clientId') clientId: string): Promise<GetPasswordsResponse> {
        // This can throw an exception but that's ok. If it does, we want the filters to handle it
        const passwords = await this.passwordRepository.getPasswordsByClientId(clientId);

        // Decrypt each of the passwords
        passwords.forEach((passwordEntry) => {
            passwordEntry.value = this.crypto.decrypt(passwordEntry.value);
        });

        return {
            statusCode: HttpStatus.OK,
            message: 'Ok',
            passwords: passwords,
        };
    }
}
