export type JSONSchema =
  | JSONSchemaString
  | JSONSchemaNumber
  | JSONSchemaBoolean
  | JSONSchemaObject
  | JSONSchemaArray;

export type JSONSchemaPrimitive<TType extends string> = {
  type: TType;
};

export type JSONSchemaString = JSONSchemaPrimitive<"string">;
export type JSONSchemaNumber = JSONSchemaPrimitive<"number">;
export type JSONSchemaBoolean = JSONSchemaPrimitive<"boolean">;

export type JSONSchemaObject = {
  type: "object";
  properties: {
    [key: string]: JSONSchema;
  };
};

export type JSONSchemaArray = {
  type: "array";
  items: JSONSchema;
};

export type FromJSONSchema<Schema extends JSONSchema> =
  Schema extends JSONSchemaPrimitive<"string">
    ? string
    : Schema extends JSONSchemaPrimitive<"number">
    ? number
    : Schema extends JSONSchemaPrimitive<"boolean">
    ? boolean
    : Schema extends JSONSchemaObject
    ? {
        [Key in keyof Schema["properties"]]: FromJSONSchema<
          Schema["properties"][Key]
        >;
      }
    : Schema extends JSONSchemaArray
    ? FromJSONSchema<Schema["items"]>[]
    : never;
