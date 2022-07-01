# Seyalthiran

Seyalthiran is a modern open-source framework that examines systems behavior and performance, precisely response time, scalability, speed, and software and infrastructure resource utilization.

[Seyalthiran](https://translate.google.com/?sl=auto&tl=en&text=%E0%AE%9A%E0%AF%86%E0%AE%AF%E0%AE%B2%E0%AF%8D%E0%AE%A4%E0%AE%BF%E0%AE%B1%E0%AE%A9%E0%AF%8D&op=translate&hl=en) is a Tamil word meaning "performance". Seyalthiran helps simulate substantial load on the servers to analyze the performance and scalability of the application using the Jmeter load generating tool.

It helps the engineer identify the application’s key performance metrics, eliminating the bottlenecks at an earlier phase of the development process, and aids in benchmarking your service.

## Highlights

- A user-friendly portal to upload JMX and run tests, the developer is hassle-free from setting up load generators and report generators
- Auto cut feature - Stop the test during runtime if SLA/KPI deviation is high
- Noise-free network latency as the Load Generator is isolated
- Dynamic cluster creation during load generation
- Shareable HTML report for each test
- Real-time dashboard to monitor tests during the runtime
- Email reports along with links to graphical and dynamic HTML reports
- Hassle-free integration with CI/CD pipeline
- Report comparison for easy analysis

### Architecture

![alt_text](images/image1.png 'image_tooltip')

### **GUI**

A simple, intuitive web application that provides solutions for creating new tests, viewing test reports, etc.

![alt_text](images/image2.png 'image_tooltip')

### **Live Dashboard**

Live test results using Grafana and time-series database InfluxDB. The test will enable the dashboard tab.

![alt_text](images/image3.png 'image_tooltip')

### **Reporting**

Leveraging Jmeter's HTML reporting capabilities, you can fetch the HTML reports with detailed performance metrics.

![alt_text](images/image4.png 'image_tooltip')

### **Admin Panel**

A highly extensible admin dashboard leveraging Jenkins for managing the service/ product on-boarding to Seyalthiran.

![alt_text](images/image5.png 'image_tooltip')

## **Getting Started**

The framework comprises three major components

1. Analytics - System for live dashboard
2. Jenkins - Admin panel for managing projects and test orchestration
3. Portal - GUI built on reactJS powered by NodeJS

### **Local setup for development**

### **Requirements**

The following tools are essential for setting up Seyalthiran in your local environment for development:

- [Docker](https://docs.docker.com/get-docker/) - All the components in the Seyalthiran framework are dockerized. Hence, docker is required to spin up the containers
- [Docker-compose](https://docs.docker.com/compose/install/) - To run multiple containers in the application, compose is used
- [Node ^16.13](https://github.com/nvm-sh/nvm#installation-and-update) - Since the portal is built using React and express node packages

### **Steps**

Clone the Seyalthiran repository

```
git clone https://github.com/freshworks/Seyalthiran.git
```

<span style="text-decoration:underline;">1. Setting up analytics</span>

Step 1: cd Seyalthiran/analytics/

Step 2:

Update `docker-compose.yml` file with preferred InfluxDB Admin and User passwords.

> INFLUXDB_ADMIN_PASSWORD={change_while_deploy}
>
> INFLUXDB_USER_PASSWORD={change_while_deploy}

Step 3: Start the influx DB and Grafana containers using

    docker-compose up -d --build

Step 4:

- Once the containers are up, open Grafana at localhost:3001 use admin:admin credentials for the first time, and set a strong password as it redirects
- Click on settings and add data source as influx DB
- Add the URL as "http://influxdb:8086", database name as "seyalthiran" with username and password given in `docker-compose.yml`
- Import the dashboard: [https://grafana.com/grafana/dashboards/5496](https://grafana.com/grafana/dashboards/5496) with dashboard name as seyalthiran-dashboard and set uid as `grafana_uid`

<span style="text-decoration:underline;">2. Setting up Jenkins</span>

Step 1: cd Seyalthiran/jenkins/

Step 2: Update preferred Jenkins password in `jenkinspassword.txt`

Step 3: Bring Jenkins container up using

    docker-compose up -d --build

Step 4: Set up an API key for the admin user

- Log in to Jenkins with admin credentials
- Click your name (upper-right corner)
- Click Configure (left-side menu)
- Use the "Add new Token" button to generate a new one then name it
- You must copy the token when you generate it as you cannot view the token afterward

<span style="text-decoration:underline;">3. Setting up Portal </span>

Step 1: cd Seyalthiran and install the dependencies

    npm install

Step 2: Update the BASE64 encoded Jenkins credentials(admin:<api_key>) in `configs/.env.development` file

> AUTH_TOKEN=Basic \<encoded>

Step 3: Spin up the server

    npm run dev

**Or**

You can set up the client and server in local with docker

Step 3a: Build the portal docker image using Dockerfile

    docker build -t Seyalthiran .

Step 3b: Update REACT_APP_JENKINS_URL with below value in `./configs/.env.development`

    REACT_APP_JENKINS_URL=http://docker.for.mac.localhost:9090

Step 3c: Start the container

    docker run -d -p 4000:4000 --env-file ./configs/.env.development Seyalthiran

[Manual](#manual_link) for using the framework

### **Self Hosting**

Seyalthiran is a hassle-free self-hostable framework with inbuilt configurations. It leverages AWS Elastic Container Service(ECS) for distributed load testing.

#### **The rationale for self-hosting seyalthiran**

- Portal can be used org-wide for performance testing activities
- Enables Distributed Load Generation using AWS ECS
- Noise-free network latency as the Load Generator is isolated
- Dynamic cluster creation of load generator to save costs as the cluster is torn down once the test is complete
- Developer/Devops is hassle-free from setting up load generators manually.

**Requirements**

Firstly, you need an AWS developer account with appropriate IAM access. Access to the following services are prerequisites for self-hosting seyalthiran

- Amazon Elastic Compute Cloud (Amazon EC2)
- AWS Elastic Container Service (ECS)

**Why AWS?**

The AWS Global Cloud Infrastructure is the most secure, extensive, and reliable cloud platform, offering over 200 fully-featured services from data centers globally. Seyalthiran is designed to be easily configurable with AWS infrastructure due to Security, Availability, Performance, Global Footprint, Scalability, and Flexibility.

**Amazon EC2**

AWS EC2 is a virtual server where one can request and provision a compute server in the AWS cloud.

**AWS Elastic Container Service (ECS)**

Amazon ECS is a fully managed container orchestration service that helps you quickly deploy, manage and scale containerized applications.

**Setting up seyalthiran in AWS**

Three EC2 instances would be required to host the Seyalthiran components - Portal, Jenkins, Analytics **reachable via ALB**(mapping corresponding ports in Target group)

You can refer to this [article](https://medium.com/@chandupriya93/deploying-docker-containers-with-aws-ec2-instance-265038bba674) for setting up the EC2 instance and installing the docker/docker-compose

Eg.

Instance 1 for **Analytics**

> DNS `http://seyalthiran-os-analytics-lb-xxxxxxxx.region.elb.amazonaws.com`
>
> Target group mapping HTTP:80 to TCP 3001

Instance 2 for **Jenkins**

> DNS: `http://seyalthiran-os-jenkins-lb-xxxxxxxx.region.elb.amazonaws.com`
>
> Target group mapping HTTP:80 to TCP 9090

Instance 3 for **Portal**

> DNS `http://seyalthiran-os-portal-lb-xxxxxxxx.region.elb.amazonaws.com`
>
> Target group mapping HTTP:80 to TCP 4000

A security group is attached to the instances to allow communication between components of the framework

Eg. Inbound rules

![alt_text](images/image6.png 'image_tooltip')

Setting up Instance 1 for **Analytics**

Step 1: git clone [https://github.com/freshworks/Seyalthiran.git](https://github.com/freshworks/Seyalthiran.git)

Step 2: cd Seyalthiran/analytics/

Step 3: Update the `docker-compose.yml` file with preferred InfluxDB Admin and User passwords.

> INFLUXDB_ADMIN_PASSWORD={change_while_deploy}
>
> INFLUXDB_USER_PASSWORD={change_while_deploy}

Step 4: Start the influx DB and Grafana containers using

    docker-compose up -d --build

Step 5:

- Once the containers are up, open Grafana at `http://seyalthiran-os-analytics-lb-xxxxxxxx.region.elb.amazonaws.com` use admin:admin credentials for the first time, and set a strong password as it redirects
- Click on settings and add data source as influx DB
- Add the URL as "http://influxdb:8086", database name as "seyalthiran" with username and password given in docker-compose.yml
- Import the dashboard: [https://grafana.com/grafana/dashboards/5496](https://grafana.com/grafana/dashboards/5496) with dashboard name as seyalthiran-dashboard and set uid as `grafana_uid`

Setting up Instance 2 for **Jenkins**

Step 1: git clone [https://github.com/freshworks/Seyalthiran.git](https://github.com/freshworks/Seyalthiran.git)

Step 2: cd jenkins/

Step 3: Update setup credentials

- Update preferred Jenkins password in `jenkinspassword.txt`
- Update SMTP credentials for sending email reports in `jenkins/jenkins-init.groovy`
- In the same file(`jenkins/jenkins-init.groovy`) update AWS details for ECS cluster creation.

IMAGE_ID=< AMI ID with which ECS instances are launched>,

VPC_ID=< VPC in which ECS instances are launched>,

SUBNET_ID=< Subnet ID in which instances are launched>,

SECURITY_GRP_ID=< Security groups to associate with your container instances>,

Eg.
<br />
![alt_text](images/image7.png 'image_tooltip')

AWS_REGION=< default aws region to be used>,

PORTAL_URL=< DNS of Instance 3 of Portal >,

ANALYTICS_URL=< DNS of Instance 1 of Analytics >,

ANALYTICS_PRIVATE_IP=< Private IP Instance 1 Analytics >

Or

Once the Jenkins is up you can update the env variable at

> Manage Jenkins => Configure Systems => Global Properties => Update the values of env variables

Step 4: As we leverage jobs and configuration of Jenkins it is recommended to store the `JENKINS_HOME` in a separate EBS-backed volume mounted to this instance mapped to `/var/lib/jenkins`

Step 5: To start Jenkins, run

    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

Step 6: Set up an API key for the admin user

Once Jenkins is up, Set up an API key for the admin user - Create API key - admin:xxxxxxxx (we recommend setting up authentication with google OAuth and creating an API key for a user)

- log in to Jenkins with admin credentials
- Click your name (upper-right corner)
- Click Configure (left-side menu)
- Use the "Add new Token" button to generate a new one then name it
- You must copy the token when you generate it as you cannot view the token afterward.

Step 7: Create EC2 key pair for transferring artifacts post the test runs and place the pem file in `~/keys/xxx.pem` (chmod 600 xxxxxp.pem)

Step 8: Attach IAM role with ECS permission in this instance for dynamic cluster creation

For example, below necessary permissions would be required

    "ecs:*",
    "ec2:*",
    "ecr:*",
    "cloudformation:*",
    "iam:CreateRole",
    "iam:AttachRolePolicy",
    "iam:CreateInstanceProfile",
    "iam:AddRoleToInstanceProfile",
    "iam:PassRole",
    "iam:RemoveRoleFromInstanceProfile",
    "iam:DetachRolePolicy",
    "iam:DeleteInstanceProfile",
    "iam:DeleteRole",
    "autoscaling:*"

Setting up Instance 3 for **Portal**

Step 1: git clone [https://github.com/freshworks/Seyalthiran.git](https://github.com/freshworks/Seyalthiran.git)

Step 2: cd Seyalthiran/

Step 3: Configure jenkins DNS (`http://seyalthiran-os-jenkins-lb-xxxxxxxx.region.elb.amazonaws.com`) and , Analytics DNS (`http://seyalthiran-os-analytics-lb-xxxxxxxx.region.elb.amazonaws.com`) and AUTH_TOKEN (base64 encode of user:api_key) in `configs/.env.development`

Step 4: Build the portal image using

    docker build -t Seyalthiran .

Step 5: Start the portal using

    docker run -d -p 4000:4000 --env-file ./configs/.env.development Seyalthiran

At Freshworks, we use an automated CI process to maintain the above setup and we recommend users implement the same with preferred CI tools

### <a name="manual_link"></a>**Manual**

This section briefly explores basic features and how to use Seyalthiran.

#### **Creating a Seyalthiran test**

- Swarm is an analogy for the collection of threads in load tests
- **How to trigger the test?**

  - Go to the Seyalthiran dashboard and check for your product/service. To get started, you can use a simple-demo in local and cluster-demo in a self-hosting setup. Jenkins admin can create new jobs(service-wise) from the demo jobs template

  - Click the ‘create swarm’ tab present in the navbar and you will be directed to a page with a dropdown list. Select your product from the dropdown and click the 'create swarm' button. Following that fill the required fields on the next page as shown below

![alt_text](images/image8.png 'image_tooltip')

- **What is the JMX Test Script?**

  - A JMX file is a saved JMeter project in XML format. You can create your script manually in JMeter or automatically record your scenario in your local JMeter setup. [Apache JMeter](https://jmeter.apache.org/usermanual/build-web-test-plan.html) is an open-source load testing tool that enables you to execute performance tests on your app or website. To run a load test, create a script that will detail the steps of your testing scenario and then run it. You can run your JMeter script locally on JMeter

  - Upload the script of Jmeter(JMX). The script should have mandatory test plan parameters sp_totalusers, sp_ramptime & sp_thinktime

    sp_ramptime is the duration for ramping up the total number of threads(sp_totalusers) chosen

    For instance, if 10 threads are used, and the ramp-up period is 100 seconds, it will take 100 seconds to get all 10 threads up and running

    sp_thinktime is the time between the completion of one request and the start of the subsequent request. There will be an editing option to update these parameters.

![alt_text](images/image9.png 'image_tooltip')

- **Email**
  - Enter the email to get the report through email. It includes links for the graphical and HTML reports
  - You will also get the customized report generated at your email once you enable the KPI field

![alt_text](images/image10.png 'image_tooltip')

- **KPI (Key Performance Indicators)**

  KPIs help **auto-stop the test run and get customized** test reports in the mail. Enabling the KPI will do the following things

  - Highlighting the email reports based on the SLO specified in the error and response time input tab. This helps in easier identification of the requests that breach the SLOs
  - **Auto-stop** Whenever you enable the auto-stop check box in the KPIs, the test is automatically stopped when a specified SLO is breached. For instance, If the response time is specified as 1 and auto stop is enabled, the test will be stopped automatically when any of the requests in the load test breach the 1 sec response time

After filling in the required fields, click the **'Run Test'** button. You will be redirected to the 'Live status' page.

- **Live Status**
  - Once the test is started, the Live status feature is enabled. This is a graphical representation of statistical information generated during the test. Critical information like Error rate, Response Time, and Throughput can be monitored lively. These graphs can also be customized according to your needs when the seyalthiran is self-hosted in your infrastructure

![alt_text](images/image3.png 'image_tooltip')

**Live Swarms**

- **Use of live swarm feature**

  Generally, the test run may take up several minutes. To achieve a seamless experience, this feature enables the user to anytime choose the running tests to see their status and helps to monitor them lively whenever needed

  - Click the live swarm button in the tab. Then you'll be redirected to a page that has a drop-down containing the list of running tests. Selecting one of them will be redirected to a live status page

![alt_text](images/image11.png 'image_tooltip')

**Swarm Reports**

The swarm report page is the landing page of Seyalthiran that contains the archives of the application/ services test run

- Select any of the services/products present in the dashboard. You will see the list of recent test runs report link
- The reports can be easily compared by selecting any two reports

![alt_text](images/image12.png 'image_tooltip')

#### **Acknowledgment**

_Thank you for using and contributing to Seyalthiran._

#### **Need help?**

_Please use Github issues_

---

Built with ❤ at Freshworks
