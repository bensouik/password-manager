import { ClientService } from '@password-manager:api:services/client/client.service';
import { CreateClientResponse } from '@password-manager:types';

import { ClientController } from './client.controller';

describe('ClientController Tests', () => {
    const mockClientService = ClientService.prototype;
    let controller: ClientController;

    beforeEach(() => {
        controller = new ClientController(mockClientService);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('Create Client', () => {
        it('Successfully creates a new client and returns it', async () => {
            mockClientService.createClient = jest.fn().mockResolvedValue(<CreateClientResponse>{
                client: {
                    clientId: 'clientId',
                    login: 'login',
                    metadata: {
                        createdDate: 'now',
                        updatedDate: 'now',
                    },
                },
            });

            const actual = await controller.createClient({ login: 'login', password: 'password' });

            expect(actual.client).toStrictEqual({
                clientId: 'clientId',
                login: 'login',
                metadata: {
                    createdDate: 'now',
                    updatedDate: 'now',
                },
            });

            expect(mockClientService.createClient).toBeCalledTimes(1);
            expect(mockClientService.createClient).toBeCalledWith({ login: 'login', password: 'password' });
        });
    });

    describe('Delete Client', () => {
        it('Successfully deletes the client', async () => {
            mockClientService.deleteClient = jest.fn().mockResolvedValue({});

            await controller.deleteClient('clientId');

            expect(mockClientService.deleteClient).toBeCalledTimes(1);
            expect(mockClientService.deleteClient).toBeCalledWith('clientId');
        });
    });

    describe('Update Client', () => {
        it('Successfully updates the client', async () => {
            mockClientService.updateClient = jest.fn().mockResolvedValue({
                clientId: 'clientId',
                login: 'login',
                metadata: {
                    createdDate: 'now',
                    updatedDate: 'now',
                },
            });

            await controller.updateClient('clientId', { login: 'login', password: 'password' });

            expect(mockClientService.updateClient).toBeCalledTimes(1);
            expect(mockClientService.updateClient).toBeCalledWith('clientId', { login: 'login', password: 'password' });
        });
    });
});
