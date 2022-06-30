#!/bin/bash
#
# Jenkins-ecs-Jmeter Orchestrator

# Leverages the AWS CLI tool and the AWS ECS CLI tool:
# http://docs.aws.amazon.com/AmazonECS/latest/developerguide/ECS_AWSCLI.html
# http://docs.aws.amazon.com/AmazonECS/latest/developerguide/ECS_CLI.html


# Clean up the folder that will hold test scripts.
rm -rf swarm_test_scripts/

# If there is no folder to hold test scripts, create it.
if [ ! -d swarm_test_scripts ] ; then
mkdir swarm_test_scripts
echo "Created swarm_test_scripts folder"
fi

# Move the jmx parsing groovy script into the test scripts folder.
cp orchestrator/jmxparsing.groovy swarm_test_scripts/

csv_files=(csvfile csvfile1 csvfile2 csvfile3)
# Move the uploded test script (JMX) into test scripts folder.
mv jmxfile "./swarm_test_scripts/${jmxfile}"
# Move the uploaded data files (CSVs) into test scripts folder.
for csv_file in "${csv_files[@]}"
do
    csv_file_name="${!csv_file}"
    if [ -n "$csv_file_name" ]; then
        mv $csv_file "./swarm_test_scripts/${csv_file_name}"
    fi
done


echo "JMX File: ${jmxfile}"

# Move into test scripts folder.
cd swarm_test_scripts

# Run the groovy script which scales the JMX and splits CSVs accordingly.
set -- $(groovy jmxparsing.groovy "${jmxfile}" ${JOB_NAME} ${threads_per_instance} ${ANALYTICS_PRIVATE_IP} | grep -e 'Scaling JMX with factor' | awk '{ print $5 }')
factor=$1

# Factor is the number of slaves in which the tests are executed.
echo "Factor determined is $factor"

# Exit execution when the number of slaves to be created exceeds 10.
if [ $factor -gt 10 ] ; then
  echo "Scaling factor exceeds the swarm allowed count. Exit execution.."
  exit 0
fi

# changing directory
cd ..

echo "===== Completed Pre ====="

if [ "$SWARM_COUNT" == '' ]; then
  SWARM_COUNT=$factor
fi

if [ "$INSTANCE_TYPE" == '' ]; then
  INSTANCE_TYPE=m4.xlarge
fi

if [ "$MEM_LIMIT" == '' ]; then
  MEM_LIMIT=12288m
fi

if [ "$INPUT_JMX" == '' ]; then
  INPUT_JMX="swarm_test_scripts/Scaled_${jmxfile}"
fi

if [ "$PEM_PATH" == '' ]; then
  PEM_PATH=/keys
  KEY_NAME=seyalthiran-kp
fi

if [ "$SEYAL_IMAGE" == '' ]; then
  SEYAL_IMAGE=freshworks/seyalthiran-jmeter:latest
fi

#required options for ecs cli
if [ -z "$IMAGE_ID" ]; then
  IMAGE_ID=''        #AMI ID to launch an instance
fi

if [ -z "$SUBNET_ID" ]; then
  SUBNET_ID=''             #Subnet IDs in which to launch your container instances
fi

if [ -z "$VPC_ID" ]; then
  VPC_ID=''                   #Specifies the ID of an existing VPC in which to launch your container instances
fi

if [ -z "$SECURITY_GRP_ID" ]; then
  SECURITY_GRP_ID=''  #Security groups to associate with your container instances (comma-separated)
fi

if [ -z "$AWS_REGION" ]; then
  AWS_REGION=''
fi

if [ -z "$FETCH_LOGS" ]; then
   FETCH_LOGS="false"
fi

# Step 1 - Create our ECS Cluster with SWARM_COUNT+1 instances
ecs-cli --version

INSTANCE_COUNT=$((SWARM_COUNT+1))
CLUSTER_NAME=SWARM-$JOB_NAME
CREATED_NEW_CLUSTER="1"
echo "Creating cluster/$CLUSTER_NAME"

ecs-cli up --image-id $IMAGE_ID --keypair $KEY_NAME --capability-iam --size $INSTANCE_COUNT --subnets $SUBNET_ID --vpc $VPC_ID --security-group $SECURITY_GRP_ID --instance-type $INSTANCE_TYPE --no-associate-public-ip-address --launch-type EC2 --cluster $CLUSTER_NAME --tags "type=compute" --force --verbose

echo "Created new cluster: $CREATED_NEW_CLUSTER"

if [ "$CREATED_NEW_CLUSTER" == "1" ]; then
	# Step 2 - Wait for the cluster to have all container instances registered (Only if we create new cluster)
	while true; do
  		CONTAINER_INSTANCE_COUNT=$(aws ecs describe-clusters --cluster $CLUSTER_NAME \
    		--query 'clusters[*].[registeredContainerInstancesCount]' --output text)
  		echo "Instance count is $CONTAINER_INSTANCE_COUNT"
  		if [ "$CONTAINER_INSTANCE_COUNT" == $INSTANCE_COUNT ]; then
    		break
  		fi
  		sleep 10
	done
fi

