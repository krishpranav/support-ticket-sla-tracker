import { GraphQLError } from "graphql";
export class AppError extends Error { public constructor(message: string, public readonly code: string, public readonly fieldErrors?: Readonly<Record<string, string>>) { super(message); } }
export const fail = (message: string, code: string, fieldErrors?: Readonly<Record<string, string>>): never => { throw new AppError(message, code, fieldErrors); };
export const toGraphqlError = (error: unknown): GraphQLError => error instanceof AppError ? new GraphQLError(error.message, { extensions: { code: error.code, fieldErrors: error.fieldErrors } }) : new GraphQLError("An unexpected error occurred", { extensions: { code: "INTERNAL_SERVER_ERROR" } });
