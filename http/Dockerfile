# Production
FROM amd64/php:8.3.36-apache AS production
RUN a2enmod rewrite
COPY http/files/apache.conf /etc/apache2/sites-available/000-default.conf
COPY http/files/php.ini /usr/local/etc/php/conf.d/nodeclient.ini
COPY http/webroot/ /var/www/html/

# Development
FROM php:8.3.36-apache AS development
RUN a2enmod rewrite
COPY http/files/apache.conf /etc/apache2/sites-available/000-default.conf
COPY http/files/php.ini /usr/local/etc/php/conf.d/nodeclient.ini
