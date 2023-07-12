export type JSONArray = JSONValue[];
export type JSONObject = { [key: string]: JSONValue };
export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONArray
  | JSONObject;

export function tryParseJson(str: string) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}
