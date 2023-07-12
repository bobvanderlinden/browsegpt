import { JSONValue } from "./json";
import { FromJSONSchema, JSONSchemaObject } from "./json-schema";

type FunctionMetadata<TParameterSchema extends JSONSchemaObject> = {
  name: string;
  description: string;
  parameters: TParameterSchema;
};

const metadataSymbol = Symbol("metadata");

export function hasMetadata(fn: any): boolean {
  return metadataSymbol in fn;
}

export function getMetadata<T extends JSONSchemaObject>(
  fn: any
): FunctionMetadata<T> {
  return fn[metadataSymbol];
}

export function annotateMetadata<T extends JSONSchemaObject, TResult>(
  metadata: FunctionMetadata<T>,
  fn: (arg: FromJSONSchema<T>) => TResult
): (arg: FromJSONSchema<T>) => TResult {
  (fn as any)[metadataSymbol] = metadata;
  return fn;
}
