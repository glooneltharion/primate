import {Domain} from "@primate/domains";

// A basic domain that contains two properies
export default class User extends Domain {
  static fields = {
    // a user's name must be a string
    name: String,
    // a user's age must be a number
    age: Number,
  };
}
