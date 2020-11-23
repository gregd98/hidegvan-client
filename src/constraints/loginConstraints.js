const required = { allowEmpty: false, message: 'This field is required.' };

// eslint-disable-next-line import/prefer-default-export
export const loginConstraints = {
  username: {
    presence: required,
  },
  password: {
    presence: required,
  },
};
