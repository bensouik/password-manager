import { HttpStatus } from '@nestjs/common';
import { SecurityQuestionRepository } from '@password-manager:api:repositories/security-question/security-question.repository';
import { PasswordManagerException } from '@password-manager:api:types';

import { GetSecurityQuestionChallengeController } from './get-security-question-challenge.controller';

describe('GetSecurityQuestionChallengeController Tests', () => {
    const mockSecurityQuestionRepository = SecurityQuestionRepository.prototype;
    let controller: GetSecurityQuestionChallengeController;

    beforeEach(() => {
        controller = new GetSecurityQuestionChallengeController(mockSecurityQuestionRepository);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    // Remove this test after the controller is implemented
    it('Method not implemented', async () => {
        try {
            await controller.handler('login');
        } catch (error) {
            expect(error).toBeInstanceOf(PasswordManagerException);

            const exception = error as PasswordManagerException<unknown>;
            expect(exception.statusCode).toBe(HttpStatus.NOT_IMPLEMENTED);
            expect(exception.message).toBe('Not Implemented');
        }
    });

    // Place all unit tests for successful results (status code 200) here
    describe('Successful Results', () => {});

    // Place all unit tests for not found results (status code 404)
    describe('Not Found Results', () => {});

    // Place all unit tests for service unavailable results (status code 503) here
    describe('Service Unavailable Results', () => {});
});
