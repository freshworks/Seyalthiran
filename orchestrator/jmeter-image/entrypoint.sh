#!/bin/sh
#
# Main entrypoint for our Docker image - runs Base, Swarms or other commands

# any .jmx file passed in the command line we act as 'Base'
if [ "${1##*.}" = 'jmx' ]; then

  if [ "$SWARM_HOSTS" = '' ]; then
    echo "SWARM_HOSTS must be specified - a command separated list of hostnames or IP addresses"
    exit 1
  fi
  echo "Connecting to $SWARM_HOSTS"

  echo "Detecting an AWS Environment"
  HOSTIP=$(curl -s --max-time 5 http://169.254.169.254/latest/meta-data/local-ipv4)

  # empty the logs directory, or jmeter may fail
  rm -rf /logs/report /logs/*.log /logs/*.jtl

  echo "Starting Swarms"

  # run jmeter in base mode
  jmeter -n \
    -R $SWARM_HOSTS \
    -Jclient.rmi.localport=60000 \
    -Dserver.rmi.ssl.disable=true \
    -Djava.rmi.server.hostname=$HOSTIP \
    -l /logs/results.jtl \
    -j /logs/jmeter.log \
    -t "$1" \
    -e -o /logs/report

  echo "Test completed"
  $JMETER_HOME/bin/JMeterPluginsCMD.sh --generate-csv /logs/aggr.csv --input-jtl /logs/results.jtl --plugin-type AggregateReport
  echo "AggregateReport Generated"
fi

# act as a 'Swarm'
if [ "$1" = 'swarm' ]; then
  echo "Entrypoint as swarm"
  echo "Detecting an AWS Environment"
  HOSTIP=$(curl -s --max-time 5 http://169.254.169.254/latest/meta-data/local-ipv4)


  # run jmeter in server (avenger) mode
  exec jmeter-server -n \
    -Dserver.rmi.localport=50000 \
    -Dserver.rmi.ssl.disable=true \
    -Djava.rmi.server.hostname=$HOSTIP

fi

exec "$@"
