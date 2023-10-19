import { HttpStatus } from '@nestjs/common';
import { ClientRepository } from '@password-manager:api:repositories/client/client.repository';
import { PasswordRepository } from '@password-manager:api:repositories/password/password.repository';
import { PasswordManagerException } from '@password-manager:api:types';
import { Crypto } from '@password-manager:crypto';
import { Client, ClientResponse, PasswordManagerErrorCodeEnum } from '@password-manager:types';

import { ClientService } from './client.service';

describe('ClientService Tests', () => {
    const mockClientRepository = ClientRepository.prototype;
    const mockPasswordRepository = PasswordRepository.prototype;
    const mockCrypto = Crypto.prototype;
    let service: ClientService;

    beforeEach(() => {
        service = new ClientService(mockClientRepository, mockPasswordRepository, mockCrypto);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('Create Client', () => {
        it('Creates a new client and returns it', async () => {
            mockClientRepository.getClientByLogin = jest.fn().mockRejectedValue(PasswordManagerException.notFound());
            mockCrypto.encrypt = jest.fn().mockReturnValue('password');
            mockClientRepository.createClient = jest.fn().mockResolvedValue(<Client>{
                clientId: 'clientId',
                login: 'login',
                password: 'password',
                metadata: {
                    createdDate: 'now',
                    updatedDate: 'now',
                },
            });

            const actual = await service.createClient({ login: 'login', password: 'password' });

            expect(actual.client).toStrictEqual(<ClientResponse>{
                clientId: 'clientId',
                login: 'login',
                metadata: {
                    createdDate: 'now',
                    updatedDate: 'now',
                },
            });

            expect(mockClientRepository.getClientByLogin).toBeCalledTimes(1);
            expect(mockClientRepository.getClientByLogin).toBeCalledWith('login');

            expect(mockCrypto.encrypt).toBeCalledTimes(1);
            expect(mockCrypto.encrypt).toBeCalledWith('password');

            expect(mockClientRepository.createClient).toBeCalledTimes(1);
            expect(mockClientRepository.createClient).toBeCalledWith({ login: 'login', password: 'password' });
        });

        it('Rejects with a Bad Request exception when the login already exists', async () => {
            mockClientRepository.getClientByLogin = jest.fn().mockResolvedValue(<Client>{
                clientId: 'clientId',
                login: 'login',
                password: 'password',
                metadata: {
                    createdDate: 'now',
                    updatedDate: 'now',
                },
            });

            try {
                await service.createClient({ login: 'login', password: 'password' });
            } catch (error) {
                expect(error).toBeInstanceOf(PasswordManagerException);

                const exception = error as PasswordManagerException;
                expect(exception.statusCode).toBe(HttpStatus.BAD_REQUEST);
                expect(exception.message).toBe('Login is already in use');
                expect(exception.errorCode).toBe(PasswordManagerErrorCodeEnum.LoginAlreadyExists);

                expect(mockClientRepository.getClientByLogin).toBeCalledTimes(1);
                expect(mockClientRepository.getClientByLogin).toBeCalledWith('login');

                expect(mockCrypto.encrypt).toBeCalledTimes(0);

                expect(mockClientRepository.createClient).toBeCalledTimes(0);
            }
        });

        it('Rejects with a Service Unavailable exception getting a client by login fails', async () => {
            mockClientRepository.getClientByLogin = jest
                .fn()
                .mockRejectedValue(PasswordManagerException.serviceUnavailable());

            try {
                await service.createClient({ login: 'login', password: 'password' });
            } catch (error) {
                expect(error).toBeInstanceOf(PasswordManagerException);

                const exception = error as PasswordManagerException;
                expect(exception.statusCode).toBe(HttpStatus.SERVICE_UNAVAILABLE);
                expect(exception.message).toBe('Service Unavailable');
                expect(exception.errorCode).toBe(PasswordManagerErrorCodeEnum.ServiceUnavailable);

                expect(mockClientRepository.getClientByLogin).toBeCalledTimes(1);
                expect(mockClientRepository.getClientByLogin).toBeCalledWith('login');

                expect(mockCrypto.encrypt).toBeCalledTimes(0);

                expect(mockClientRepository.createClient).toBeCalledTimes(0);
            }
        });
    });

    describe('Delete Client', () => {
        it('Deletes a client along with their passwords and security question', async () => {
            mockClientRepository.deleteClient = jest.fn().mockResolvedValue({});
            mockPasswordRepository.deletePasswordsForClientId = jest.fn().mockResolvedValue({});

            await service.deleteClient('clientId');

            expect(mockClientRepository.deleteClient).toBeCalledTimes(1);
            expect(mockClientRepository.deleteClient).toBeCalledWith('clientId');

            expect(mockPasswordRepository.deletePasswordsForClientId).toBeCalledTimes(1);
            expect(mockPasswordRepository.deletePasswordsForClientId).toBeCalledWith('clientId');
        });
    });

    describe('Update Client', () => {
        // Remove this test after the service is implemented
        it('If client exists updates a client (login and password) and returns the client', async () => {
            mockClientRepository.getClientById = jest
                .fn()
                .mockResolvedValue({
                    clientId: 'clientId',
                    login: 'login',
                    password: 'password',
                    metadata: { createdDate: 'now', updatedDate: 'now' },
                });
            mockCrypto.encrypt = jest.fn().mockReturnValue('password');
            mockClientRepository.updateClient = jest.fn().mockResolvedValue(<Client>{
                clientId: 'clientId',
                login: 'username',
                password: 'password',
                metadata: {
                    createdDate: 'now',
                    updatedDate: 'now',
                },
            });

            const actual = await service.updateClient('clientId', { login: 'username', password: 'password' });

            expect(actual.client).toStrictEqual(<ClientResponse>{
                clientId: 'clientId',
                login: 'username',
                metadata: {
                    createdDate: 'now',
                    updatedDate: 'now',
                },
            });

            expect(mockClientRepository.getClientById).toBeCalledTimes(1);

            expect(mockCrypto.encrypt).toBeCalledTimes(1);
            expect(mockCrypto.encrypt).toBeCalledWith('password');

            expect(mockClientRepository.updateClient).toBeCalledTimes(1);
            expect(mockClientRepository.updateClient).toBeCalledWith('clientId', {
                login: 'username',
                password: 'password',
            });
        });

        it('If client does not exist rejcect with a login not found error', async () => {
            mockClientRepository.getClientById = jest.fn().mockRejectedValue(PasswordManagerException.notFound());
            mockClientRepository.updateClient = jest
                .fn()
                .mockRejectedValue(PasswordManagerException.serviceUnavailable());

            try {
                await service.updateClient('clientId', { login: 'login', password: 'password' });
            } catch (error) {
                expect(error).toBeInstanceOf(PasswordManagerException);

                const exception = error as PasswordManagerException;
                expect(exception.statusCode).toBe(HttpStatus.NOT_FOUND);
                expect(exception.message).toBe('Login not found');
                expect(exception.errorCode).toBe(PasswordManagerErrorCodeEnum.ClientNotFound);

                expect(mockClientRepository.getClientById).toBeCalledTimes(1);
                expect(mockClientRepository.getClientById).toBeCalledWith('clientId');

                expect(mockCrypto.encrypt).toBeCalledTimes(0);

                expect(mockClientRepository.updateClient).toBeCalledTimes(0);
            }
        });

        it('Rejects with a service unavailable if getting client by Id fails', async () => {
            mockClientRepository.getClientById = jest
                .fn()
                .mockRejectedValue(PasswordManagerException.serviceUnavailable());
            mockClientRepository.updateClient = jest
                .fn()
                .mockRejectedValue(PasswordManagerException.serviceUnavailable());

            try {
                await service.updateClient('clientId', { login: 'login', password: 'password' });
            } catch (error) {
                expect(error).toBeInstanceOf(PasswordManagerException);

                const exception = error as PasswordManagerException;
                expect(exception.statusCode).toBe(HttpStatus.SERVICE_UNAVAILABLE);
                expect(exception.message).toBe('Service Unavailable');
                expect(exception.errorCode).toBe(PasswordManagerErrorCodeEnum.ServiceUnavailable);

                expect(mockClientRepository.getClientById).toBeCalledTimes(1);
                expect(mockClientRepository.getClientById).toBeCalledWith('clientId');

                expect(mockCrypto.encrypt).toBeCalledTimes(0);

                expect(mockClientRepository.updateClient).toBeCalledTimes(0);
            }
        });

        // Write additional unit tests here
    });
});
