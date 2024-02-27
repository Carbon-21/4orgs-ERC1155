#!/bin/bash
# source ../api-2.0/.env

#create carbon user with low password policy and all permissions
# sudo mysql --execute "SET GLOBAL validate_password.policy=LOW"
sudo mysql --execute "CREATE USER 'carbon'@'localhost' IDENTIFIED BY '12345678'" 
# create user to any host (allow non-localhost calls)
sudo mysql --execute "GRANT ALL ON *.* TO 'carbon'@'localhost' WITH GRANT OPTION"
sudo mysql --execute "CREATE USER 'carbon'@'%' IDENTIFIED BY '12345678'"
sudo mysql --execute "GRANT ALL ON *.* TO 'carbon'@'%' WITH GRANT OPTION"
