DELIMITER $$

----------------------------------------------------
CREATE TRIGGER insert_users_activity AFTER INSERT ON users
FOR EACH ROW
BEGIN
  INSERT INTO users_activity (action, action_user, user_id, name, cpf, email,password, avatar, status)
  VALUES('INSERT', NEW.update_user, NEW.id, NEW.name, NEW.cpf, NEW.email, NEW.password, NEW.avatar, NEW.status);
END$$

CREATE TRIGGER update_users_activity AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  INSERT INTO users_activity (action, action_user, user_id, name, cpf, email,password,avatar, status)
  VALUES('UPDATE', NEW.update_user, NEW.id,
        if (OLD.name != NEW.name,NEW.name,null),
        if (OLD.cpf != NEW.cpf,NEW.cpf,null),
        if (OLD.email != NEW.email,NEW.email,null),
        if (OLD.password != NEW.password,NEW.password,null),
        if ((OLD.avatar is null and NEW.avatar is not null) or (OLD.avatar != NEW.avatar),NEW.avatar,null),
        if (OLD.status != NEW.status,NEW.status,null));
END$$
----------------------------------------------------

-- ACTIVITY TEMPLATE --

-- CREATE TRIGGER insert_contracts_activity AFTER INSERT ON contracts
-- FOR EACH ROW
-- BEGIN
--   INSERT INTO contracts_activity (action, action_user, contract_id, plan_id, enroll_date, disenroll_date, next_payment_date, current_users, team_name, status)
--   VALUES('INSERT', NEW.update_user_id, NEW.id, NEW.plan_id, NEW.enroll_date, NEW.disenroll_date, NEW.next_payment_date, NEW.current_users, NEW.team_name, NEW.status);
-- END$$

-- CREATE TRIGGER update_contracts_activity AFTER UPDATE ON contracts
-- FOR EACH ROW
-- BEGIN
--   INSERT INTO contracts_activity (action, action_user, contract_id, plan_id, enroll_date, disenroll_date, next_payment_date, current_users, team_name, status)
--   VALUES('UPDATE', NEW.update_user_id, NEW.id,
--         if (OLD.plan_id != NEW.plan_id,NEW.plan_id,null),
--         if (OLD.enroll_date != NEW.enroll_date,NEW.enroll_date,null),
--         if (OLD.disenroll_date != NEW.disenroll_date,NEW.disenroll_date,null),
--         if (OLD.next_payment_date != NEW.next_payment_date,NEW.next_payment_date,null),
--         if (OLD.current_users != NEW.current_users,NEW.current_users,null),
--         if ((OLD.team_name is null and NEW.team_name is not null) or (OLD.team_name != NEW.team_name),NEW.team_name,null), -- USE THIS IF VALUE CAN BE NULL!
--         if (OLD.status != NEW.status,NEW.status,null));
-- END$$

----------------------------------------------------
-- DELETE TEMPLATE --

-- CREATE TRIGGER delete_permissions_log AFTER DELETE ON permissions
-- FOR EACH ROW
-- BEGIN
--   INSERT INTO permissions_log (action, action_user, code, description)
--   VALUES('INSERT', OLD.update_user_id, OLD.code, OLD.description,);
-- END$$
----------------------------------------------------


DELIMITER ;
