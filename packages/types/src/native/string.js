import {is, assert} from "runtime-compat/dyndef";

const between = ({length}, min, max) => length >= min && length <= max;
const base = "string";

const string = {
  base,
  validate(value) {
    if (typeof value === "string") {
      return value;
    }
    throw new Error("not a string");
  },
  between(min, max) {
    is(min).usize();
    is(max).usize();
    assert(min >= max, "min has to be smaller than max");

    return {
      validate(value) {
        const typed = string.validate(value);
        if (between(typed, min, max)) {
          return typed;
        }
        throw new Error(`\`${typed}\` is not in the range of ${min} of ${max}`);
      },
      base,
    };
  },
};

export default string;