# Step 3 - Run the Swarm task with the requested JMeter version, instance count and memory
sed -i 's/950m/'"$MEM_LIMIT"'/' orchestrator/cluster.yml
ecs-cli compose --file orchestrator/cluster.yml up --cluster $CLUSTER_NAME
ecs-cli compose --file orchestrator/cluster.yml --cluster $CLUSTER_NAME scale $SWARM_COUNT

# Step 4 - Get Base and Swarm's instance ID's.  Base is the container with a runningTasksCount = 0
CONTAINER_INSTANCE_IDS=$(aws ecs list-container-instances --cluster $CLUSTER_NAME --output text |
      awk '{print $2}' | tr '\n' ' ')
echo "Container instances IDs: $CONTAINER_INSTANCE_IDS"

BASE_INSTANCE_ID=$(aws ecs describe-container-instances --cluster $CLUSTER_NAME \
  --container-instances $CONTAINER_INSTANCE_IDS --query 'containerInstances[*].[ec2InstanceId,runningTasksCount]' --output text | grep -m 1 $'\t0' | awk '{print $1}')
echo "Base instance ID: $BASE_INSTANCE_ID"

SWARM_INSTANCE_IDS=$(aws ecs describe-container-instances --cluster $CLUSTER_NAME \
  --container-instances $CONTAINER_INSTANCE_IDS --query 'containerInstances[*].[ec2InstanceId,runningTasksCount]' --output text | grep $'\t1' | awk '{print $1}')
echo "Swarm instances IDs: $SWARM_INSTANCE_IDS"

# Step 5 - Get IP addresses of Base and Swarms (always Private)
echo "Using Base's Private IP"
BASE_HOST=$(aws ec2 describe-instances --instance-ids $BASE_INSTANCE_ID \
      --query 'Reservations[*].Instances[*].[PrivateIpAddress]' --output text | tr -d '\n')
echo "Base at $BASE_HOST"

SWARM_HOSTS=$(aws ec2 describe-instances --instance-ids $SWARM_INSTANCE_IDS \
      --query 'Reservations[*].Instances[*].[PrivateIpAddress]' --output text | tr '\n' ',')
echo "Swarms at $SWARM_HOSTS"

SWARM_HOSTS_ARRAY=$(aws ec2 describe-instances --instance-ids $SWARM_INSTANCE_IDS \
      --query 'Reservations[*].Instances[*].[PrivateIpAddress]' --output text | tr '\n' ' ')
echo "Swarms at $SWARM_HOSTS_ARRAY"

# Step 6 - Copy specified JMXto Base
echo "Copying $INPUT_JMX to Base"
scp -i $PEM_PATH/$KEY_NAME.pem -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no "$INPUT_JMX" ec2-user@${BASE_HOST}:/tmp


# Step 7 - Copy Csv's to Swarms
# Array of slave-instance's IPs (worker nodes) from Base base.
swarm_ips=( $SWARM_HOSTS_ARRAY ) # Swarms hosts as array

# # Send data files (CSVs) to the Swarms.
for i in $(seq 1 $factor); do
if [ -d "swarm_test_scripts/$i" ] ; then
echo "Copying swarm_test_scripts/$i"
scp -i $PEM_PATH/$KEY_NAME.pem -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no swarm_test_scripts/$i/* ec2-user@${swarm_ips[$i-1]}:/tmp
fi
done

# Step 8 - Run test in Base
ssh -i $PEM_PATH/$KEY_NAME.pem -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no ec2-user@${BASE_HOST} \
    "sudo yum install -y python3 \
    && pip3 install --upgrade --user awscli \
    && $(aws ecr get-login --no-include-email --region $AWS_REGION) \
    && docker pull $SEYAL_IMAGE"

echo "Running Docker to start JMeter in Base mode"
JMX_IN_CONTAINER=/tmp/$(basename "$INPUT_JMX")

echo "Starting the test"

ssh -i $PEM_PATH/$KEY_NAME.pem -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no ec2-user@${BASE_HOST} \
 "docker run --network host -v /tmp:/tmp -v /logs:/logs --env SWARM_HOSTS=$SWARM_HOSTS $SEYAL_IMAGE '$JMX_IN_CONTAINER'"

echo "end of run"

mkdir -p $BUILD_NUMBER

# Step 9 - Fetch the results from Base
echo "Copying results from Base"
scp -r -i $PEM_PATH/$KEY_NAME.pem -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no ec2-user@${BASE_HOST}:/logs/* $BUILD_NUMBER/

# Step 9A - Fetch logs from slaves
if [ "$FETCH_LOGS" == "true" ]; then
  echo "Copying logs from Slave"
  for i in $(seq 1 $factor); do
  scp -i $PEM_PATH/$KEY_NAME.pem -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no ec2-user@${swarm_ips[$i-1]}:/tmp/jmeter-server.log "$BUILD_NUMBER/$i-jmeter-server.log"
  done
fi

# Step 12 - generate summary report
groovy orchestrator/testsummary.groovy

# Step 13 - backup jmx script for reference
cp $INPUT_JMX $BUILD_NUMBER/

# Clean up the folder that will hold test scripts.
rm -rf swarm_test_scripts/
