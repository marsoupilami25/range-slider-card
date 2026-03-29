export enum FlexSliderCardEntityType {
  NUMBER = "number",
  TIME = "time"
}

export type FlexSliderEntityDomain = "number" | "input_number" | "input_datetime";

export function getEntityDomain(entityid: string): FlexSliderEntityDomain {
  const domain: string = entityid.split(".")[0];
  return domain as FlexSliderEntityDomain;
}

export function getEntityType(entityid: string): FlexSliderCardEntityType {
  const domain: string = getEntityDomain(entityid);
  switch (domain) {
    case "number":
    case "input_number":
      return FlexSliderCardEntityType.NUMBER;
    case "input_datetime":
      return FlexSliderCardEntityType.TIME;
    default:
      throw new Error(`Unexpected 'entity_${entityid}' domain`);
  }
}