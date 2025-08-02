import { type } from 'arktype';

export const signupSchema = type({
	name: 'string>0',
	email: 'string.email',
	password: 'string>=8'
});

export const signinSchema = type({
	email: 'string.email',
	password: 'string>0'
});

export type SignupSchema = typeof signupSchema.infer;
export type SigninSchema = typeof signinSchema.infer;

