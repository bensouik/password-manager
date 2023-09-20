import { HttpClient, HttpStatusCode } from '@angular/common/http';
import { fakeAsync, flush } from '@angular/core/testing';
import { GetPasswordsResponse, LoginResponse } from '@password-manager:types';
import { of } from 'rxjs';

import { BFFService } from './bff.service';

describe('BFFService Tests', () => {
    const mockHttpClient = HttpClient.prototype;
    let service: BFFService;

    beforeEach(() => {
        // Mock getTime to return 1000 so the token expiration is
        // 1000 for every test
        jest.spyOn(Date.prototype, 'getTime').mockReturnValue(1000);

        service = new BFFService(mockHttpClient);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('Login', () => {
        it('Sets the session in local storage when login is successful', fakeAsync(() => {
            // mockLocalSessionService.set = jest.fn();

            mockHttpClient.post = jest.fn().mockReturnValue(
                of(<LoginResponse>{
                    clientId: 'id',
                    auth: {
                        token: 'token',
                        expiresIn: 3600,
                    },
                }),
            );

            service.login('username', 'password').subscribe({
                next: (response: LoginResponse) => {
                    expect(response.clientId).toBe('id');
                    expect(response.auth.token).toBe('token');
                    expect(response.auth.expiresIn).toBe(3600);

                    // Update with wrapper around local storage
                    // expect(mockLocalSessionService.set).toBeCalledTimes(4);
                    // expect(mockLocalSessionService.set).toHaveBeenNthCalledWith(1, 'username', 'username');
                    // expect(mockLocalSessionService.set).toHaveBeenNthCalledWith(2, 'sessionId', 'id');
                    // expect(mockLocalSessionService.set).toHaveBeenNthCalledWith(3, 'sessionToken', 'token');
                    // expect(mockLocalSessionService.set).toHaveBeenNthCalledWith(4, 'sessionTokenExpiration', '1000');
                },
            });

            flush();
        }));
    });

    describe('Get Passwords', () => {
        it('Gets the passwords for a client', fakeAsync(() => {
            mockHttpClient.get = jest.fn().mockReturnValue(
                of(<GetPasswordsResponse>{
                    statusCode: HttpStatusCode.Ok,
                    message: 'OK',
                    passwords: [
                        {
                            passwordId: 'id',
                            name: 'Name',
                            website: null,
                            login: 'Login',
                            value: 'password',
                            clientId: 'id',
                        },
                    ],
                }),
            );

            service.getPasswords('id').subscribe({
                next: (response: GetPasswordsResponse) => {
                    expect(response.statusCode).toBe(HttpStatusCode.Ok);
                    expect(response.message).toBe('OK');
                    expect(response.passwords).toStrictEqual([
                        {
                            passwordId: 'id',
                            name: 'Name',
                            website: null,
                            login: 'Login',
                            value: 'password',
                            clientId: 'id',
                        },
                    ]);
                },
            });

            flush();
        }));
    });
});
