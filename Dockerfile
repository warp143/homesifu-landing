FROM nginx:alpine

# Copy only the website files we need
COPY index.html /usr/share/nginx/html/
COPY script.js /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/
COPY images/ /usr/share/nginx/html/images/

EXPOSE 80