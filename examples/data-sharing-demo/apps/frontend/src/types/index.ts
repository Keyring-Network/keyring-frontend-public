export * from "./dataSharing";

export interface Field {
  id: string;
  label: string;
  description: string;
}

export interface Datasource {
  id: string;
  name: string;
  label: string;
  image: string;
}

export interface PartnerInfo {
  id: string;
  name: string;
  allowed_fields: Field[];
  allowed_datasources: Datasource[];
}
