export const ResponseStatus = {
  OK: { httpCode: 200, message: 'Success', code: 0 }, // Success
  MissingInput: { httpCode: 400, message: 'Missing Input', code: 1 }, // Missing Input
  InvalidFormatInput: {
    httpCode: 400,
    message: 'Invalid Format Input',
    code: 2
  }, // Invalid Format Input
  Unauthorized: { httpCode: 401, message: 'Unauthorized', code: 3 }, // Unauthorized
  ServerError: { httpCode: 500, message: 'Server Error', code: -1 }, // Server Error
  NotFound: { httpCode: 404, message: 'Not Found', code: -2 }, // Not Found
  DuplicatedRecord: { httpCode: 409, message: 'Duplicated Record', code: -3 }, // Duplicated Record
  Forbidden: { httpCode: 403, message: 'Forbidden (Authorization)', code: -4 }, // Forbidden
  InsufficientBalance: {
    httpCode: 400,
    message: 'Insufficient balance in the source wallet',
    code: -8
  }, // Insufficient balance in the source wallet
  NotAcceptingOrders: {
    httpCode: 400,
    message: 'This restaurant is currently not accepting at the moment.',
    code: -5
  },
  NoDrivers: {
    httpCode: 400,
    message: 'This restaurant is currently not accepting at the moment.',
    code: -6
  },
  DRIVER_MAXIMUM_ORDER: {
    httpCode: 400,
    message: 'Driver has reached maximum number of orders',
    code: -7
  },
  EXPIRED: {
    httpCode: 400,
    message: 'Expired',
    code: -9
  },
  NOT_AVAILABLE: {
    httpCode: 400,
    message: 'Expired',
    code: -9
  }
};

export const FIXED_DELIVERY_DRIVER_WAGE = 20;

export const FLASHFOOD_FINANCE = {
  id: 'F_WALLET_06f81c5e-8ef5-4072-85b2-dc3f19f91ef3',
  user_id: 'USR_ee0f6d15-f7bf-4b97-a903-fa0406a43847',
  email: 'flashfood.finance@gmail.com'
};
