import {Path} from "runtime-compat/fs";
import errors from "../../errors.js";

export default type => async (log, directory, load) => {
  const filter = path => new RegExp(`^\\+${type}.js$`, "u").test(path.name);

  const replace = new RegExp(`\\+${type}`, "u");
  const objects = (await load({log, directory, filter, warn: false}))
    .map(([name, object]) => [name.replace(replace, () => ""), object])
    .toSorted(([a], [b]) => a.length - b.length);

  const resolve = name => new Path(directory, name, `+${type}.js`);
  objects.some(([name, value]) => typeof value !== "function"
    && errors.InvalidDefaultExport.throw(resolve(name)));

  return objects;
};