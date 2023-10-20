import { HttpStatus } from '@nestjs/common';
import { PasswordService } from '@password-manager:api:services/password/password.service';
import { Password } from '@password-manager:types';

import { PasswordsController } from './passwords.controller';

describe('PasswordsController Tests', () => {
    const mockPasswordService = PasswordService.prototype;
    let controller: PasswordsController;

    beforeEach(() => {
        controller = new PasswordsController(mockPasswordService);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('Get Passwords', () => {
        it("Returns a 200 and the client's passwords", async () => {
            mockPasswordService.getPasswords = jest.fn().mockResolvedValue({
                statusCode: HttpStatus.OK,
                message: 'Ok',
                passwords: [
                    <Password>{
                        passwordId: 'passwordId',
                        name: 'name',
                        website: 'http://foo.com',
                        login: 'login',
                        value: 'value',
                        clientId: 'clientId',
                    },
                ],
            });

            const actual = await controller.getPasswords('clientId');

            expect(mockPasswordService.getPasswords).toBeCalledTimes(1);
            expect(mockPasswordService.getPasswords).toBeCalledWith('clientId');

            expect(actual.passwords).toStrictEqual([
                <Password>{
                    passwordId: 'passwordId',
                    name: 'name',
                    website: 'http://foo.com',
                    login: 'login',
                    value: 'value',
                    clientId: 'clientId',
                },
            ]);
        });
    });

    describe('Create Password', () => {
        it('Successfully creates a password', async () => {
            mockPasswordService.createPassword = jest.fn().mockResolvedValue({
                passwordId: 'passwordId',
                name: 'name',
                website: null,
                login: 'login',
                value: 'password',
                clientId: 'clientId',
                metadata: {
                    createdDate: 'now',
                    updatedDate: 'now',
                },
            });

            const actual = await controller.createPassword('clientId', {
                name: 'name',
                website: null,
                login: 'login',
                value: 'password',
            });

            expect(mockPasswordService.createPassword).toBeCalledTimes(1);
            expect(mockPasswordService.createPassword).toBeCalledWith('clientId', {
                name: 'name',
                website: null,
                login: 'login',
                value: 'password',
            });

            expect(actual).toStrictEqual({
                passwordId: 'passwordId',
                name: 'name',
                website: null,
                login: 'login',
                value: 'password',
                clientId: 'clientId',
                metadata: {
                    createdDate: 'now',
                    updatedDate: 'now',
                },
            });
        });
    });

    describe('Delete Password', () => {
        it('Successfully deletes a password', async () => {
            mockPasswordService.deletePassword = jest.fn().mockResolvedValue({});

            await controller.deletePassword('passwordId');

            expect(mockPasswordService.deletePassword).toBeCalledTimes(1);
            expect(mockPasswordService.deletePassword).toBeCalledWith('passwordId');
        });
    });

    describe('Update Password', () => {
        it('Successfully updates a password', async () => {
            mockPasswordService.updatePassword = jest.fn().mockResolvedValue({
                passwordId: 'passwordId',
                name: 'name',
                website: null,
                login: 'login',
                value: 'password',
                clientId: 'clientId',
                metadata: {
                    createdDate: 'now',
                    updatedDate: 'now',
                },
            });

            const actual = await controller.updatePassword('clientId', 'passwordId', {
                name: 'name',
                website: null,
                login: 'login',
                value: 'password',
            });

            expect(mockPasswordService.updatePassword).toBeCalledTimes(1);
            expect(mockPasswordService.updatePassword).toBeCalledWith('clientId', 'passwordId', {
                name: 'name',
                website: null,
                login: 'login',
                value: 'password',
            });

            expect(actual).toStrictEqual({
                passwordId: 'passwordId',
                name: 'name',
                website: null,
                login: 'login',
                value: 'password',
                clientId: 'clientId',
                metadata: {
                    createdDate: 'now',
                    updatedDate: 'now',
                },
            });
        });
    });
});
