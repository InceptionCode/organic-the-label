import { describe, expect, test } from 'bun:test'
import { validateTouched } from '~/components/auth/validation'
import { emailFieldsSchema, signUpFieldsSchema, updatePasswordSchema } from '~/lib/auth-schemas'

const signup = { username: 'beat.maker', email: 'a@example.com', password: 'Abcdefg1', confirmPassword: 'Abcdefg1' }

describe('validateTouched', () => {
  test('hides errors for fields the user has not left yet', () => {
    const result = validateTouched(signUpFieldsSchema, { ...signup, email: 'nope', username: 'bad name!' }, new Set(['email']))
    expect(result.valid).toBe(false)
    expect(result.errors).toEqual({ email: 'Please enter a valid email' })
  })

  test('shows the v1 messages verbatim once touched', () => {
    const touched = new Set(['username', 'password', 'confirmPassword'])
    const result = validateTouched(signUpFieldsSchema, { ...signup, username: 'bad name!', password: 'short', confirmPassword: 'x' }, touched)
    expect(result.errors).toEqual({
      username: 'Username must NOT contain special characters',
      password: 'Password must be at least 8 characters long.',
      confirmPassword: 'Password and confirm password must match',
    })
  })

  test('valid forms report valid with no errors', () => {
    expect(validateTouched(signUpFieldsSchema, signup, new Set(Object.keys(signup)))).toEqual({ errors: {}, valid: true })
    expect(validateTouched(emailFieldsSchema, { email: 'a@example.com' }, new Set(['email'])).valid).toBe(true)
  })

  test('new passwords need a capital letter and a number', () => {
    const result = validateTouched(updatePasswordSchema, { password: 'abcdefgh', confirmPassword: 'abcdefgh' }, new Set(['password']))
    expect(result.errors.password).toBe('Password must contain capital letter and a number.')
  })
})
