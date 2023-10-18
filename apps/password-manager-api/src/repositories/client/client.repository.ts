/* eslint-disable @typescript-eslint/no-unused-vars */
import { GetCommandInput, DeleteCommandInput, QueryCommandInput, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';
import { ClassProvider, Inject, Injectable, InjectionToken } from '@nestjs/common';
import { IClientRepository } from '@password-manager:api:interfaces';
import { DYNAMODB_CLIENT, LOGGER } from '@password-manager:api:providers';
import { ClientInput, PasswordManagerException } from '@password-manager:api:types';
import { IDynamoDBClient } from '@password-manager:dynamodb-client';
import { ILogger } from '@password-manager:logger';
import { Client, PasswordManagerErrorCodeEnum } from '@password-manager:types';
import { v4 as uuid } from 'uuid';

@Injectable()
export class ClientRepository implements IClientRepository {
    private readonly TABLE_NAME = 'Client';

    constructor(
        @Inject(LOGGER)
        private readonly logger: ILogger,
        @Inject(DYNAMODB_CLIENT)
        private readonly dynamoDBClient: IDynamoDBClient,
    ) {}

    public async getClientById(clientId: string): Promise<Client> {
        try {
            // Construct a GetCommandInput to query that will query the
            // Client table by the clientId which is the key.
            const input = <GetCommandInput>{
                TableName: this.TABLE_NAME,
                Key: {
                    clientId: clientId,
                },
            };

            // Send the GetCommandInput request to DynamoDB
            const result = await this.dynamoDBClient.get(this.TABLE_NAME, input);

            // If no item is returned, this means that there is not a client record
            // that exists with the ID provided
            if (!result.Item) {
                // Log a warn message that indicates that no client record was found by the clientId
                this.logger.warn("Couldn't find the client by ID", { dynamoDB: { table: this.TABLE_NAME } });

                // Reject/throw and exception indicating a 404 (Not Found) and that no client record was found
                return Promise.reject(
                    PasswordManagerException.notFound()
                        .withMessage(`No client exists with ID '${clientId}'`)
                        .withErrorCode(PasswordManagerErrorCodeEnum.ClientNotFound),
                );
            }

            // If an item exists, log an info message stating a client record was found
            this.logger.info('Found client by ID', { dynamoDB: { table: this.TABLE_NAME } });

            // Return the item casted as a Client type
            return result.Item as Client;
        } catch (error) {
            // If something goes wrong, log an error message stating that finding
            // the client by ID failed and what error occurred
            this.logger.error('Failed to find the client by ID', {
                dynamoDB: { table: this.TABLE_NAME },
                error: error,
            });

            // Reject/throw an exception indicating a 503 (Service Unavailable) and that
            // DynamoDB is down
            return Promise.reject(
                PasswordManagerException.serviceUnavailable()
                    .withMessage('Service is temporarily unavailable.')
                    .withErrorCode(PasswordManagerErrorCodeEnum.DynamoDBDown),
            );
        }
    }

    public async getClientByLogin(login: string): Promise<Client> {
        try {
            // Construct a QueryCommandInput which queries DynamoDB by
            // a GlobalSecondaryIndex on the Client table. In this case
            // we want to query by the LoginIndex so we can find a client
            // record by their login/username.
            const input = <QueryCommandInput>{
                TableName: this.TABLE_NAME,
                IndexName: 'LoginIndex',
                KeyConditionExpression: 'login = :login',
                ExpressionAttributeValues: {
                    ':login': login,
                },
            };

            // Send the QueryCommandInput to DynamoDB
            const result = await this.dynamoDBClient.query(this.TABLE_NAME, input);

            // A query can result in multiples records being found so DynamoDB
            // will return an array or list of items. Check if the array exists or
            // if there are no items found.
            if (!result.Items || result.Items.length === 0) {
                // If no items were found, this means that no client record
                // exists with the provided login/username. Log an info message
                // stating that the client was not found by the login
                this.logger.info('Client not found by login', { dynamoDB: { table: this.TABLE_NAME, login: login } });

                // Reject/throw a 404 (Not Fond) exception which indicates that the client was not found
                return Promise.reject(
                    PasswordManagerException.notFound()
                        .withMessage(`No client exists with login '${login}'`)
                        .withErrorCode(PasswordManagerErrorCodeEnum.ClientNotFound),
                );
            }

            // If there is an item returned back from DynamoDB, then log an info message
            // stating that we've successfully found the client by their login
            this.logger.info('Successfully found the client with the provided login', {
                dynamoDB: { table: this.TABLE_NAME, login: login },
            });

            // There should only be one client per login/username so take
            // the first item in the array as cast it as the Client type
            return result.Items[0] as Client;
        } catch (error) {
            // If something goes wrong then log and error message stating
            // that we've failed to find the client by login and log the error that occurred
            this.logger.error('Failed to find the client by login', {
                dynamoDB: { table: this.TABLE_NAME, login: login },
                error: error,
            });

            // Reject/throw an exception that indicates DynamoDB is down
            return Promise.reject(
                PasswordManagerException.serviceUnavailable()
                    .withMessage('Service is temporarily unavailable.')
                    .withErrorCode(PasswordManagerErrorCodeEnum.DynamoDBDown),
            );
        }
    }

    public async createClient(input: ClientInput): Promise<Client> {
        // In this method, we want to create a new client record in DynamoDB.
        // The most important thing in this method is to construct an object
        // that represents a Client. After doing so, save the client
        // in DynamoDB. If that is successful, then return the newly created client,
        // otherwise if something fails, reject with a 503 (Service Unavailable) exception.
        // You can reference the 'createPassword' method in the PasswordRepository for help.
        try {
            // Get the current time stamp in ISO format
            const now = new Date().toISOString();

            // Create a new client record
            const entry = <Client>{
                clientId: uuid(), // Generate a UUID/GUID (Universal/Global Unique Identifier) for the client
                login: input.login,
                password: input.password, //Does this need to be encrypted?
                metadata: {
                    createdDate: now,
                    updatedDate: now,
                },
            };

            // Using the DynamoDB client, save the created client above
            // to the client table
            await this.dynamoDBClient.save(this.TABLE_NAME, entry);

            // Log an info message indicating that a new client was created
            this.logger.info('Successfully created a new client', {
                dynamoDB: {
                    table: this.TABLE_NAME,
                },
            });

            // Return the record so consuming services/classes can have access to the newly created client
            return entry;
        } catch (error) {
            // If something goes wrong, log an error message with the error that occurred
            this.logger.error('Failed to create a new client', {
                dynamoDB: {
                    table: this.TABLE_NAME,
                    error,
                },
            });

            // Reject/throw an exception indicating DynamoDB is down/unavailable
            return Promise.reject(
                PasswordManagerException.serviceUnavailable().withErrorCode(PasswordManagerErrorCodeEnum.DynamoDBDown),
            );
        }
    }

    public async deleteClient(clientId: string): Promise<void> {
        // This method is dedicated to deleting a client record in DynamoDB.
        // All you should need is the clientId and table name to construct the 'DeleteCommandInput'
        // If this is successful, return nothing, otherwise reject with a 503 (Service Unavailable) exception.
        // You can reference the 'deletePassword' method in the PasswordRepository for help
        try {
            // Construct the DeleteCommandInput type
            // What is important is the table name and
            // the Key object which consists of primary key
            // of 'clientId'
            const input = <DeleteCommandInput>{
                TableName: this.TABLE_NAME,
                Key: {
                    clientId: clientId,
                },
            };

            // Send the delete request to DynamoDB
            await this.dynamoDBClient.delete(this.TABLE_NAME, input);

            // Log an info message indicating the client was successfully deleted
            this.logger.info('Successfully deleted client', {
                dynamoDB: {
                    table: this.TABLE_NAME,
                    clientId,
                },
            });
        } catch (error) {
            // If an error occurs, log an error message indicating it failed and the error that occurred
            this.logger.error('Failed to delete client', {
                dynamoDB: {
                    table: this.TABLE_NAME,
                    clientId,
                    error,
                },
            });

            // Reject/throw an exception that indicates that DynamoDB is down and unavailable
            return Promise.reject(
                PasswordManagerException.serviceUnavailable().withErrorCode(PasswordManagerErrorCodeEnum.DynamoDBDown),
            );
        }
    }

    public async updateClient(clientId: string, input: ClientInput): Promise<Client> {
        // This method is supposed to update an existing client record in DynamoDB.
        // You'll need to construct an 'UpdateCommandInput' to send to DynamoDB.
        // This can look quite complex depending how how many attributes you are updating.
        // Take a look at the 'updatePassword' method in the PasswordRepository for help.
        try {
            // Construct an UpdateCommandInput type which contains the table name,
            // the key to query by which is the passwordId, along with the update expressions.
            // This command will update the password record's name, website, login, value, clientId, and the updatedDate
            const entry = <UpdateCommandInput>{
                TableName: this.TABLE_NAME,
                Key: {
                    clientId: clientId,
                },
                UpdateExpression: 'set #login = :login, #password = :password, metadata.#updatedDate = :updatedDate',
                ExpressionAttributeNames: {
                    '#login': 'login',
                    '#password': 'password',
                    '#updatedDate': 'updatedDate',
                },
                ExpressionAttributeValues: {
                    ':login': input.login,
                    ':password': input.password,
                    ':updatedDate': new Date().toISOString(),
                },
                ConditionExpression: 'attribute_exists(clientId)',
            };

            // Send the UpdateCommandInput request to DynamoDB
            await this.dynamoDBClient.update(this.TABLE_NAME, entry);

            // Log an info message stating that the password was updated successfully
            this.logger.info('Successfully updated the client', {
                dynamoDB: {
                    table: this.TABLE_NAME,
                    clientId,
                },
            });

            // Return the updated client record
            return this.getClientById(clientId);
        } catch (error) {
            // If something goes wrong, log an error message indicating that updating the password failed
            this.logger.error('Failed to update client', {
                dynamoDB: {
                    table: this.TABLE_NAME,
                    clientId,
                    error,
                },
            });

            // Reject/throw an exception that indicates that DynamoDB is down
            return Promise.reject(
                PasswordManagerException.serviceUnavailable().withErrorCode(PasswordManagerErrorCodeEnum.DynamoDBDown),
            );
        }
    }
}

export const CLIENT_REPOSITORY: InjectionToken = 'ClientRepository';

export default <ClassProvider>{
    provide: CLIENT_REPOSITORY,
    useClass: ClientRepository,
};
