-- Find IDs via SELECT or assume known UUIDs
insert into group_attributes (group_id, attribute_id)
select g.id, d.id
from attribute_groups g
join attribute_definitions d on
  (g.name='Dimensional' and d.internal_name in ('length','width','height'))
union all
select g.id, d.id
from attribute_groups g
join attribute_definitions d on
  (g.name='Mechanical' and d.internal_name in ('force','pressure'))
union all
select g.id, d.id
from attribute_groups g
join attribute_definitions d on
  (g.name='Electrical' and d.internal_name in ('voltage','current','power'))
union all
select g.id, d.id
from attribute_groups g
join attribute_definitions d on
  (g.name='Material' and d.internal_name='density')
;
