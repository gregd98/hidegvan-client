const calculatePasswordStrength = (value) => {
  let strength = 0;
  strength += value.match(/[\p{Ll}]+/u) ? 1 : 0;
  strength += value.match(/\p{Lu}/u) ? 1 : 0;
  strength += value.match(/[0-9]/) ? 1 : 0;
  strength += value.match(/[`~!@#$%^&*()\-_=+{}[\]\\|;:'",<.>/?]+/) ? 1 : 0;
  return strength;
};

export default calculatePasswordStrength;
