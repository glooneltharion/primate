import { maybe } from "rcompat/invariant";
import { tryreturn } from "rcompat/sync";
import * as object from "rcompat/object";
import errors from "./errors.js";
import bases from "./bases.js";
import validate from "./validate.js";
import primary from "./primary.js";

const { FailedDocumentValidation } = errors;

const transform = to => ({ types, schema, document, path }) =>
  object.transform(document, entry => entry
    .map(([field, value]) =>
      tryreturn(_ => [field, types[bases[schema[field].base]][to](value)])
        .orelse(_ => {
          const { name } = schema[field];
          const command = `(await ${path}.get("${document.id}")).${field}`;
          return errors.CannotUnpackValue.throw(value, name, command);
        }),
    ));

export default (config, facade, types) => {
  const name = config.name.toLowerCase();
  const path = name.replaceAll("_", ".");
  const { schema, actions = _ => ({}) } = config;

  const pack = document => transform("in")({ document, path, schema, types });
  const unpack = result => typeof result === "object"
    ? transform("out")({ document: result, path, schema, types })
    : result;

  const store = {
    connection: facade.connection,
    facade,
    async validate(input) {
      const result = await validate({ input, types, schema,
        strict: config.strict });
      if (Object.keys(result.errors).length > 0) {
        const error = FailedDocumentValidation.new(Object.keys(result));
        error.errors = result.errors;
        throw error;
      } else {
        return result.document;
      }
    },
    async write(input, writer) {
      const document = await this.validate(input);
      return config.readonly ? document : unpack(await writer(pack(document)));
    },
    async get(value) {
      const id = types.primary.in(value);
      const document = await facade.get(name, primary, id);

      document === undefined &&
        errors.NoDocumentFound.throw(primary, id,
          `${path}.exists({${primary}: ${id}})`, `${path}.get$`);

      return unpack(document);
    },
    async count(criteria) {
      maybe(criteria).object();
      return facade.count(name, criteria);
    },
    async find(criteria) {
      maybe(criteria).object();
      const documents = await facade.find(name, pack(criteria));
      return documents.map(document => unpack(document));
    },
    async exists(criteria) {
      maybe(criteria).object();
      const count = await facade.count(name, criteria);
      return count > 0;
    },
    async insert(document = {}) {
      return this.write(document,
        validated => facade.insert(name, primary, validated));
    },
    async update(criteria, document = {}) {
      maybe(criteria).object();
      return this.write(document,
        validated => facade.update(name, pack(criteria), validated));
    },
    async save(document) {
      return document[primary] === undefined
        ? this.insert(document)
        : this.update({ [primary]: document[primary] }, document);
    },
    async delete(criteria) {
      maybe(criteria).object();
      return facade.delete(name, pack(criteria));
    },
    schema: {
      async create(description) {
        maybe(description).object();
        return facade.schema.create(name, description);
      },
      async delete() {
        return facade.schema.delete(name);
      },
    },
  };

  return { ...store, ...actions(store) };
};
