insert into attribute_definitions
  (internal_name, display_name, description, data_type, unit, synonyms, concept_ids)
values
  ('length', 'Length', 'Linear dimension', 'float', 'm', '{"length","len"}', '{}'),
  ('width', 'Width', 'Lateral dimension', 'float', 'm', '{"width","wid"}', '{}'),
  ('height', 'Height', 'Vertical dimension', 'float', 'm', '{"height","ht"}', '{}'),
  ('mass', 'Mass', 'Amount of matter', 'float', 'kg', '{"mass"}', '{}'),
  ('force', 'Force', 'Mechanical force', 'float', 'N', '{"force"}', '{}'),
  ('pressure', 'Pressure', 'Force per area', 'float', 'Pa', '{"pressure","press"}', '{}'),
  ('voltage', 'Voltage', 'Electrical potential', 'float', 'V', '{"voltage","volt"}', '{}'),
  ('current', 'Current', 'Electrical current', 'float', 'A', '{"current","amp"}', '{}'),
  ('power', 'Power', 'Rate of energy transfer', 'float', 'W', '{"power"}', '{}'),
  ('density', 'Density', 'Mass per unit volume', 'float', 'kg/m³', '{"density"}', '{}')
;
