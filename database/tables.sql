-- Basic table creation v0.0

-- DROP DATABASE IF EXISTS carbon;
-- CREATE DATABASE carbon;
-- USE carbon;

create table users(
    id int unsigned auto_increment primary key not null,
    name varchar(255) not null,
    cpf varchar(11) not null,
    unique (cpf),
    email varchar(255) not null,
    unique (email),
    password varchar(60) not null,
    avatar varchar(255),
    status varchar(10) default 'pending' not null,
    update_user varchar(10) default 'self' not null -- not ID (self,admin etc)
);

create table users_activity(
    action char(6) not null, --(update,insert)
    action_date timestamp default current_timestamp not null ,
    action_user varchar(10) not null, -- update_user
    user_id int unsigned not null,
    foreign key (user_id) references users(id),
    name varchar(255),
    email varchar(255),
    password varchar(60),
    avatar varchar(255),
    status varchar(10) 
);

create table authentication_log(
    id int unsigned not null auto_increment primary key,
    user_id int unsigned not null,
    foreign key (user_id) references users(id),
    event_type varchar(10) not null,
    success boolean,
    ip text,    
    created_at timestamp default current_timestamp not null
);

-- create table emails(
--     id int unsigned not null auto_increment primary key,
--     email varchar(255) not null,
--     unique (email)
-- );

