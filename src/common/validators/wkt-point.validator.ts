import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

// Validates WKT POINT in lon/lat order, SRID 4326 assumed.
// Example: "POINT(44.5126 40.1772)"
@ValidatorConstraint({ name: 'isWktPoint', async: false })
export class IsWktPointConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value !== 'string') return false;

    const trimmed = value.trim();
    const match =
      /^POINT\s*\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)$/i.exec(
        trimmed,
      );
    if (!match) return false;

    const lon = Number(match[1]);
    const lat = Number(match[2]);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return false;

    return lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be WKT POINT(lon lat) with lon in [-180,180] and lat in [-90,90]`;
  }
}

export function IsWktPoint(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: IsWktPointConstraint,
    });
  };
}


