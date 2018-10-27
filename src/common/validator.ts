
interface ValidatorOption {
  type: string;
  required?: boolean;
  value?: any;
  minValue?: number;
  maxValue?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
}

interface ValidatorSchema {
  [key: string]: ValidatorOption
}

interface ValidatorMap {
  [key: string]: ValidatorFunc
}

interface ValidatorError {
  field: string;
  message: string;
}

interface ValidatorFunc {
  (value: any, option?: ValidatorOption): void;
}

const validators: ValidatorMap = {
  'key': function (value) {
    if (!Number.isInteger(value) || !(value > 0)) {
      throw new Error('올바른 식별자가 아닙니다.');
    }
  },
  'integer': function (value, option) {
    if (!Number.isInteger(value)) {
      throw new Error('올바른 정수가 아닙니다.');
    }

    if (Number.isInteger(option.minValue) && value < option.minValue) {
      throw new Error(`${option.minValue} 이상이어야 합니다.`);
    }

    if (Number.isInteger(option.maxValue) && value > option.maxValue) {
      throw new Error(`${option.maxValue} 이하이어야 합니다.`);
    }
  },
  'float': function (value, option) {
    if (!Number.isFinite(value)) {
      throw new Error('올바른 숫자가 아닙니다.');
    }

    if (Number.isFinite(option.minValue) && value < option.minValue) {
      throw new Error(`${option.minValue} 이상이어야 합니다.`);
    }

    if (Number.isFinite(option.maxValue) !== null && value > option.maxValue) {
      throw new Error(`${option.maxValue} 이하이어야 합니다.`);
    }
  },
  'decimal': function (value, option) {
    if (!Number.isFinite(value)) {
      throw new Error('올바른 숫자가 아닙니다.');
    }

    if (Number.isFinite(option.minValue) && value < option.minValue) {
      throw new Error(`${option.minValue} 이상이어야 합니다.`);
    }

    if (Number.isFinite(option.maxValue) !== null && value > option.maxValue) {
      throw new Error(`${option.maxValue} 이하이어야 합니다.`);
    }
  },
  'string': function (value, option) {
    let min = option.min || 0;
    let max = option.max || null;

    if (typeof value === 'string') {
      if (value.length < min) {
        throw new Error(`문자열의 크기는 ${min}자 이상이어야 합니다.`);
      }

      if (max !== null && value.length > max) {
        throw new Error(`문자열의 크기는 ${max}자 이하이어야 합니다.`);
      }

      if (option.pattern && !option.pattern.exec(value)) {
        throw new Error(`올바른 형식의 문자열이 아닙니다.`);
      }
    } else {
      throw new Error('문자열이 아닙니다.');
    }
  },
  'boolean': function (value) {
    if (typeof value !== 'boolean' || (typeof value === 'number' && (value !== 0 || value !== 1))) {
      throw new Error('올바른 불린값이 아닙니다.');
    }
  },
  'password': function (value) {
    if (typeof value !== 'string') {
      throw new Error('비밀번호는 문자열 형식이어야 합니다.');
    }

    if (value.length < 4) {
      throw new Error(`비밀번호는 4자 이상이어야 합니다.`);
    }

    if (value.length > 32) {
      throw new Error(`비밀번호는 32자 이하이어야 합니다.`);
    }
  },
  'email': function (value) {
    if (!/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.exec(value)) {
      throw new Error('올바른 이메일 형식이 아닙니다.');
    }
  },
  'phone': function (value) {
    if (typeof value !== 'string') {
      throw new Error('연락처는 문자열 형식이어야 합니다.');
    }
  },
  'address': function (value) {
    if (typeof value !== 'string') {
      throw new Error('주소는 문자열 형식이어야 합니다.');
    }
  },
  'enum': function (value, option) {
    if (typeof value !== 'string') {
      throw new Error('열거형 값이 문자열 형식이 아닙니다.');
    }

    if (option.value.indexOf(value) < 0) {
      throw new Error('존재하지 않는 값입니다.');
    }
  },
  'date': function (value) {
    if (!/^\d\d\d\d-\d\d?-\d\d?$/.exec(value)) {
      throw new Error('올바른 날짜 형식이 아닙니다.');
    }

    if (Number.isNaN(Date.parse(value))) {
      throw new Error('올바른 날짜가 아닙니다.');
    }
  },
  'datetime': function (value) {
    if (Number.isNaN(Date.parse(value))) {
      throw new Error('올바른 날짜가 아닙니다.');
    }
  },
  'json': function (value) {
    return;
  }
};

class Validator {
  public errors: ValidatorError[] = [];

  validate(value: any, option: ValidatorOption | ValidatorSchema): boolean {
    this.errors = [];

    if (typeof value === 'object') {
      this.checkObject(value, <ValidatorSchema>option);
    } else {
      this.checkValue(null, value, <ValidatorOption>option);
    }

    return this.errors.length === 0;
  }

  private addError(field: string, message: string): void {
    this.errors.push({ field, message });
  }

  private checkValue(name: string, value: any, option: ValidatorOption): void {
    let type = option.type;
    let required = option.required === false ? false : true;

    if (value === null || value === undefined) {
      if (required) {
        this.addError(name, '필수입력입니다.');
      }

      return;
    }

    if (type === 'object') {
      this.checkObject(value, option.value);
    } else if (!(type in validators)) {
      this.addError(name, `존재하지 않는 타입(${type})입니다.`);
    } else {
      try {
        validators[type](value, option);
      } catch (e) {
        this.addError(name, e.message);
      }
    }
  }

  private checkObject(obj: any, schema: ValidatorSchema): void {
    for (let key in obj) {
      if (!schema[key]) {
        this.addError(key, `정의되지 않은 속성입니다.`);
      }
    }

    for (let key in schema) {
      this.checkValue(key, obj[key], schema[key]);
    }
  }
}

export default Validator;

export {
  ValidatorOption,
  ValidatorSchema,
  ValidatorError
};
