import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA, QueryList } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatExpansionPanel } from '@angular/material/expansion';
import { Router, RouterModule } from '@angular/router';
import { GetPasswordsResponse, UIUrlsEnum } from '@password-manager:types';
import { BFFService } from '@password-manager:ui:services/bff/bff.service';
import { BrowserStorageService } from '@password-manager:ui:services/browser-storage/browser-storage.service';
import { Observable, of } from 'rxjs';

import { DashboardComponent } from './dashboard.component';
import PageConfig from './dashboard.component.config';

describe('DashboardComponent Tests', () => {
    let mockRouter: Router;
    let mockBFFService: BFFService;
    let mockBrowserStorageService: BrowserStorageService;
    let component: DashboardComponent;
    let fixture: ComponentFixture<DashboardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, RouterModule, HttpClientTestingModule],
            declarations: [DashboardComponent],
            providers: [BFFService, BrowserStorageService],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(DashboardComponent);
        component = fixture.componentInstance;

        mockRouter = TestBed.inject(Router);
        mockBFFService = TestBed.inject(BFFService);
        mockBrowserStorageService = TestBed.inject(BrowserStorageService);

        mockRouter.navigateByUrl = jest.fn();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('Should create the Dashboard Component Page', () => {
        expect(component).toBeTruthy();
    });

    describe('Component Initialization', () => {
        it('Fetches passwords for the client on initialization', () => {
            mockBrowserStorageService.getItem = jest.fn().mockReturnValue('id');

            mockBFFService.getPasswords = jest.fn().mockReturnValue(
                of(<GetPasswordsResponse>{
                    passwords: [
                        {
                            passwordId: 'id',
                            name: 'Foo',
                            website: null,
                            login: 'login',
                            value: 'password',
                            clientId: 'id',
                        },
                    ],
                }),
            );

            expect(component.page.isLoading).toBeTruthy();

            component.ngOnInit();

            expect(mockBFFService.getPasswords).toBeCalledTimes(1);
            expect(mockBFFService.getPasswords).toBeCalledWith('id');

            expect(component.page.passwordEntries.pop()?.password).toStrictEqual({
                passwordId: 'id',
                name: 'Foo',
                website: null,
                login: 'login',
                value: 'password',
                clientId: 'id',
            });

            expect(component.page.banner.show).toBeFalsy();
            expect(component.page.isLoading).toBeFalsy();
        });

        it('Fetches passwords for the client on initialization but receives a 404', () => {
            mockBrowserStorageService.getItem = jest.fn().mockReturnValue('id');

            mockBFFService.getPasswords = jest.fn().mockReturnValue(
                new Observable((observer) =>
                    observer.error(
                        new HttpErrorResponse({
                            status: HttpStatusCode.NotFound,
                            statusText: 'Not Found',
                            error: { message: 'Not found' },
                        }),
                    ),
                ),
            );

            expect(component.page.isLoading).toBeTruthy();

            component.ngOnInit();

            expect(mockBFFService.getPasswords).toBeCalledTimes(1);
            expect(mockBFFService.getPasswords).toBeCalledWith('id');

            expect(component.page.passwordEntries).toStrictEqual([]);

            expect(component.page.banner).toStrictEqual({
                show: true,
                title: PageConfig.banner.createPassword.title,
                message: PageConfig.banner.createPassword.message,
                variant: PageConfig.banner.createPassword.variant,
                button: {
                    label: PageConfig.banner.createPassword.button.label,
                    click: expect.anything(),
                },
            });

            expect(component.page.isLoading).toBeFalsy();
        });

        it('Fetches passwords for the client on initialization but receives a 500', () => {
            mockBFFService.getPasswords = jest.fn().mockReturnValue(
                new Observable((observer) =>
                    observer.error(
                        new HttpErrorResponse({
                            status: HttpStatusCode.InternalServerError,
                            statusText: 'Internal Server Error',
                            error: { message: 'Something broke' },
                        }),
                    ),
                ),
            );

            expect(component.page.isLoading).toBeTruthy();

            component.ngOnInit();

            expect(mockBFFService.getPasswords).toBeCalledTimes(1);
            expect(mockBFFService.getPasswords).toBeCalledWith('');

            expect(component.page.passwordEntries).toStrictEqual([]);

            expect(component.page.banner).toStrictEqual({
                show: true,
                title: PageConfig.banner.error.title,
                message: PageConfig.banner.error.message,
                variant: PageConfig.banner.error.variant,
                button: {
                    label: PageConfig.banner.error.button.label,
                    click: expect.anything(),
                },
            });

            expect(component.page.isLoading).toBeFalsy();
        });
    });

    describe('Update Password', () => {
        // Remove this test and replace with others once implemented
        it('Closes the accordion', () => {
            component.expansionPanels = {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                get: (index: number) => ({
                    close: () => {},
                }),
            } as QueryList<MatExpansionPanel>;

            component.updatePassword(0);
        });
    });

    describe('Delete Password', () => {
        // Remove this test and replace with others once implemented
        it('Closes the accordion', () => {
            component.expansionPanels = {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                get: (index: number) => ({
                    close: () => {},
                }),
            } as QueryList<MatExpansionPanel>;

            component.deletePassword(0);
        });
    });

    describe('Cancel Password Edit', () => {
        // Remove this test and replace with others once implemented
        it('Closes the accordion', () => {
            component.expansionPanels = {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                get: (index: number) => ({
                    close: () => {},
                }),
            } as QueryList<MatExpansionPanel>;

            component.page.passwordEntries = [
                {
                    password: {
                        name: 'name',
                        website: 'website',
                        login: 'login',
                        value: 'value',
                        passwordId: 'passwordId',
                        clientId: 'clientId',
                        metadata: {
                            createdDate: 'now',
                            updatedDate: 'now',
                        },
                    },
                    formControl: {} as FormGroup,
                },
            ];

            component.cancelPasswordEdit(0);
        });
    });

    describe('Go to Create Password Page', () => {
        it('Navigates to the create password page', () => {
            component.goToCreatePasswordPage();

            expect(mockRouter.navigateByUrl).toBeCalledTimes(1);
            expect(mockRouter.navigateByUrl).toBeCalledWith(UIUrlsEnum.CreatePassword);
        });
    });

    describe('Close Banner', () => {
        it('Closes the banner', () => {
            component.page.banner.show = true;

            expect(component.page.banner.show).toBeTruthy();

            component.closeBanner();

            expect(component.page.banner.show).toBeFalsy();
        });
    });
});
