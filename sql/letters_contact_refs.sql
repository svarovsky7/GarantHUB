-- Добавление ссылок на контрагентов и физлиц в таблице letters
ALTER TABLE letters
  ADD COLUMN sender_person_id BIGINT REFERENCES persons(id),
  ADD COLUMN sender_contractor_id INTEGER REFERENCES contractors(id),
  ADD COLUMN receiver_person_id BIGINT REFERENCES persons(id),
  ADD COLUMN receiver_contractor_id INTEGER REFERENCES contractors(id);

-- Заполнение новых колонок на основании существующих данных
UPDATE letters l
  SET sender_person_id = p.id
  FROM persons p
  WHERE l.sender = p.full_name;
UPDATE letters l
  SET sender_contractor_id = c.id
  FROM contractors c
  WHERE l.sender = c.name;
UPDATE letters l
  SET receiver_person_id = p.id
  FROM persons p
  WHERE l.receiver = p.full_name;
UPDATE letters l
  SET receiver_contractor_id = c.id
  FROM contractors c
  WHERE l.receiver = c.name;
