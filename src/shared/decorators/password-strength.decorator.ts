import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'passwordStrength', async: false })
export class PasswordStrengthConstraint implements ValidatorConstraintInterface {
    validate(password: string) {
        const regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+{}[\]:;<>,.?~/\\=-]).{8,}$/;
        return regex.test(password);
    }

    defaultMessage() {
        return 'Password must contain a minimum amount of 8 characters including at least 1 special character, 1 capital letter and 1 number';
    }
}

export function IsPasswordStrong(validationOptions?: ValidationOptions) {
    return function (object: Record<string, any>, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: PasswordStrengthConstraint,
        });
    };
}
