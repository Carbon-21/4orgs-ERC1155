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

create table nft_requests(
    id int unsigned not null auto_increment primary key,
    user_id int unsigned not null,
    foreign key (user_id) references users(id),
    land_owner varchar(255) not null,
    land_area varchar(255) not null,
    phyto varchar(255),
    geolocation varchar(255),
    certificate mediumblob,
    request_status ENUM('accepted', 'rejected', 'pending') default 'pending' not null,
    user_notes text,
    admin_notes text,
    created_at timestamp default current_timestamp not null,
    updated_at timestamp default current_timestamp on update current_timestamp not null
);

create table nft_requests_activity(
    action char(6) not null, -- (update,insert)
    action_date timestamp default current_timestamp not null ,
    request_id int unsigned not null,
    foreign key (request_id) references nft_requests(id),
    land_owner varchar(255),
    land_area varchar(255),
    phyto varchar(255),
    geolocation varchar(255),
    certificate mediumblob,
    request_status ENUM('accepted', 'rejected', 'pending') default 'pending',
    user_notes text,
    admin_notes text,
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp on update current_timestamp
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

CREATE TRIGGER insert_nft_requests_activity AFTER INSERT ON nft_requests
FOR EACH ROW
BEGIN
  INSERT INTO nft_requests_activity (action, request_id, land_owner, land_area, phyto, geolocation, certificate, request_status, user_notes, admin_notes, created_at, updated_at)
  VALUES('INSERT', NEW.id, NEW.land_owner, NEW.land_area, NEW.phyto, NEW.geolocation, NEW.certificate, NEW.request_status, NEW.user_notes, NEW.admin_notes, NEW.created_at, NEW.updated_at);
END$$

CREATE TRIGGER update_nft_requests_activity AFTER UPDATE ON nft_requests
FOR EACH ROW
BEGIN
  INSERT INTO nft_requests_activity (action, request_id, land_owner, land_area, phyto, geolocation, certificate, request_status, user_notes, admin_notes, created_at, updated_at)
  VALUES('UPDATE', NEW.id,
        if (OLD.land_owner != NEW.land_owner,NEW.land_owner,null),
        if (OLD.land_area != NEW.land_area,NEW.land_area,null),
        if (OLD.phyto != NEW.phyto,NEW.phyto,null),
        if (OLD.geolocation != NEW.geolocation,NEW.geolocation,null),
        if (OLD.certificate != NEW.certificate,NEW.certificate,null),
        if (OLD.request_status != NEW.request_status,NEW.request_status,null),
        if (OLD.user_notes != NEW.user_notes,NEW.user_notes,null),
        if (OLD.admin_notes != NEW.admin_notes, NEW.admin_notes, null),
        if (OLD.created_at != NEW.created_at,NEW.created_at,null),
        if (OLD.updated_at != NEW.updated_at,NEW.updated_at,null));
END$$

DELIMITER ;
