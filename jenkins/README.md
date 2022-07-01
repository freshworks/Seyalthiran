# To bring jenkins container up for local development

docker-compose up -d --build

Pre-requisites:
1. Update smtp password in jenkins-init.groovy
2. Update jenkins password in jenkinspassword.txt

# To bring jenkins container up in production (self hosting)

1. Login as root and create ~/keys and have `xxxxxxxxxx-kp.pem` file inside
2. Mount an EBS backed volumed vol-xxxxxxx to the instance at `/var/lib/jenkins`
3. docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
