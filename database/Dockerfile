FROM mysql:5.7
WORKDIR /database
COPY . ./
ADD carbon.sql /docker-entrypoint-initdb.d
RUN ["chmod", "+x", "./grant-access-db.sh"]
EXPOSE 3306
# ADD install-db /scripts/install-db
# RUN ls
# ENV MYSQL_PASSWORD=12345678
# RUN mysql --execute "CREATE USER 'carbon'@'localhost' IDENTIFIED BY '$MYSQL_PASSWORD'" 
# RUN mysql -ucarbon -p$MYSQL_PASSWORD --execute "source carbon.sql"
# RUN systemctl start mysql
# CMD ["./install-db"]