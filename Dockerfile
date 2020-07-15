FROM rocker/shiny
COPY tfer_1.3.tar.gz /tmp/
RUN R -e "install.packages('/tmp/tfer_1.3.tar.gz')"
RUN R -e "install.packages('shinyBS')"

COPY parameter_settings.R /srv/shiny-server/
COPY server.R /srv/shiny-server/
COPY ui.R /srv/shiny-server/
COPY www /srv/shiny-server/www

# select port
EXPOSE 3838

# allow permission
RUN sudo chown -R shiny:shiny /srv/shiny-server

# run app
CMD ["shiny-server"]
