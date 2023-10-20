import { HttpStatus } from '@nestjs/common';
import { PasswordRepository } from '@password-manager:api:repositories/password/password.repository';
import { PasswordInput, PasswordManagerException } from '@password-manager:api:types';
import { Crypto } from '@password-manager:crypto';
import { Password, PasswordManagerErrorCodeEnum, PasswordResponse } from '@password-manager:types';

import { PasswordService } from './password.service';

describe('PasswordService Tests', () => {
    const mockPasswordRepository = PasswordRepository.prototype;
    const mockCrypto = Crypto.prototype;
    let service: PasswordService;

    beforeEach(() => {
        service = new PasswordService(mockPasswordRepository, mockCrypto);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('Get Passwords', () => {
        it('Returns all passwords for the provided client ID', async () => {
            mockPasswordRepository.getPasswordsByClientId = jest.fn().mockResolvedValue([
                <Password>{
                    passwordId: 'passwordId',
                    name: 'name',
                    website: null,
                    login: 'login',
                    value: 'value',
                    clientId: 'clientId',
                },
            ]);

            mockCrypto.decrypt = jest.fn().mockReturnValue('password');

            const actual = await service.getPasswords('clientId');

            expect(mockPasswordRepository.getPasswordsByClientId).toBeCalledTimes(1);
            expect(mockPasswordRepository.getPasswordsByClientId).toBeCalledWith('clientId');

            expect(mockCrypto.decrypt).toBeCalledTimes(1);
            expect(mockCrypto.decrypt).toBeCalledWith('value');

            expect(actual.passwords).toStrictEqual([
                <Password>{
                    passwordId: 'passwordId',
                    name: 'name',
                    website: null,
                    login: 'login',
                    value: 'password',
                    clientId: 'clientId',
                },
            ]);
        });

        it('Throws a NotFound PasswordManagerException when no passwords exist for the client', async () => {
            mockPasswordRepository.getPasswordsByClientId = jest
                .fn()
                .mockRejectedValue(PasswordManagerException.notFound());

            try {
                await service.getPasswords('clientId');
            } catch (error) {
                expect(error).toBeInstanceOf(PasswordManagerException);

                const exception = error as PasswordManagerException;
                expect(exception.statusCode).toBe(HttpStatus.NOT_FOUND);
                expect(exception.message).toBe('Not Found');
                expect(exception.errorCode).toBe(PasswordManagerErrorCodeEnum.NotFound);

                expect(mockPasswordRepository.getPasswordsByClientId).toBeCalledTimes(1);
                expect(mockPasswordRepository.getPasswordsByClientId).toBeCalledWith('clientId');

                expect(mockCrypto.decrypt).toBeCalledTimes(0);
            }
        });
    });

    describe('Create Password', () => {
        it('Creates a new password and returns it', async () => {
            mockCrypto.encrypt = jest.fn().mockReturnValue('password');
            mockPasswordRepository.createPassword = jest.fn().mockResolvedValue(<Password>{
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

            const actual = await service.createPassword('clientId', {
                name: 'name',
                website: null,
                login: 'login',
                value: 'password',
            });

            expect(actual.password).toStrictEqual(<PasswordResponse>{
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

            expect(mockCrypto.encrypt).toBeCalledTimes(1);
            expect(mockCrypto.encrypt).toBeCalledWith('password');

            expect(mockPasswordRepository.createPassword).toBeCalledTimes(1);
            expect(mockPasswordRepository.createPassword).toBeCalledWith({
                clientId: 'clientId',
                name: 'name',
                website: null,
                login: 'login',
                value: 'password',
            });
        });
    });

    describe('Delete Password', () => {
        it('Deletes the password', async () => {
            mockPasswordRepository.deletePassword = jest.fn().mockResolvedValue({});

            await service.deletePassword('passwordId');

            expect(mockPasswordRepository.deletePassword).toBeCalledTimes(1);
            expect(mockPasswordRepository.deletePassword).toBeCalledWith('passwordId');
        });
    });

    describe('Update Password', () => {
        it('Updates the password', async () => {
            mockPasswordRepository.getPasswordById = jest.fn().mockResolvedValue({});
            mockCrypto.encrypt = jest.fn().mockReturnValue('password');
            mockPasswordRepository.updatePassword = jest.fn().mockResolvedValue(<Password>{
                passwordId: 'passwordId',
                name: 'name',
                website: 'website',
                login: 'login',
                value: 'password',
                clientId: 'clientId',
                metadata: {
                    createdDate: 'now',
                    updatedDate: 'now',
                },
            });

            const result = await service.updatePassword('clientId', 'passwordId', {
                name: 'name',
                website: 'website',
                login: 'login',
                value: 'password',
            });

            expect(result.password).toStrictEqual({
                passwordId: 'passwordId',
                name: 'name',
                website: 'website',
                login: 'login',
                value: 'password',
                clientId: 'clientId',
                metadata: {
                    createdDate: 'now',
                    updatedDate: 'now',
                },
            });

            expect(mockPasswordRepository.getPasswordById).toBeCalledTimes(1);
            expect(mockPasswordRepository.getPasswordById).toBeCalledWith('passwordId');

            expect(mockCrypto.encrypt).toBeCalledTimes(1);
            expect(mockCrypto.encrypt).toBeCalledWith('password');

            expect(mockPasswordRepository.updatePassword).toBeCalledTimes(1);
            expect(mockPasswordRepository.updatePassword).toBeCalledWith('passwordId', <PasswordInput>{
                name: 'name',
                website: 'website',
                login: 'login',
                value: 'password',
                clientId: 'clientId',
            });
        });
    });
});
