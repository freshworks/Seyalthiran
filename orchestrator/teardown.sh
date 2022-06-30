CLUSTER_NAME=SWARM-$JOB_NAME
ecs-cli compose --file orchestrator/cluster.yml --cluster $CLUSTER_NAME stop
ecs-cli down --cluster $CLUSTER_NAME --force
