-- Basic table creation v0.0

DROP DATABASE IF EXISTS carbon;
CREATE DATABASE carbon;
USE carbon;

create table users(
    id int unsigned auto_increment primary key not null,
    name varchar(255),
    cpf varchar(11),
    unique (cpf),
    email varchar(255) not null,
    unique (email),
    password varchar(64),
    seed varchar(64) not null,
    org varchar(30) default 'Carbon' not null,
    avatar varchar(255),
    status varchar(12) default 'registering' not null,
    update_user varchar(10) default 'self' not null, -- not ID (self,admin etc)
    key_on_server boolean default false not null -- whether user's privete key is stored on the server (true or false)
);

create table users_activity(
    action char(6) not null, -- (update,insert)
    action_date timestamp default current_timestamp not null ,
    action_user varchar(10) not null, -- update_user
    user_id int unsigned not null,
    foreign key (user_id) references users(id),
    name varchar(255),
    cpf varchar(11),
    email varchar(255),
    password varchar(64),
    seed varchar(64),
    org varchar(30),
    avatar varchar(255),
    status varchar(12),
    key_on_server boolean default false
);

create table authentication_log(
    id int unsigned not null auto_increment primary key,
    user_id int unsigned not null,
    foreign key (user_id) references users(id),
    event_type varchar(10) not null,
    success boolean,
    ip text,    
    datestamp timestamp default current_timestamp not null
);

DELIMITER $$

CREATE TRIGGER insert_users_activity AFTER INSERT ON users
FOR EACH ROW
BEGIN
  INSERT INTO users_activity (action, action_user, user_id, name, cpf, email, password, seed, org, avatar, status, key_on_server)
  VALUES('INSERT', NEW.update_user, NEW.id, NEW.name, NEW.cpf, NEW.email, NEW.password, NEW.seed, NEW.org, NEW.avatar, NEW.status, NEW.key_on_server);
END$$

CREATE TRIGGER update_users_activity AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  INSERT INTO users_activity (action, action_user, user_id, name, cpf, email,password, seed, org, avatar, status, key_on_server)
  VALUES('UPDATE', NEW.update_user, NEW.id,
        if (OLD.name != NEW.name,NEW.name,null),
        if (OLD.cpf != NEW.cpf,NEW.cpf,null),
        if (OLD.email != NEW.email,NEW.email,null),
        if (OLD.password != NEW.password,NEW.password,null),
        if (OLD.seed != NEW.seed,NEW.seed,null),
        -- if (OLD.salt != NEW.salt,NEW.salt,null),
        -- if (OLD.weeded_salt != NEW.weeded_salt,NEW.weeded_salt,null),
        if (OLD.org != NEW.org, NEW.org, null),
        if ((OLD.avatar is null and NEW.avatar is not null) or (OLD.avatar != NEW.avatar),NEW.avatar,null),
        if (OLD.status != NEW.status,NEW.status,null),
        if (OLD.key_on_server != NEW.key_on_server,NEW.key_on_server,null));
END$$

DELIMITER ;
